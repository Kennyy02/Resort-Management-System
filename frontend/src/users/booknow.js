import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './styles/booknow.css'; 

// Define API URL using environment variable (for production) or localhost (for development)
const BOOKING_API_URL = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_BOOKING_API_URL
    : 'http://localhost:5003';

const BookNow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { serviceId, serviceName } = location.state || {};

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    checkInDate: "",
    checkOutDate: "",
    modeOfPayment: "online",
  });

  const [bookedDates, setBookedDates] = useState([]);
  const [message, setMessage] = useState("");

  // Auto-fill logged-in user details
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!loggedIn || !user) {
      navigate("/login", {
        state: { from: "/booknow", message: "Please sign in to continue booking." },
      });
    } else {
      // derive a fallback name from email if fullname is missing
      const fallbackName = user.email ? user.email.split("@")[0] : "";

      setFormData((prev) => ({
        ...prev,
        name: user.fullname || fallbackName,
        email: user.email || "",
        phoneNumber: user.phone || "",
      }));
    }
  }, [navigate]);

  // Fetch already booked dates for the service
  useEffect(() => {
    if (serviceId) {
      // *** USING BOOKING_API_URL VARIABLE ***
      fetch(`${BOOKING_API_URL}/api/bookings/service/${serviceId}`)
        .then((res) => res.json())
        .then((data) => setBookedDates(data))
        .catch((err) => console.error("Error fetching booked dates:", err));
    }
  }, [serviceId]);

  const isDateBooked = (date) => bookedDates.includes(date);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return navigate("/login");

    try {
      const bookingData = { userId: user.id, serviceId, serviceName, ...formData };
      console.log("📤 Submitting booking data:", bookingData);

      // *** USING BOOKING_API_URL VARIABLE ***
      const res = await fetch(`${BOOKING_API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      setMessage(data.message || data.error);

      if (res.ok) setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error(err);
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="booking-container">
      <h2 className="booking-title">Book Now: {serviceName}</h2>

      <form className="booking-form" onSubmit={handleSubmit}>
        {/* Name */}
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          disabled
          placeholder="Name will appear here automatically"
        />

        {/* Email */}
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          disabled
          placeholder="Your email address"
        />

        {/* Phone number */}
        <label htmlFor="phoneNumber">Phone Number</label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
          placeholder="Your phone number"
        />

        {/* Check-in date */}
        <label htmlFor="checkInDate">Check-In Date</label>
        <input
          type="date"
          id="checkInDate"
          name="checkInDate"
          value={formData.checkInDate}
          onChange={handleChange}
          required
          min={new Date().toISOString().split("T")[0]}
        />
        {isDateBooked(formData.checkInDate) && (
          <p className="error-text">❌ This date is already booked.</p>
        )}

        {/* Check-out date */}
        <label htmlFor="checkOutDate">Check-Out Date</label>
        <input
          type="date"
          id="checkOutDate"
          name="checkOutDate"
          value={formData.checkOutDate}
          onChange={handleChange}
          required
          min={formData.checkInDate || new Date().toISOString().split("T")[0]}
        />

        {/* Mode of payment */}
        <label>Mode of Payment</label>
        <select
          name="modeOfPayment"
          value={formData.modeOfPayment}
          onChange={handleChange}
        >
          <option value="online">💳 Online Payment</option>
          <option value="onsite">🏠 Pay Onsite</option>
        </select>

        {/* Submit button */}
        <button type="submit" className="btn-primary">
          Confirm Booking
        </button>

        {message && <p className="booking-message">{message}</p>}
      </form>
    </div>
  );
};

export default BookNow;
