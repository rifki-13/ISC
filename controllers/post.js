const {validationResult} = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

//get all post || GET /post/
exports.getPosts = (req, res, next) => {
    Post
        .find()
        .then(posts => {
            res.status(200).json({message: "All post fetched", posts: posts});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

//create a post || POST /post/
exports.addPost = (req, res, next) => {
    //error handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }
    //model construct
    const title = req.body.title;
    const author = req.userId;
    const channel = req.body.channelId;
    const kategori = req.body.kategori;
    let creator;
    let createdPost;
    const content = {
        text: req.body.text
    };
    //validate if this user belong to channel that post directed to
    User.findById(author)
        .then(user => {
            if (!user.assignedChannel.includes(channel)) {
                const error = new Error('This user does cant create post in this channel');
                error.statusCode = 403;
                throw error;
            }
            creator = user;
            //create post
            const post = new Post({
                title: title,
                author: author,
                datePosted: new Date(),
                channel: channel,
                kategori: kategori,
                content: content
            });
            //save post
            return post.save();
        })
        .then(post => {
            createdPost = post;
            creator.posts.push(post);
            return creator.save();
        })
        .then(() => {
            res.status(201).json({
                message: 'Post Created',
                post: createdPost,
                creator: creator
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

//get a post || GET /post/:postId
exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({message: 'Post Found', post: post});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

//edit a post || PUT /post/:postId
exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    //error validation handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }
    //model construct
    const title = req.body.title;
    const channel = req.body.channelId;
    const kategori = req.body.kategori;
    const content = {
        text: req.body.text
    };
    Post.findById(postId)
        .then(post => {
            //not found error
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            //validating user
            if (post.author.toString() !== req.userId) {
                const error = new Error('Not Authorized');
                error.statusCode = 403;
                throw error;
            }
            post.title = title;
            post.channel = channel;
            post.kategori = kategori;
            post.content = content;
            return post.save();
        })
        //send result
        .then(result => {
            res.status(200).json({message: "Post Updated", post: result});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

//delete a post || DELETE /post/:postId
exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            //validating user
            if (post.author.toString() !== req.userId) {
                const error = new Error('Not Authorized');
                error.statusCode = 403;
                throw error;
            }
            return Post.findByIdAndRemove(postId);
        })
        .then(() => {
            return User.findById(req.userId);
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save();
        })
        .then(() => {
            res.status(200).json({message: "Post deleted"});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.getPostsByChannel = (req, res, next) => {
    const channelId = req.params.channelId;
    Post.find({channel: channelId})
        .then(post => {
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({message: 'Post Found', post: post});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.getPostByUser = (req, res, next) => {
    const userId = req.userId;
    Post.find({author: userId})
        .then(post => {
            //not found error
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            return post;
        })
        .then(result => {
            res.status(200).json({message: "post by " + userId, post: result});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });

}

exports.postComment = (req, res, next) => {
    const postId = req.params.postId;
    //error validation handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }
    //extracting request
    const userId = req.userId;
    const content = req.body.content;
    const date = new Date();
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            post.comments.push({
                author: userId,
                content: content,
                date: date
            })
            return post.save();
        })
        .then(post => {
            res.status(200).json({
                message: 'Comment added',
                post: post
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

//edit comment in a post
exports.editComment = (req, res, next) => {
    //error handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    Post.findById(postId)
        .then(post => {
            //not found error
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            const comment = post.comments.id(commentId);
            //validating user's comment
            if (comment.author.toString() !== req.userId) {
                const error = new Error('Not Authorized');
                error.statusCode = 403;
                throw error;
            }
            comment.content = req.body.comment;
            comment.date = new Date();
            return post.save();
        })
        .then(result => {
            res.status(200).json({message: "Post with comment", post: result});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

//delete comment
exports.deleteComment = (req, res, next) => {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    Post.findById(postId)
        .then(post => {
            //not found error
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            //validating user
            if (post.author.toString() !== req.userId) {
                const error = new Error('Not Authorized');
                error.statusCode = 403;
                throw error;
            }
            post.comments.id(commentId).remove();
            return post;
        })
        .then(result => {
            res.status(200).json({message: "comment deleted", post: result});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.replyComment = (req, res, next) => {
    //validation handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }
    //extract request
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const userId = req.userId;
    const content = req.body.content;
    Post.findById(postId)
        .then(post => {
            //not found error
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            const comment = post.comments.id(commentId);
            comment.replies.push({
                user_id: userId,
                content: content
            });
            return post.save();
        })
        .then(post => {
            res.status(200).json({
                message: 'Comment replied successfully',
                post: post
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}