const express = require("express");
const { body } = require("express-validator");

const userController = require("../controllers/user");

const isAuth = require("../middleware/is-auth");
const multerHelper = require("../helpers/multer");

//multer upload user photo
const upload = multerHelper.uploadUserPhoto;

const router = express.Router();

//route /
router
  .route("/")
  .get(isAuth, userController.getUsers) //get all user
  .post(
    [
      body("username").trim().isLength({ max: 30 }),
      body("password").trim().isLength({ max: 16 }),
      body("name").trim().isLength({ max: 30 }),
    ],
    userController.addUser
  ); //create user

router.route("/:userId/profile").put(isAuth, userController.updateProfile);

router
  .route("/:userId")
  .get(userController.getUser)
  .delete(userController.deleteUser); //DELETE /user/:userId

router
  .route("/:userId/photo")
  .post(
    [isAuth, express().use(upload.single("photo"))],
    userController.changePhoto
  ) //POST /user/change-photo
  .delete(isAuth, userController.removePhoto); //POST /user/photo/remove

//route to save expo push token
router
  .route("/:userId/expo-token")
  .post(isAuth, userController.saveExpoToken)
  .delete(isAuth, userController.deleteExpoToken);

//route get post based on userid || GET /posts/user
router.route("/:userId/posts").get(isAuth, userController.getOwnPost);

//TODO get user data without sensitif data
// router.get("/user-data/:userId", userController.getUserData);

//POST /user/ || create user

//POST /user/assign
router.post("/channel/:entryCode", isAuth, userController.enterChannel);

//POST /users/channel/:channelId/quit
router.delete("/channel/:channelId/quit", isAuth, userController.quitChannel);

router
  .route("/posts/:postId/save")
  .post(isAuth, userController.savePost) //route save post ke user || POST /users/posts/:postId/save
  .delete(isAuth, userController.removeSavedPost); //DELETE /users/:postId/remove-save || // Menghapus saved post dari user

router
  .route("/posts/:postId/archive")
  .post(isAuth, userController.archivePost) //POST /users/posts/:postId/archive || Archive post
  .delete(isAuth, userController.unarchivePost); //DELETE /users/posts/:postId/archive || Unarchive active post

module.exports = router;
