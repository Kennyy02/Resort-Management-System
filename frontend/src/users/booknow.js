import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/booknow.css";

const BOOKING_API_URL =
    process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_BOOKING_API_URL
        : "http://localhost:5003";

const PAYMENT_API_URL =
    process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_PAYMENT_API
        : "http://localhost:5002"; // MUST POINT TO PAYMENT QR SERVER (i.e., your Services/QR server)

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
    const [qrModalOpen, setQrModalOpen] = useState(false);
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

        // ---------------- CORRECTED NAME LOGIC ----------------
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

        // FETCH ALL SERVICES (includes payment QRs)
        fetch(`${PAYMENT_API_URL}/api/services`) 
            .then((res) => res.json())
            .then((data) => {
                console.log("Loaded QR codes:", data);

                // FILTER BY TYPE and ensure image_url exists
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
        setFormData((p) => ({ ...p, [name]: value }));

        if (name === "modeOfPayment") {
            // only open modal if paymentQRs are available for online payment
            if (value === "online" && paymentQRs.length > 0) {
                setQrModalOpen(true);
            } else if (value === "onsite") {
                 setQrModalOpen(true); // Open modal for deposit info
            } else {
                setQrModalOpen(false); // Close if switching away or no QRs
            }
        }
    };

    // ---------------- SUBMIT ----------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setIsSubmitting(true);

        const user = JSON.parse(localStorage.getItem("user"));

        const bookingData = {
            userId: user.id,
            serviceId,
            serviceName,
            ...formData,
        };

        if (bookingData.modeOfPayment === "online" && !bookingData.referenceNumber.trim()) {
            setMessage("❌ Please enter your payment reference number.");
            setIsSubmitting(false);
            return;
        }

        if (isDateBooked(bookingData.checkInDate)) {
            setMessage("❌ Check-in date is already booked.");
            setIsSubmitting(false);
            return;
        }

        if (bookingData.checkInDate > bookingData.checkOutDate) {
            setMessage("❌ Check-out date must be same or after check-in date.");
            setIsSubmitting(false);
            return;
        }

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

    // Determine if the "No online payment available" message should display
    const showNoPaymentMessage = formData.modeOfPayment === "online" && paymentQRs.length === 0;

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
                                : "To confirm your booking, a minimum 15% deposit is required. You may scan the QR codes below or pay onsite."}
                        </p>

                        <div className="qr-grid">
                            {paymentQRs.length > 0 ? (
                                paymentQRs.map((qr) => (
                                    <div key={qr.id} className="qr-item">
                                        <img
                                            // ✅ THE FIX: Ensure robust URL concatenation by stripping any trailing slash
                                            // from the base URL, as the image_url starts with a leading slash.
                                            src={`${PAYMENT_API_URL.replace(/\/$/, '')}${qr.image_url}`}
                                            alt={qr.name}
                                            className="qr-image"
                                        />
                                        <p className="qr-label">{qr.name}</p>
                                    </div>
                                ))
                            ) : (
                                showNoPaymentMessage && ( 
                                    <p style={{ color: "red", fontWeight: "bold" }}>
                                        No online payment QR codes available at this moment.
                                    </p>
                                )
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
                <select name="modeOfPayment" value={formData.modeOfPayment} onChange={handleChange}>
                    <option value="online">💳 Online Payment</option>
                    <option value="onsite">🏠 Pay Onsite</option>
                </select>

                <label>Reference Number</label>
                <input
                    type="text"
                    name="referenceNumber"
                    placeholder="Enter payment reference number (if paid)"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    required={formData.modeOfPayment === "online"}
                />
                
                {showNoPaymentMessage && (
                    <p style={{ color: "red", marginTop: "10px" }}>
                        **Online payment is currently unavailable. Please select 'Pay Onsite'.**
                    </p>
                )}


                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Confirm Booking"}
                </button>

                {message && (
                    <p className={`booking-message ${message.includes("❌") ? "error" : "success"}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default BookNow;
