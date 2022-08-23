const express = require("express");
const { body } = require("express-validator");

//importing channel controller
const channelController = require("../controllers/channel");

//importing middleware
const isAuth = require("../middleware/is-auth");

const router = express.Router();

//route get /channel/ to get all channel
router.get("/", isAuth, channelController.getChannels);

router.get("/:channelIds", isAuth, channelController.getChannelsData);

//route post /channel/ to create empty channel
router.post(
  "/",
  isAuth,
  [
    //validator request
    body("name").trim().isLength({ min: 4, max: 50 }),
    body("desc").trim(),
    body("entry_code").trim().isLength({ min: 6, max: 6 }),
  ],
  channelController.addChannel
);

//get 1 channel based on id || /channel/:channelId
router.get("/:channelId", isAuth, channelController.getChannel);

//edit channel based on Chanusicnel Id.
router.put(
  "/:channelId",
  isAuth,
  [body("name").trim().isLength({ min: 4, max: 50 }), body("desc").trim()],
  channelController.updateChannel
);

//delete channel based on Id || DELETE /channel/:channelId
router.delete("/:channelId", isAuth, channelController.deleteChannel);

module.exports = router;
