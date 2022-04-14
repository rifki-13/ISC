const {validationResult} = require("express-validator");
const bcrypt = require("bcrypt");
const User = require('../models/user');

//get all user || GET /user/
exports.getUsers = (req, res, next) => {
    res.status(200).json({
        posts: [{title:'first post', content: 'this is content'}]
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