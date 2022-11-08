const express = require("express");

const isAuth = require("../middleware/is-auth");
const isAdmin = require("../middleware/is-admin");

const adminController = require("../controllers/admin");

const router = express.Router();

router.post(
  "/channels/:channelId/set-admin/:userId",
  isAuth,
  adminController.setAsAdmin
);

router.delete(
  "/channels/:channelId/demote-admin/:userId",
  isAuth,
  adminController.demoteFromAdmin
);

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

router.put("channels/:channelId", isAuth, isAdmin);

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
