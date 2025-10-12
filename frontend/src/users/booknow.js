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
  
  const serviceId = location.state?.serviceId; 
  const serviceName = location.state?.serviceName || 'Unknown Service'; 
  const servicePrice = location.state?.servicePrice;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Initial Checks and Data Fetching ---
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const user = JSON.parse(localStorage.getItem("user"));

    // 1. Authentication Check
    if (!loggedIn || !user) {
      navigate("/login", {
        state: { from: "/booknow", message: "Please sign in to continue booking." },
      });
      return; 
    }

    // 2. Service ID Check (CRITICAL)
    if (!serviceId) {
        setMessage("❌ Error: Service details are missing. Please return to Services page.");
        setIsLoading(false);
        return; 
    }

    // 3. Auto-fill user data (FIX: Generate user-friendly name)
    let userFullName = user.fullname;
    if (!userFullName && user.email) {
        // Creates a friendly name (e.g., "john.doe@gmail.com" -> "John Doe")
        const emailPrefix = user.email.split("@")[0];
        userFullName = emailPrefix.replace(/[^a-zA-Z.]/g, ' ').split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ').trim();
    }
    
    setFormData((prev) => ({
      ...prev,
      name: userFullName || "Guest", // Fallback to "Guest"
      email: user.email || "",
      phoneNumber: user.phone || "",
    }));
    
    setIsLoading(false); 

    // 4. Fetch booked dates for the service
    fetch(`${BOOKING_API_URL}/api/bookings/service/${serviceId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => setBookedDates(data))
      .catch((err) => {
        console.error("Error fetching booked dates:", err);
      });

  }, [navigate, serviceId]);

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
    
    // Check for critical missing data (especially name and phone number which are required by backend)
    if (!user || !serviceId || !serviceName || !formData.name || !formData.phoneNumber) {
        setMessage("❌ Critical booking data missing. Ensure name and phone number are present.");
        setIsSubmitting(false);
        if (!user) navigate("/login");
        return;
    }

    // Basic Form Validation 
    if (isDateBooked(formData.checkInDate)) {
      setMessage("❌ Check-in date is already booked.");
      setIsSubmitting(false);
      return;
    }
    
    // FIX: Allow check-in and check-out to be EQUAL (same-day stay)
    if (formData.checkInDate > formData.checkOutDate) { 
      setMessage("❌ Check-out date must be the same as or after check-in date.");
      setIsSubmitting(false);
      return;
    }

    try {
      // FIX: Ensure all fields the backend requires are included in the payload
      const bookingData = { 
          // The backend does not explicitly require userId, but we send it for safety
          userId: user.id, 
          serviceId: serviceId,
          serviceName: serviceName,
          ...formData 
      };
      
      console.log("📤 Submitting booking data:", bookingData);
      
      const res = await fetch(`${BOOKING_API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      
      if (!res.ok) {
          console.error("API Error Response:", data); 
          throw new Error(data.error || `Booking failed with status ${res.status}`);
      }
      
      setMessage(`✅ Booking successful! Your status is: ${data.status || 'Pending'}`);
      setTimeout(() => navigate("/"), 1500); 

    } catch (err) {
      console.error(err);
      setMessage(`❌ Booking failed: ${err.message || "Server error. Please try again."}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading booking form...</div>
  }
  
  if (!serviceId) {
    return <div className="booking-container"><h2 className="error-title">Booking Error</h2><p className="error-text">{message}</p></div>;
  }

  return (
    <div className="booking-container">
      <h2 className="booking-title">Book Now: {serviceName}</h2>
      
      <form className="booking-form" onSubmit={handleSubmit}>
        
        {/* Name (Auto-filled & Disabled) - Visible and User-Friendly */}
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          disabled
        />

        {/* Email (Auto-filled & Disabled) */}
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          disabled
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
          // Allows same-day check-out
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

        {message && <p className={`booking-message ${message.includes('❌') ? 'error' : 'success'}`}>{message}</p>}
      </form>
    </div>
  );
};

export default BookNow;
