const express = require('express');
const { body } = require('express-validator');
const aws = require("aws-sdk");
const config = require("config");
const multer = require("multer");
const multerS3 = require("multer-s3");

const userController = require('../controllers/user');

const isAuth = require('../middleware/is-auth');

//s3 account
const s3 = new aws.S3({
    accessKeyId: config.get('s3.accessKeyId'),
    secretAccessKey: config.get('s3.secretAccessKey')
})

//multer upload user photo
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.get('s3.bucket'),
        acl: "public-read",
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, 'user_photos/' + Date.now().toString() + '-' + file.originalname);
        }
    })
})

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
router.post('/photo', [isAuth, express().use(upload.single('photo'))], userController.changePhoto);

//POST /user/photo/remove
router.delete('/photo', isAuth, userController.removePhoto);

//DELETE /user/:userId
router.delete('/:userId', userController.deleteUser);

//route save post ke user || POST /users/posts/:postId/save
router.post('/posts/:postId/save', isAuth, userController.savePost);

//DELETE /users/:postId/remove-save || Menghapus saved post dari user
router.delete('/posts/:postId/remove-saved', isAuth, userController.removeSavedPost);

module.exports = router;