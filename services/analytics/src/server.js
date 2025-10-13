const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
// CRITICAL FIX: Use the port provided by the hosting environment (Railway)
const dynamicPort = process.env.PORT || 3002;

const allowedOrigins = [
    'https://emzbayviewmountainresort.up.railway.app', // CORS FIX
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://localhost:3002' 
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        res.json({ message: 'Database connected successfully!', solution: rows[0].solution });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});

app.get('/api/analytics/bookings-by-month', async (req, res) => {
    try {
        // CLEANUP FIX: Use .trim() and remove initial blank line
        const query = `
SELECT
    YEAR(checkInDate) AS booking_year,
    MONTH(checkInDate) AS booking_month,
    COUNT(*) AS total_bookings
FROM bookings
GROUP BY booking_year, booking_month
ORDER BY booking_year, booking_month;
        `.trim();
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching monthly booking trends:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/api/analytics/revenue-by-month', async (req, res) => {
    try {
        // CLEANUP FIX: Use .trim() and remove initial blank line
        const query = `
SELECT
    YEAR(transaction_timestamp) AS revenue_year,
    MONTH(transaction_timestamp) AS revenue_month,
    SUM(amount) AS total_revenue
FROM transactions
WHERE transaction_type = 'Booking'
GROUP BY revenue_year, revenue_month
ORDER BY revenue_year, revenue_month;
        `.trim();
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching monthly revenue trends:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/api/analytics/bookings-by-service', async (req, res) => {
    try {
        // CLEANUP FIX: Use .trim() and remove initial blank line
        const query = `
SELECT
    serviceName,
    COUNT(*) AS total_bookings
FROM bookings
GROUP BY serviceName
ORDER BY total_bookings DESC;
        `.trim();
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching bookings by service type:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/api/analytics/summary/total-bookings-month', async (req, res) => {
    try {
        // CLEANUP FIX: Use .trim() and remove initial blank line
        const query = `
SELECT COUNT(*) AS total_bookings
FROM bookings
WHERE MONTH(checkInDate) = MONTH(CURDATE()) AND YEAR(checkInDate) = 2025;
        `.trim();
        const [rows] = await pool.query(query);
        res.json(rows[0] || { total_bookings: 0 });
    } catch (error) {
        console.error('Error fetching total bookings for month:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/api/analytics/summary/total-revenue-month', async (req, res) => {
    try {
        // CLEANUP FIX: Use .trim() and remove initial blank line
        const query = `
SELECT SUM(amount) AS total_revenue
FROM transactions
WHERE transaction_type = 'Booking'
AND MONTH(transaction_timestamp) = MONTH(CURDATE()) AND YEAR(transaction_timestamp) = 2025;
        `.trim();
        const [rows] = await pool.query(query);
        res.json(rows[0] || { total_revenue: 0 });
    } catch (error) {
        console.error('Error fetching total revenue for month:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/api/analytics/payment-methods', async (req, res) => {
    try {
        // CLEANUP FIX: Use .trim() and remove initial blank line
        const query = `
SELECT
    modeOfPayment,
    COUNT(*) AS total_payments,
    SUM(amount) AS total_revenue
FROM transactions
WHERE transaction_type = 'Booking'
GROUP BY modeOfPayment
ORDER BY total_revenue DESC;
        `.trim();
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.listen(dynamicPort, () => {
    console.log(`🚀 Analytics server running on http://localhost:${dynamicPort}`);
});
