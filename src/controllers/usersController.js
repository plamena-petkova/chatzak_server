const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Message = require("../models/messageModel");
const { createSession, generateJWTJitsi } = require("../utils/token");
const sgMail = require("@sendgrid/mail");

module.exports.register = async (req, res, next) => {
  try {
    const { username, names, password, email } = req.body;

    const usernameCheck = await User.findOne({ username });

    if (usernameCheck) {
      return res
        .status(409)
        .json({ msg: "Username already used", status: false });
    }

    const emailCheck = await User.findOne({ email });

    if (emailCheck) {
      return res.status(409).json({ msg: "Email already used", status: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      username,
      names,
      password: hashedPassword,
    });
    delete user.password;

    const sessionUser = createSession(user);

    return res.json({ status: true, sessionUser });
  } catch (err) {
    next(err);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(404)
        .json({ msg: "Incorrect username or password", status: false });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(404)
        .json({ msg: "Incorrect username or password", status: false });
    }

    delete user.password;

    const sessionUser = createSession(user);

    return res.json({ status: true, sessionUser });
  } catch (err) {
    next(err);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.json({ status: true, users });

    if (!users) {
      return res
        .status(404)
        .json({ message: "Users not found", status: false });
    }
  } catch (error) {
    console.error("Something went wrong!", error);
  }
};

module.exports.updateAvatar = async (req, res, next) => {
  try {
    const { userId, avatar } = req.body;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found", status: false });
      }

      user.avatarImg = avatar;

      await user.save();

      return res.json({ message: "User info updated", status: true, user });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found", status: false });
      }

      return res.json({ status: true, user });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.editUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { username, names, email } = req.body;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found", status: false });
      }

      if (username) {
        user.username = username;
      }
      if (email) {
        user.email = email;
      }
      if (names) {
        user.names = names;
      }

      await user.save();

      return res.json({ message: "User info updated", status: true, user });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.blockUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { blockedUser } = req.body;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found", status: false });
      }
      if (user.blockedUsers.includes(blockedUser)) {
        res
          .status(409)
          .json({ message: "User was already blocked", status: false });
        return;
      }

      user.blockedUsers.push(blockedUser);
      await user.save();

      return res.json({ message: "User info updated", status: true, user });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.unblockUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { blockedUser } = req.body;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found", status: false });
      }
      const indexIdToUnblock = user.blockedUsers.indexOf(blockedUser);

      if (indexIdToUnblock !== -1) {
        user.blockedUsers.splice(indexIdToUnblock, 1);
      }

      await user.save();

      return res.json({ message: "User info updated", status: true, user });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.deleteUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);

      const from = userId;
      const to = userId;

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found", status: false });
      }

      await Message.deleteMany({
        users: {
          $all: [from, to],
        },
      });

      await user.deleteOne();

      return res.json({ message: "User account deleted!", status: true });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.sendInvitation = async (req, res, next) => {
  try {
    const { email, messageEmail, senderMail } = req.body;

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: email, // Change to your recipient
      from: senderMail, // Change to your verified sender
      subject: "Invitation to join Chatzak chat app",
      text: messageEmail,
      html: `<strong>${messageEmail}</strong>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.refreshToken = async (req, res, next) => {
  const { jitsiAccesToken } = req.body;

  const appId = "vpaas-magic-cookie-4d8a089a85214104aca4d08d55dfca18";
  // Validate current token here (optional)

  const newToken = generateJWTJitsi(process.env.JITSI_PRIVATE_KEY, {
      id: uuid(),
      name: req.body.name,
      email: req.body.email,
      avatar: req.body.avatar,
      appId: appId,
  });

  res.json({ accessToken: newToken });
};
