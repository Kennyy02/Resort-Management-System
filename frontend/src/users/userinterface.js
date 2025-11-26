import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // Import axios for API calls
import './styles/userinterface.css'; 
// NOTE: We keep the image imports for static visual elements like the main slider and central image
import resortImage from '../components/pictures/resort.jpg';
import mountainView from '../components/pictures/mountainView.jpg'; 
// We are removing all static data arrays like popularDestinationsData, howItWorksSteps, etc.

// --- API Configuration ---
// Assuming your about us service is accessible at this URL prefix
const ABOUTUS_API_BASE_URL = process.env.REACT_APP_ABOUTUS_API || 'http://localhost:5006'; 
const GENERAL_INFO_URL = `${ABOUTUS_API_BASE_URL}/pre/api/aboutus`;

// --- Mock/Fallback Data for other sections (MUST be replaced with real API calls later) ---
// For now, we will use simple placeholder arrays to prevent errors.
const MOCK_SLIDER_IMAGES = [resortImage, mountainView];
const MOCK_POPULAR_DESTINATIONS = [
    { name: 'Loading...', image: mountainView, description: 'Fetching destinations from API...' },
];
const MOCK_HOW_IT_WORKS = [
    { number: '01', title: 'Loading...', description: 'Fetching features from API...' },
];


const UserInterface = () => {
    const navigate = useNavigate();
    
    // --- State for Static Elements (kept for basic display) ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [destinationDotIndex, setDestinationDotIndex] = useState(0);

    // --- NEW State for Dynamic Data ---
    const [generalAboutUs, setGeneralAboutUs] = useState("Loading resort information...");
    const [loadingAboutUs, setLoadingAboutUs] = useState(true);
    const [errorAboutUs, setErrorAboutUs] = useState(null);

    // --- Intersection Observer Refs ---
    const howItWorksRef = useRef(null);
    const discoverPlacesRef = useRef(null);
    const whyWorkWithUsRef = useRef(null);
    const popularDestinationsContainerRef = useRef(null);

    // --- State for Animation Visibility ---
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [showDiscoverPlaces, setShowDiscoverPlaces] = useState(false);
    const [showWhyWorkWithUs, setShowWhyWorkWithUs] = useState(false);

    // --- 1. Fetch About Us Data (Replacing hardcoded features) ---
    useEffect(() => {
        const fetchAboutUsData = async () => {
            try {
                const response = await axios.get(GENERAL_INFO_URL);
                const data = response.data;

                if (data && data.length > 0 && data[0].content) {
                    setGeneralAboutUs(data[0].content);
                } else {
                    setGeneralAboutUs("No general information is currently available. Please check the admin panel.");
                }
                setErrorAboutUs(null);
            } catch (error) {
                console.error("Error fetching About Us data:", error);
                setGeneralAboutUs("Failed to load information. Please check the network connection.");
                setErrorAboutUs("Failed to load general information.");
            } finally {
                setLoadingAboutUs(false);
            }
        };

        fetchAboutUsData();
    }, []);


    // --- 2. Slider Effect (Using Mock Data) ---
    useEffect(() => {
        const intervalId = setInterval(() => {
            setFade(false); 
            setTimeout(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % MOCK_SLIDER_IMAGES.length);
                setFade(true); 
            }, 500); 
        }, 10000); 

        return () => clearInterval(intervalId);
    }, []); 

    // --- 3. Intersection Observer Logic (The logic for scrolling animation remains the same) ---
    // (This part is long and unchanged, so I'll omit it here for brevity, assuming you keep it as is)
    // ... (Keep your existing Intersection Observer useEffects here)

    // --- 4. Destination Slider Scroll Logic (Using Mock Data) ---
    useEffect(() => {
        const container = popularDestinationsContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const cardTotalWidth = 320 + 20; 
            // We use the mock array length here for the dots until we implement the real destination fetch
            const dotCount = MOCK_POPULAR_DESTINATIONS.length; 
            const newIndex = Math.round(scrollLeft / cardTotalWidth);
            setDestinationDotIndex(Math.min(newIndex, dotCount - 1)); // Ensure index is safe
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleReadMoreClick = (path) => {
        navigate(path);
    };

    const renderAboutUsContent = () => {
        if (loadingAboutUs) {
            return <p>Loading resort highlights...</p>;
        }
        if (errorAboutUs) {
            return <p className="error-message">Error: {errorAboutUs}</p>;
        }

        // Split the content by newlines and render as paragraphs
        return generalAboutUs
            .split(/\r?\n/)
            .filter(line => line.trim() !== "")
            .map((line, index) => (
                <p key={index} className="about-us-paragraph">{line}</p>
            ));
    };

    return (
        <div className="home-page-content">
            
            {/* 1. 🏞️ HERO SECTION (Uses MOCK_SLIDER_IMAGES) */}
            <section className="hero-section">
                <div className="app-image-section">
                    <img
                        src={MOCK_SLIDER_IMAGES[currentIndex]}
                        className={`resort-image ${fade ? 'fade-in' : 'fade-out'}`}
                        alt={`Slide ${currentIndex + 1}`}
                    />
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <h1>Swim<br />Chill<br />Relax</h1>
                        <button className="explore-more-button" onClick={() => handleReadMoreClick('/explore')}>EXPLORE MORE</button>
                    </div>
                    <div className="slider-dots">
                        {MOCK_SLIDER_IMAGES.map((_, idx) => (
                            <span
                                key={idx}
                                className={`slider-dot ${idx === currentIndex ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <hr/>

            {/* 2. ⭐ ABOUT US (DYNAMICALLY FETCHED from API) */}
            <section
                ref={whyWorkWithUsRef}
                className={`about-us-summary-section scroll-animate ${showWhyWorkWithUs ? 'is-visible' : ''}`}
            >
                <h2 className="section-title">About EM'z Bayview Mountain Resort</h2>
                <div className="about-us-content-wrapper">
                    {renderAboutUsContent()}
                </div>
                <button className="explore-more-button secondary" onClick={() => handleReadMoreClick('/aboutus')}>Read Full Story & Policies</button>
            </section>

            <hr/>

            {/* 3. 🗺️ POPULAR TOURIST SPOTS (Using Mock Data - Needs future API) */}
            <section
                ref={discoverPlacesRef}
                className={`popular-destination-section scroll-animate ${showDiscoverPlaces ? 'is-visible' : ''}`}
            >
                <div className="popular-destination-header">
                    <p className="subtitle">where to sail now</p>
                    <h2 className="section-title">Popular Tourist Spots</h2>
                    <div className="destination-info">
                        <p className="destination-count">{MOCK_POPULAR_DESTINATIONS.length} Destinations (Mock)</p>
                        <p className="destination-description">This data is currently static. You will need to build an API endpoint to manage destinations dynamically.</p>
                    </div>
                </div>

                <div className="popular-destination-cards-container" ref={popularDestinationsContainerRef}>
                    {MOCK_POPULAR_DESTINATIONS.map((destination, index) => (
                        <div className="destination-card" key={index}>
                            <div className="destination-card-image-wrapper">
                                <img src={destination.image} alt={destination.name} />
                            </div>
                            <div className="destination-card-content">
                                <h3>{destination.name}</h3>
                                <p>{destination.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Dots removed since MOCK_POPULAR_DESTINATIONS is just a single item */}
                <button className="explore-more-button secondary" onClick={() => handleReadMoreClick('/destinations')}>View All Destinations</button>
            </section>

            <hr/>

            {/* 4. 🛌 WHAT WE OFFER (Using Mock Data - Needs future API) */}
            <section
                ref={howItWorksRef}
                className={`how-it-works-section scroll-animate ${showHowItWorks ? 'is-visible' : ''}`}
            >
                <h2 className="how-it-works-title">What We Offer (Mock Data)</h2>

                <div className="how-it-works-content-grid">
                    <div className="how-it-works-column left-column">
                        {MOCK_HOW_IT_WORKS.map((step, index) => (
                            <div className="how-it-works-step" key={index}>
                                <div className="step-number">{step.number}</div>
                                <div className="step-text">
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="how-it-works-central-image-container">
                        <img src={resortImage} alt="Resort overview" className="central-image" />
                    </div>

                    <div className="how-it-works-column right-column">
                        {MOCK_HOW_IT_WORKS.map((step, index) => (
                            <div className="how-it-works-step" key={index + 2}>
                                <div className="step-number">0X</div> {/* Placeholder number */}
                                <div className="step-text">
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default UserInterface;
