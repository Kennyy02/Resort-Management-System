const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234567890', // change if needed
  database: 'resort_management'
});

// Connect to database
db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database');
  }
});

// --- GET ALL BOOKINGS ---
app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM bookings');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching bookings:', err.message);
    res.status(500).json({ error: 'Server error fetching bookings' });
  }
});

// --- ✅ NEW ROUTE: Get Booked Dates for a Specific Service ---
app.get('/api/bookings/service/:serviceId', async (req, res) => {
  const { serviceId } = req.params;

  try {
    const [rows] = await db.promise().query(
      'SELECT checkInDate FROM bookings WHERE serviceId = ?',
      [serviceId]
    );

    const bookedDates = rows.map(row =>
      new Date(row.checkInDate).toISOString().split('T')[0]
    );

    res.json(bookedDates);
  } catch (err) {
    console.error('❌ Error fetching booked dates:', err.message);
    res.status(500).json({ error: 'Server error fetching booked dates' });
  }
});

// --- POST A NEW BOOKING ---
app.post('/api/bookings', async (req, res) => {
  const {
    name,
    email,
    phoneNumber,
    checkInDate,
    checkOutDate,
    serviceId,
    serviceName,
    modeOfPayment,
    referenceNumber,
  } = req.body;

  if (
    !name ||
    !email ||
    !phoneNumber ||
    !checkInDate ||
    !checkOutDate ||
    !serviceId ||
    !serviceName ||
    !modeOfPayment
  ) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  try {
    const [result] = await db.promise().query(
      `INSERT INTO bookings 
       (name, email, phoneNumber, checkInDate, checkOutDate, serviceId, serviceName, modeOfPayment, referenceNumber, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [name, email, phoneNumber, checkInDate, checkOutDate, serviceId, serviceName, modeOfPayment, referenceNumber]
    );

    res.status(201).json({ message: 'Booking created successfully', bookingId: result.insertId });
  } catch (err) {
    console.error('❌ Error creating booking:', err.message);
    res.status(500).json({ error: 'Server error creating booking' });
  }
});

// --- UPDATE BOOKING STATUS (Admin) ---
app.put('/api/bookings/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.promise().query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Booking status updated successfully' });
  } catch (err) {
    console.error('❌ Error updating booking status:', err.message);
    res.status(500).json({ error: 'Server error updating booking status' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
