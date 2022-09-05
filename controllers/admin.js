const Channel = require("../models/channel");
const User = require("../models/user");

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

// exports.