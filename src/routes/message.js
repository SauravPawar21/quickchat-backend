const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const authMiddleware = require("../middlewares/auth");

router.get("/:otherUserId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user._id;
    const otherUserId = req.params.otherUserId;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/read/:senderId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user._id;
    const senderId = req.params.senderId;

    await Message.updateMany(
      { senderId: senderId, receiverId: myId, isRead: false },
      { isRead: true },
    );
    res.json({ message: "Message marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
