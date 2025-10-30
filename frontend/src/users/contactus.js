import React, { useState } from 'react';
import axios from 'axios';
import './styles/contactus.css';
// 1. Import the background image
import mountainView from '../components/pictures/mountainView.jpg';

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
            
            {/* --- HERO SECTION --- */}
            <div className="contact-hero-section">
                <img
                    src={mountainView}
                    alt="Mountain View Background"
                    className="contact-hero-image"
                />
                <div className="contact-hero-overlay" />
                <div className="contact-hero-content">
                    <h1 className="hero-title">Get in Touch</h1>
                </div>
            </div>

            {/* --- CONTENT CONTAINER --- */}
            <div className="contact-container">
                
                {/* Contact Info (Moved to the left on desktop for better flow, but can be ordered in CSS) */}
                <div className="contact-info">
                    <h2>Resort Contact Info</h2>
                    <p>
                        <strong>Address:</strong>
                        <span>Dacutan Balatasa, Bulalacao, Oriental Mindoro</span>
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
                        {/* 2. Corrected Email Address and Mailto Link */}
                        <a
                            href="mailto:emzbayviewmountain@gmail.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            emzbayviewmountain@gmail.com
                        </a>
                    </p>
                </div>

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
                        <button type="submit">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
