import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Admin Pages
import AdminLogin from './admin/pages/login';
import Dashboard from './admin/pages/dashboard';
import AdminServices from './admin/pages/service';
import ManageFeedback from './admin/pages/managefeedback';
import ContactUsView from './admin/pages/contactusview';
import AdminBookNow from './admin/pages/booknow';
import AdminAboutUs from './admin/pages/aboutus';
import AnalyticsDashboard from './admin/pages/analytics';
import PaymentsTransactions from './admin/pages/payments';

// User Pages
import UserLayout from './components/userlayout';
import UserInterface from './users/userinterface';
import AboutUs from './users/aboutus';
import Services from './users/service';
import Feedbacks from './users/feedbacks';
import FeedbackForm from './users/feedbackform';
import ContactUs from './users/contactus';
import BookNow from './users/booknow';
import PaymentConfirmation from './users/PaymentConfirmation';
import UserLogin from './users/userlogin';
import Signup from './users/signup';

// --- Helper Component for Protected Admin Routes ---
/**
 * A wrapper for admin routes that checks for login status AND admin role.
 * If not an admin, it redirects to the admin login page.
 */
const AdminRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = JSON.parse(localStorage.getItem('user'));

  // **ASSUMPTION:** The user object stored in localStorage has a 'role' property,
  // and the admin role is explicitly 'admin'. Adjust this logic based on your actual
  // user object structure and role naming.
  const isAdmin = isLoggedIn && user && user.role === 'admin';

  if (!isAdmin) {
    // Redirect to the admin login page if not logged in as admin
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};
// ----------------------------------------------------


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');

  // Load user data once and determine admin status.
  const user = JSON.parse(localStorage.getItem('user'));
  // **NOTE:** You need to ensure your AdminLogin component correctly sets the 'user' object
  // in localStorage with a 'role' property when a user logs in.
  const isAdmin = isLoggedIn && user && user.role === 'admin';


  return (
    <Router>
      <Routes>
        {/* Public Admin Login Route */}
        <Route path="/admin/login" element={<AdminLogin onLogin={() => setIsLoggedIn(true)} />} />

        {/* 🔐 Protected Admin Routes */}
        {/* The main /admin path requires the AdminRoute component for protection */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        >
          {/* Nested admin routes are now protected by the parent <Route> using <AdminRoute> */}
          <Route index element={<Navigate to="analytics" replace />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="booknow" element={<AdminBookNow />} />
          <Route path="payments" element={<PaymentsTransactions />} />
          <Route path="managefeedback" element={<ManageFeedback />} />
          <Route path="contactusview" element={<ContactUsView />} />
          <Route path="service" element={<AdminServices />} />
          <Route path="about-us-content" element={<AdminAboutUs />} />
        </Route>

        {/* User Routes (No changes needed) */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<UserInterface />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/services" element={<Services />} />
          <Route path="/feedback" element={<Feedbacks user={user} />} />
          <Route path="/create-feedback" element={<FeedbackForm user={user} />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/booknow" element={<BookNow />} />
          <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
