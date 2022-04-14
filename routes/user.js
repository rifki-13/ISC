const express = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/user');

const router = express.Router();

//GET /user/ || get all user
router.get('/', userController.getUsers); //get all user

//POST /user/ || create user
router.post('/', [
    body('username').trim().isLength({max: 30}),
    body('password').trim().isLength({max:16}),
    body('name').trim().isLength({max:30})
],userController.addUser); //create user

module.exports = router;