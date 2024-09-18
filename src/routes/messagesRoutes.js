const { addMessage, getAllMessages, deleteMessage, editMessage, getLastMessage } = require("../controllers/messagesController");


const router = require("express").Router();

router.post("/addMsg", addMessage);
router.post("/getMsg", getAllMessages);
router.post("/getLastMsg", getLastMessage);
router.patch("/message/:messageId", deleteMessage);
router.put("/message/:messageId", editMessage);


module.exports = router;
 

