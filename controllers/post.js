const {validationResult} = require('express-validator');

const Post = require('../models/post');

//get all post || GET /post/
exports.getPosts = (req, res, next) => {
    Post
        .find()
        .then(posts => {
            res.status(200).json({message: "All post fetched", posts: posts});
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
}