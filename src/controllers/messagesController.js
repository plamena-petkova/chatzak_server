const Message = require("../models/messageModel");
const User = require("../models/userModel");

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;

    const sender = await User.findById(from);
    const receiver = await User.findById(to);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    // Check if either user has blocked the other
    if (sender.blockedUsers.includes(to) || receiver.blockedUsers.includes(from)) {
      return res.status(403).json({ message: "Action not allowed - user is blocked", status: false });
    }

    const data = await Message.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });


    if (data) {
      return res.json({ msg: "Message adedd successfully" });
    } else {
      return res.json({ msg: "Failed to add message to Database" });
    }
  } catch (err) {
    next(err);
    console.error(err);
  }
};
module.exports.deleteMessage = async (req, res, next) => {
  try {
    const messageId = req.params.messageId;

    const message = await Message.findById(messageId);

    message.message.text = "Removed message";
    message.message.isRemoved = true;
    message.save();

    return res.json({ msg: "Message successfully deleted", message });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.editMessage = async (req, res, next) => {
  try {
    const messageId = req.params.messageId;
    const msg = req.body.newMessage;

    const message = await Message.findById(messageId);

    message.message.text = msg;
    message.save();

    return res.json({ msg: "Message successfully edited", message });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.getAllMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    const messages = await Message.find({
      users: {
        $all: [from, to],
      },
    });
    const projectMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        id: msg._id,
        isRemoved: msg.message.isRemoved,
        date: msg.createdAt,
      };
    });
    res.json(projectMessages);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.getLastMessage = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    
    const users = await User.find({});

    const lastMessagePerUser = new Map();

    await Promise.all(users.map(async user => {
      const messages = await Message.find({
        users: {
          $all: [userId, user._id.toString()],
        },
      });

      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) {
          lastMessagePerUser.set(user._id.toString(), lastMessage);
          lastMessagePerUser.delete(userId);
        }
      }
    }));

   
    res.json(Object.fromEntries(lastMessagePerUser));  

  } catch (err) {
    console.error(err);
    next(err);
  }
};