import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './styles/booknow.css'; // RESTORING ORIGINAL CSS IMPORT

// Define API URL using environment variable (for production) or localhost (for development)
const BOOKING_API_URL = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_BOOKING_API_URL
    : 'http://localhost:5003';

const BookNow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Check if location.state exists before destructuring
  const serviceId = location.state?.serviceId || '1'; // Default service ID
  const serviceName = location.state?.serviceName || 'Couple Room'; // Default service Name

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    checkInDate: "",
    checkOutDate: "",
    modeOfPayment: "online", // Reverting default payment mode to original
  });

  const [bookedDates, setBookedDates] = useState([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 


  // Auto-fill logged-in user details & Authentication check
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!loggedIn || !user) {
      navigate("/login", {
        state: { from: "/booknow", message: "Please sign in to continue booking." },
      });
      return; // Stop execution if not logged in
    }

    // Derive a fallback name from email if fullname is missing
    const fallbackName = user.email ? user.email.split("@")[0] : "";

    setFormData((prev) => ({
      ...prev,
      name: user.fullname || fallbackName,
      email: user.email || "",
      phoneNumber: user.phone || "",
    }));
    setIsLoading(false); // Authentication check passed

  }, [navigate]);

  // Fetch already booked dates for the service
  useEffect(() => {
    if (serviceId) {
      // This request is critical and will now use the correct URL after deployment
      fetch(`${BOOKING_API_URL}/api/bookings/service/${serviceId}`)
        .then((res) => {
          // Check for 404/500 to prevent JSON parsing errors
          if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => setBookedDates(data))
        .catch((err) => {
          console.error("Error fetching booked dates (expected if API is down):", err);
          // Don't block the form if booked dates fail to load
        });
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
    setIsSubmitting(true);

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      setIsSubmitting(false);
      return navigate("/login");
    }

    // Basic Form Validation (retained from previous fixes)
    if (isDateBooked(formData.checkInDate)) {
      setMessage("❌ Check-in date is already booked.");
      setIsSubmitting(false);
      return;
    }
    if (formData.checkInDate >= formData.checkOutDate) {
      setMessage("❌ Check-out date must be after check-in date.");
      setIsSubmitting(false);
      return;
    }

    try {
      const bookingData = { userId: user.id, serviceId, serviceName, ...formData };
      console.log("📤 Submitting booking data:", bookingData);

      const res = await fetch(`${BOOKING_API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      // Reverting message handling to original simplicity
      setMessage(data.message || data.error); 

      if (res.ok) setTimeout(() => navigate("/"), 1500); // Reverting delay
    } catch (err) {
      console.error(err);
      setMessage("Server error. Please try again."); // Reverting message
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading user data...</div>
  }

  return (
    <div className="booking-container">
      <h2 className="booking-title">Book Now: {serviceName}</h2>

      <form className="booking-form" onSubmit={handleSubmit}>
        {/* Name (Auto-filled & Disabled) - PLACEHOLDER REMOVED */}
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          disabled
          // Placeholder removed so the user's name shows up automatically
        />

        {/* Email (Auto-filled & Disabled) - PLACEHOLDER REMOVED */}
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          disabled
          // Placeholder removed so the user's email shows up automatically
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
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Confirm Booking'}
        </button>

        {message && <p className="booking-message">{message}</p>}
      </form>
    </div>
  );
};

export default BookNow;
