import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import logo from "./pictures/logo.jpg";
import "./layout.css";

const UserLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const SCROLL_THRESHOLD = 100;

    const handleScroll = () => {
      const scrolled = window.scrollY > SCROLL_THRESHOLD;
      setIsScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, [location]);

  useEffect(() => {
    const handleStorageChange = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="app-container">
      <header className={`app-header ${isScrolled ? "scrolled" : ""}`}>
        <Link to="/" className="logo-link">
          <img
            src={logo}
            className="app-logo"
            alt="EM'z Bayview Mountain Resort Logo"
          />
          <span className="resort-name">Emz Bayview Mountain</span>
        </Link>

        <nav className={`app-nav ${isMenuOpen ? "is-open" : ""}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link
            to="/about-us"
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            About Us
          </Link>
          <Link
            to="/services"
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Services
          </Link>
          <Link
            to="/feedback"
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Feedbacks
          </Link>
          <Link
            to="/contactus"
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact Us
          </Link>

          {isLoggedIn ? (
            <button className="nav-link logout-btn" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </nav>

        <button
          className="hamburger-menu"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </button>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="footer-content-wrapper">
          <div className="footer-column branding-and-contact">
            <Link to="/" className="logo-link footer-logo-link">
              <img
                src={logo}
                className="app-logo footer-logo"
                alt="EM'z Bayview Mountain Resort Logo"
              />
              <span className="resort-name footer-resort-name">Emz Bayview Mountain</span>
            </Link>

            <div className="contact-info">
              <p>📍 <strong>Address</strong></p>
              <address>Dacutan, Balatasan, Bulalacao Oriental Mindoro, Bulalacao, Philippines, 5214</address>
              <p>📞 <strong>Contact Number</strong></p>
              <p>0919 003 3771</p>
            </div>
          </div>

          <div className="footer-column newsletter-section">
            <h4>Join Our Newsletter</h4>
            <p className="newsletter-text">Stay updated on our latest rooms and island tour packages.</p>
            <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert("Subscribed!"); }}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit" className="subscribe-btn">Subscribe</button>
            </form>
            <p className="footer-legal-mini">
              By subscribing you agree to our policies.
            </p>
          </div>

          <div className="footer-column site-links">
            <h4>Quick Links</h4>
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/about-us" className="footer-link">About Us</Link>
            <Link to="/services" className="footer-link">Services</Link>
            <Link to="/feedback" className="footer-link">Feedbacks</Link>
            <Link to="/contactus" className="footer-link">Contact Us</Link>
          </div>

          <div className="footer-column follow-us">
            <h4>Follow Us</h4>
            <a 
              href="https://web.facebook.com/emzbayviewresort" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-link"
            >
              <i className="fab fa-facebook"></i> Facebook
            </a>
            <a href="#" className="social-link"><i className="fab fa-instagram"></i> Instagram</a>
            <a href="#" className="social-link"><i className="fab fa-twitter"></i> Twitter</a>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="copyright-text">© 2025 EM'z Bayview Mountain Resort. All rights reserved.</p>
          <div className="legal-links">
            <Link to="/privacy-policy" className="legal-link">Privacy Policy</Link>
            <Link to="/terms-of-service" className="legal-link">Terms of Service</Link>
            <button className="legal-link" onClick={() => console.log('Open Cookie Settings')}>Cookies Settings</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserLayout;
