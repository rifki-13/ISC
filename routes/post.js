const express = require("express");

//import post controller
const postController = require("../controllers/post");

//import middleware
const isAuth = require("../middleware/is-auth");
const uploadPostAttachmentMiddleware = require("../middleware/uploader/post-attachment-middleware");
const commentValidator = require("../middleware/validator/comment-reply-validator");

const router = express.Router();

router
  .route("/")
  .get(isAuth, postController.getPosts) //route get all post
  .post([isAuth, uploadPostAttachmentMiddleware], postController.addPost); //route create post

router
  .route("/:postId")
  .get(isAuth, postController.getPost) //route get 1 post
  //  TODO : change update post
  .put([isAuth, uploadPostAttachmentMiddleware], postController.updatePost) //route update post
  .delete(isAuth, postController.deletePost); //route delete post

//report post
router
  .route("/:postId/report")
  .post(isAuth, postController.reportPost)
  //TODO : add admin middleware later, after creating reported post page in admin client
  .delete(isAuth, postController.deleteReportedStatus);

//Enable disable comment
router
  .route("/:postId/set/comment/:value")
  .put(isAuth, postController.toggleComment);

router
  .route("/channel/:channelId")
  .get(isAuth, postController.getPostsByChannel); //route get post based on channel id

//get post by channel and status
router
  .route("/channel/:channelId/:status")
  .get(isAuth, postController.getPostsByChannelStatus);

router
  .route("/:postId/comment")
  .post([isAuth, commentValidator], postController.postComment); //route post comment

router
  .route("/:postId/comment/:commentId")
  .put([isAuth, commentValidator], postController.editComment) //route edit comment
  .delete(isAuth, postController.deleteComment); //route delete comment

router
  .route("/:postId/comments/:commentId/reply")
  .post([isAuth, commentValidator], postController.replyComment); //route reply comments

router
  .route("/:postId/comments/:commentId/reply/:replyId")
  .put([isAuth, commentValidator], postController.editReply) //route edit reply
  .delete(isAuth, postController.deleteReply); //route delete reply

router
  .route("/reported/channels/:channelId")
  .get(postController.getReportedPostData);

router
  .route("/reported/:postId")
  .delete(isAuth, postController.deleteReportedPost);

router
  .route("/:postId/channels/:channelId")
  .delete(isAuth, postController.removeChannelFromPost);

module.exports = router;
