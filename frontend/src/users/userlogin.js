// UserLogin.js
import React, { useState } from "react";
import "./styles/userlogin.css";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import background1 from "../components/pictures/backgound1.jpg";
import Modal from "./modal";

const UserLogin = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!consent) return setMessage("You must agree to the Terms and Privacy Policy.");

    try {
      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone, password }), // <-- FIXED HERE
      });

      const data = await res.json();
      setMessage(data.message || data.error);

      if (res.ok) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate(location.state?.from || "/");
      }
    } catch {
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: `url(${background1})` }}>
      <div className="overlay" />
      <div className="login-box">
        <h2>Welcome!</h2>
        <p>Sign in to continue</p>
        {location.state?.message && <p className="login-warning">{location.state.message}</p>}

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="login-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I agree to the{" "}
              <span className="modal-link" onClick={() => setShowTerms(true)}>
                Terms & Conditions
              </span>{" "}
              and{" "}
              <span className="modal-link" onClick={() => setShowPrivacy(true)}>
                Privacy Policy
              </span>
            </span>
          </div>

          <button type="submit" className="btn-primary">Sign In</button>
          {message && <p className="login-message">{message}</p>}
        </form>

        <p className="or-divider">OR</p>

        <div className="btn-google">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const res = await fetch("http://localhost:4000/google-login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: credentialResponse.credential }),
                });

                const data = await res.json();
                if (res.ok) {
                  localStorage.removeItem("user");
                  localStorage.setItem("isLoggedIn", "true");
                  localStorage.setItem("user", JSON.stringify(data.user));
                  navigate("/");
                } else {
                  setMessage(data.error || "Google login failed");
                }
              } catch (error) {
                console.error("Google login fetch error:", error);
                setMessage("Google login failed.");
              }
            }}
            onError={() => setMessage("Google Sign-In failed.")}
          />
        </div>

        <p className="signup-text">
          Don’t have an account?{" "}
          <button onClick={() => navigate("/signup")}>Create account</button>
        </p>
      </div>

      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms and Conditions">
        <p>
          By accessing and using this platform, you agree to be bound by the following Terms and Conditions.
          These rules are designed to protect both users and the service provider, and to comply with the{" "}
          <strong>Data Privacy Act of 2012 (RA 10173)</strong>.
        </p>
        <h2>1. Account Registration</h2>
        <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>
        <h2>2. Acceptable Use</h2>
        <p>You agree not to misuse the platform, including attempting to disrupt services, gain unauthorized access, or use the system for fraudulent purposes.</p>
        <h2>3. Intellectual Property</h2>
        <p>All content, trademarks, and logos remain the property of EM’z Bayview Mountain Resort and may not be used without permission.</p>
        <h2>4. Limitation of Liability</h2>
        <p>We are not responsible for damages arising from service interruptions, data loss, or unauthorized access beyond our reasonable control.</p>
        <h2>5. Termination</h2>
        <p>We reserve the right to suspend or terminate your account if you violate these Terms.</p>
        <h2>6. Changes to Terms</h2>
        <p>We may revise these Terms periodically. Continued use of the platform after updates means you accept the revised Terms.</p>
      </Modal>

      <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy">
        <p>
          This Privacy Policy explains how EM’z Bayview Mountain Resort collects, uses, and protects your personal information. 
          We comply with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>.
        </p>
        <h2>1. Information We Collect</h2>
        <ul>
          <li>Personal details (name, phone number, email, and password)</li>
          <li>Booking and feedback history</li>
          <li>Technical information such as IP address and device data</li>
        </ul>
        <h2>2. How We Use Your Data</h2>
        <p>Your information is used to create accounts, process bookings, personalize services, and improve system features.</p>
        <h2>3. Sharing of Data</h2>
        <p>We do not sell or share your personal data with third parties except when required by law or with your explicit consent.</p>
        <h2>4. Data Retention</h2>
        <p>We retain your personal data only for as long as necessary to provide services or as required by law. Once no longer needed, data will be securely deleted.</p>
        <h2>5. Data Security</h2>
        <p>We use encryption, firewalls, and access controls to protect your data. However, no system is 100% secure, and we cannot guarantee absolute protection.</p>
        <h2>6. Your Rights</h2>
        <p>You have the right to access, update, and request deletion of your data. You may also withdraw consent at any time by contacting us.</p>
        <h2>7. Policy Updates</h2>
        <p>We may update this Privacy Policy from time to time. We encourage you to review it periodically.</p>
      </Modal>
    </div>
  );
};

export default UserLogin;
