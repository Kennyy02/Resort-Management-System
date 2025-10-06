const express = require('express');
const mysql = require('mysql2');  // <-- changed here
const cors = require('cors');

const app = express();
const PORT = 8081;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234567890', // Update if your MySQL has a password
  database: 'contact_us', // Ensure this database exists
});

// Test database connection
db.connect((err) => {
  if (err) {
    console.error('MySQL connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Create messages table if it doesn't exist
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

db.query(createTableSQL, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Messages table ensured.');
  }
});

// API route to handle message submission
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Received:', { name, email, message }); // For debugging

  const sql = 'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)';
  db.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error('Error saving message:', err);
      return res.status(500).json({ error: 'Failed to store message' });
    }
    res.status(201).json({ message: 'Message submitted successfully' });
  });
});

// API route to get all messages (admin panel)
app.get('/api/messages', (req, res) => {
  const sql = 'SELECT * FROM messages ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
    res.json(results);
  });
});

// API route to delete a message by ID
app.delete('/api/messages/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM messages WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting message:', err);
      return res.status(500).json({ error: 'Failed to delete message' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.status(200).json({ message: 'Message deleted successfully' });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
