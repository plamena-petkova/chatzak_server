const jwt = require("jsonwebtoken");
const blacklist = [];

function createSession(user) {
  const token = generateJWTJitsi(process.env.JITSI_PRIVATE_KEY, user);

  /*  
  const token = generateJWTJitsi('my private key', {
    id: uuid(),
    name: "my user name",
    email: "my user email",
    avatar: "my avatar url",
    appId: "my AppID", // Your AppID ( previously tenant )
    kid: "vpaas-magic-cookie-4d8a089a85214104aca4d08d55dfca18/9948a3"
});
*/

  return {
    names: user.names,
    username: user.username,
    email: user.email,
    _id: user._id,
    avatarImg: user.avatarImg,
    blockedUsers: user.blockedUsers,
    accessToken: jwt.sign(
      {
        email: user.email,
        _id: user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "20h" }
    ),
    jitsiAccessToken: token,
  };
}

function verifySession(token) {
  if (blacklist.includes(token)) {
    throw new Error("Token is invalidated");
  }
  const payload = jwt.verify(token, JWT_SECRET);

  return {
    names: payload.names,
    username: payload.username,
    email: payload.email,
    _id: payload._id,
    token,
  };
}

const generateJWTJitsi = (privateKey, user) => {
  const { _id, names, email, avatarImg } = user;
  const appId = "vpaas-magic-cookie-4d8a089a85214104aca4d08d55dfca18";
  const kid = process.env.JITSI_KID;
  const now = new Date();
  const jwtoken = jwt.sign(
    {
      aud: "jitsi",
      context: {
        user: {
          _id,
          names,
          avatarImg,
          email: email,
          moderator: "false",
        },
        features: {
          livestreaming: "true",
          recording: "true",
          transcription: "true",
          "outbound-call": "true",
        },
      },
      iss: "chat",
      room: "*",
      sub: appId,
      exp: Math.round(now.setHours(now.getHours() + 3) / 1000),
      nbf: Math.round(new Date().getTime() / 1000) - 10,
    },
    privateKey,
    { algorithm: "RS256", header: { kid } }
  );
  return jwtoken;
};

module.exports = {
  createSession,
  verifySession,
};

