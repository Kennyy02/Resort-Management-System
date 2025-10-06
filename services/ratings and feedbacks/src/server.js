const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

// FIX: This exposes the 'uploads' folder (and all its subfolders) to the public web via the '/uploads' URL route.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer setup for file uploads
const storage = multer.diskStorage({
  // FIX: Ensure files are saved to 'uploads/feedbacks/' to match the URL path used in feedback.js
  destination: (req, file, cb) => cb(null, "uploads/feedbacks/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234567890",
  database: "feedbacks",
});

db.connect((err) => {
  if (err) return console.error("DB connection error:", err);
  console.log('✅ Connected to MySQL database "feedbacks".');
});

// Fetch all feedbacks
app.get("/feedbacks", (req, res) => {
  const sql = "SELECT * FROM feedbacks ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });

    // Parse JSON fields
    const formatted = results.map(fb => ({
      ...fb,
      likedBy: fb.likedBy ? JSON.parse(fb.likedBy) : [],
      replies: fb.replies ? JSON.parse(fb.replies) : [],
    }));

    res.json(formatted);
  });
});

// Add new feedback
app.post("/feedbacks", upload.array("photos"), (req, res) => {
  const { name, profilePicture, message, rating } = req.body;
  const photos = req.files.length > 0 ? req.files.map(f => f.filename).join(",") : null;

  if (!name || !message || rating === undefined) {
    return res.status(400).json({ error: "Name, message, and rating are required." });
  }

  const sql = "INSERT INTO feedbacks (name, profilePicture, message, rating, photos, likes, likedBy, replies) VALUES (?, ?, ?, ?, ?, 0, ?, ?)";
  db.query(sql, [name, profilePicture, message, rating, photos, JSON.stringify([]), JSON.stringify([])], (err) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    res.status(201).json({ message: "✅ Feedback submitted successfully!" });
  });
});

// Like a feedback
app.post("/feedbacks/:id/like", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "User ID required" });

  const sql = "SELECT likes, likedBy FROM feedbacks WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    if (!results[0]) return res.status(404).json({ error: "Feedback not found" });

    const likedBy = results[0].likedBy ? JSON.parse(results[0].likedBy) : [];
    if (likedBy.includes(userId)) return res.status(400).json({ error: "Already liked" });

    likedBy.push(userId);
    const likes = results[0].likes + 1;

    db.query("UPDATE feedbacks SET likes = ?, likedBy = ? WHERE id = ?", [likes, JSON.stringify(likedBy), id], (err2) => {
      if (err2) return res.status(500).json({ error: "Internal Server Error" });
      res.json({ message: "Liked successfully" });
    });
  });
});

// Reply to feedback
app.post("/feedbacks/:id/reply", (req, res) => {
  const { id } = req.params;
  const { userId, userName, message, anonymous } = req.body;

  if (!userId || !userName || !message) {
    return res.status(400).json({ error: "Missing reply info" });
  }

  const sql = "SELECT replies FROM feedbacks WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    if (!results[0]) return res.status(404).json({ error: "Feedback not found" });

    const replies = results[0].replies ? JSON.parse(results[0].replies) : [];
    const newReply = { id: Date.now(), user: { name: anonymous ? "Anonymous" : userName, userId }, message };
    replies.push(newReply);

    db.query("UPDATE feedbacks SET replies = ? WHERE id = ?", [JSON.stringify(replies), id], (err2) => {
      if (err2) return res.status(500).json({ error: "Internal Server Error" });
      res.json({ message: "Reply added" });
    });
  });
});

// Hide/restore feedbacks (optional)
app.put("/feedbacks/:id/delete", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE feedbacks SET deleted = true WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    res.json({ message: "Feedback hidden successfully" });
  });
});

app.put("/feedbacks/:id/restore", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE feedbacks SET deleted = false WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    res.json({ message: "Feedback restored successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Feedback microservice running at http://localhost:${PORT}`);
});