const { validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");
const ReportedPost = require("../models/reported_post");
const s3Helpers = require("../helpers/s3");
const { Expo } = require("expo-server-sdk");
const axios = require("axios");

//get all post || GET /post/
exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res.status(200).json({ message: "All post fetched", posts: posts });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//create a post || POST /post/
exports.addPost = (req, res, next) => {
  //error handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  //model construct
  const title = req.body.title;
  const author = req.userId;
  const channel = JSON.parse(req.body.channel);
  const kategori = req.body.kategori;
  let validDate = null;
  if (req.body.validDate) {
    validDate = new Date(req.body.validDate);
  }
  const readOnly = req.body.readOnly;
  const sendNotif = req.body.sendNotification;
  let creator;
  let createdPost;
  let images = [];
  // let videos = [];
  let attachments = [];
  if (req.files) {
    if (req.files.images) {
      req.files.images.forEach((element) => {
        images.push(element.location);
      });
    }
    if (req.files.attachments) {
      req.files.attachments.forEach((element) => {
        attachments.push(element.location);
      });
    }
  }
  const content = {
    text: req.body.text,
    images: images,
    attachments: attachments,
  };
  //validate if this user belong to channel that post directed to
  User.findById(author)
    .then((user) => {
      if (!channel.some((c) => user.assigned_channel.includes(c))) {
        const error = new Error(
          "This user does cant create post in this channel"
        );
        error.statusCode = 403;
        throw error;
      }
      creator = user;
      //create post
      let postObj = {
        title: title,
        author: author,
        channel: channel,
        read_only: readOnly,
        kategori: kategori,
        content: content,
      };
      if (validDate) {
        postObj = { ...postObj, validity_date: validDate };
      }
      const post = new Post({ ...postObj });
      //save post
      return post.save();
    })
    .then((post) => {
      createdPost = post;
      creator.posts.push(post);
      return creator.save();
    })
    .then((creator) => {
      if (sendNotif === "true") {
        //send notification
        let expoTokens = [];
        User.find().then((res) => {
          res.forEach((el) => {
            if (
              Expo.isExpoPushToken(el.expo_push_token) &&
              creator.expo_push_token !== el.expo_push_token
            ) {
              expoTokens.push(el.expo_push_token);
            }
          });
          axios({
            url: "https://exp.host/--/api/v2/push/send",
            headers: {
              "Content-Type": "application/json",
            },
            method: "post",
            data: {
              to: expoTokens,
              title: createdPost.title,
              body: createdPost.content.text,
            },
          }).then((res) => {
            console.log(res.data);
          });
        });
      }
      res.status(201).json({
        message: "Post Created",
        post: createdPost,
        creator: creator,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//get a post || GET /post/:postId
exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .populate("author")
    .populate([
      {
        path: "comments",
        populate: "author",
      },
      { path: "comments.replies", populate: "author" },
    ])
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Post Found", post: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//edit a post || PUT /post/:postId
exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  //error validation handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  //extract body request
  const title = req.body.title;
  const channel = req.body.channelId;
  const kategori = req.body.kategori;
  //push attachment location ke array
  let images = [];
  // let videos = [];
  let attachments = [];
  if (req.files) {
    if (req.files.images) {
      req.files.images.forEach((element) => {
        images.push(element.location);
      });
    }
    // if (req.files.videos) {
    //   req.files.videos.forEach((element) => {
    //     videos.push(element.location);
    //   });
    // }
    if (req.files.attachments) {
      req.files.attachments.forEach((element) => {
        attachments.push(element.location);
      });
    }
  }
  //object content
  const content = {
    text: req.body.text,
    images: images,
    // videos: videos,
    attachments: attachments,
  };
  Post.findById(postId)
    .then((post) => {
      //not found error
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      //validating user
      if (post.author.toString() !== req.userId) {
        const error = new Error("Not Authorized");
        error.statusCode = 403;
        throw error;
      }
      //extract array
      const images = post.content.images;
      // const videos = post.content.videos;
      const attachments = post.content.attachments;
      let keys = [];
      //delete images
      if (images.length > 0) {
        keys = s3Helpers.extractKeys(images, keys);
      }
      //delete videos
      // if (videos.length > 0) {
      //   keys = s3Helpers.extractKeys(videos, keys);
      // }
      //delete attachment
      if (attachments.length > 0) {
        keys = s3Helpers.extractKeys(attachments, keys);
      }
      s3Helpers.deleteObjects(keys);
      post.title = title;
      post.channel = channel;
      post.kategori = kategori;
      post.content = content;
      return post.save();
    })
    //send result
    .then((result) => {
      res.status(200).json({ message: "Post Updated", post: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//delete a post || DELETE /post/:postId
exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      //TODO : loop through all users to delete deleted post from saved post id
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      //validating user
      if (post.author.toString() !== req.userId) {
        const error = new Error("Not Authorized");
        error.statusCode = 403;
        throw error;
      }
      //extract array
      const images = post.content.images;
      // const videos = post.content.videos;
      const attachments = post.content.attachments;
      let keys = [];
      //delete images
      if (images.length > 0) {
        keys = s3Helpers.extractKeys(images, keys);
        s3Helpers.deleteObjects(keys);
      }
      //delete attachment
      if (attachments.length > 0) {
        keys = s3Helpers.extractKeys(attachments, keys);
        s3Helpers.deleteObjects(keys);
      }
      return Post.findByIdAndRemove(postId);
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(() => {
      res.status(200).json({ message: "Post deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPostsByChannel = (req, res, next) => {
  const channelId = JSON.parse(req.params.channelId);
  Post.find()
    .where("channel")
    .in([...channelId])
    .populate("author")
    .populate([
      {
        path: "comments",
        populate: "author",
      },
      { path: "comments.replies", populate: "author" },
    ])
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Post Found", post: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postComment = (req, res, next) => {
  const postId = req.params.postId;
  //error validation handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  //extracting request
  const userId = req.userId;
  const content = req.body.content;
  const date = new Date();
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      post.comments.push({
        author: userId,
        content: content,
        date: date,
      });
      return post.save();
    })
    .then((post) => {
      res.status(200).json({
        message: "Comment added",
        post: post,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//edit comment in a post
exports.editComment = (req, res, next) => {
  //error handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const commentId = req.params.commentId;
  Post.findById(postId)
    .then((post) => {
      //not found error
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      const comment = post.comments.id(commentId);
      //validating user's comment
      if (comment.author.toString() !== req.userId) {
        const error = new Error("Not Authorized");
        error.statusCode = 403;
        throw error;
      }
      comment.content = req.body.comment;
      comment.date = new Date();
      return post.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Post with comment", post: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//delete comment
exports.deleteComment = (req, res, next) => {
  const postId = req.params.postId;
  const commentId = req.params.commentId;
  Post.findById(postId)
    .then((post) => {
      //not found error
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      post.comments.id(commentId).remove();
      return post.save();
    })
    .then((result) => {
      res.status(200).json({ message: "comment deleted", post: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.replyComment = (req, res, next) => {
  //validation handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  //extract request
  const postId = req.params.postId;
  const commentId = req.params.commentId;
  const author = req.userId;
  const content = req.body.content;
  Post.findById(postId)
    .then((post) => {
      //not found error
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      const comment = post.comments.id(commentId);
      comment.replies.push({
        author: author,
        content: content,
      });
      return post.save();
    })
    .then((post) => {
      res.status(201).json({
        message: "Comment replied successfully",
        post: post,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.editReply = (req, res, next) => {
  //validation handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  //extract request
  const postId = req.params.postId;
  const commentId = req.params.commentId;
  const replyId = req.params.replyId;
  const userId = req.userId;
  const content = req.body.content;
  Post.findById(postId)
    .then((post) => {
      //not found error
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      const comment = post.comments.id(commentId);
      const reply = comment.replies.id(replyId);
      if (!reply.user_id === userId) {
        const error = new Error("This user cannot edit others reply");
        error.statusCode = 403;
        throw error;
      }
      reply.content = content;
      return post.save();
    })
    .then((post) => {
      res.status(200).json({
        message: "Reply edited successfully",
        post: post,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteReply = (req, res, next) => {
  const postId = req.params.postId;
  const commentId = req.params.commentId;
  const replyId = req.params.replyId;
  const userId = req.userId;
  Post.findById(postId)
    .then((post) => {
      //not found error
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      const reply = post.comments.id(commentId).replies.id(replyId);
      if (reply.author.toString() !== userId.toString()) {
        const error = new Error("Not authorized");
        error.statusCode = 403;
        throw error;
      }
      reply.remove();
      return post.save();
    })
    .then((post) => {
      res.status(200).json({
        message: "Reply deleted successfully",
        post: post,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.reportPost = async (req, res, next) => {
  const userId = req.userId;
  const { postId } = req.params;
  const { reportedTo, reason, description } = req.body;
  console.log(req);
  try {
    let post = await Post.findById(postId);
    post.status = "reported";
    post.save();
    const reported = await ReportedPost.create({
      postId: post._id,
      reported_to: reportedTo,
      reporter: userId,
      reason: reason,
      description: description,
    });
    res.status(200).json({
      message: "Post reported successfully",
      reported: reported,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
