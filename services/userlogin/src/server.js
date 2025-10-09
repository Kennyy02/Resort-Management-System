const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const PORT = 4000;

const GOOGLE_CLIENT_ID = "430674928740-d1s155des1c5fsl0oag9j5ermavaucnt.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3003",
      "https://emzbayviewmountainresort.up.railway.app", 
    ],
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL Connected");
});

app.post("/admin-login", (req, res) => {
  const { staffId, email, password } = req.body;

  if (!staffId || !email || !password)
    return res.status(400).json({ error: "Staff ID, Email, and password are required" });

  db.query(
    "SELECT * FROM admin_accounts WHERE staff_id = ? AND email = ?",
    [staffId, email],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0)
        return res.status(400).json({ error: "Admin account does not exist" });

      const admin = results[0];

      bcrypt.compare(password, admin.password, (err, match) => {
        if (err) return res.status(500).json({ error: "Error checking password" });
        if (!match) return res.status(400).json({ error: "Invalid credentials" });

        res.json({
          message: "Admin login successful",
          role: "admin",
          admin: {
            id: admin.id,
            staff_id: admin.staff_id,
            email: admin.email,
          },
        });
      });
    }
  );
});

app.post("/signup", (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !password || (!phone && !email))
    return res.status(400).json({ error: "Name, password, and either phone or email are required" });

  const checkSql = phone ? "SELECT * FROM users WHERE phone = ?" : "SELECT * FROM users WHERE email = ?";
  const checkVal = phone ? phone : email;

  db.query(checkSql, [checkVal], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length > 0) return res.status(400).json({ error: "Account already exists" });

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: "Error hashing password" });

      db.query(
        "INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)",
        [name, phone || null, email || null, hash],
        (err) => {
          if (err) return res.status(500).json({ error: "Database error" });
          res.json({ message: "User registered successfully" });
        }
      );
    });
  });
});

app.post("/login", (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) return res.status(400).json({ error: "Email/Phone and password are required" });

  db.query("SELECT * FROM users WHERE phone = ? OR email = ?", [identifier, identifier], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(400).json({ error: "Account does not exist" });

    const user = results[0];

    bcrypt.compare(password, user.password, (err, match) => {
      if (err) return res.status(500).json({ error: "Error checking password" });
      if (!match) return res.status(400).json({ error: "Invalid credentials" });

      res.json({
        message: "User login successful",
        role: "user",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          picture: user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
        },
      });
    });
  });
});

app.post("/google-login", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Google token is required" });

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
    const { email, name, picture, sub } = ticket.getPayload();

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length > 0) {
        const user = results[0];
        res.json({
          message: "Login successful",
          role: "user",
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone, picture: user.profilePicture || picture },
        });
      } else {
        db.query(
          "INSERT INTO users (name, email, google_id, profilePicture) VALUES (?, ?, ?, ?)",
          [name, email, sub, picture],
          (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.json({
              message: "User registered via Google",
              role: "user",
              user: { id: result.insertId, name, email, picture }
            });
          }
        );
      }
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid Google token" });
  }
});

app.listen(PORT, () => console.log(`🚀 Auth server running on port ${PORT}`));
