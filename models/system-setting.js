const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const channelSettingSchema = new Schema({
  max_admin: {
    type: Number,
    required: true,
    default: 5,
  },
});

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
    channels_setting: {
      type: channelSettingSchema,
      required: true,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("SystemSetting", systemSettingSchema);
