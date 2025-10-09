import React, { useState } from 'react';
import axios from 'axios';
import './styles/contactus.css';

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending message...');

    try {
      await axios.post(`${process.env.REACT_APP_RATINGS_API}/api/contact`, form);
      setStatus('✅ Message sent successfully!');
      setForm({ name: '', email: '', message: '' });
    } catch (error) {
      setStatus('❌ Failed to store message.');
      console.error('Error storing message:', error);
      if (error.response) {
        console.error('Server response data:', error.response.data);
        console.error('Server response status:', error.response.status);
      }
    }
  };

  return (
    <div className="contact-container">
      {/* Contact Form */}
      <div className="contact-form">
        <h2>Contact Us</h2>
        {status && (
          <p className={`status-message ${status.startsWith('❌') ? 'error' : ''}`}>
            {status}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your Name"
            required
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Your Email"
            required
          />
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Your Message"
            required
          />
          <button type="submit">Send</button>
        </form>
      </div>

      {/* Contact Info */}
      <div className="contact-info">
        <h2>Resort Contact Info</h2>
        <p>
          <strong>Facebook:</strong>{' '}
          <a
            href="https://www.facebook.com/emzbayviewresort"
            target="_blank"
            rel="noopener noreferrer"
          >
            Emz' Bayview Mountain Resort
          </a>
        </p>
        <p>
          <strong>Phone:</strong>{' '}
          <a href="tel:+639190033771">0919-003-3771</a>
        </p>
        <p>
          <strong>Email:</strong>{' '}
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=emzbayviewresort@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            emzbayviewresort@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default ContactUs;
