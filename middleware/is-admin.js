const User = require("../models/user");

module.exports = (req, res, next) => {
  const userId = req.userId;
  User.findById(userId)
    .then((user) => {
      if (user.managed_channel && user.managed_channel.length === 0) {
        const error = new Error("Not Authenticated as admin");
        error.statusCode = 401;
        throw error;
      }
      req.managed_channel = user.managed_channel;
      next();
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
