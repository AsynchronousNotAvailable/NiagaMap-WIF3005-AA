// routes/chatbot.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { askChatbot } = require("../services/openaiService");

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post("/api/chatbot", async (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const reply = await askChatbot(message);

    // Extract JSON from code block if present
    let jsonString = reply;
    const match = reply.match(/```json\s*([\s\S]*?)\s*```/i);
    if (match) {
      jsonString = match[1];
    }

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse JSON from chatbot response" });
    }

    res.json(data);
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: "OpenAI API failed" });
  }
});

// Add this endpoint for file upload
router.post("/api/chatbot/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  // You can also access req.body.message if you send a message with the file
  res.json({ filename: req.file.filename, originalname: req.file.originalname, message: req.body.message });
});

module.exports = router;
