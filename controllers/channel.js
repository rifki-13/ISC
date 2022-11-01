const { validationResult } = require("express-validator");

const Channel = require("../models/channel");
const Post = require("../models/post");

//helper
const isJsonParsable = require("../helpers/is-json-parsable");
const convertUrlToKey = require("../helpers/url-to-aws-key");
const s3Helpers = require("../helpers/s3");

//return all list channel || GET /channel/
exports.getChannels = (req, res, next) => {
  Channel.find()
    .then((channels) => {
      res
        .status(200)
        .json({ message: "All Channel fetched", channels: channels });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getChannelsData = async (req, res, next) => {
  let query;
  const channelIds = req.params.channelId;
  if (isJsonParsable(channelIds)) {
    query = Channel.find({ _id: JSON.parse(channelIds) });
  } else {
    query = Channel.findById(channelIds);
  }
  try {
    const channel = await query
      .populate("member", "_id name photo")
      .populate("admin", "_id name photo");
    if (!channel) {
      const error = new Error("Channels not founds");
      error.statusCode = 404;
      next(error);
    }
    res
      .status(200)
      .json({ message: "All Channel Data fetched", channels: channel });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//create empty channel || POST /channel/
exports.addChannel = (req, res, next) => {
  //error handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  //model construct
  const name = req.body.name;
  const desc = req.body.desc;
  const entry_code = req.body.entryCode;
  const channel = new Channel({
    name: name,
    desc: desc,
    entry_code: entry_code,
  });
  if (req.body.kodeProdi) {
    channel.kodeProdi = req.body.kodeProdi;
  }
  //save model ke database
  channel
    .save()
    .then((result) => {
      res.status(201).json({
        message: "Channel created",
        channel: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//edit channel based on Id || PUT /channel/:channelId
exports.updateChannel = async (req, res, next) => {
  const channelId = req.params.channelId;
  //error validation handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  const name = req.body.name;
  const desc = req.body.desc;
  const entryCode = req.body.entryCode;
  // TODO : reconsider entry code is not changeable
  // TODO: check entry code is used / not, possibly using new route and function if above decided
  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      const error = new Error("Channel not found");
      error.statusCode = 404;
      next(error);
    }
    channel.name = name;
    channel.desc = desc;
    channel.entry_code = entryCode;
    await channel.save();
    res.status(200).json({ message: "Channel updated", channel: channel });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteChannel = (req, res, next) => {
  const channelId = req.params.channelId;
  Channel.findById(channelId)
    .then((channel) => {
      if (!channel) {
        const error = new Error("Channel not found");
        error.statusCode = 404;
        throw error;
      }
      return Channel.findByIdAndRemove(channelId);
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({ message: "Channel deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.setChannelPhoto = async (req, res, next) => {
  const { channelId } = req.params;
  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      const error = new Error("Channel not found");
      error.statusCode = 404;
      next(error);
    }
    if (channel.photo) {
      //delete existing photo in s3 bucket
      const photoKey = convertUrlToKey(channel.photo);
      await s3Helpers.deleteObject(photoKey);
    }
    channel.photo = req.file.location;
    await channel.save();
    res.status(201).json({
      message: "Photo added",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteChannelPhoto = async (req, res, next) => {
  const { channelId } = req.params;
  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      const error = new Error("Channel not found");
      error.statusCode = 404;
      next(error);
    }
    const photoKey = convertUrlToKey(channel.photo);
    await s3Helpers.deleteObject(photoKey);
    channel.photo = null;
    await channel.save();
    res.status(200).json({
      message: "Photo deleted",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.changeSetting = async (req, res, next) => {
  const { channelId } = req.params;
  const { postApproval, entryThroughCode } = req.body;
  try {
    const channel = await Channel.findById(channelId);
    channel.setting = {
      post_approval: postApproval,
      entry_through_code: entryThroughCode,
    };
    await channel.save();
    res
      .status(200)
      .json({ message: "setting updated", setting: channel.setting });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.responsePendingPost = async (req, res, next) => {
  const { channelId, postId, response } = req.params;
  try {
    const channel = await Channel.findById(channelId).populate("pending_posts");
    const pendingPost = channel.pending_posts.find(
      (el) => el._id.toString() === postId
    );
    if (!pendingPost) {
      const error = new Error("Pending post not found");
      error.statusCode = 404;
      next(error);
    }
    let message = "";
    if (response === "approve") {
      const post = await Post.findById(postId);
      post.channel.push(channelId);
      post.pending_channels.pull(channelId);
      await post.save();
      message = "post approved";
    } else if (response === "decline") {
      message = "post declined";
    }
    channel.pending_posts.pull(postId);
    await channel.save();
    res.status(200).json({ message: message });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPendingPost = async (req, res, next) => {
  let channelId, query;
  if (isJsonParsable(req.params.channelId)) {
    channelId = JSON.parse(req.params.channelId);
    query = Channel.find({ _id: channelId });
  } else {
    query = Channel.findById(req.params.channelId);
  }
  try {
    const channel = await query.populate({
      path: "pending_posts",
      populate: { path: "author", select: "_id, name" },
    });
    let pendingPosts;
    if (channel.length) {
      for (const channelElement of channel) {
        let data = {
          channel: { _id: channelElement._id, name: channelElement.name },
          posts: [...channelElement.pending_posts],
        };
        pendingPosts =
          typeof pendingPosts === "undefined"
            ? [data]
            : pendingPosts.push(data);
      }
    } else {
      pendingPosts = channel.pending_posts;
    }
    res
      .status(200)
      .json({ message: "pending post fetched", pendingPosts: pendingPosts });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
