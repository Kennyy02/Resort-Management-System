const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080; // Railway assigns PORT dynamically

// --- Add all frontend origins that will access this API ---
const allowedOrigins = [
    'https://emzbayviewmountainresort.up.railway.app',  // main frontend
    'https://admin.emzbayviewmountainresort.up.railway.app', // admin frontend
    'http://localhost:3000' // local development
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow non-browser requests like Postman
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,OPTIONS",
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// --- MySQL connection ---
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    dateStrings: true // return dates as ISO strings
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// --- Ensure table exists ---
const createTableSQL = `
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;

db.query(createTableSQL, err => {
    if (err) console.error('Error creating table:', err);
    else console.log('Contact Messages table ensured.');
});

// --- API Routes ---

// Send message
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = 'INSERT INTO contact_messages (name, email, message, status) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, email, message, 'pending'], (err, result) => {
        if (err) {
            console.error('Error saving message:', err);
            return res.status(500).json({ error: 'Failed to store message' });
        }
        res.status(201).json({ message: 'Message submitted successfully' });
    });
});

// Get all messages
app.get('/api/messages', (req, res) => {
    const sql = 'SELECT * FROM contact_messages ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({ error: 'Failed to fetch messages' });
        }
        res.json(results);
    });
});

// Update message status
app.put('/api/messages/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    if (status !== 'answered') {
        return res.status(400).json({ error: 'Invalid status value' });
    }

    const sql = 'UPDATE contact_messages SET status = ? WHERE id = ?';
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

// --- Start server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
