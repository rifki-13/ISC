const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const channelSettingSchema = new Schema({
  max_admin: {
    type: Number,
    required: true,
    default: 5,
  },
});

const prodiSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  kode: {
    type: String,
    required: true,
  },
});

const jurusanSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  prodi: [
    {
      type: prodiSchema,
      required: false,
    },
  ],
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
    jurusan: [
      {
        type: jurusanSchema,
        required: true,
      },
    ],
  },

  { timestamps: true }
);

module.exports = mongoose.model("SystemSetting", systemSettingSchema);
