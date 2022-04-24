const {validationResult} = require("express-validator");
const bcrypt = require("bcrypt");

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
exports.assignChannel = (req, res, next) => {
    //validation error handling
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }
    //extracting request
    const entry_code = req.body.entry_code;
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