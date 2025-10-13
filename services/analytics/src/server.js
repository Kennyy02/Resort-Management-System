// Import necessary modules
const express = require('express');
const mysql = require('mysql2/promise'); // Using mysql2/promise for async/await
const cors = require('cors'); // Import cors to allow cross-origin requests

// Initialize Express app
const app = express();
const port = 3002;

// --- CRITICAL CORS FIX: Specify the allowed origin ---
// This allows your deployed frontend to access this deployed backend.
const allowedOrigins = [
    // Your deployed frontend domain (CRITICAL FOR PRODUCTION)
    'https://emzbayviewmountainresort.up.railway.app', 
    // Local development origins
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://localhost:3002' 
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps/curl) or if the origin is explicitly allowed
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Block the request if the origin is not allowed
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};

// Middleware
app.use(express.json()); // To parse JSON request bodies
app.use(cors(corsOptions)); // Use the customized CORS options
// ----------------------------------------------------------------

// Database connection pool setup
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, // This should be 'railway' based on your screenshot
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        res.json({ message: 'Database connected successfully!', solution: rows[0].solution });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});

// ------------------------------------
// ANALYTICS ENDPOINTS
// ------------------------------------

// 1. API Endpoint: Get Monthly Booking Trends
app.get('/api/analytics/bookings-by-month', async (req, res) => {
    try {
        const query = `
            SELECT
                YEAR(checkInDate) AS booking_year,
                MONTH(checkInDate) AS booking_month,
                COUNT(*) AS total_bookings
            FROM bookings  /* FIXED: Removed 'booking.' prefix */
            GROUP BY booking_year, booking_month
            ORDER BY booking_year, booking_month;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching monthly booking trends:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// 2. NEW API Endpoint: Get Monthly Revenue Trends
app.get('/api/analytics/revenue-by-month', async (req, res) => {
    try {
        const query = `
            SELECT
                YEAR(transaction_timestamp) AS revenue_year,
                MONTH(transaction_timestamp) AS revenue_month,
                SUM(amount) AS total_revenue
            FROM transactions
            WHERE transaction_type = 'Booking'
            GROUP BY revenue_year, revenue_month
            ORDER BY revenue_year, revenue_month;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching monthly revenue trends:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// 3. API Endpoint: Get Bookings by Service Type (Rooms/Cottage)
app.get('/api/analytics/bookings-by-service', async (req, res) => {
    try {
        const query = `
            SELECT
                serviceName,
                COUNT(*) AS total_bookings
            FROM bookings /* FIXED: Removed 'booking.' prefix */
            GROUP BY serviceName
            ORDER BY total_bookings DESC;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching bookings by service type:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// 4. API Endpoint: Get Total Bookings for Current Month (SUMMARY CARD)
app.get('/api/analytics/summary/total-bookings-month', async (req, res) => {
    try {
        const query = `
            SELECT COUNT(*) AS total_bookings
            FROM bookings /* FIXED: Removed 'booking.' prefix */
            WHERE MONTH(checkInDate) = MONTH(CURDATE()) AND YEAR(checkInDate) = YEAR(CURDATE());
        `;
        const [rows] = await pool.query(query);
        res.json(rows[0] || { total_bookings: 0 });
    } catch (error) {
        console.error('Error fetching total bookings for month:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// 5. API Endpoint: Get Total Revenue for Current Month (SUMMARY CARD)
app.get('/api/analytics/summary/total-revenue-month', async (req, res) => {
    try {
        const query = `
            SELECT SUM(amount) AS total_revenue
            FROM transactions
            WHERE transaction_type = 'Booking'
            AND MONTH(transaction_timestamp) = MONTH(CURDATE()) AND YEAR(transaction_timestamp) = YEAR(CURDATE());
        `;
        const [rows] = await pool.query(query);
        res.json(rows[0] || { total_revenue: 0 });
    } catch (error) {
        console.error('Error fetching total revenue for month:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// 6. API Endpoint: Get Popular Payment Methods (For future chart/table)
app.get('/api/analytics/payment-methods', async (req, res) => {
    try {
        const query = `
            SELECT
                modeOfPayment,
                COUNT(*) AS total_payments,
                SUM(amount) AS total_revenue
            FROM transactions
            WHERE transaction_type = 'Booking'
            GROUP BY modeOfPayment
            ORDER BY total_revenue DESC;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Analytics server running on http://localhost:${port}`);
});
