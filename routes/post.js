const express = require('express');
const { body } = require('express-validator');

//import post controller
const postController = require('../controllers/post');

//import middleware
const isAuth = require('../middleware/is-auth');

const router = express.Router();

//route get all post || GET /post/
router.get('/', isAuth, postController.getPosts);

//route create post || POST /post/
router.post('/', isAuth, postController.addPost);

//route get 1 post || GET /post/:postId
router.get('/:postId', isAuth, postController.getPost);

//route update post || PUT /post/:postId
router.put('/:postId', isAuth, postController.updatePost);

//route delete post || DELETE /post/:postId
router.delete('/:postId', isAuth, postController.deletePost);

module.exports = router;