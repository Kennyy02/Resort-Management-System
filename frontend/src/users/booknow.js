import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/booknow.css";

// API URLS
const BOOKING_API_URL =
    process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_BOOKING_API_URL
        : "http://localhost:5003";

const PAYMENT_API_URL =
    process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_SERVICES_API
        : "http://localhost:5002";

const BookNow = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const serviceId = location.state?.serviceId;
    const serviceName = location.state?.serviceName || "Unknown Service";

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        checkInDate: "",
        checkOutDate: "",
        modeOfPayment: "online",
        referenceNumber: "",
    });

    const [bookedDates, setBookedDates] = useState([]);
    const [paymentQRs, setPaymentQRs] = useState([]);
    const [qrModalOpen, setQrModalOpen] = useState(true); // ⭐ auto-open because default is online
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const isPhoneNumberDisabled = user && user.phone;

    // ---------------- LOAD USER + QR ----------------
    useEffect(() => {
        const loggedIn = localStorage.getItem("isLoggedIn");
        const user = JSON.parse(localStorage.getItem("user"));

        if (!loggedIn || !user) {
            navigate("/login", {
                state: { from: "/booknow", message: "Please sign in to continue booking." },
            });
            return;
        }

        let userFullName = user.name || user.fullname || "";
        if (!userFullName && user.email) {
            const emailPrefix = user.email.split("@")[0];
            userFullName = emailPrefix
                .replace(/[^a-zA-Z.]/g, " ")
                .split(".")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
                .trim();
        }

        userFullName = userFullName || "Guest User";

        setFormData((prev) => ({
            ...prev,
            name: userFullName,
            email: user.email || "",
            phoneNumber: user.phone || "",
        }));

        // Fetch booked dates
        fetch(`${BOOKING_API_URL}/api/bookings/service/${serviceId}`)
            .then((res) => res.json())
            .then((data) => setBookedDates(data))
            .catch((err) => console.error("Error fetching booked dates:", err));

        // Fetch all payment QR codes
        fetch(`${PAYMENT_API_URL}/api/services`)
            .then((res) => res.json())
            .then((data) => {
                const filtered = data.filter((qr) => qr.type === "payment" && qr.image_url);
                setPaymentQRs(filtered);
            })
            .catch((err) => console.error("Error fetching payment QRs:", err));

        setIsLoading(false);
    }, [navigate, serviceId]);

    const isDateBooked = (date) => bookedDates.includes(date);

    // ---------------- FORM CHANGE ----------------
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Auto open modal when mode changed to online or onsite
        if (name === "modeOfPayment") {
            setQrModalOpen(true);
        }
    };

    // ---------------- SUBMIT ----------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setIsSubmitting(true);

        const { checkInDate, checkOutDate, referenceNumber, phoneNumber } = formData;

        // ⭐ Phone Number Required
        if (!phoneNumber.trim()) {
            setMessage("❌ Phone number is required.");
            setIsSubmitting(false);
            return;
        }

        // ⭐ Reference Number Always Required
        if (!referenceNumber.trim()) {
            setMessage("❌ Reference number is required for payment.");
            setIsSubmitting(false);
            return;
        }

        // ⭐ Date validation (check if booked)
        if (isDateBooked(checkInDate) || isDateBooked(checkOutDate)) {
            setMessage("❌ Booking on that date is no longer available.");
            setIsSubmitting(false);
            return;
        }

        const user = JSON.parse(localStorage.getItem("user"));

        const bookingData = {
            userId: user.id,
            serviceId,
            serviceName,
            ...formData,
        };

        try {
            const res = await fetch(`${BOOKING_API_URL}/api/bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookingData),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(`❌ Booking failed: ${data.error || "Server error"}`);
                throw new Error(data.error);
            }

            setMessage(`✅ Booking successful! Status: ${data.status}`);
            setTimeout(() => navigate("/"), 1500);
        } catch (e) {
            setMessage(`❌ Error: ${e.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="loading-container">Loading booking form...</div>;

    const showNoPaymentMessage = paymentQRs.length === 0;

    return (
        <div className="booking-container">
            <h2 className="booking-title">Book Now: {serviceName}</h2>

            {/* -------------------- QR MODAL -------------------- */}
            {qrModalOpen && (
                <div className="qr-modal">
                    <div className="qr-modal-content">
                        <h3>
                            {formData.modeOfPayment === "online"
                                ? "Online Payment (100% Required)"
                                : "Onsite Payment (Minimum 15% Deposit)"}
                        </h3>

                        <p>
                            {formData.modeOfPayment === "online"
                                ? "Scan the QR below to proceed with the full payment:"
                                : "A 15% deposit is required. Scan a QR code below to pay the deposit or full amount."}
                        </p>

                        <div className="qr-grid">
                            {paymentQRs.length > 0 ? (
                                paymentQRs.map((qr) => (
                                    <div key={qr.id} className="qr-item">
                                        <img
                                            src={`${PAYMENT_API_URL.replace(/\/$/, "")}${qr.image_url}`}
                                            alt={qr.name}
                                            className="qr-image"
                                        />
                                        <p className="qr-label">{qr.name}</p>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: "red", fontWeight: "bold" }}>
                                    No payment QR codes available.
                                </p>
                            )}
                        </div>

                        <button className="close-modal-btn" onClick={() => setQrModalOpen(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* -------------------- FORM -------------------- */}
            <form className="booking-form" onSubmit={handleSubmit}>
                <label>Full Name</label>
                <input type="text" value={formData.name} disabled />

                <label>Email</label>
                <input type="email" value={formData.email} disabled />

                <label>Phone Number</label>
                <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    disabled={isPhoneNumberDisabled}
                />

                <label>Check-In Date</label>
                <input
                    type="date"
                    name="checkInDate"
                    value={formData.checkInDate}
                    onChange={handleChange}
                    required
                />

                <label>Check-Out Date</label>
                <input
                    type="date"
                    name="checkOutDate"
                    value={formData.checkOutDate}
                    onChange={handleChange}
                    required
                />

                <label>Mode of Payment</label>
                <select
                    name="modeOfPayment"
                    value={formData.modeOfPayment}
                    onChange={handleChange}
                >
                    <option value="online">💳 Online Payment (100% full payment)</option>
                    <option value="onsite">🏠 Pay Onsite (15% deposit required)</option>
                </select>

                <label>Reference Number</label>
                <input
                    type="text"
                    name="referenceNumber"
                    placeholder="Enter payment reference number"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    required // ALWAYS REQUIRED
                />

                {showNoPaymentMessage && (
                    <p style={{ color: "red", marginTop: "10px" }}>
                        **No payment methods are available. Please try again later.**
                    </p>
                )}

                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Confirm Booking"}
                </button>

                {message && (
                    <p
                        className={`booking-message ${
                            message.includes("❌") ? "error" : "success"
                        }`}
                    >
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default BookNow;
