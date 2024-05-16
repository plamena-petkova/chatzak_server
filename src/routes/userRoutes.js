const { register, login, getAllUsers, updateAvatar, getUserById, editUserById } = require("../controllers/usersController");


const router = require("express").Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users/:userId", getUserById);
router.get("/all-users", getAllUsers);
router.put("/users/:userId", updateAvatar);
router.put("/users/edit/:userId", editUserById);

module.exports = router;
 

