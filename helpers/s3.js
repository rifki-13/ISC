const aws = require("aws-sdk");
const config = require("config");

const s3 = new aws.S3({
  accessKeyId: config.get("s3.accessKeyId"),
  secretAccessKey: config.get("s3.secretAccessKey"),
});
//s3 account
exports.client = s3;

exports.extractKeys = (arr, keys) => {
  let key = arr.map((key) => ({
    Key: key.slice(key.indexOf("aws.com/") + 8),
  }));
  keys.push(...key);
  return keys;
};

exports.deleteObjects = (keys) => {
  return s3
    .deleteObjects({
      Bucket: config.get("s3.bucket"),
      Delete: { Objects: keys },
    })
    .promise();
};

exports.deleteObject = (key) => {
  return s3
    .deleteObject({
      Bucket: config.get("s3.bucket"),
      Key: key,
    })
    .promise();
};
