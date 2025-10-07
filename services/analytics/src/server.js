// Import necessary modules
const express = require('express');
const mysql = require('mysql2/promise'); // Using mysql2/promise for async/await
const cors = require('cors'); // Import cors to allow cross-origin requests

// Initialize Express app
const app = express();
const port = 3002; // Using port 3002

// Middleware
app.use(express.json()); // To parse JSON request bodies
app.use(cors()); // Enable CORS for all routes, allowing your React app to connect

// Database connection pool setup
// IMPORTANT: Replace with your actual MySQL credentials
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

// API Endpoint: Get Monthly Booking Trends
app.get('/api/analytics/bookings-by-month', async (req, res) => {
  try {
    const query = `
      SELECT
        YEAR(checkInDate) AS booking_year,
        MONTH(checkInDate) AS booking_month,
        COUNT(*) AS total_bookings
      FROM booking.bookings  -- Explicitly referencing 'booking.bookings'
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

// API Endpoint: Get Popular Payment Methods
app.get('/api/analytics/payment-methods', async (req, res) => {
  try {
    const query = `
      SELECT
        payment_method,
        COUNT(*) AS total_payments,
        SUM(amount) AS total_revenue
      FROM transactions
      WHERE transaction_type = 'Booking'
      GROUP BY payment_method
      ORDER BY total_revenue DESC;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// NEW API Endpoint: Get Bookings by Service Type (Rooms/Cottage)
app.get('/api/analytics/bookings-by-service', async (req, res) => {
  try {
    const query = `
      SELECT
        serviceName,
        COUNT(*) AS total_bookings
      FROM booking.bookings -- Accessing the bookings table in the 'booking' database
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

// NEW API Endpoint: Get Total Bookings for Current Month
app.get('/api/analytics/summary/total-bookings-month', async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS total_bookings
      FROM booking.bookings
      WHERE MONTH(checkInDate) = MONTH(CURDATE()) AND YEAR(checkInDate) = YEAR(CURDATE());
    `;
    const [rows] = await pool.query(query);
    res.json(rows[0] || { total_bookings: 0 });
  } catch (error) {
    console.error('Error fetching total bookings for month:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// NEW API Endpoint: Get Total Revenue for Current Month
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


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
