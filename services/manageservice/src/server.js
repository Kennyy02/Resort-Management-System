const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// MySQL connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB connection
db.getConnection()
    .then(conn => {
        console.log('Connected to MySQL database: manageservices');
        conn.release();
    })
    .catch(err => console.error('DB connection failed:', err));

// ----------------- ROUTES -----------------

// POST new service
app.post('/api/services', upload.single('image'), async (req, res) => {
    const { name, description, price, status, type } = req.body;
    let image_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const [result] = await db.query(
            'INSERT INTO services (name, description, price, image_url, status, type) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, image_url, status, type]
        );
        res.status(201).json({ message: 'Service added successfully', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all services
app.get('/api/services', async (req, res) => {
    try {
        const [services] = await db.query('SELECT * FROM services');
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch services: ' + err.message });
    }
});

// PUT (Update) service
app.put('/api/services/:id', upload.single('image'), async (req, res) => {
    const serviceId = req.params.id;
    const { name, description, price, status, type } = req.body;

    try {
        const [rows] = await db.query('SELECT image_url FROM services WHERE id = ?', [serviceId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Service not found' });

        let image_url = rows[0].image_url;
        let oldImage = null;

        if (req.file) {
            if (image_url) oldImage = path.join(__dirname, image_url);
            image_url = `/uploads/${req.file.filename}`;
        }

        await db.query(
            'UPDATE services SET name=?, description=?, price=?, image_url=?, status=?, type=? WHERE id=?',
            [name, description, price, image_url, status, type, serviceId]
        );

        if (oldImage && fs.existsSync(oldImage)) fs.unlinkSync(oldImage);

        res.json({ message: 'Service updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE service
app.delete('/api/services/:id', async (req, res) => {
    const serviceId = req.params.id;

    try {
        const [rows] = await db.query('SELECT image_url FROM services WHERE id = ?', [serviceId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Service not found' });

        const image_url = rows[0].image_url;
        if (image_url) {
            const imagePath = path.join(__dirname, image_url);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        const [result] = await db.query('DELETE FROM services WHERE id = ?', [serviceId]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Service not found after deletion' });

        res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Root route
app.get('/', (req, res) => res.send('🎉 Resort Management Backend is Running'));

// Catch-all 404
app.use((req, res) => res.status(404).json({ error: `API endpoint '${req.url}' not found.` }));

// Global error handler
app.use((err, req, res, next) => {
    console.error('Uncaught error:', err.stack);
    res.status(500).json({ error: 'Something went wrong on the server.', details: err.message });
});

// Start server
const PORT = 5002;
app.listen(PORT, () => console.log(`🚀 Services Server running at port ${PORT}`));
