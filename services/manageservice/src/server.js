const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // ✅ Added uuid for unique filenames

const app = express();

// --- START: CONFIGURATION ---
const FRONTEND_URL = 'https://emzbayviewmountainresort.up.railway.app';
const PORT = 5002;

// ✅ CRITICAL FIX: Define the absolute mount path for the persistent volume
const UPLOAD_DIR = '/app/uploads'; 
// ----------------------------

// Configure CORS
const corsOptions = {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json()); // Parse JSON

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ----------------------------------------------------
// ✅ FIX 1: Guarded Directory Creation
// ----------------------------------------------------
try {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        console.log(`✅ Persistent upload directory created at: ${UPLOAD_DIR}`);
    } else {
        console.log(`✅ Persistent upload directory found at: ${UPLOAD_DIR}`);
    }
} catch (error) {
    console.error(`❌ FATAL ERROR: Could not access or create upload directory at ${UPLOAD_DIR}`);
    console.error(`Please ensure Railway Volume Mount Path is set to /app/uploads and RAILWAY_RUN_UID=0.`);
    // We will let the app continue, but file uploads might fail if the error is permissions related.
}
// ----------------------------------------------------


// ✅ FIX 2: Serve uploads statically from the absolute volume mount path
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // ✅ Multer must save files directly to the absolute mount path
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // ✅ FIX 3: Use UUID and original extension for robust, unique filenames
        const uniqueSuffix = uuidv4();
        const fileExtension = path.extname(file.originalname);
        cb(null, uniqueSuffix + fileExtension);
    }
});
const upload = multer({ storage });

// MySQL connection (No changes needed)
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
    
    // ✅ Use the unique filename saved by Multer
    let image_url = req.file ? `/uploads/${req.file.filename}` : null; 

    const finalPrice = (type === 'payment' || !price) ? null : price;

    try {
        const [result] = await db.query(
            'INSERT INTO services (name, description, price, image_url, status, type) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, finalPrice, image_url, status, type] 
        );
        res.status(201).json({ message: 'Service added successfully', id: result.insertId, image_url });
    } catch (err) {
        console.error("Error inserting service:", err);
        // Clean up the uploaded file if DB insert fails
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error cleaning up file:", unlinkErr);
            });
        }
        res.status(500).json({ error: err.message, detail: 'Failed to insert into database.' });
    }
});

// GET all services (No changes needed)
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
        let oldImagePath = null;

        if (req.file) {
            // New file was uploaded. Prepare to delete the old one.
            if (image_url) {
                // ✅ FIX 4: Construct old file path using the absolute UPLOAD_DIR
                const oldFilename = path.basename(image_url); // Extract only the filename from the URL
                oldImagePath = path.join(UPLOAD_DIR, oldFilename);
            }
            // Update URL to the new file's public path
            image_url = `/uploads/${req.file.filename}`;
        }
        
        const finalPrice = (type === 'payment' || !price) ? null : price;

        const [updateResult] = await db.query(
            'UPDATE services SET name=?, description=?, price=?, image_url=?, status=?, type=? WHERE id=?',
            [name, description, finalPrice, image_url, status, type, serviceId]
        );
        
        if (updateResult.affectedRows === 0) {
            // Clean up the new file if DB update failed
            if (req.file) {
                 fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error("Error cleaning up new file:", unlinkErr);
                });
            }
            return res.status(404).json({ error: 'Service update failed or not found' });
        }

        // Delete the old file after a successful DB update
        if (oldImagePath && fs.existsSync(oldImagePath)) {
             // Using async unlink is better than sync unlinkSync()
             fs.unlink(oldImagePath, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting old file:", unlinkErr);
            });
        }

        res.json({ message: 'Service updated successfully' });
    } catch (err) {
        console.error("Error updating service:", err);
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
             // ✅ FIX 5: Construct image path using the absolute UPLOAD_DIR
            const filename = path.basename(image_url);
            const imagePath = path.join(UPLOAD_DIR, filename);

            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, (err) => {
                    if (err) console.error("Error deleting file:", err);
                });
            }
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
app.listen(PORT, () => console.log(`🚀 Services Server running at port ${PORT}`));
