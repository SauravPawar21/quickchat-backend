const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const upload = require("../middlewares/upload");
const authMiddleware = require("../middlewares/auth");
const User = require("../models/user");

router.post(
  "/profile-photo",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileBase64 = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${fileBase64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "quickchat/profile-photos",
        transformation: [
          { width: 300, height: 300, crop: "fill", gravity: "face" },
        ],
      });

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { photoUrl: result.secure_url },
        { new: true },
      ).select("-password");

      res.json({
        message: "Profile photo updated successfully",
        photoUrl: result.secure_url,
        user: updatedUser,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: err.message });
    }
  },
);

module.exports = router;
