const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 5003; // or any port Railway assigns automatically

// ✅ CORS CONFIG — this is the critical fix
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://emzbayviewmountainresort.up.railway.app",
    "http://localhost:3000"
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // ✅ Handle preflight
  }

  next();
});

app.use(express.json());

// ✅ MYSQL CONNECTION (hardcoded since no .env)
const db = mysql.createConnection({
  host: "monorail.proxy.rlwy.net",
  user: "root",
  password: "your_mysql_password_here", // replace with your Railway DB password
  database: "railway", // replace if different
  port: 12345, // use your Railway DB port
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL Database");
});

// ✅ Nodemailer config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "emzbayviewmountain@gmail.com",
    pass: "vbmw askg uute pvox", // Gmail app password
  },
});

// --- ROUTES ---

// ✅ Create booking
app.post("/api/bookings", (req, res) => {
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
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    INSERT INTO bookings 
    (name, email, phoneNumber, checkInDate, checkOutDate, serviceId, serviceName, modeOfPayment, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  db.query(
    sql,
    [name, email, phoneNumber, checkInDate, checkOutDate, serviceId, serviceName, modeOfPayment],
    (err, result) => {
      if (err) {
        console.error("❌ Error creating booking:", err);
        return res.status(500).json({ error: "Database insert failed" });
      }

      res.status(201).json({
        message: "Booking created successfully",
        bookingId: result.insertId,
      });
    }
  );
});

// ✅ Get all bookings (admin)
app.get("/api/bookings", (req, res) => {
  db.query("SELECT * FROM bookings ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch bookings" });
    res.json(results);
  });
});

// ✅ Get booked dates by service
app.get("/api/bookings/service/:serviceId", (req, res) => {
  const { serviceId } = req.params;
  db.query(
    "SELECT checkInDate FROM bookings WHERE serviceId = ?",
    [serviceId],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching booked dates:", err);
        return res.status(500).json({ error: "Failed to fetch booked dates" });
      }
      const bookedDates = results.map((r) => r.checkInDate);
      res.json(bookedDates);
    }
  );
});

// ✅ Update booking status + send email
app.put("/api/bookings/:id/status", (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!["pending", "approved", "declined"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const updateSql = "UPDATE bookings SET status = ? WHERE id = ?";
  db.query(updateSql, [status, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to update status" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    db.query(
      "SELECT name, email, serviceName, checkInDate, checkOutDate FROM bookings WHERE id = ?",
      [id],
      (err, rows) => {
        if (err || rows.length === 0)
          return res.status(500).json({ error: "Failed to fetch booking details" });

        const booking = rows[0];
        const formatDate = (d) => new Date(d).toLocaleDateString("en-US");

        let subject, text;
        if (status === "approved") {
          subject = "✅ Your Booking Has Been Approved";
          text = `Hello ${booking.name},\n\nYour reservation for ${booking.serviceName} from ${formatDate(
            booking.checkInDate
          )} to ${formatDate(booking.checkOutDate)} has been APPROVED.\n\nThank you!`;
        } else if (status === "declined") {
          subject = "❌ Your Booking Has Been Declined";
          text = `Hello ${booking.name},\n\nWe’re sorry, but your reservation for ${booking.serviceName} has been declined.\n\nPlease contact us for more details.`;
        }

        transporter.sendMail(
          {
            from: "emzbayviewmountain@gmail.com",
            to: booking.email,
            subject,
            text,
          },
          (error, info) => {
            if (error) {
              console.error("❌ Email failed:", error);
              return res.status(500).json({ error: "Email sending failed" });
            }
            console.log("✅ Email sent:", info.response);
            res.json({ message: `Status updated to ${status}` });
          }
        );
      }
    );
  });
});

// ✅ Health check
app.get("/", (req, res) => res.send("Booking API running successfully ✅"));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
