import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const AdminLogin = ({ onLogin }) => { // Note the prop destructuring here
  const [staffId, setStaffId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);

  // const navigate = useNavigate(); // We don't strictly need this now

  const handleSubmit = async (e) => {
    e.preventDefault(); // Keep this for standard form handling

    try {
      const res = await fetch(`${process.env.REACT_APP_ADMIN_API}/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Backend returned 200 OK. Save data and redirect.
        localStorage.setItem('isLoggedIn', 'true');
        // Ensure the server response includes 'admin' data with a 'role' property!
        localStorage.setItem('user', JSON.stringify({ ...data.admin, role: data.role }));
        
        // Call the parent handler (if needed for App.js state):
        if (onLogin) onLogin();
        
        console.log('Login successful, forcing hard redirect...');
        
        // FINAL FIX: FORCING BROWSER NAVIGATION
        window.location.href = '/admin/analytics'; 
        
      } else {
        setMessage(data.error || 'Login failed'); 
      }
    } catch (error) {
      console.error('Error during login:', error);
      setMessage('Network error or server not available');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Admin Login</h2>

        {message && (
          <p className={`login-message ${message.toLowerCase().includes('success') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}

        {/* NOTE: Reverting form structure to original and using onSubmit */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Staff ID</label>
            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
              <button
                type="button"
                className="show-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* NOTE: Reverting button type to submit */}
          <button type="submit" className="login-button">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
