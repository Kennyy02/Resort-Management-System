const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5003;

// ✅ Proper CORS setup
const allowedOrigins = [
  "https://emzbayviewmountainresort.up.railway.app", // your frontend domain
  "http://localhost:3000" // local testing
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        const msg = "CORS policy does not allow access from this origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// --- MySQL Setup ---
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to booking database");
});

// --- Email Transporter (Gmail) ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "emzbayviewmountain@gmail.com", // ✅ Gmail address
    pass: "vbmw askg uute pvox", // ✅ App Password (Google App password, not your main password)
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Nodemailer transporter error:", error);
  } else {
    console.log("✅ Server ready to send emails");
  }
});

// --- CREATE BOOKING ---
app.post("/api/bookings", async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      checkInDate,
      checkOutDate,
      serviceId,
      serviceName,
      modeOfPayment,
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
      return res.status(400).json({ error: "All required fields must be provided" });
    }

    const formattedCheckIn = new Date(checkInDate).toISOString().split("T")[0];
    const formattedCheckOut = new Date(checkOutDate).toISOString().split("T")[0];

    const [conflicts] = await db
      .promise()
      .query("SELECT id FROM bookings WHERE serviceId = ? AND checkInDate = ?", [
        serviceId,
        formattedCheckIn,
      ]);

    if (conflicts.length > 0) {
      return res.status(409).json({ error: "Already booked for that check-in date" });
    }

    const sql = `
      INSERT INTO bookings 
      (name, email, phoneNumber, checkInDate, checkOutDate, serviceId, serviceName, modeOfPayment, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const [result] = await db
      .promise()
      .query(sql, [
        name,
        email,
        phoneNumber,
        formattedCheckIn,
        formattedCheckOut,
        serviceId,
        serviceName,
        modeOfPayment,
      ]);

    res.status(201).json({ message: "Booking created", bookingId: result.insertId });
  } catch (err) {
    console.error("❌ Booking error:", err.message);
    res.status(500).json({ error: "Server error while booking" });
  }
});

// --- GET ALL BOOKINGS (for admin) ---
app.get("/api/bookings", (req, res) => {
  db.query("SELECT * FROM bookings ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: "Error fetching bookings" });
    res.json(results);
  });
});

// --- GET BOOKINGS BY SERVICE (for user-side booked dates) ---
app.get("/api/bookings/service/:serviceId", (req, res) => {
  const { serviceId } = req.params;
  const sql = "SELECT checkInDate FROM bookings WHERE serviceId = ?";
  db.query(sql, [serviceId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching booked dates:", err);
      return res.status(500).json({ error: "Error fetching booked dates" });
    }
    const bookedDates = results.map((r) => r.checkInDate);
    res.json(bookedDates);
  });
});

// --- UPDATE BOOKING STATUS + SEND EMAIL ---
app.put("/api/bookings/:id/status", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!["pending", "approved", "declined"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    // Update status
    const [result] = await db.promise().query("UPDATE bookings SET status = ? WHERE id = ?", [
      status,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Get booking details for email
    const [rows] = await db
      .promise()
      .query(
        "SELECT name, email, serviceName, checkInDate, checkOutDate FROM bookings WHERE id = ?",
        [id]
      );

    const booking = rows[0];
    if (!booking) {
      return res.status(404).json({ error: "Booking details not found" });
    }

    // Format dates
    const formatDate = (d) => new Date(d).toLocaleDateString("en-US");

    let subject, text;
    if (status === "approved") {
      subject = "✅ Your Booking Has Been Approved";
      text = `Hello ${booking.name},\n\nYour reservation for ${booking.serviceName} from ${formatDate(
        booking.checkInDate
      )} to ${formatDate(
        booking.checkOutDate
      )} has been APPROVED.\n\nThank you for choosing us!`;
    } else if (status === "declined") {
      subject = "❌ Your Booking Has Been Declined";
      text = `Hello ${booking.name},\n\nWe’re sorry, but your reservation for ${
        booking.serviceName
      } from ${formatDate(booking.checkInDate)} to ${formatDate(
        booking.checkOutDate
      )} has been DECLINED.\n\nPlease contact us for more details.`;
    }

    console.log("📤 Sending email to:", booking.email);

    const info = await transporter.sendMail({
      from: "emzbayviewmountain@gmail.com",
      to: booking.email,
      subject,
      text,
    });

    console.log("✅ Email sent:", info.response);

    res.json({ message: `Status updated to ${status} and email sent to ${booking.email}` });
  } catch (err) {
    console.error("❌ Error updating status or sending email:", err);
    res.status(500).json({ error: "Error updating status or sending email" });
  }
});

// --- Default headers for safety ---
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://emzbayviewmountainresort.up.railway.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.listen(PORT, () =>
  console.log(`🚀 Booking service running on port ${PORT} (Railway ready)`)
);
