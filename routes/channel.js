const express = require("express");

//importing channel controller
const channelController = require("../controllers/channel");

//importing middleware
const isAuth = require("../middleware/is-auth");
const isAdmin = require("../middleware/is-admin");
const multerHelper = require("../helpers/multer");

//multer
const upload = multerHelper.uploadChannelPhoto;

//import validator
const channelFormValidator = require("../middleware/validator/channel-form-validator");

const router = express.Router();

router
  .route("/")
  .get(isAuth, channelController.getChannels) //route get /channel/ to get all channel
  .post([isAuth, ...channelFormValidator], channelController.addChannel); //route post /channel/ to create empty channel

router
  .route("/:channelId")
  .get(isAuth, channelController.getChannelsData)
  .put(
    [isAuth, isAdmin, ...channelFormValidator],
    channelController.updateChannel
  ) //edit channel based on channel Id.
  .delete(isAuth, channelController.deleteChannel); //delete channel based on Id || DELETE /channel/:channelId

router
  .route("/:channelId/photo")
  .post(
    [isAuth, isAdmin, express().use(upload.single("photo"))],
    channelController.setChannelPhoto
  )
  .delete([isAuth, isAdmin], channelController.deleteChannelPhoto);

router
  .route("/:channelId/setting")
  .put([isAuth, isAdmin], channelController.changeSetting);

//TODO : add request channel validator
router
  .route("/:channelId/creation-request")
  .get([isAuth, isAdmin], channelController.getRequestedChannel)
  .post([isAuth], channelController.requestChannel);

router
  //  response : "accept","decline"
  .route("/:channelId/creation-request/:requestId/:response")
  //body contain : reason
  .post([isAuth, isAdmin], channelController.responseRequestedChannel);

router
  .route("/:channelId/pending-posts")
  .get([isAuth, isAdmin], channelController.getPendingPost); //accept 1 channel or array of channel

router
  .route("/:channelId/pending-posts/:postId/:response")
  .post([isAuth, isAdmin], channelController.responsePendingPost);

module.exports = router;
