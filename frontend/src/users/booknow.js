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
  
  // Determine if the phone number field should be disabled (i.e., if user.phone already exists)
  const user = JSON.parse(localStorage.getItem("user"));
  const isPhoneNumberDisabled = user && user.phone;

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

    // 2. Service ID Check
    if (!serviceId) {
        setMessage("❌ Error: Service details are missing. Please return to Services page.");
        setIsLoading(false);
        return; 
    }

    // 3. Auto-fill user data (CRITICAL FIX: Ensure name/email are non-empty)
    let userFullName = user.fullname;
    let userEmail = user.email || "";
    let userPhone = user.phone || "";
    
    // Fallback logic for Full Name if 'fullname' is missing
    if (!userFullName && userEmail) {
        // Creates a friendly name from email (e.g., "john.doe@gmail.com" -> "John Doe")
        const emailPrefix = userEmail.split("@")[0];
        userFullName = emailPrefix.replace(/[^a-zA-Z.]/g, ' ').split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ').trim();
    }
    
    // Ensure name is never empty string by falling back to email or a default
    userFullName = userFullName || userEmail || "Guest User";

    // Set the state with the user's data. This ensures the form is not submitted with blank fields.
    setFormData((prev) => ({
      ...prev,
      // GUARANTEED non-empty fields:
      name: userFullName, 
      email: userEmail, 
      phoneNumber: userPhone, 
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

  }, [navigate, serviceId]); // Dependency array

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
    
    const bookingData = { 
        userId: user.id, // For tracking
        serviceId: serviceId,
        serviceName: serviceName,
        ...formData 
    };

    // Basic Form Validation 
    if (isDateBooked(bookingData.checkInDate)) {
      setMessage("❌ Check-in date is already booked.");
      setIsSubmitting(false);
      return;
    }
    
    // FIX: Allow check-in and check-out to be EQUAL (same-day stay)
    if (bookingData.checkInDate > bookingData.checkOutDate) { 
      setMessage("❌ Check-out date must be the same as or after check-in date.");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("📤 Submitting booking data:", bookingData);
      
      const res = await fetch(`${BOOKING_API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      
      if (!res.ok) {
          // The backend will now return 'missing' fields in the error response
          const missing = data.missing ? ` (Missing: ${data.missing.join(', ')})` : '';
          console.error("API Error Response:", data); 
          // If name or email are missing, this will show the user a specific message
          if (data.missing && (data.missing.includes('name') || data.missing.includes('email'))) {
              setMessage(`❌ Critical User Data Missing. Please sign out and sign in again.`);
          } else {
              setMessage(`❌ Booking failed: ${data.error + missing || 'Server error. Please try again.'}`); 
          }
          throw new Error(data.error + missing || `Booking failed with status ${res.status}`);
      }
      
      setMessage(`✅ Booking successful! Your status is: ${data.status || 'Pending'}`);
      setTimeout(() => navigate("/"), 1500); 

    } catch (err) {
      console.error(err);
      // Catch the thrown error message
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
        
        {/* Name (Auto-filled & Disabled) */}
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

        {/* Phone number (CRITICAL: Required if not pre-filled) */}
        <label htmlFor="phoneNumber">Phone Number</label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          required 
          placeholder="Enter your phone number"
          disabled={isPhoneNumberDisabled} // Disable if phone number already exists on the user profile
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
          required
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
