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

        <div className="sidebar-nav">
          <div
            className={isActive("/admin/booknow") ? "nav-link active-link" : "nav-link"}
            onClick={() => navigate("/admin/booknow")}
          >
            📅 Manage Bookings
          </div>
          {/* Removed Payment Transactions */}
          <div
            className={isActive("/admin/managefeedback") ? "nav-link active-link" : "nav-link"}
            onClick={() => navigate("/admin/managefeedback")}
          >
            💬 Manage Feedbacks
          </div>
          <div
            className={isActive("/admin/contactusview") ? "nav-link active-link" : "nav-link"}
            onClick={() => navigate("/admin/contactusview")}
          >
            📨 View Messages
          </div>
          <div
            className={isActive("/admin/analytics") ? "nav-link active-link" : "nav-link"}
            onClick={() => navigate("/admin/analytics")}
          >
            📊 Resort Analytics
          </div>
          <div
            className={isActive("/admin/service") ? "nav-link active-link" : "nav-link"}
            onClick={() => navigate("/admin/service")}
          >
            🖥️ Manage Services
          </div>
          <div
            className={isActive("/admin/about-us-content") ? "nav-link active-link" : "nav-link"}
            onClick={() => navigate("/admin/about-us-content")}
          >
            📝 Manage About Us
          </div>
        </div>

        <div className="sidebar-footer">
          <div
            className="logout-link"
            onClick={() => {
              localStorage.removeItem("isLoggedIn");
              navigate("/admin/login");
            }}
          >
            Logout
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
