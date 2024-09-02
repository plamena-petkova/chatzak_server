
const jwt = require('jsonwebtoken');
const blacklist = [];

function createSession (user) {

    return {
        names: user.names,
        username: user.username,
        email:user.email,
        _id:user._id,
        avatarImg:user.avatarImg,
        accessToken: jwt.sign({
            email: user.email,
            _id:user._id
        }, process.env.JWT_SECRET, { expiresIn: '20h' })
    };
}

function verifySession(token) {
    if (blacklist.includes(token)) {
        throw new Error('Token is invalidated');
    }
    const payload = jwt.verify(token, JWT_SECRET);
  

    return {
        names: payload.names,
        username: payload.username,
        email: payload.email,
        _id: payload._id,
        token
    }

}

module.exports = {
    createSession, 
    verifySession
}