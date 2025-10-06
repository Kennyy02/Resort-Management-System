// UserLayout.js
import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import logo from "./pictures/logo.jpg";
import "./layout.css";

const UserLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Re-check login state on mount + whenever location changes
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, [location]);

  // ✅ Update state if localStorage changes (multi-tab support)
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
      <header className="app-header">
        <Link to="/" className="logo-link">
          <img
            src={logo}
            className="app-logo"
            alt="EM'z Bayview Mountain Resort Logo"
          />
        </Link>

        {/* Desktop Navigation */}
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

          {/* ✅ Conditionally show Login OR Logout */}
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

        {/* Hamburger Menu Icon for Mobile */}
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
        <p>© 2025 EM'z Bayview Mountain Resort</p>
      </footer>
    </div>
  );
};

export default UserLayout;
