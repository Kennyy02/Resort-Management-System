import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const AdminLogin = () => {
  const [staffId, setStaffId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();

  // We keep the 'e' argument just in case, but rely on the button click
  const handleSubmit = async (e) => {
    // Remove e.preventDefault() if you remove the onSubmit handler, 
    // or keep it if you want to be extra safe:
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    

    try {
      const res = await fetch(`${process.env.REACT_APP_ADMIN_API}/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('admin', JSON.stringify(data.admin));
        console.log('Login successful, forcing redirect...');
        
        // Use the reliable hard redirect:
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

        {/* REMOVED onSubmit={handleSubmit} */}
        <form className="login-form"> 
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
                type={showPassword ? 'text' : 'password'} // toggles password visibility
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

          {/* CHANGED TYPE AND ADDED onClick HANDLER */}
          <button type="button" onClick={handleSubmit} className="login-button">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
