const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5001;

// --- CRITICAL FIX: CORS Configuration ---
const allowedOrigins = [
    // Your production frontend domain
    'https://emzbayviewmountainresort.up.railway.app', 
    // Add other necessary domains (like localhost for development)
    'http://localhost:3000', 
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};

app.use(cors(corsOptions));
// ---------------------------------------

app.use(bodyParser.json());

// FIX: This exposes the 'uploads' folder (and all its subfolders) to the public web via the '/uploads' URL route.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer setup for file uploads
const storage = multer.diskStorage({
    // FIX: Ensure files are saved to 'uploads/feedbacks/' to match the URL path used in feedback.js
    destination: (req, file, cb) => {
        // Create the directory if it doesn't exist (helpful for local/deployment setup)
        const dir = path.join(__dirname, "uploads/feedbacks/");
        require('fs').mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {
    if (err) return console.error("DB connection error:", err);
    console.log('✅ Connected to MySQL database "feedbacks".');
});

// Fetch all feedbacks
app.get("/feedbacks", (req, res) => {
    const showDeleted = req.query.showDeleted === 'true'; // Check for showDeleted query parameter
    
    // Adjust SQL query based on the 'showDeleted' parameter
    const whereClause = showDeleted ? "" : "WHERE deleted = FALSE";
    
    const sql = `SELECT * FROM feedbacks ${whereClause} ORDER BY created_at DESC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });

        // Parse JSON fields
        const formatted = results.map(fb => ({
            ...fb,
            // Safely parse JSON fields, defaulting to an empty array
            likedBy: fb.likedBy ? JSON.parse(fb.likedBy) : [],
            replies: fb.replies ? JSON.parse(fb.replies) : [],
        }));

        res.json(formatted);
    });
});

// Add new feedback
app.post("/feedbacks", upload.array("photos"), (req, res) => {
    const { name, profilePicture, message, rating } = req.body;
    // Map the uploaded file information to a comma-separated string of filenames
    const photos = req.files && req.files.length > 0 ? req.files.map(f => f.filename).join(",") : null;

    if (!name || !message || rating === undefined) {
        return res.status(400).json({ error: "Name, message, and rating are required." });
    }

    // Include the userId from the user object if available (assuming it's in the body/headers for a logged-in user)
    // NOTE: Your frontend code uses 'storedUser.name' but not 'storedUser.email' for the ID here. 
    // If you need a stable userId, you should pass it from the frontend to the body.
    
    const sql = "INSERT INTO feedbacks (name, profilePicture, message, rating, photos, likes, likedBy, replies) VALUES (?, ?, ?, ?, ?, 0, ?, ?)";
    db.query(sql, [name, profilePicture, message, rating, photos, JSON.stringify([]), JSON.stringify([])], (err) => {
        if (err) {
            console.error("Error inserting feedback:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
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

// Edit feedback (PUT /feedbacks/:id)
app.put("/feedbacks/:id", (req, res) => {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: "New message required for update" });
    
    db.query("UPDATE feedbacks SET message = ? WHERE id = ?", [message, id], (err) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        res.json({ message: "Feedback updated successfully" });
    });
});

// Delete feedback (DELETE /feedbacks/:id)
app.delete("/feedbacks/:id", (req, res) => {
    const { id } = req.params;

    // NOTE: This performs a hard delete. If you prefer soft-delete, use the /delete endpoint below.
    db.query("DELETE FROM feedbacks WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        res.json({ message: "Feedback deleted successfully" });
    });
});

// Hide/soft-delete feedback (PUT /feedbacks/:id/delete)
app.put("/feedbacks/:id/delete", (req, res) => {
    const { id } = req.params;
    db.query("UPDATE feedbacks SET deleted = true WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        res.json({ message: "Feedback hidden successfully" });
    });
});

// Restore feedback (PUT /feedbacks/:id/restore)
app.put("/feedbacks/:id/restore", (req, res) => {
    const { id } = req.params;
    db.query("UPDATE feedbacks SET deleted = false WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        res.json({ message: "Feedback restored successfully" });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Feedback microservice running at ${process.env.RATINGS_API_URL || 'http://localhost:' + PORT}`);
});
