const express = require('express');
const {body} = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.put('/signup', [
    body('username').trim().isLength({max:32})
        .custom((value, {req}) => {
           return User.findOne({username: value}).then(userDoc => {
               if(userDoc) {
                   return Promise.reject('Username already exist');
               }
           })
        }),
    body('password').isLength({max:32}),
    body('name').trim().isLength({max:32})
], authController.signup);

router.post('/signin', authController.login);

module.exports = router;