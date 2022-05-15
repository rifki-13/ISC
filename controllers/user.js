const {validationResult} = require("express-validator");
const bcrypt = require("bcrypt");
const aws = require('aws-sdk');

//importing model
const User = require('../models/user');
const Channel = require('../models/channel');

//get all user || GET /user/
exports.getUsers = (req, res, next) => {
    User
        .find()
        .then(users => {
            res.status(200).json({message: "Users fetched", users: users})
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
};

//create user || POST /user/
exports.addUser = (req, res, next) => {
    //error handling
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }
    //extract request body
    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name;
    //generating hashed password
    bcrypt.genSalt(10)
        .then(salt => {
            bcrypt.hash(password, salt)
                .then(hash => {
                    //construct user after hash done
                    const user = new User({
                        username: username,
                        password: hash,
                        name: name
                    });
                    //save user model to database
                    user.save()
                        .then(result=> {
                            res.status(201).json({
                                message: 'User Created',
                                user: result
                            })
                        })
                        .catch(err => {
                            if(!err.statusCode){
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
    Channel.findOne({entry_code: entry_code})
        .then(channel => {
            //wrong entry code
            if(!channel){
                const error = new Error('Wrong entry code');
                error.statusCode = 401;
                throw error;
            }
            channelEntered = channel;
            return User.findById(userId);
        })
        .then(user => {
            if(user.assignedChannel.includes(channelEntered._id)){
                const error = new Error('User has already in this channel');
                error.statusCode = 400;
                throw error;
            }
            user.assignedChannel.push(channelEntered._id);
            channelEntered.member.push(user._id);
            channelEntered.save();
            return user.save();
        })
        .then(user => {
            res.status(201).json({
                message: user.name + ' entered channel successfully',
                user: user
            })
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.quitChannel = (req, res, next) => {
    const userId = req.userId;
    const channelId = req.params.channelId;
    User.findById(userId)
        .then(user => {
            //throw error if user not in this channel
            if(!user.assignedChannel.includes(channelId)){
                const error = new Error('This user does not belong in this channel');
                error.statusCode = 403;
                throw error;
            }
            user.assignedChannel.pull(channelId);
            return user.save();
        })
        .then(() => {
            return Channel.findById(channelId)
                .then(channel => {
                    channel.member.pull(userId);
                    return channel.save();
                })
        })
        .then(channel => {
            res.status(200).json({
                message: "User successfully quit channel",
                channel: channel,
            })
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.changePhoto = (req, res, next) => {
    const userId = req.userId;
    User.findById(userId)
        .then(user => {
            user.photo = req.file.location
            return user.save();
        })
        .then(user => {
            res.status(201).json({
                message: "Photo added",
                user: user,
                key: req.file.key
            })
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.removePhoto = (req, res, next) => {
    const userId = req.userId;
    let photoKey;
    User.findById(userId)
        .then(user => {
            //error photo is null handler
            if(user.photo === null){
                const error = new Error('Photo is not exist');
                error.statusCode = 404;
                throw error;
            }
            photoKey = user.photo.slice(user.photo.indexOf('aws.com/') + 8);
            user.photo = null;
            return user.save();
        })
        //delete photo in s3 bucket
        .then(user => {
            //s3 account
            const s3 = new aws.S3({
                accessKeyId: 'AKIAWDXZGMLGMFFP2SPU',
                secretAccessKey: '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',
            })
            return s3.deleteObject({
                Bucket: 'ta-isc',
                Key: photoKey,
            }).promise()
        })
        .then(response => {
            res.status(201).json({
                message: "Photo removed",
                key: photoKey
            })
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.deleteUser = (req, res, next) => {
    const userId = req.params.userId;
    User.findById(userId)
        .then(user => {
            if(!user){
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }
            return User.findByIdAndRemove(userId);
        })
        .then(() => {
            return Channel.find({member: userId});
        })
        .then(channels => {
            return channels.forEach(channel => {
                channel.member.pull(userId);
                channel.save();
            })
        })
        .then(() => {
            res.status(200).json({message: "User deleted"});
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        })
}