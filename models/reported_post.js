const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const reportedPostSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    reported_to: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: {
        values: ["hoax", "outdated", "offensive", "spam", "other"],
      },
    },
    description: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReportedPost", reportedPostSchema);
