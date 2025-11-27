import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/userinterface.css';

import resortImage from '../components/pictures/resort.jpg';
import mountainView from '../components/pictures/mountainView.jpg';

const ABOUTUS_API_BASE_URL = process.env.REACT_APP_ABOUTUS_API || 'http://localhost:5006';
const GENERAL_INFO_URL = `${ABOUTUS_API_BASE_URL}/pre/api/aboutus`;

const MOCK_SLIDER_IMAGES = [resortImage, mountainView];
const MOCK_POPULAR_DESTINATIONS = [
    { name: 'Loading...', image: mountainView, description: 'Fetching destinations from API...' },
];
const MOCK_HOW_IT_WORKS = [
    { number: '01', title: 'Loading...', description: 'Fetching features from API...' },
];

const UserInterface = () => {
    const navigate = useNavigate();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [destinationDotIndex, setDestinationDotIndex] = useState(0);

    const [generalAboutUs, setGeneralAboutUs] = useState("Loading resort information...");
    const [loadingAboutUs, setLoadingAboutUs] = useState(true);
    const [errorAboutUs, setErrorAboutUs] = useState(null);

    const howItWorksRef = useRef(null);
    const discoverPlacesRef = useRef(null);
    const whyWorkWithUsRef = useRef(null);
    const popularDestinationsContainerRef = useRef(null);

    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [showDiscoverPlaces, setShowDiscoverPlaces] = useState(false);
    const [showWhyWorkWithUs, setShowWhyWorkWithUs] = useState(false);

    // --- Fetch About Us ---
    useEffect(() => {
        const fetchAboutUsData = async () => {
            try {
                const response = await axios.get(GENERAL_INFO_URL);
                const data = response.data;

                if (data && data.length > 0 && data[0].content) {
                    setGeneralAboutUs(data[0].content);
                } else {
                    setGeneralAboutUs("No general information available.");
                }
                setErrorAboutUs(null);
            } catch (error) {
                console.error("Error fetching About Us:", error);
                setGeneralAboutUs("Failed to load information.");
                setErrorAboutUs("Failed to load data.");
            } finally {
                setLoadingAboutUs(false);
            }
        };

        fetchAboutUsData();
    }, []);

    // --- Slider Effect ---
    useEffect(() => {
        const intervalId = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % MOCK_SLIDER_IMAGES.length);
                setFade(true);
            }, 500);
        }, 10000);

        return () => clearInterval(intervalId);
    }, []);

    // --- FIXED INTERSECTION OBSERVER (IMPORTANT) ---
    useEffect(() => {
        const options = { threshold: 0.2 };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target === howItWorksRef.current) {
                        setShowHowItWorks(true);
                    }
                    if (entry.target === discoverPlacesRef.current) {
                        setShowDiscoverPlaces(true);
                    }
                    if (entry.target === whyWorkWithUsRef.current) {
                        setShowWhyWorkWithUs(true);
                    }
                }
            });
        }, options);

        if (howItWorksRef.current) observer.observe(howItWorksRef.current);
        if (discoverPlacesRef.current) observer.observe(discoverPlacesRef.current);
        if (whyWorkWithUsRef.current) observer.observe(whyWorkWithUsRef.current);

        return () => observer.disconnect();
    }, []);

    // Destination Scroll Logic
    useEffect(() => {
        const container = popularDestinationsContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const cardTotalWidth = 320 + 20;
            const dotCount = MOCK_POPULAR_DESTINATIONS.length;
            const newIndex = Math.round(scrollLeft / cardTotalWidth);
            setDestinationDotIndex(Math.min(newIndex, dotCount - 1));
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleReadMoreClick = (path) => {
        navigate(path);
    };

    const renderAboutUsContent = () => {
        if (loadingAboutUs) return <p>Loading...</p>;
        if (errorAboutUs) return <p className="error-message">{errorAboutUs}</p>;

        return generalAboutUs
            .split(/\r?\n/)
            .filter(line => line.trim() !== "")
            .map((line, index) => <p key={index}>{line}</p>);
    };

    return (
        <div className="home-page-content">

            {/* HERO SECTION */}
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
                        <button className="explore-more-button" onClick={() => handleReadMoreClick('/explore')}>
                            EXPLORE MORE
                        </button>
                    </div>
                </div>
            </section>

            <hr />

            {/* ABOUT US */}
            <section
                ref={whyWorkWithUsRef}
                className={`about-us-summary-section scroll-animate ${showWhyWorkWithUs ? 'is-visible' : ''}`}
            >
                <h2 className="section-title">About EM'z Bayview Mountain Resort</h2>
                <div className="about-us-content-wrapper">
                    {renderAboutUsContent()}
                </div>
                <button className="explore-more-button secondary" onClick={() => handleReadMoreClick('/aboutus')}>
                    Read Full Story & Policies
                </button>
            </section>

            <hr />

            {/* POPULAR DESTINATIONS */}
            <section
                ref={discoverPlacesRef}
                className={`popular-destination-section scroll-animate ${showDiscoverPlaces ? 'is-visible' : ''}`}
            >
                <div className="popular-destination-header">
                    <p className="subtitle">where to sail now</p>
                    <h2 className="section-title">Popular Tourist Spots</h2>
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

                <button className="explore-more-button secondary" onClick={() => handleReadMoreClick('/destinations')}>
                    View All Destinations
                </button>
            </section>

            <hr />

            {/* WHAT WE OFFER */}
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
                                <div className="step-number">0X</div>
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
