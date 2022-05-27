const multer = require("multer");
const multerS3 = require("multer-s3");
const config = require("config");
const s3Helpers = require("../helpers/s3");
const s3 = s3Helpers.client;

const imageWL = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const videoWL = ["video/x-msvideo", "video/mp4", "video/mpeg", "video/webm"];

exports.uploadPostAttachment = multer({
  storage: multerS3({
    s3: s3,
    bucket: config.get("s3.bucket"),
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(
        null,
        "attachments/" + Date.now().toString() + "-" + file.originalname
      );
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "images") {
      if (!imageWL.includes(file.mimetype)) {
        return cb(new Error("image file only"), false);
      }
      cb(null, true);
    } else if (file.fieldname === "videos") {
      if (!videoWL.includes(file.mimetype)) {
        return cb(new Error("video file only"), false);
      }
      cb(null, true);
    } else {
      cb(null, true);
    }
  },
});

exports.uploadUserPhoto = multer({
  storage: multerS3({
    s3: s3,
    bucket: config.get("s3.bucket"),
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(
        null,
        "user_photos/" + Date.now().toString() + "-" + file.originalname
      );
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!imageWL.includes(file.fieldname)) {
      return cb(new Error("image file only"), false);
    }
    cb(null, true);
  },
});
