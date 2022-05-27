const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//skema user
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      required: false,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    assignedChannel: [
      {
        type: Schema.Types.ObjectId,
        ref: "Channel",
        required: false,
      },
    ],
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: false,
      },
    ],
    archived_posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: false,
      },
    ],
    managed_channel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: false,
    },
    saved_post: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
