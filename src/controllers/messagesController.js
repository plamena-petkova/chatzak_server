const Message = require("../models/messageModel");
const User = require("../models/userModel");

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
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
    //const { from, to } = req.body;
    const { userId } = req.body;
    /*
    const messages = await Message.find({
      users: {
        $all: [from, to],
      },
    });
*/
    const users = await User.find({});

    const usersArr = [];

    const userObjectLastMessage = {};

    users.forEach(async (user) => {
      console.log("UserId", user._id.toString());

      try {
        const lastMessageUser = await Message.find({
          users: {
            $all: [userId, user._id.toString()],
          },
        });

        const lastMsg = lastMessageUser.slice(-1).pop();

        userObjectLastMessage.userId = user._id;
        userObjectLastMessage.lastMessage = lastMsg.message;

        usersArr.push(userObjectLastMessage);
        res.json(usersArr);
      } catch (e) {
        console.log("Error", e);
      }
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
