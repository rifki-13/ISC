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
router.post('/', isAuth);

module.exports = router;