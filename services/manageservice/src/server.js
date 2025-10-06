const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Using promise-based mysql2
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json()); // For parsing application/json

// Middleware to log all incoming requests (VERY helpful for debugging)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);
    next(); // Pass control to the next middleware/route handler
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup - store files in /uploads, keep original filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            console.log(`Creating uploads directory: ${uploadDir}`);
            fs.mkdirSync(uploadDir, { recursive: true }); // Ensure recursive creation
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Appending Date.now() to ensure unique filenames
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// MySQL Database connection for 'manageservices'
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234567890',
    database: 'manageservices',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB connection (optional, but good for initial setup)
db.getConnection()
    .then(connection => {
        console.log('Connected to MySQL database: manageservices');
        connection.release(); // Release the connection immediately
    })
    .catch(err => {
        console.error('Failed to connect to MySQL database "manageservices":', err);
        // You might want to exit the process or handle this more gracefully in production
        // process.exit(1); 
    });


// POST new service
app.post('/api/services', upload.single('image'), async (req, res) => {
    console.log('Backend: POST /api/services hit!');
    const { name, description, price, status, type } = req.body;
    let image_url = null;
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
        console.log(`Image uploaded: ${image_url}`);
    }

    try {
        const [result] = await db.query(
            'INSERT INTO services (name, description, price, image_url, status, type) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, image_url, status, type]
        );
        console.log('Service added to DB, ID:', result.insertId);
        res.status(201).json({ message: 'Service added successfully', id: result.insertId });
    } catch (err) {
        console.error('Backend: Insert error (POST /api/services):', err);
        res.status(500).json({ error: err.message });
    }
});

// GET all services (THE PROBLEM ROUTE - CAREFULLY RETYPED)
app.get('/api/services', async (req, res) => {
    console.log('Backend: GET /api/services route handler executed!'); // THIS LOG IS CRUCIAL
    try {
        const [services] = await db.query('SELECT * FROM services');
        console.log('Backend: Services fetched from DB. Count:', services.length);
        res.json(services);
    } catch (err) {
        console.error('Backend: Read error (GET /api/services):', err);
        res.status(500).json({ error: 'Failed to fetch services: ' + err.message });
    }
});

// PUT (Update) a service
app.put('/api/services/:id', upload.single('image'), async (req, res) => {
    console.log(`Backend: PUT /api/services/${req.params.id} hit!`);
    const { name, description, price, status, type } = req.body;
    const serviceId = req.params.id;

    try {
        const [rows] = await db.query('SELECT image_url FROM services WHERE id = ?', [serviceId]);
        if (rows.length === 0) {
            console.log(`Service with ID ${serviceId} not found for update.`);
            return res.status(404).json({ error: 'Service not found' });
        }

        let image_url = rows[0].image_url; // Keep existing image if no new one
        let oldImagePathForDeletion = null;

        if (req.file) {
            if (image_url) { // If there was an old image, prepare to delete it
                oldImagePathForDeletion = path.join(__dirname, image_url);
            }
            image_url = `/uploads/${req.file.filename}`; // New image URL
            console.log(`New image uploaded for service ID ${serviceId}: ${image_url}`);
        }

        await db.query(
            'UPDATE services SET name=?, description=?, price=?, image_url=?, status=?, type=? WHERE id=?',
            [name, description, price, image_url, status, type, serviceId]
        );

        // Delete old image file after successful DB update
        if (oldImagePathForDeletion && fs.existsSync(oldImagePathForDeletion)) {
            fs.unlinkSync(oldImagePathForDeletion);
            console.log(`Old image deleted: ${oldImagePathForDeletion}`);
        }

        res.json({ message: 'Service updated successfully' });
    } catch (err) {
        console.error('Backend: Update error (PUT /api/services/:id):', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE a service
app.delete('/api/services/:id', async (req, res) => {
    console.log(`Backend: DELETE /api/services/${req.params.id} hit!`);
    const serviceId = req.params.id;

    try {
        const [rows] = await db.query('SELECT image_url FROM services WHERE id = ?', [serviceId]);
        if (rows.length === 0) {
            console.log(`Service with ID ${serviceId} not found for deletion.`);
            return res.status(404).json({ error: 'Service not found' });
        }

        const image_url = rows[0].image_url;
        if (image_url) {
            const imagePath = path.join(__dirname, image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`Image file deleted: ${imagePath}`);
            }
        }

        const [result] = await db.query('DELETE FROM services WHERE id = ?', [serviceId]);
        if (result.affectedRows === 0) {
             console.log(`Service with ID ${serviceId} not deleted (affectedRows was 0).`);
            return res.status(404).json({ error: 'Service not found after image delete attempt' });
        }
        res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        console.error('Backend: Delete error (DELETE /api/services/:id):', err);
        res.status(500).json({ error: err.message });
    }
});

// Root route (for basic server check)
app.get('/', (req, res) => {
    console.log('Backend: Root route (/) hit!');
    res.send('🎉 Resort Management Backend is Running');
});

// Catch-all for undefined routes (order matters: this MUST be last among routes)
app.use((req, res, next) => {
    console.log(`Backend: No route found for ${req.method} ${req.url}`);
    res.status(404).json({ error: `API endpoint '${req.url}' not found.` });
});

// Global error handler (for unexpected errors in middleware/routes)
app.use((err, req, res, next) => {
    console.error('Backend: Uncaught error:', err.stack);
    res.status(500).json({ error: 'Something went wrong on the server.', details: err.message });
});


// Change to a new port (e.g., 5002) to avoid potential conflicts
const PORT = 5002;
app.listen(PORT, () => {
    console.log(`🚀 Services Server running at http://localhost:${PORT}`);
});