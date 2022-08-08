const mongoose = require("mongoose");
const Schema = mongoose.Schema;
/**
 *  title
 *  author : user object id
 *  datePosted
 *  channel : channel object id
 *  active
 *  kategori : 'Surat Edaran', 'Event', 'Notice', 'Lost and Found'
 *  content : {
 *      text
 *  }
 */
//skema content
const contentSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  attachments: [
    {
      type: String,
      required: false,
    },
  ],
  images: [
    {
      type: String,
      required: false,
    },
  ],
  videos: [
    {
      type: String,
      required: false,
    },
  ],
});

//skema reply
const replySchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      max: [50, "Comment exceeded maximum length"],
    },
  },
  { timestamps: true }
);

//skema comment
const commentSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      max: [50, "Comment exceeded maximum length"],
    },
    replies: [
      {
        type: replySchema,
        required: false,
      },
    ],
  },
  { timestamps: true }
);

//skema post
const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    validityDate: {
      type: Date,
      required: false,
    },
    channel: [
      {
        type: Schema.Types.ObjectId,
        ref: "Channel",
        required: true,
      },
    ],
    urgent: {
      type: Boolean,
      required: false,
      default: false,
    },
    readOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "archived", "expired", "reported"],
        message: "{VALUE} is not supported",
      },
      default: "active",
      required: true,
    },
    kategori: {
      type: String,
      enum: {
        values: ["Surat Edaran", "Event", "Notice", "Lost and Found"],
        message: "{VALUE} is not supported",
      },
      required: true,
    },
    content: {
      type: contentSchema,
      required: true,
    },
    comments: [
      {
        type: commentSchema,
        required: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
