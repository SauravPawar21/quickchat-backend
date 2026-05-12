const Message = require("../models/message");
const User = require("../models/user");

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", async (userId) => {
      socket.join(userId);
      socket.userId = userId;

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      console.log(`User ${userId} is now online`);
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { senderId, receiverId, text } = data;

        const message = new Message({ senderId, receiverId, text });
        await message.save();

        io.to(receiverId).emit("receiveMessage", message);

        io.to(senderId).emit("receiveMessage", message);
      } catch (err) {
        console.error("Error sending message:", err.message);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("typing", { senderId });
    });

    socket.on("stopTyping", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("stopTyping", { senderId });
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        console.log(`User ${socket.userId} is now offline`);
      }
    });
  });
};

module.exports = initSocket;
