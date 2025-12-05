const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const sql = require("mssql");

router.post("/", async (req, res) => {
    try {
        const newUser = await userService.createUser(req.body);
        
        res.status(201).json({ message: "User created.", newUser });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get("/", async (req, res) => {
    try {
        const users = await userService.getUsers();
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET user by userId
router.get("/:userId", async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.userId);
        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.put("/:id", async (req, res) => {
    try {
        const updatedUser = await userService.updateUser(req.params.id, req.body);
        res.json({  message: "User updated.", updatedUser });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.delete("/:userId", async (req, res) => {
    try {
        const deletedUser = await userService.deleteUser(req.params.userId);
        res.json({ message: "User deleted. ", deletedUser: deletedUser });
    } catch (err) {
        res.status(500).send(err.message);
    }
});



module.exports = router;
