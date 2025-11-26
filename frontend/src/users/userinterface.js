import React from 'react';
import { useNavigate } from 'react-router-dom';
import Feedbacks from './feedbacks'; 
import './styles/userinterface.css'; 

// Placeholder image (create this file in your project)
import homepageHero from '../components/pictures/homepageHero.jpg'; 

// --- 1. YouTube Video Section ---
const VideoSection = ({ videoId }) => (
    <div className="homepage-hero-section">
        {/* Background and Overlay */}
        <img
            src={homepageHero} 
            alt="Homepage Hero Background"
            className="homepage-hero-image"
        />
        <div className="homepage-hero-overlay" />
        
        <div className="homepage-hero-content">
            <h1 className="hero-title">Experience Paradise!</h1>
            <p className="hero-subtitle">Discover Bulalacao’s Hidden Gem in 2 Minutes.</p>

            {/* Embedded YouTube Player */}
            <div className="youtube-embed-container">
                <iframe
                    width="100%"
                    height="100%"
                    // Using the video ID you provided: f4eLvLbREEI
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&rel=0`}
                    title="EMZ Mountain Resort Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    </div>
);

// --- 2. Booking/Rooms Section ---
const BookingSection = () => {
    const navigate = useNavigate();
    return (
        <section className="section-container booking-section">
            <h2>🛌 Booking & Rooms</h2>
            <p>Choose from our selection of comfortable and luxurious accommodations.</p>
            <div className="room-cards-placeholder">
                <div className="room-card">Standard Room</div>
                <div className="room-card">Family Villa</div>
                <div className="room-card">Ocean View Suite</div>
            </div>
            <button className="cta-button" onClick={() => navigate("/rooms")}>
                View Rooms & Check Availability
            </button>
        </section>
    );
};

// --- 3. Island Hopping Section ---
const IslandHoppingSection = () => {
    const navigate = useNavigate();
    return (
        <section className="section-container island-hopping-section">
            <h2>🏝️ Island Hopping & Tours</h2>
            <p>Explore the best of the islands with our guided tour packages.</p>
            <div className="tour-info-placeholder">
                * **Tour A:** Snorkeling Adventure (Coral Gardens, Shipwreck)
                * **Tour B:** Hidden Lagoons & Caves (Lunch included)
                * **Tour C:** Sunset Cruise (Relaxing end to the day)
            </div>
            <button className="cta-button secondary" onClick={() => navigate("/tours")}>
                See All Packages & Prices
            </button>
        </section>
    );
};

// --- 5. Footer Component ---
const Footer = () => (
    <footer className="site-footer">
        <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} Resort Name. All rights reserved.</p>
            <p>Contact: info@resort.com | (123) 456-7890</p>
        </div>
    </footer>
);


// --- Main HomePage Component ---

export default function HomePage({ user }) {
    const navigate = useNavigate();
    const YOUTUBE_VIDEO_ID = "f4eLvLbREEI"; 

    return (
        <div className="homepage-page">
            
            {/* 1. YOUTUBE VIDEO SECTION */}
            <VideoSection videoId={YOUTUBE_VIDEO_ID} />
            
            <hr/>
            
            {/* 2. BOOKING/ROOMS SECTION */}
            <BookingSection />
            
            <hr/>
            
            {/* 3. ISLAND HOPPING SECTION */}
            <IslandHoppingSection />
            
            <hr/>
            
            {/* 4. FEEDBACKS SECTION */}
            <section className="section-container feedbacks-section">
                <h2>⭐ Guest Feedbacks Highlights</h2>
                <p>Don't just take our word for it—see what our guests are saying!</p>
                
                {/* Renders your Feedbacks component in preview mode */}
                <Feedbacks user={user} isPreview={true} /> 
                
                <button className="cta-button secondary" onClick={() => navigate("/feedbacks")}>
                    Read All Feedbacks
                </button>
            </section>
            
            <hr/>
            
            {/* 5. FOOTER */}
            <Footer />
        </div>
    );
}
