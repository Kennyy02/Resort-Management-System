const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8081;

// --- CORS Setup ---
const allowedOrigins = [
  'https://emzbayviewmountainresort.up.railway.app',
  'http://localhost:3000',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser requests
    if (!allowedOrigins.includes(origin)) {
      const msg = `CORS policy does not allow access from origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: "GET,HEAD,PUT,PATCH,POST,OPTIONS",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// --- MySQL Connection ---
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  dateStrings: true, // Return dates as ISO strings
});

db.connect((err) => {
  if (err) return console.error('MySQL connection failed:', err);
  console.log('Connected to MySQL database');
});

// --- Ensure Table Exists ---
const createTableSQL = `
CREATE TABLE IF NOT EXISTS messages ( // <-- FIX: Changed table name from contact_messages to messages
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'notAnswered', // <-- FIX: Changed default status from 'pending' to 'notAnswered'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createTableSQL, (err) => {
  if (err) console.error('Error creating table:', err);
  else console.log('Contact Messages table ensured.');
});

// --- Routes ---
// Submit a new contact message
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  // <-- FIX: Changed table name to messages and status to notAnswered
  const sql = 'INSERT INTO messages (name, email, message, status) VALUES (?, ?, ?, ?)';
  
  db.query(sql, [name, email, message, 'notAnswered'], (err) => { 
    if (err) {
      console.error('Error saving message:', err);
      return res.status(500).json({ error: 'Failed to store message' });
    }
    res.status(201).json({ message: 'Message submitted successfully' });
  });
});

// Get all messages (most recent first)
app.get('/api/messages', (req, res) => {
  // <-- FIX: Changed table name to messages
  const sql = 'SELECT * FROM messages ORDER BY created_at DESC'; 
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
    res.json(results);
  });
});

// Update message status to "answered"
app.put('/api/messages/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'answered') {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  // <-- FIX: Changed table name to messages
  const sql = 'UPDATE messages SET status = ? WHERE id = ?'; 
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating status:', err);
      return res.status(500).json({ error: 'Failed to update status' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.status(200).json({ message: 'Message status updated successfully' });
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
