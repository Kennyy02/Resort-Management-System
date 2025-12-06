import React, { useState } from 'react';
import axios from 'axios';
import './styles/contactus.css';
// import mountainView from '../components/pictures/mountainView.jpg'; // <-- COMMENTED OUT TO TEST

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending message...');

    try {
      await axios.post(`${process.env.REACT_APP_CONTACT_API}/api/contact`, form);
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
    <div className="contact-page">
      {/* HERO SECTION */}
      {/* TEMPORARY FIX: Added style and removed image tag to prevent crashing due to file path errors */}
      <section className="contact-hero-section" style={{ minHeight: '200px', backgroundColor: '#333' }}>
        {/* <img src={mountainView} alt="Mountain View" className="contact-hero-image" /> */}
        <div className="contact-hero-overlay" />
        <div className="contact-hero-content">
          <h1 className="hero-title">Get in Touch</h1>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="contact-container">
        {/* Contact Info */}
        <aside className="contact-info">
          <h2>Resort Contact Info</h2>
          <p>
            <strong>Address:</strong> Dacutan Balatasa, Bulalacao, Oriental Mindoro
          </p>
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
              href="mailto:emzbayviewmountain@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              emzbayviewmountain@gmail.com
            </a>
          </p>
        </aside>

        {/* Contact Form */}
        <div className="contact-form">
          <h2>Send Us a Message</h2>
          {status && (
            <p className={`status-message ${status.startsWith('❌') ? 'error' : ''}`}>
              {status}
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              required
            />
            <input
              type="email"
              name="email"
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
            <button type="submit">Send Message</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
