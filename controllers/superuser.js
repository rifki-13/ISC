const SystemSetting = require("../models/system-setting");

// exports.createSystemSetting = async (req, res, next) => {
//   try {
//     await SystemSetting.create({
//       enable_register: true,
//       enable_channel_creation: true,
//     });
//     res.status(201).json({ message: "Setting created" });
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

exports.editSystemSetting = async (req, res, next) => {
  try {
    //  TODO: edit system setting
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
