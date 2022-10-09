const { body } = require("express-validator");
module.exports = body("content").isLength({ max: 200, min: 1 });
