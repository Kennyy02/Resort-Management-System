const express = require('express');
const mysql = require('mysql2');
const app = express();
const PORT = process.env.PORT || 8080;

// --- Force Open CORS headers (Allows all origins for testing) ---
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());

// --- HEALTH CHECK ROUTE (CRITICAL FIX) ---
// This simple route allows Railway to check if the service is alive, preventing crashes.
app.get('/', (req, res) => {
    res.status(200).send('Contact service is online and healthy.');
});


// --- MySQL connection ---
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    dateStrings: true
});

db.connect(err => {
    if (err) return console.error('DB connection failed:', err);
    console.log('Connected to MySQL');
});

// --- Ensure table ---
db.query(`
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`, err => {
    if (err) console.error(err);
    else console.log('Table ensured');
});

// --- API Routes ---
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = 'INSERT INTO contact_messages (name, email, message, status) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, email, message, 'pending'], (err) => {
        if (err) {
            console.error('Error saving message:', err);
            return res.status(500).json({ error: 'Failed to store message' });
        }
        res.status(201).json({ message: 'Message submitted successfully' });
    });
});

app.get('/api/messages', (req, res) => {
    db.query('SELECT * FROM contact_messages ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({ error: 'Failed to fetch messages' });
        }
        res.json(results);
    });
});

app.put('/api/messages/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== 'answered') return res.status(400).json({ error: 'Invalid status' });

    db.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to update status' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Message not found' });
        res.json({ message: 'Status updated' });
    });
});

app.listen(PORT, () => console.log(`Contact service running on port ${PORT}`));
