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
    jurusan: {
      type: String,
      required: false,
    },
    prodi: {
      type: String,
      required: false,
    },
    assigned_channel: [
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
    saved_post: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: false,
      },
    ],
    managed_channel: [
      {
        type: Schema.Types.ObjectId,
        ref: "Channel",
        required: false,
      },
    ],
    role: [
      {
        type: String,
        enum: {
          values: ["admin", "mahasiswa", "dosen", "superuser"],
        },
      },
    ],
    expo_push_token: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
