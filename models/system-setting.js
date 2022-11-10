const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const systemSettingSchema = new Schema(
  {
    enable_register: {
      type: Boolean,
      required: true,
      default: true,
    },
    enable_channel_creation: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemSetting", systemSettingSchema);
