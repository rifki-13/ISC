const aws = require("aws-sdk");
const config = require("config");

//s3 account
const s3 = new aws.S3({
  accessKeyId: config.get("s3.accessKeyId"),
  secretAccessKey: config.get("s3.secretAccessKey"),
});

module.exports = s3;
