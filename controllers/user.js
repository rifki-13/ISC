const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

//importing model
const User = require("../models/user");
const Channel = require("../models/channel");
const Post = require("../models/post");
const s3Helpers = require("../helpers/s3");
const mongoose = require("mongoose");

//get all user || GET /user/
exports.getUsers = (req, res, next) => {
  User.find()
    .then((users) => {
      res.status(200).json({ message: "Users fetched", users: users });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUser = (req, res, next) => {
  const userId = req.params.userId;
  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User doesn't exist");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "User's data fetched", user: user });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUserData = (req, res, next) => {
  const userId = req.params.userId;
  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User doesn't exist");
        error.statusCode = 404;
        throw error;
      }
      const userData = {
        name: user.name,
        username: user.username,
        jurusan: user.jurusan,
        prodi: user.prodi,
      };
      res.status(200).json({ message: "User's data fetched", user: userData });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//create user || POST /user/
exports.addUser = (req, res, next) => {
  //error handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  //extract request body
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;
  const jurusan = req.body.jurusan;
  const prodi = req.body.prodi;
  //generating hashed password
  bcrypt.genSalt(10).then((salt) => {
    bcrypt.hash(password, salt).then((hash) => {
      //construct user after hash done
      const user = new User({
        username: username,
        password: hash,
        name: name,
        jurusan: jurusan,
        prodi: prodi,
      });
      //save user model to database
      user
        .save()
        .then((result) => {
          res.status(201).json({
            message: "User Created",
            user: result,
          });
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    });
  });
};

//assign user to channel through entry code
exports.enterChannel = (req, res, next) => {
  //extracting request
  const entry_code = req.params.entryCode;
  let channelEntered;
  const userId = req.userId;
  Channel.findOne({ entry_code: entry_code })
    .then((channel) => {
      //wrong entry code
      if (!channel) {
        const error = new Error("Wrong entry code");
        error.statusCode = 404;
        throw error;
      }
      channelEntered = channel;
      return User.findById(userId);
    })
    .then((user) => {
      if (user.assigned_channel.includes(channelEntered._id)) {
        const error = new Error("User has already in this channel");
        error.statusCode = 400;
        throw error;
      }
      user.assigned_channel.push(channelEntered._id);
      channelEntered.member.push(user._id);
      channelEntered.save();
      return user.save();
    })
    .then((user) => {
      res.status(201).json({
        message: user.name + " entered channel successfully",
        user: user,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.quitChannel = (req, res, next) => {
  const userId = req.userId;
  const channelId = req.params.channelId;
  User.findById(userId)
    .then((user) => {
      //throw error if user not in this channel
      if (!user.assigned_channel.includes(channelId)) {
        const error = new Error("This user does not belong in this channel");
        error.statusCode = 403;
        throw error;
      }
      user.assigned_channel.pull(channelId);
      return user.save();
    })
    .then(() => {
      return Channel.findById(channelId).then((channel) => {
        channel.member.pull(userId);
        return channel.save();
      });
    })
    .then((channel) => {
      res.status(200).json({
        message: "User successfully quit channel",
        channel: channel,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.changePhoto = (req, res, next) => {
  const userId = req.userId;
  User.findById(userId)
    .then((user) => {
      user.photo = req.file.location;
      return user.save();
    })
    .then((user) => {
      res.status(201).json({
        message: "Photo added",
        user: user,
        key: req.file.key,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.removePhoto = (req, res, next) => {
  const userId = req.userId;
  let photoKey;
  User.findById(userId)
    .then((user) => {
      //error photo is null handler
      if (user.photo === null) {
        const error = new Error("Photo is not exist");
        error.statusCode = 404;
        throw error;
      }
      photoKey = user.photo.slice(user.photo.indexOf("aws.com/") + 8);
      user.photo = null;
      return user.save();
    })
    //delete photo in s3 bucket
    .then(() => {
      return s3Helpers.deleteObject(photoKey);
    })
    .then(() => {
      res.status(201).json({
        message: "Photo removed",
        key: photoKey,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteUser = (req, res, next) => {
  const userId = req.params.userId;
  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }
      return User.findByIdAndRemove(userId);
    })
    .then(() => {
      return Channel.find({ member: userId });
    })
    .then((channels) => {
      return channels.forEach((channel) => {
        channel.member.pull(userId);
        channel.save();
      });
    })
    .then(() => {
      res.status(200).json({ message: "User deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//save post
exports.savePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      //not found error
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      return User.findById(req.userId)
        .then((user) => {
          user.saved_post.push(post);
          return user.save();
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    })
    .then((result) => {
      res.status(200).json({ message: "Post saved", user: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.removeSavedPost = (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.userId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      return post;
    })
    .then((post) => {
      return User.findById(userId).then((user) => {
        user.saved_post.pull(post._id);
        return user.save();
      });
    })
    .then((user) => {
      res.status(200).json({ message: "Saved post deleted", user: user });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.archivePost = (req, res, next) => {
  const userId = req.userId;
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (post.author.toString() !== userId) {
        const error = new Error("This post doesnt belong to this user");
        error.statusCode = 403;
        throw error;
      }
      post.status = "archived";
      return post.save();
    })
    .then((post) => {
      return User.findById(userId)
        .then((user) => {
          user.posts.pull(post);
          user.archived_posts.push(post);
          return user.save();
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    })
    .then((user) => {
      res.status(200).json({ message: "Post archived", user: user });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.unarchivePost = (req, res, next) => {
  const userId = req.userId;
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (post.author.toString() !== userId) {
        const error = new Error("This post doesnt belong to this user");
        error.statusCode = 403;
        throw error;
      }
      if (post.status !== "archived") {
        const error = new Error("This post is not archived");
        error.statusCode = 400;
        throw error;
      }
      post.status = "active";
      return post.save();
    })
    .then((post) => {
      return User.findById(userId)
        .then((user) => {
          user.archived_posts.pull(post);
          user.posts.push(post);
          return user.save();
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    })
    .then((user) => {
      res.status(200).json({ message: "Post unarchived", user: user });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getOwnPost = (req, res, next) => {
  const userId = mongoose.Types.ObjectId(req.params.userId);
  Post.find({ author: userId })
    .populate("channel")
    .populate("author")
    .populate([
      {
        path: "comments",
        populate: "author",
      },
      { path: "comments.replies", populate: "author" },
    ])
    .then((post) => {
      //not found error
      return post;
    })
    .then((result) => {
      res.status(200).json({ message: "post by " + userId, posts: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.saveExpoToken = (req, res, next) => {
  const expoToken = req.body.expoToken;
  const userId = req.userId;
  User.findById(userId)
    .then((user) => {
      user.expo_push_token = expoToken;
      user.save();
      res.status(200).json({ message: "Expo Push Token Saved" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteExpoToken = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    user.expo_push_token = "";
    await user.save();
    res.status(200).json({ message: "expo push token deleted" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
