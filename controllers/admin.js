const Channel = require("../models/channel");
const User = require("../models/user");
const Post = require("../models/post");
const ChannelRequest = require("../models/channel-request");
const ReportedPost = require("../models/reported_post");
const s3Helpers = require("../helpers/s3");
const sendPushNotification = require("../helpers/send-notification");

//done
exports.setAsAdmin = (req, res, next) => {
  const channelId = req.params.channelId;
  const userToAdmin = req.params.userId;
  Channel.findById(channelId)
    .then((channel) => {
      if (!channel) {
        const error = new Error("Channel not found");
        error.statusCode = 404;
        throw error;
      }
      User.findById(userToAdmin).then((user) => {
        user.managed_channel.push(channel);
        user.save();
        channel.admin.push(user);
        channel.save();
        res.status(200).json({ message: "Set as admin success" });
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//done
exports.demoteFromAdmin = (req, res, next) => {
  const channelId = req.params.channelId;
  const userId = req.params.userId;
  Channel.findById(channelId)
    .then((channel) => {
      if (!channel) {
        const error = new Error("Channel not found");
        error.statusCode = 404;
        throw error;
      }
      User.findById(userId).then((user) => {
        user.managed_channel.pull(channel);
        user.save();
        channel.admin.pull(user);
        channel.save();
        res.status(200).json({ message: "Demote admin success" });
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//done
exports.kickUser = (req, res, next) => {
  const channelId = req.params.channelId;
  const userId = req.params.userId;
  Channel.findById(channelId)
    .then((channel) => {
      if (!channel) {
        const error = new Error("Channel not found");
        error.statusCode = 404;
        throw error;
      }
      User.findById(userId).then((user) => {
        user.assigned_channel.pull(channel);
        user.save();
        channel.member.pull(user);
        channel.save();
        res.status(200).json({ message: "User removed" });
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.responsePendingEntry = async (req, res, next) => {
  const { channelId, userId, response } = req.params;
  try {
    const channel = await Channel.findById(channelId);
    const user = await User.findById(userId);
    if (response === "accept") {
      user.assigned_channel.push(channel);
      channel.member.push(user);
      await user.save();
    }
    channel.pending_entry.pull(user);
    await channel.save();
    res.status(200).json({
      status: response,
      message: `Entry ${response === "accept" ? "accepted" : "rejected"}`,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteChannel = async (req, res, next) => {
  const { channelId } = req.params;
  try {
    const channel = await Channel.findById(channelId).populate("member");
    if (channel.child_channel.length !== 0) {
      res.status(403).json({
        message:
          "Cant delete channel because this channel contain child channel",
      });
      return;
    }
    let expoTokens = [];
    for (const memberElement of channel.member) {
      memberElement.assigned_channel.pull(channel);
      if (
        memberElement.expo_push_token &&
        !channel.admin.includes(memberElement._id)
      ) {
        expoTokens.push(memberElement.expo_push_token);
      }
      if (memberElement.managed_channel.includes(channelId)) {
        memberElement.managed_channel.pull(channel);
      }
      await memberElement.save();
    }
    //send notification to channel member
    if (expoTokens.length > 0) {
      await sendPushNotification(
        expoTokens,
        channel.name,
        `Channel ${channel.name} has been deleted by admin`
      );
    }
    if (channel.parent_channel) {
      const parentChannel = await Channel.findById(channel.parent_channel);
      parentChannel.child_channel.pull(channel);
      await parentChannel.save();
    }
    const posts = await Post.find({ channel: channelId });
    for (const post of posts) {
      post.channel.pull(channel);
      post.save();
    }
    const pendingPosts = await Post.find({ pending_channels: channelId });
    if (pendingPosts) {
      for (const pendingPost of pendingPosts) {
        pendingPost.pending_channels.pull(channel);
        await pendingPost.save();
      }
    }

    const reportedPost = await ReportedPost.findOne({
      reported_to: channelId,
    }).populate("post");
    if (reportedPost) {
      reportedPost.post.status = "active";
      await reportedPost.post.save();
      reportedPost.remove();
    }
    const channelRequests = await ChannelRequest.find({
      requested_to: channelId,
    }).populate("requester");
    if (channelRequests) {
      for (const channelRequest of channelRequests) {
        if (channelRequest.requester.expo_push_token) {
          await sendPushNotification(
            [channelRequest.requester.expo_push_token],
            "Channel Request deleted",
            "Request deleted because parent channel got deleted by its admin"
          );
        }
        channelRequest.remove();
      }
    }
    //delete channel photo
    let keys = [];
    if (channel.photo) {
      keys = s3Helpers.extractKeys([channel.photo], keys);
      await s3Helpers.deleteObjects(keys);
    }

    await channel.remove();
    res.status(200).json({ message: "Channel Deleted successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.changeChannelStatus = async (req, res, next) => {
  const { channelId, value } = req.params;
  try {
    await Channel.findByIdAndUpdate(channelId, { status: value });
    res.status(200).json({ message: "Channel status changed" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
