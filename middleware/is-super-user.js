const User = require("../models/user");

module.exports = async (req, res, next) => {
  const userId = req.userId;
  const user = await User.findById(userId);
  if (user.role !== "superuser") {
    const error = new Error("This user is not superuser of the system");
    error.statusCode = 401;
    throw error;
  }
  next();
};
