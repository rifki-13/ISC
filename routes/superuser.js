const express = require("express");

const router = express.Router();

const superUserController = require("../controllers/superuser");

const isAuth = require("../middleware/is-auth");
const isSuperUser = require("../middleware/is-super-user");

router
  .route("/channel-setting")
  // .post(superUserController.createSystemSetting);
  .put([isAuth, isSuperUser], superUserController.editSystemSetting);

router
  .route("/import/mahasiswa")
  //TODO: import data mahasiswa sebagai user melalui excel
  .post([isAuth, isSuperUser], () => {});

module.exports = router;
