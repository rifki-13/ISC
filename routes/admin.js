const express = require("express");

const isAuth = require("../middleware/is-auth");
const isAdmin = require("../middleware/is-admin");

const adminController = require("../controllers/admin");

const router = express.Router();

router
  .route("/channels/:channelId/admin/:userId")
  .post(isAuth, adminController.setAsAdmin)
  .delete(isAuth, adminController.demoteFromAdmin);

router
  .route("/channels/:channelId/status/:value")
  .put([isAuth, isAdmin], adminController.changeChannelStatus);

router.delete(
  "/channels/:channelId/remove/:userId",
  isAuth,
  isAdmin,
  adminController.kickUser
);

//TODO: move route only admin can access to admin route
//response either accept / reject
router.put(
  "/channels/:channelId/users/:userId/:response",
  [isAuth, isAdmin],
  adminController.responsePendingEntry
);

//TODO : add delete channel by admin
router.delete(
  "/channels/:channelId",
  [isAuth, isAdmin],
  adminController.deleteChannel
);

// router.put("hierarchy/set", isAuth);

//admin delete user posts / pull this channel id from posts, so post not visible in this channel
router.delete("/channels/:channelId/posts/:postId", isAuth, isAdmin, () => {});

//admin delete post in channel permanently

module.exports = router;
