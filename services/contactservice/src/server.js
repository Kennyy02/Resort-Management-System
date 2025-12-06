const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
// Railway automatically sets the PORT variable
const PORT = process.env.PORT || 8081; 

app.use(cors()); 
app.use(express.json());

// --- MySQL Connection ---
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

db.connect((err) => {
  if (err) return console.error('❌ MySQL connection failed:', err);
  console.log('✅ Connected to MySQL database');
});

// --- Ensure Table Exists ---
// ✅ FIX: Removed leading whitespace/special characters from the SQL lines.
const createTableSQL = `
CREATE TABLE IF NOT EXISTS contact_messages (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL,
message TEXT NOT NULL,
status VARCHAR(50) DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createTableSQL, (err) => {
  if (err) console.error('❌ Error creating table:', err);
  else console.log('✅ Contact Messages table ensured.');
});

// --- Routes ---
// Submit a new contact message
app.post('/api/contact', (req, res) => {
// ... (rest of the post route is unchanged)
  const { name, email, message } = req.body;
  const sql = 'INSERT INTO contact_messages (name, email, message, status) VALUES (?, ?, ?, ?)';
  
  db.query(sql, [name, email, message, 'pending'], (err) => {
    if (err) {
      console.error('❌ Error saving message:', err);
      return res.status(500).json({ error: 'Failed to store message' });
    }
    res.status(201).json({ message: 'Message submitted successfully' });
  });
});

// Get all messages (most recent first)
app.get('/api/messages', (req, res) => {
// ... (rest of the get route is unchanged)
  const sql = 'SELECT * FROM contact_messages ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
    res.json(results);
  });
});

// Update message status to "answered"
app.put('/api/messages/:id/status', (req, res) => {
// ... (rest of the put route is unchanged)
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'answered') {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const sql = 'UPDATE contact_messages SET status = ? WHERE id = ?';
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('❌ Error updating status:', err);
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
  console.log(`🚀 Contact service running on port ${PORT}`);
});
