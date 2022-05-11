const express = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/user');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

//GET /user/ || get all user
router.get('/', isAuth, userController.getUsers); //get all user

//POST /user/ || create user
router.post('/', [
    body('username').trim().isLength({max: 30}),
    body('password').trim().isLength({max:16}),
    body('name').trim().isLength({max:30})
],userController.addUser); //create user

//POST /user/assign
router.post('/assign', isAuth, [
    body('entry_code').trim().isLength({max:6, min:6})
], userController.assignChannel);

//POST /user/changePhoto
router.post('/changePhoto', isAuth, userController.changePhoto);

//DELETE /user/:userId
router.delete('/:userId', userController.deleteUser);

module.exports = router;