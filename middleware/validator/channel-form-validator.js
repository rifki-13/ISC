const { body } = require("express-validator");

module.exports = [
  body("name").trim().isLength({ min: 4, max: 50 }),
  body("desc").trim(),
  body("entryCode").isLength({ min: 6, max: 6 }),
];
