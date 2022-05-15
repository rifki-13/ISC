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
router.post('/channel/:entryCode', isAuth, userController.enterChannel);

//POST /users/channel/:channelId/quit
router.post('/channel/:channelId/quit', isAuth, userController.quitChannel)

//POST /user/change-photo
router.post('/change-photo', isAuth, userController.changePhoto);

//POST /user/photo/remove
router.post('/photo/remove', isAuth, userController.removePhoto);

//DELETE /user/:userId
router.delete('/:userId', userController.deleteUser);

module.exports = router;