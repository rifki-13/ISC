const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//skema channel
const channelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    entry_code: {
      type: String,
      required: false,
    },
    member: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    admin: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    parentChannel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: false,
    },
    kodeProdi: [
      {
        type: String,
        required: false,
      },
    ],
    reported_post: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Channel", channelSchema);
