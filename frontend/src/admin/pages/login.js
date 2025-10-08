import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const AdminLogin = () => {
  const [staffId, setStaffId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${process.env.REACT_APP_ADMIN_API}/admin-login`,, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, email, password }), // <-- FIXED HERE
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('admin', JSON.stringify(data.admin)); // store admin info
        console.log('Login successful, navigating...');
        navigate('/admin/analytics'); 
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="login-button">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
