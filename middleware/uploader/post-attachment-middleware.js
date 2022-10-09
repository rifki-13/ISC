const multerHelper = require("../../helpers/multer");

//upload multer
const upload = multerHelper.uploadPostAttachment;

const express = require("express");

module.exports = express().use(
  upload.fields([
    { name: "images", maxCount: 10 },
    {
      name: "attachments",
      maxCount: 10,
    },
  ])
);
