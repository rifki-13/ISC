const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const channelSettingSchema = new Schema({
  post_approval: {
    type: Boolean,
    required: true,
    default: false,
  },
  entry_through_code: {
    type: Boolean,
    required: true,
    default: true,
  },
});

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
    parent_channel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: false,
    },
    child_channel: [
      {
        type: Schema.Types.ObjectId,
        ref: "Channel",
        required: false,
      },
    ],
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
    photo: {
      type: String,
      required: false,
    },
    setting: {
      type: channelSettingSchema,
      default: {
        post_approval: false,
        entry_through_code: true,
      },
      required: true,
    },
    pending_posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: false,
      },
    ],
    pending_entry: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["active", "suspended"],
        message: "{VALUE} is not supported",
      },
      default: "active",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Channel", channelSchema);
