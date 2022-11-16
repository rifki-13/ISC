const express = require("express");

const router = express.Router();

const superUserController = require("../controllers/superuser");
const multerHelper = require("../helpers/multer");

//upload multer
const upload = multerHelper.uploadMahasiswaExcel;

const isAuth = require("../middleware/is-auth");
const isSuperUser = require("../middleware/is-super-user");

router
  .route("/system-setting")
  .get(superUserController.getSystemSetting)
  .put([isAuth, isSuperUser], superUserController.editSystemSetting);

router
  .route("/jurusan-prodi")
  .post([isAuth, isSuperUser], superUserController.addJurusanProdi);

router
  .route("/channels")
  .post([isAuth, isSuperUser], superUserController.createChannel)
  .get([isAuth, isSuperUser], superUserController.getChannels);

router
  .route("/jurusan-prodi/:jurusanId")
  .put([isAuth, isSuperUser], superUserController.editJurusanProdi);
//TODO : superuser can set parent channel / child channel / channel hierarchy
//TODO : superuser can send broadcast to all channel so in this post, contain all channel id in channel field (?)
router
  .route("/import/user")
  .post(
    [isAuth, isSuperUser, express().use(upload.single("attachment"))],
    superUserController.importMahasiswa
  );

router
  .route("/users/prodi/:prodi")
  .get([isAuth, isSuperUser], superUserController.getUserProdi);

router.route("/users").get([isAuth, isSuperUser], superUserController.getUsers);

router
  .route("/users/:userId")
  .delete([isAuth, isSuperUser], superUserController.deleteUser);

module.exports = router;
