const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const userRoute = require("./routes/userRoutes");
const messagesRoute = require("./routes/messagesRoutes");
const socket = require("socket.io");

const compression = require("compression");
const app = express();
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connection succesfully!");
  })
  .catch((e) => {
    console.log("Error", e);
  });

app.use(compression());


app.use(cors());
app.use(express.json());

app.use("/api/auth", userRoute);
app.use("/api/messages", messagesRoute);



const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on port:${process.env.PORT}`);
});

const io = socket(server, {
  cors: {
    origin: ["https://chatzak.netlify.app", "http://localhost:8081", "http://localhost:3000"],
    credentials: true,
  },
});

const onlineUsers = new Map();
const users = new Map();

io.on("connect", (socket) => {
  socket.on("add-user", (newUserId) => {
    if(socket.id && newUserId) {
      onlineUsers.set(newUserId, socket.id);
      users.set(socket.id, newUserId);
      io.emit("update-users", Object.fromEntries(users));
    }
    
  });

  socket.on("disconnect", () => {
    const userId = users.get(socket.id);
    if (userId) {
      onlineUsers.delete(userId);
      users.delete(socket.id);
      io.emit("update-users", Object.fromEntries(users));
    }
  });
  

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", data);
    }
  });
  socket.on("edit-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-edited", data.message);
    }
  });
  socket.on('block-user', (data) => {
    const sendUserSocket = onlineUsers.get(data.blockedUser._id);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit('user-blocked', data);
    }
   
  });
  socket.on('unblock-user', (data) => {
    const sendUserSocket = onlineUsers.get(data.blockedUser._id);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit('user-unblocked', data);
    }
  });

  socket.on('call-user', (data) => {
    const sendUserSocket = onlineUsers.get(data.to._id);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit('call-received', data);
    }
   
  });
});


