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
  
  // FIX: Access serviceId and serviceName directly from location.state
  // Use a default service ID (e.g., 1) and name (e.g., 'Unknown Service')
  // if the state is missing, but this should be caught during navigation.
  const serviceId = location.state?.serviceId; 
  const serviceName = location.state?.serviceName || 'Unknown Service'; 
  const servicePrice = location.state?.servicePrice; // Used for display/debugging

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
  const [isLoading, setIsLoading] = useState(true);  // Combined loading state

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
        // If serviceId is missing, something went wrong in the navigation logic
        setMessage("❌ Error: Service details are missing. Please return to Services page.");
        setIsLoading(false);
        return; 
    }

    // 3. Auto-fill user data
    const fallbackName = user.email ? user.email.split("@")[0] : "";
    setFormData((prev) => ({
      ...prev,
      name: user.fullname || fallbackName,
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

  }, [navigate, serviceId]); // Added serviceId to dependencies

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
    
    // Ensure all data is present before submission
    if (!user || !serviceId || !serviceName) {
        setMessage("❌ Critical booking data missing. Please refresh and try again.");
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
    if (formData.checkInDate >= formData.checkOutDate) {
      setMessage("❌ Check-out date must be after check-in date.");
      setIsSubmitting(false);
      return;
    }

    try {
      // FIX: Explicitly include serviceId and serviceName in the payload
      const bookingData = { 
          userId: user.id, 
          serviceId: serviceId, // Ensure this non-form field is included
          serviceName: serviceName, // Ensure this non-form field is included
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
          // Log the exact error from the API for better debugging
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
  
  // If serviceId is null after loading, show error message instead of form
  if (!serviceId) {
    return <div className="booking-container"><h2 className="error-title">Booking Error</h2><p className="error-text">{message}</p></div>;
  }

  return (
    <div className="booking-container">
      <h2 className="booking-title">Book Now: {serviceName}</h2>
      
      {/* ... (rest of the form remains the same) */}
      
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

        {message && <p className={`booking-message ${message.includes('❌') ? 'error' : 'success'}`}>{message}</p>}
      </form>
    </div>
  );
};
export default BookNow;
