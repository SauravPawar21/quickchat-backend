const Message = require("../models/message");

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { senderId, receiverId, text } = data;

        const message = new Message({ senderId, receiverId, text });
        await message.save();

        io.to(receiverId).emit("receiveMessage", message);

        io.to(senderId).emit("receiveMessage", message);
        console.log(`Message from ${senderId} to ${receiverId}: ${text}`);
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

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = initSocket;
