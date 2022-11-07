const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const channelRequestSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel_name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    requested_to: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChannelRequest", channelRequestSchema);
