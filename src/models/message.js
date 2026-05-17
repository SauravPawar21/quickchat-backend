const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

messageSchema.index({ senderId: 1, receiverId: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
