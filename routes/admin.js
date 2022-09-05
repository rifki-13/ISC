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
  "/channels/:channelId/kick/:userId",
  isAuth,
  isAdmin,
  adminController.kickUser
);

router.put("channels/:channelId", isAuth, isAdmin);

router.put("hierarchy/set", isAuth);

module.exports = router;
