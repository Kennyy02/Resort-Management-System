const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
// --- FIX #1: Explicit CORS Configuration ---
const allowedOrigin = 'https://emzbayviewmountainresort.up.railway.app'; 

app.use(cors({
    origin: allowedOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
    optionsSuccessStatus: 204
})); 
// -------------------------------------------

app.use(express.json()); 

// Middleware to log all incoming requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);
    next(); 
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup - store files in /uploads, keep original filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            console.log(`Creating uploads directory: ${uploadDir}`);
            fs.mkdirSync(uploadDir, { recursive: true }); 
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// MySQL Database connection for 'manageservices'
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
    .then(connection => {
        console.log('Connected to MySQL database: manageservices');
        connection.release();
    })
    .catch(err => {
        console.error('Failed to connect to MySQL database "manageservices":', err);
    });


// POST new service (FINAL FIX: Robust NULL handling for optional fields like price)
app.post('/api/services', upload.single('image'), async (req, res) => {
    console.log('Backend: POST /api/services hit!');
    
    // Extract fields
    const { name, description, price, status, type, mode_of_payment } = req.body;
    let image_url = null;
    
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
        console.log(`Image uploaded: ${image_url}`);
    }

    // --- ENFORCING NULL for empty/missing optional fields ---
    // The check (variable && variable.trim() !== '') ensures that only true data is kept.
    // If empty string or undefined, it resolves to null.
    const final_name = name || null; 
    const final_description = (description && description.toString().trim() !== '') ? description : null;
    const final_price = (price && price.toString().trim() !== '') ? price : null;
    const final_image_url = image_url || null; 
    const final_status = status || 'available'; 
    const final_type = type || 'room';
    const final_mode_of_payment = mode_of_payment || 'online'; 
    // --------------------------------------------------------
    
    if (!final_name || !final_type) {
        return res.status(400).json({ error: "Service Name and Type are required." });
    }

    // --- DEBUG LOG: WHAT ARE WE SENDING? ---
    console.log("DEBUG: Attempting to insert service with values:");
    console.log("name:", final_name);
    console.log("description:", final_description);
    console.log("price:", final_price);          
    console.log("image_url:", final_image_url);
    console.log("status:", final_status);
    console.log("type:", final_type);
    console.log("mode_of_payment:", final_mode_of_payment);
    // ------------------------------------------
    
    try {
        const [result] = await db.query(
            'INSERT INTO services (name, description, price, image_url, status, type, mode_of_payment) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [final_name, final_description, final_price, final_image_url, final_status, final_type, final_mode_of_payment]
        );
        console.log('Service added to DB, ID:', result.insertId);
        res.status(201).json({ message: 'Service added successfully', id: result.insertId });
    } catch (err) {
        console.error('Backend: Insert error (POST /api/services):', err);
        // This response will show the exact SQL error code in the frontend network tab
        res.status(500).json({ error: err.message, sqlError: err.code }); 
    }
});

// GET all services
app.get('/api/services', async (req, res) => {
    console.log('Backend: GET /api/services route handler executed!'); 
    try {
        const [services] = await db.query('SELECT * FROM services');
        console.log('Backend: Services fetched from DB. Count:', services.length);
        res.json(services);
    } catch (err) {
        console.error('Backend: Read error (GET /api/services):', err);
        res.status(500).json({ error: 'Failed to fetch services: ' + err.message });
    }
});

// PUT (Update) a service (FINAL FIX: Robust NULL handling for optional fields like price)
app.put('/api/services/:id', upload.single('image'), async (req, res) => {
    console.log(`Backend: PUT /api/services/${req.params.id} hit!`);
    const { name, description, price, status, type, mode_of_payment } = req.body;
    const serviceId = req.params.id;

    // --- ENFORCING NULL for empty/missing optional fields ---
    const final_name = name || null;
    const final_description = (description && description.toString().trim() !== '') ? description : null;
    const final_price = (price && price.toString().trim() !== '') ? price : null;
    const final_status = status || 'available'; 
    const final_type = type || 'room'; 
    const final_mode_of_payment = mode_of_payment || 'online';
    // --------------------------------------------------------
    
    if (!final_name) {
        return res.status(400).json({ error: "Service Name is required." });
    }

    try {
        const [rows] = await db.query('SELECT image_url FROM services WHERE id = ?', [serviceId]);
        if (rows.length === 0) {
            console.log(`Service with ID ${serviceId} not found for update.`);
            return res.status(404).json({ error: 'Service not found' });
        }

        let image_url = rows[0].image_url; 
        let oldImagePathForDeletion = null;

        if (req.file) {
            if (image_url) { 
                oldImagePathForDeletion = path.join(__dirname, image_url);
            }
            image_url = `/uploads/${req.file.filename}`; 
            console.log(`New image uploaded for service ID ${serviceId}: ${image_url}`);
        }
        const final_image_url = image_url || null;

        await db.query(
            'UPDATE services SET name=?, description=?, price=?, image_url=?, status=?, type=?, mode_of_payment=? WHERE id=?',
            [final_name, final_description, final_price, final_image_url, final_status, final_type, final_mode_of_payment, serviceId]
        );

        // Delete old image file after successful DB update
        if (oldImagePathForDeletion && fs.existsSync(oldImagePathForDeletion)) {
            fs.unlinkSync(oldImagePathForDeletion);
            console.log(`Old image deleted: ${oldImagePathForDeletion}`);
        }

        res.json({ message: 'Service updated successfully' });
    } catch (err) {
        console.error('Backend: Update error (PUT /api/services/:id):', err);
        res.status(500).json({ error: err.message, sqlError: err.code });
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

// Catch-all for undefined routes
app.use((req, res, next) => {
    console.log(`Backend: No route found for ${req.method} ${req.url}`);
    res.status(404).json({ error: `API endpoint '${req.url}' not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Backend: Uncaught error:', err.stack);
    res.status(500).json({ error: 'Something went wrong on the server.', details: err.message });
});


// Change to a new port (e.g., 5002) to avoid potential conflicts
const PORT = 5002;
app.listen(PORT, () => {
    console.log(`🚀 Services Server running at https://your-backend.up.railway.app`);
});
