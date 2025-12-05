const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5003;

app.use(cors());
app.use(express.json());

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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'emzbayviewmountain@gmail.com',
        pass: 'vbmw askg uute pvox',
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Nodemailer transporter error:", error);
    } else {
        console.log("✅ Server ready to send emails");
    }
});

app.get('/api/bookings/check-prerequisite/:email', async (req, res) => {
    const { email } = req.params;

    if (!email) {
        return res.status(400).json({ error: 'Email parameter is required' });
    }

    try {
        const [results] = await db.promise().query(
            `SELECT id 
             FROM bookings 
             WHERE email = ? 
               AND status = 'approved' 
               AND (serviceName LIKE '%room%' OR serviceName LIKE '%cottage%')
             LIMIT 1`,
            [email]
        );

        const hasPrerequisite = results.length > 0;
        res.json({ hasRoomOrCottageBooking: hasPrerequisite });

    } catch (err) {
        console.error("❌ Error checking booking prerequisite:", err.message);
        res.status(500).json({ error: 'Error checking booking prerequisite' });
    }
});

app.get('/api/bookings/service/:serviceId', async (req, res) => {
    const { serviceId } = req.params;
    try {
        const [results] = await db.promise().query(
            "SELECT DISTINCT DATE_FORMAT(checkInDate, '%Y-%m-%d') AS checkInDate FROM bookings WHERE serviceId = ?",
            [serviceId]
        );
        const bookedDates = results.map(row => row.checkInDate);
        res.json(bookedDates);
    } catch (err) {
        console.error("❌ Error fetching booked dates by serviceId:", err.message);
        res.status(500).json({ error: 'Error fetching booked dates' });
    }
});

// ----------------- ✅ FIXED POST /api/bookings ROUTE -----------------
app.post('/api/bookings', async (req, res) => {
    try {
        // ✅ FIX 1: Destructure referenceNumber from the request body
        const { name, email, phoneNumber, checkInDate, checkOutDate, serviceId, serviceName, modeOfPayment, referenceNumber } = req.body;

        // ✅ FIX 2: Include referenceNumber in the required fields check
        const requiredFields = { name, email, phoneNumber, checkInDate, checkOutDate, serviceId, serviceName, modeOfPayment, referenceNumber };
        // The frontend handles making referenceNumber optional for onsite payment, so we can simplify the backend check here.
        // If referenceNumber is required by the form (e.g., online payment), the frontend ensures it's passed.
        const missingFields = Object.keys(requiredFields).filter(key => {
            // Check if the field is modeOfPayment and its value is missing
            if (key === 'referenceNumber' && modeOfPayment === 'onsite') {
                // referenceNumber is not required for onsite (or can be treated as an empty string)
                return false; 
            }
            // Check if any other required field is missing/falsy
            return !requiredFields[key];
        });

        if (missingFields.length > 0) {
            console.error("❌ Missing required fields for booking:", missingFields.join(', '));
            return res.status(400).json({ error: 'All required fields must be provided', missing: missingFields });
        }

        const formattedCheckIn = new Date(checkInDate).toISOString().split('T')[0];
        const formattedCheckOut = new Date(checkOutDate).toISOString().split('T')[0];
        
        // Ensure referenceNumber is stored as null if empty (for onsite payments)
        const finalReferenceNumber = (modeOfPayment === 'onsite' && !referenceNumber) ? null : referenceNumber;

        const [conflicts] = await db.promise().query(
            "SELECT id FROM bookings WHERE serviceId = ? AND checkInDate = ?",
            [serviceId, formattedCheckIn]
        );
        if (conflicts.length > 0) {
            return res.status(409).json({ error: 'Already booked for that check-in date' });
        }

        const sql = `INSERT INTO bookings 
             (name, email, phoneNumber, checkInDate, checkOutDate, serviceId, serviceName, modeOfPayment, referenceNumber) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`; // ✅ FIX 3: Added referenceNumber column

        const [result] = await db.promise().query(sql, [
            name, email, phoneNumber, formattedCheckIn, formattedCheckOut, serviceId, serviceName, modeOfPayment, finalReferenceNumber // ✅ FIX 4: Added referenceNumber value
        ]);

        res.status(201).json({ message: 'Booking created', bookingId: result.insertId });
    } catch (err) {
        console.error("❌ Booking error:", err.message);
        res.status(500).json({ error: 'Server error while booking' });
    }
});
// ----------------- END FIXED POST /api/bookings ROUTE -----------------


app.get('/api/bookings', (req, res) => {
    db.query("SELECT * FROM bookings ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching bookings' });
        res.json(results);
    });
});

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
        } else {
            res.json({ message: `Status updated to ${status}` });
            return;
        }

        console.log("📤 Sending email to:", booking.email, "with subject:", subject);

        const info = await transporter.sendMail({
            from: 'emzbayviewmountain@gmail.com',
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

app.listen(PORT, () => console.log(`🚀 Booking service running on http://localhost:${PORT}`));
