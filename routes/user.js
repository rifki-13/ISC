const express = require("express");
const { body } = require("express-validator");

const userController = require("../controllers/user");

const isAuth = require("../middleware/is-auth");
const multerHelper = require("../helpers/multer");

//multer upload user photo
const upload = multerHelper.uploadUserPhoto;

const router = express.Router();

//GET /user/ || get all user
router.get("/", isAuth, userController.getUsers); //get all user\

router.get("/:userId", userController.getUser);

//TODO get user data without sensitif data
router.get("/user-data/:userId", userController.getUserData);

//POST /user/ || create user
router.post(
  "/",
  [
    body("username").trim().isLength({ max: 30 }),
    body("password").trim().isLength({ max: 16 }),
    body("name").trim().isLength({ max: 30 }),
  ],
  userController.addUser
); //create user

//POST /user/assign
router.post("/channel/:entryCode", isAuth, userController.enterChannel);

//POST /users/channel/:channelId/quit
router.delete("/channel/:channelId/quit", isAuth, userController.quitChannel);

//POST /user/change-photo
router.post(
  "/photo",
  [isAuth, express().use(upload.single("photo"))],
  userController.changePhoto
);

//POST /user/photo/remove
router.delete("/photo", isAuth, userController.removePhoto);

//DELETE /user/:userId
router.delete("/:userId", userController.deleteUser);

//route save post ke user || POST /users/posts/:postId/save
router.post("/posts/:postId/save", isAuth, userController.savePost);

//DELETE /users/:postId/remove-save || Menghapus saved post dari user
router.delete("/posts/:postId/save", isAuth, userController.removeSavedPost);

//POST /users/posts/:postId/archive || Archive post
router.post("/posts/:postId/archive", isAuth, userController.archivePost);

//DELETE /users/posts/:postId/archive || Unarchive active post
router.delete("/posts/:postId/archive", isAuth, userController.unarchivePost);

//route get post based on userid || GET /posts/user
router.get("/posts/own", isAuth, userController.getOwnPost);

module.exports = router;
