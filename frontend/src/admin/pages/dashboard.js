import React from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">EMz Admin Panel</h1>
        </div>

        <div className="sidebar-nav-cards">
          <div className={`card ${isActive("/admin/booknow") ? "active-card" : ""}`} onClick={() => navigate("/admin/booknow")}>📅 Manage Bookings</div>
          <div className={`card ${isActive("/admin/payments") ? "active-card" : ""}`} onClick={() => navigate("/admin/payments")}>💳 Payment Transactions</div>
          <div className={`card ${isActive("/admin/managefeedback") ? "active-card" : ""}`} onClick={() => navigate("/admin/managefeedback")}>💬 Manage Feedbacks</div>
          <div className={`card ${isActive("/admin/contactusview") ? "active-card" : ""}`} onClick={() => navigate("/admin/contactusview")}>📨 View Messages</div>
          <div className={`card ${isActive("/admin/analytics") ? "active-card" : ""}`} onClick={() => navigate("/admin/analytics")}>📊 Resort Analytics</div>
          <div className={`card ${isActive("/admin/service") ? "active-card" : ""}`} onClick={() => navigate("/admin/service")}>🖥️ Manage Services</div>
          <div className={`card ${isActive("/admin/about-us-content") ? "active-card" : ""}`} onClick={() => navigate("/admin/about-us-content")}>📝 Manage About Us</div>
        </div>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={() => {
            localStorage.removeItem('isLoggedIn');
            navigate("/admin/login");
          }}>Logout</button>
        </div>
      </div>

      <div className="dashboard-main">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
