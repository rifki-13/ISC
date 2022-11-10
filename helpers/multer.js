const multer = require("multer");
const multerS3 = require("multer-s3");
const config = require("config");
const s3Helpers = require("../helpers/s3");
const s3 = s3Helpers.client;

const imageWL = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/*",
];

function storeFile(folderPrefix) {
  return multer({
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
          folderPrefix + Date.now().toString() + "-" + file.originalname
        );
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.fieldname === "images") {
        if (!imageWL.includes(file.mimetype)) {
          return cb(new Error("image file only"), false);
        }
        cb(null, true);
      } else {
        cb(null, true);
      }
    },
  });
}
// const videoWL = ["video/x-msvideo", "video/mp4", "video/mpeg", "video/webm"];

exports.uploadPostAttachment = storeFile("attachments/");

exports.uploadUserPhoto = storeFile("user_photos/");

exports.uploadChannelPhoto = storeFile("channel_photos/");

exports.uploadMahasiswaExcel = storeFile("excel/");
