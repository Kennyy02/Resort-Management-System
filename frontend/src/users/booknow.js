import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./styles/booknow.css";

const BookNow = () => {
  const location = useLocation();
  const { serviceId, serviceName } = location.state || {};

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    checkInDate: "",
    checkOutDate: "",
    modeOfPayment: "",
    referenceNumber: "",
  });

  const [bookedDates, setBookedDates] = useState([]);
  const [message, setMessage] = useState("");

  // --- Fetch booked dates for selected service ---
  useEffect(() => {
    if (!serviceId) {
      console.warn("⚠️ serviceId missing — cannot fetch booked dates");
      return;
    }

    fetch(`https://booking-production-5576.up.railway.app/api/bookings/service/${serviceId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch booked dates");
        return res.json();
      })
      .then((data) => setBookedDates(data))
      .catch((err) => console.error("Error fetching booked dates:", err));
  }, [serviceId]);

  // --- Handle input changes ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Submit booking form ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`https://booking-production-5576.up.railway.app/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, serviceId, serviceName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to create booking");
        return;
      }

      setMessage("✅ Booking submitted successfully!");
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        checkInDate: "",
        checkOutDate: "",
        modeOfPayment: "",
        referenceNumber: "",
      });
    } catch (error) {
      console.error("Booking error:", error);
      setMessage("❌ Failed to submit booking. Please try again.");
    }
  };

  return (
    <div className="booknow-container">
      <h2>Book: {serviceName || "Service"}</h2>

      {message && <p className="message">{message}</p>}

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />

        <label>Check-in Date:</label>
        <input type="date" name="checkInDate" value={formData.checkInDate} onChange={handleChange} required />

        <label>Check-out Date:</label>
        <input type="date" name="checkOutDate" value={formData.checkOutDate} onChange={handleChange} required />

        <label>Mode of Payment:</label>
        <select name="modeOfPayment" value={formData.modeOfPayment} onChange={handleChange} required>
          <option value="">Select</option>
          <option value="GCash">GCash</option>
          <option value="Cash">Cash</option>
        </select>

        {formData.modeOfPayment === "GCash" && (
          <div className="gcash-section">
            <p>Send payment to GCash number: <strong>09XXXXXXXXX</strong></p>
            <input
              name="referenceNumber"
              placeholder="Enter GCash Reference Number"
              value={formData.referenceNumber}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <button type="submit">Submit Booking</button>
      </form>
    </div>
  );
};

export default BookNow;
