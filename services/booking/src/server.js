const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5003; // ✅ Railway assigns dynamic ports

// ✅ CORS setup for frontend domain
app.use(cors({
  origin: 'https://emzbayviewmountainresort.up.railway.app',
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// ✅ MySQL connection using Railway environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to booking database");
});

// ✅ Nodemailer setup using Railway environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Nodemailer transporter error:", error);
  } else {
    console.log("✅ Server ready to send emails");
  }
});

// ✅ Health check route for Railway
app.get('/', (req, res) => {
  res.send('Booking service is running 🚀');
});

// ✅ Create Booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, phoneNumber, checkInDate, checkOutDate, serviceId, serviceName, modeOfPayment } = req.body;

    if (!name || !email || !phoneNumber || !checkInDate || !checkOutDate || !serviceId || !serviceName || !modeOfPayment) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const formattedCheckIn = new Date(checkInDate).toISOString().split('T')[0];
    const formattedCheckOut = new Date(checkOutDate).toISOString().split('T')[0];

    const [conflicts] = await db.promise().query(
      "SELECT id FROM bookings WHERE serviceId = ? AND checkInDate = ?",
      [serviceId, formattedCheckIn]
    );
    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Already booked for that check-in date' });
    }

    const sql = `INSERT INTO bookings 
      (name, email, phoneNumber, checkInDate, checkOutDate, serviceId, serviceName, modeOfPayment) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await db.promise().query(sql, [
      name, email, phoneNumber, formattedCheckIn, formattedCheckOut, serviceId, serviceName, modeOfPayment
    ]);

    res.status(201).json({ message: 'Booking created', bookingId: result.insertId });
  } catch (err) {
    console.error("❌ Booking error:", err.message);
    res.status(500).json({ error: 'Server error while booking' });
  }
});

// ✅ Get All Bookings
app.get('/api/bookings', (req, res) => {
  db.query("SELECT * FROM bookings ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: 'Error fetching bookings' });
    res.json(results);
  });
});

// ✅ Get Booked Dates by Service ID
app.get('/api/bookings/service/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.promise().query(
      "SELECT checkInDate FROM bookings WHERE serviceId = ?",
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching booked dates:", err.message);
    res.status(500).json({ error: 'Error fetching booked dates' });
  }
});

// ✅ Update Booking Status + Send Email
app.put('/api/bookings/:id/status', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['pending', 'approved', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const [result] = await db.promise().query(
      "UPDATE bookings SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const [rows] = await db.promise().query(
      "SELECT name, email, serviceName, checkInDate, checkOutDate FROM bookings WHERE id = ?",
      [id]
    );
    const booking = rows[0];

    if (!booking) {
      return res.status(404).json({ error: 'Booking details not found' });
    }

    const formatDate = (d) => new Date(d).toLocaleDateString("en-US");

    let subject, text;
    if (status === 'approved') {
      subject = "✅ Your Booking Has Been Approved";
      text = `Hello ${booking.name},\n\nYour reservation for ${booking.serviceName} from ${formatDate(booking.checkInDate)} to ${formatDate(booking.checkOutDate)} has been APPROVED.\n\nThank you for choosing us!`;
    } else if (status === 'declined') {
      subject = "❌ Your Booking Has Been Declined";
      text = `Hello ${booking.name},\n\nWe’re sorry, but your reservation for ${booking.serviceName} from ${formatDate(booking.checkInDate)} to ${formatDate(booking.checkOutDate)} has been DECLINED.\n\nPlease contact us for more details.`;
    }

    console.log("📤 Sending email to:", booking.email, "with subject:", subject);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: booking.email,
      subject,
      text,
    });

    console.log("✅ Email sent:", info.response);

    res.json({ message: `Status updated to ${status} and email sent to ${booking.email}` });

  } catch (err) {
    console.error("❌ Error updating status or sending email:", err);
    res.status(500).json({ error: 'Error updating status or sending email' });
  }
});

// ✅ Start server on Railway-assigned port
app.listen(PORT, () => console.log(`🚀 Booking service running on port ${PORT}`));
