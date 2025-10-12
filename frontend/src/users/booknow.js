import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// Removed: import './styles/booknow.css'; to resolve the compilation error.

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
    modeOfPayment: "onsite", // Updated default to 'onsite'
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
      const bookingData = { userId: user.id, serviceId, serviceName, ...formData };
      console.log("📤 Submitting booking data:", bookingData);

      const res = await fetch(`${BOOKING_API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      setMessage(res.ok ? `✅ ${data.message || 'Booking successful!'}` : `❌ ${data.error || 'Booking failed.'}`);

      if (res.ok) setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-600">Loading user data...</div>
  }

  return (
    <div className="booking-container p-4 sm:p-8 max-w-lg mx-auto bg-white shadow-xl rounded-xl my-8">
      <h2 className="booking-title text-2xl font-bold text-center mb-6 text-indigo-700">Book Now: {serviceName}</h2>

      <form className="booking-form space-y-4" onSubmit={handleSubmit}>
        {/* Name (Auto-filled & Disabled) */}
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          disabled
          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          placeholder="Registered name (Read Only)"
        />

        {/* Email (Auto-filled & Disabled) */}
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          disabled
          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          placeholder="Registered email (Read Only)"
        />

        {/* Phone number */}
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Your phone number"
        />

        {/* Check-in date */}
        <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700">Check-In Date</label>
        <input
          type="date"
          id="checkInDate"
          name="checkInDate"
          value={formData.checkInDate}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          min={new Date().toISOString().split("T")[0]}
        />
        {isDateBooked(formData.checkInDate) && (
          <p className="error-text text-red-500 text-sm mt-1">❌ This date is already booked.</p>
        )}

        {/* Check-out date */}
        <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700">Check-Out Date</label>
        <input
          type="date"
          id="checkOutDate"
          name="checkOutDate"
          value={formData.checkOutDate}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          min={formData.checkInDate || new Date().toISOString().split("T")[0]}
        />

        {/* Mode of payment */}
        <label className="block text-sm font-medium text-gray-700">Mode of Payment</label>
        <select
          name="modeOfPayment"
          value={formData.modeOfPayment}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="online">💳 Online Payment (Pre-paid)</option>
          <option value="onsite">🏠 Pay Onsite (Upon Arrival)</option>
        </select>

        {/* Submit button */}
        <button type="submit" className="w-full mt-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-300" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Confirm Booking'}
        </button>

        {message && <p className={`booking-message mt-4 p-3 rounded-lg text-center ${message.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</p>}
      </form>
    </div>
  );
};

export default BookNow;
