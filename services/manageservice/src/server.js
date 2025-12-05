const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// =========================
// CORS CONFIGURATION
// =========================
const FRONTEND_URL = 'https://emzbayviewmountainresort.up.railway.app';

const corsOptions = {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
};

app.use(cors(corsOptions));

// =========================
// MIDDLEWARE
// =========================
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// =========================
// STATIC FILES (Railway Volume)
// =========================
app.use('/uploads', express.static('/data/uploads'));


// =========================
// MULTER (FILE UPLOADS) — FIXED FOR RAILWAY VOLUME
// =========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = '/data/uploads'; // persistent volume
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });


// =========================
/* DATABASE CONNECTION */
// =========================
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


// =========================
// ROUTES
// =========================

// CREATE service
app.post('/api/services', upload.single('image'), async (req, res) => {
    const { name, description, price, status, type } = req.body;
    let image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Ensure price is NULL when type = "payment"
    const finalPrice = (type === 'payment' || !price) ? null : price;

    try {
        const [result] = await db.query(
            'INSERT INTO services (name, description, price, image_url, status, type) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, finalPrice, image_url, status, type]
        );

        res.status(201).json({
            message: 'Service added successfully',
            id: result.insertId
        });
    } catch (err) {
        console.error('Error inserting service:', err);
        res.status(500).json({
            error: err.message,
            detail: 'Failed to insert into database.'
        });
    }
});


// READ services
app.get('/api/services', async (req, res) => {
    try {
        const [services] = await db.query('SELECT * FROM services');
        res.json(services);
    } catch (err) {
        res.status(500).json({
            error: 'Failed to fetch services: ' + err.message
        });
    }
});


// UPDATE service
app.put('/api/services/:id', upload.single('image'), async (req, res) => {
    const serviceId = req.params.id;
    const { name, description, price, status, type } = req.body;

    try {
        const [rows] = await db.query(
            'SELECT image_url FROM services WHERE id = ?',
            [serviceId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        let image_url = rows[0].image_url;
        let oldImage = null;

        if (req.file) {
            if (image_url) {
                oldImage = path.join('/data/uploads', path.basename(image_url));
            }
            image_url = `/uploads/${req.file.filename}`;
        }

        const finalPrice = (type === 'payment' || !price) ? null : price;

        await db.query(
            'UPDATE services SET name=?, description=?, price=?, image_url=?, status=?, type=? WHERE id=?',
            [name, description, finalPrice, image_url, status, type, serviceId]
        );

        if (oldImage && fs.existsSync(oldImage)) {
            fs.unlinkSync(oldImage);
        }

        res.json({ message: 'Service updated successfully' });
    } catch (err) {
        console.error('Error updating service:', err);
        res.status(500).json({ error: err.message });
    }
});


// DELETE service
app.delete('/api/services/:id', async (req, res) => {
    const serviceId = req.params.id;

    try {
        const [rows] = await db.query(
            'SELECT image_url FROM services WHERE id = ?',
            [serviceId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const image_url = rows[0].image_url;

        if (image_url) {
            const imagePath = path.join('/data/uploads', path.basename(image_url));
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        const [result] = await db.query(
            'DELETE FROM services WHERE id = ?',
            [serviceId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Service not found after deletion'
            });
        }

        res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Root
app.get('/', (req, res) => {
    res.send('🎉 Resort Management Backend is Running');
});

// Catch-all 404
app.use((req, res) => {
    res.status(404).json({
        error: `API endpoint '${req.url}' not found.`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Uncaught error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong on the server.',
        details: err.message
    });
});

// Start server
const PORT = 5002;
app.listen(PORT, () => {
    console.log(`🚀 Services Server running at port ${PORT}`);
});
