const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Message = require("../models/message");
const authMiddleware = require("../middlewares/auth");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const myId = req.user._id;

    // Find all users except the logged in user
    const users = await User.find({ _id: { $ne: myId } }).select(
      "firstName lastName photoUrl bio isOnline lastSeen",
    );

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/search", authMiddleware, async (req, res) => {
  console.log("SEARCH ROUTE HIT");
  try {
    const query = req.query.query;

    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { emailId: { $regex: query, $options: "i" } },
      ],
    }).select("-password");

    res.json(users);
  } catch (error) {
    console.log("SEARCH ERROR:", error);
    res.status(500).json({
      message: "Error searching users",
    });
  }
});

router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "firstName lastName photoUrl bio isOnline lastSeen",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, bio, photoUrl } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, bio, photoUrl },
      { new: true }, // return updated user
    ).select("-password");

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/conversations/list", authMiddleware, async (req, res) => {
  try {
    const myId = req.user._id;
    const message = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "firstName lastName photoUrl isOnline")
      .populate("receiverId", "firstName lastName photoUrl isOnline");

    const conversationMap = {};

    message.forEach((msg) => {
      const otherUser =
        msg.senderId._id.toString() === myId.toString()
          ? msg.receiverId
          : msg.senderId;

      const otherId = otherUser._id.toString();

      if (!conversationMap[otherId]) {
        conversationMap[otherId] = {
          user: otherUser,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          isRead: msg.isRead,
        };
      }
    });

    const conversations = Object.values(conversationMap);

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
