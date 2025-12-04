import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './styles/booknow.css';

// API URLs
const BOOKING_API_URL = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_BOOKING_API_URL
    : 'http://localhost:5003';

const BookNow = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const serviceId = location.state?.serviceId; 
  const serviceName = location.state?.serviceName || 'Unknown Service';

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
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(true); // Always show
  const [paymentQR, setPaymentQR] = useState({ gcash: "", bank: "" });

  const user = JSON.parse(localStorage.getItem("user"));
  const isPhoneNumberDisabled = user && user.phone;

  // Fetch initial data
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!loggedIn || !user) {
      navigate("/login", {
        state: { from: "/booknow", message: "Please sign in to continue booking." },
      });
      return; 
    }

    if (!serviceId) {
      setMessage("❌ Error: Service details are missing. Please return to Services page.");
      setIsLoading(false);
      return;
    }

    // Auto-fill user info
    let userFullName = user.fullname;
    let userEmail = user.email || "";
    let userPhone = user.phone || "";
    
    if (!userFullName && userEmail) {
        const emailPrefix = userEmail.split("@")[0];
        userFullName = emailPrefix.replace(/[^a-zA-Z.]/g, ' ').split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ').trim();
    }

    userFullName = userFullName || userEmail || "Guest User";

    setFormData((prev) => ({
      ...prev,
      name: userFullName,
      email: userEmail,
      phoneNumber: userPhone,
    }));

    setIsLoading(false);

    // Fetch booked dates
    fetch(`${BOOKING_API_URL}/api/bookings/service/${serviceId}`)
      .then(res => res.json())
      .then(data => setBookedDates(data))
      .catch(err => console.error("Error fetching booked dates:", err));

    // Fetch Payment QR codes
    fetch(`${BOOKING_API_URL}/api/payment-qr`)
      .then(res => res.json())
      .then(data => {
        setPaymentQR({
          gcash: data.gcashQR || "",
          bank: data.bankQR || "",
        });
      })
      .catch(err => console.error("Payment QR fetch error:", err));

  }, [navigate, serviceId]);

  const isDateBooked = (date) => bookedDates.includes(date);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const bookingData = { 
      userId: user.id,
      serviceId,
      serviceName,
      ...formData
    };

    if (isDateBooked(bookingData.checkInDate)) {
      setMessage("❌ Check-in date is already booked.");
      setIsSubmitting(false);
      return;
    }

    if (bookingData.checkInDate > bookingData.checkOutDate) { 
      setMessage("❌ Check-out date must be the same as or after check-in date.");
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
        const missing = data.missing ? ` (Missing: ${data.missing.join(', ')})` : '';
        setMessage(`❌ Booking failed: ${data.error + missing || 'Server error'}`);
        throw new Error(data.error + missing || `Booking failed`);
      }

      setMessage(`✅ Booking successful! Status: ${data.status || 'Pending'}`);
      setTimeout(() => navigate("/"), 1500);

    } catch (err) {
      console.error(err);
      setMessage(`❌ Booking failed: ${err.message || "Server error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="loading-container">Loading booking form...</div>;
  if (!serviceId) return <div className="booking-container"><h2 className="error-title">Booking Error</h2><p className="error-text">{message}</p></div>;

  return (
    <div className="booking-container">
      <h2 className="booking-title">Book Now: {serviceName}</h2>
      
      <form className="booking-form" onSubmit={handleSubmit}>
        <label htmlFor="name">Full Name</label>
        <input type="text" id="name" name="name" value={formData.name} disabled />

        <label htmlFor="email">Email Address</label>
        <input type="email" id="email" name="email" value={formData.email} disabled />

        <label htmlFor="phoneNumber">Phone Number</label>
        <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required placeholder="Enter phone number" disabled={isPhoneNumberDisabled} />

        <label htmlFor="checkInDate">Check-In Date</label>
        <input type="date" id="checkInDate" name="checkInDate" value={formData.checkInDate} onChange={handleChange} required min={new Date().toISOString().split("T")[0]} />
        {isDateBooked(formData.checkInDate) && <p className="error-text">❌ This date is already booked.</p>}

        <label htmlFor="checkOutDate">Check-Out Date</label>
        <input type="date" id="checkOutDate" name="checkOutDate" value={formData.checkOutDate} onChange={handleChange} required min={formData.checkInDate || new Date().toISOString().split("T")[0]} />

        <label>Mode of Payment</label>
        <select name="modeOfPayment" value={formData.modeOfPayment} onChange={handleChange} required>
          <option value="online">💳 Online Payment</option>
          <option value="onsite">🏠 Pay Onsite</option>
        </select>

        <label htmlFor="referenceNumber">Reference Number</label>
        <input type="text" id="referenceNumber" name="referenceNumber" placeholder="Enter payment reference number" value={formData.referenceNumber} onChange={handleChange} required />

        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Confirm Booking'}</button>

        {message && <p className={`booking-message ${message.includes('❌') ? 'error' : 'success'}`}>{message}</p>}
      </form>

      {/* Payment QR Modal */}
      {showPaymentModal && (
        <div className="payment-modal">
          <div className="payment-modal-content">
            <button className="close-btn" onClick={() => setShowPaymentModal(false)}>✖</button>
            <h3>Payment QR Codes (15% required)</h3>
            <div className="qr-section">
              {paymentQR.gcash && (
                <div className="qr-box">
                  <h4>GCash</h4>
                  <img src={paymentQR.gcash} alt="GCash QR" />
                </div>
              )}
              {paymentQR.bank && (
                <div className="qr-box">
                  <h4>Bank Transfer</h4>
                  <img src={paymentQR.bank} alt="Bank QR" />
                </div>
              )}
            </div>
            <p className="qr-note">Please scan and pay 15%, then enter the reference number in the form above.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookNow;
