const express = require("express");
const { body } = require("express-validator");

//import post controller
const postController = require("../controllers/post");

//import middleware
const isAuth = require("../middleware/is-auth");
const multerHelper = require("../helpers/multer");

//upload multer
const upload = multerHelper.uploadPostAttachment;

const router = express.Router();

//route get all post || GET /post/
router.get("/", isAuth, postController.getPosts);

//route create post || POST /post/
router.post(
  "/",
  [
    express().use(
      upload.fields([
        { name: "images", maxCount: 10 },
        {
          name: "attachments",
          maxCount: 10,
        },
        // { name: "videos", maxCount: 3 },
      ])
    ),
    isAuth,
  ],
  postController.addPost
);

//route get 1 post || GET /post/:postId
router.get("/:postId", isAuth, postController.getPost);

//route update post || PUT /post/:postId
router.put(
  "/:postId",
  [
    express().use(
      upload.fields([
        { name: "images", maxCount: 10 },
        {
          name: "attachments",
          maxCount: 10,
        },
        // { name: "videos", maxCount: 3 },
      ])
    ),
    isAuth,
  ],
  postController.updatePost
);

//route delete post || DELETE /post/:postId
router.delete("/:postId", isAuth, postController.deletePost);

//route get post based on channel id || POST /posts/channel/:channelId
router.get("/channel/:channelId", isAuth, postController.getPostsByChannel);

//route post comment || POST /post/:postId/comment
router.post(
  "/:postId/comment",
  isAuth,
  [body("content").isLength({ max: 50, min: 1 })],
  postController.postComment
);

//route edit comment || PUT /posts/:postId/comment/:commentId
router.put(
  "/:postId/comment/:commentId",
  isAuth,
  [body("comment").isLength({ max: 50, min: 1 })],
  postController.editComment
);

//route delete comment || DELETE /posts/:postId/comment/:commentId
router.delete(
  "/:postId/comment/:commentId",
  isAuth,
  postController.deleteComment
);

//route reply comments || POST /posts/:postId/comments/:commentId/reply
router.post(
  "/:postId/comments/:commentId/reply",
  isAuth,
  [body("content").isLength({ max: 50, min: 1 })],
  postController.replyComment
);

//route edit reply || PUT /posts/:postId/comments/:commentId/reply/:replyId/edit
router.put(
  "/:postId/comments/:commentId/reply/:replyId",
  isAuth,
  [body("content").isLength({ max: 50, min: 1 })],
  postController.editReply
);

//route delete reply || DELETE /posts/:postId/comments/:commentId/reply/:replyId/edit
router.delete(
  "/:postId/comments/:commentId/reply/:replyId",
  isAuth,
  postController.deleteReply
);

module.exports = router;
