import React, { useState } from "react";
import "./styles/signup.css";
import background1 from "../components/pictures/backgound1.jpg";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    consent: false,
  });
  const [message, setMessage] = useState("");

  const { name, phone, password, confirmPassword, consent } = formData;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validatePassword = (pwd) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validations
    if (!name || !phone || !password) {
      setMessage("All fields are required.");
      return;
    }

    if (!validatePassword(password)) {
      setMessage(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!consent) {
      setMessage("You must agree to the Terms and Privacy Policy.");
      return;
    }

    // Debug log before sending fetch
    console.log("Submitting signup data:", { name, phone, password });

    try {
      await fetch(`${process.env.REACT_APP_USER_API}/signup`, { ... });
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });

      const data = await res.json();
      setMessage(data.message || data.error);

      if (res.ok) {
        setFormData({
          name: "",
          phone: "",
          password: "",
          confirmPassword: "",
          consent: false,
        });
      }
    } catch (err) {
      console.error("Signup fetch error:", err);
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div
      className="signup-container"
      style={{ backgroundImage: `url(${background1})` }}
    >
      <div className="signup-box">
        <h2 className="signup-title">Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              required
              className="form-input"
            />
            <small className="password-hint">
              Must be 8+ characters, include uppercase, lowercase, number, and
              special character.
            </small>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group consent">
            <input
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={handleChange}
              required
              className="consent-checkbox"
            />
            <p className="consent-text">
              I agree to the <a href="/terms">Terms & Conditions</a> and{" "}
              <a href="/privacy">Privacy Policy</a>
            </p>
          </div>

          <button type="submit" className="btn-submit">
            Register
          </button>

          {message && (
            <p
              className={`form-message ${
                message.toLowerCase().includes("success") ? "success" : "error"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Signup;
