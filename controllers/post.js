const { validationResult } = require("express-validator");

//model
const Post = require("../models/post");
const User = require("../models/user");
const Channel = require("../models/channel");
const ReportedPost = require("../models/reported_post");
//helper
const s3Helpers = require("../helpers/s3");
const sendPushNotification = require("../helpers/send-notification");
const isJsonParsable = require("../helpers/is-json-parsable");

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
exports.addPost = async (req, res, next) => {
  //error handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    throw error;
  }
  //model construct
  const { readOnly, sendNotification, title, kategori } = req.body;
  const author = req.userId;
  const channel = JSON.parse(req.body.channel);
  let validDate = null;
  if (req.body.validDate) {
    validDate = new Date(req.body.validDate);
  }
  let images = [],
    attachments = [];
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
  try {
    let user = await User.findById(author);
    if (!channel.some((c) => user.assigned_channel.includes(c))) {
      const error = new Error(
        "This user does cant create post in this channel"
      );
      error.statusCode = 403;
      next(error);
    }
    let channelId = [];
    let approvalRequiredChannel = [];
    const channels = await Channel.find({ _id: channel });
    //filtering channel
    for (const chan of channels) {
      if (!chan.setting?.post_approval || chan.admin.includes(author)) {
        channelId.push(chan._id);
      } else {
        approvalRequiredChannel.push(chan);
      }
    }
    //create post
    let postObj = {
      title: title,
      author: author,
      channel: channelId,
      read_only: readOnly,
      kategori: kategori,
      content: content,
    };
    if (validDate) {
      postObj = { ...postObj, validity_date: validDate };
    }
    const post = await Post.create({ ...postObj });
    user.posts.push(post);
    user = await user.save();
    //sent post to pending post in channel
    for (let apprChannel of approvalRequiredChannel) {
      post.pending_channels.push(apprChannel._id);
      apprChannel.pending_posts.push(post);
      apprChannel.save();
    }
    await post.save();
    //Send Notification
    if (sendNotification === "true") {
      let expoTokens = [];
      const users = await User.find()
        .where("assigned_channel")
        .in([...channelId]);
      for (let u of users) {
        if (u._id.toString() !== user._id.toString()) {
          expoTokens.push(u.expo_push_token);
        }
      }
      if (expoTokens.length === 0) {
        return 0;
      }
      await sendPushNotification(expoTokens, post.title, post.content.text);
    }
    res.status(201).json({
      message: "post created",
      post: post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//get a post || GET /post/:postId
exports.getPost = async (req, res, next) => {
  let query;
  const postId = req.params.postId;
  try {
    if (isJsonParsable(postId)) {
      query = Post.find({ _id: JSON.parse(postId) });
    } else {
      query = Post.findById(postId);
    }
    const post = await query
      .populate("channel")
      .populate("author")
      .populate([
        {
          path: "comments",
          populate: "author",
        },
        { path: "comments.replies", populate: "author" },
      ]);
    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      next(error);
    }
    res.status(200).json({ message: "Post Found", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//edit a post || PUT /post/:postId
exports.updatePost = async (req, res, next) => {
  const userId = req.userId;
  const postId = req.params.postId;
  //error validation handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    next(error);
  }
  //extract body request
  const { title, text, channel, kategori, readOnly } = req.body;
  //push attachment location ke array
  let images = [];
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
  try {
    const post = await Post.findById(postId);
    let channelId = [];
    let approvalRequiredChannel = [];
    const channels = await Channel.find({ _id: JSON.parse(channel) });
    //filtering channel
    for (const chan of channels) {
      if (
        !chan.setting?.post_approval ||
        post.channel.includes(chan._id) ||
        chan.admin.includes(userId)
      ) {
        channelId.push(chan._id);
      } else {
        approvalRequiredChannel.push(chan);
      }
    }
    if (approvalRequiredChannel.length > 0) {
      for (let apprChannel of approvalRequiredChannel) {
        apprChannel.pending_posts.push(post);
        apprChannel.save();
      }
    }
    //delete images if on request images not sent
    if (req.body.deleteImages && post.content.images.length !== 0) {
      const images = post.content.images;
      let keys = [];
      //delete images
      if (images.length > 0) {
        keys = s3Helpers.extractKeys(images, keys);
      }
      await s3Helpers.deleteObjects(keys);
    }
    if (post.content.attachments.length > 0) {
      const attachments = post.content.attachments;
      let keys = [];
      keys = s3Helpers.extractKeys(attachments, keys);
      await s3Helpers.deleteObjects(keys);
    }
    post.channel = channelId;
    post.title = title;
    post.kategori = kategori;
    if (req.body.validDate) {
      post.validity_date = new Date(req.body.validDate);
    } else {
      post.validity_date = undefined;
    }
    post.read_only = readOnly;
    post.content = {
      text: text,
      images: images,
    };
    if (images.length > 0) {
      post.content = {
        ...post.content,
        images: images,
      };
    }
    if (attachments.length > 0) {
      post.content = {
        ...post.content,
        attachments: attachments,
      };
    }
    await post.save();
    res.status(200).json({ message: "Post Updated", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//delete a post || DELETE /post/:postId
exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
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
      //pull post id from saved post
      User.find({ saved_post: postId }).then((res) => {
        for (const u of res) {
          u.saved_post.pull(postId);
          u.save();
        }
      });
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

exports.getPostsByChannelStatus = async (req, res, next) => {
  const channelId = JSON.parse(req.params.channelId);
  const status = req.params.status;
  let posts = [];
  try {
    posts = await Post.find({ status: status })
      .where("channel")
      .in([...channelId])
      .populate("channel")
      .populate("author")
      .populate([
        {
          path: "comments",
          populate: "author",
        },
        { path: "comments.replies", populate: "author" },
      ]);
    res.status(200).json({ message: "Post Found", post: posts });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
  if (!posts) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }
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
      comment.content = req.body.content;
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
  try {
    let post = await Post.findById(postId);
    post.status = "reported";
    post.save();
    const reported = await ReportedPost.create({
      post: post._id,
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

exports.deleteReportedStatus = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    post.status = "active";
    const reportedPost = await ReportedPost.findOne({ post: postId });
    if (reportedPost) {
      await post.save();
      await reportedPost.remove();
    }
    res.status(200).json({
      message: "Post reported status is lifted",
      post: post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getReportedPostData = async (req, res, next) => {
  const channelId = JSON.parse(req.params.channelId);
  try {
    const reportedPosts = await ReportedPost.find()
      .where("reported_to")
      .in([...channelId])
      .populate("post")
      .populate("reporter")
      .populate("reported_to");
    console.log(reportedPosts);
    res.status(200).json({
      message: "reported post data fetched",
      reportedPost: reportedPosts,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.removeChannelFromPost = async (req, res, next) => {
  const { postId, channelId } = req.params;
  try {
    await ReportedPost.findOneAndDelete({ post: postId });
    const post = await Post.findById(postId);
    post.channel.pull(channelId);
    post.status = "active";
    await post.save();
    res.status(200).json({ message: "Post removed", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteReportedPost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    const user = await User.findById(post.author);
    const reportedPost = await ReportedPost.findOne({ post: postId });
    if (post && reportedPost) {
      await post.remove();
      user.posts.pull(postId);
      await user.save();
      await reportedPost.remove();
      //loop through all user to remove saved post id
      const users = await User.find({ saved_post: postId });
      for (const u of users) {
        u.pull(postId);
        u.save();
      }
      res.status(200).json({ message: "reported post deleted" });
    } else {
      res.status(404).json({ message: "reported post not found" });
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.toggleComment = async (req, res, next) => {
  const { postId, value } = req.params;
  try {
    const post = await Post.findById(postId);
    post.read_only = value !== "enable";
    await post.save();
    res.status(200).json({ message: `Comment ${value}d` });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
