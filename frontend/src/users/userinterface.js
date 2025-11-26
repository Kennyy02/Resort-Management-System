import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './styles/userinterface.css'; 

// Import data and images from the new data file
import {
    sliderImages,
    popularDestinationsData,
    howItWorksSteps,
    whyWorkWithUsFeatures,
    resortImage
} from '../components/UserInterfaceData';


const UserInterface = () => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [destinationDotIndex, setDestinationDotIndex] = useState(0);

    // --- References for Intersection Observer ---
    const howItWorksRef = useRef(null);
    const discoverPlacesRef = useRef(null);
    const whyWorkWithUsRef = useRef(null);
    const popularDestinationsContainerRef = useRef(null);

    // --- State for Animation Visibility ---
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [showDiscoverPlaces, setShowDiscoverPlaces] = useState(false);
    const [showWhyWorkWithUs, setShowWhyWorkWithUs] = useState(false);

    // --- 1. Slider Effect ---
    useEffect(() => {
        const intervalId = setInterval(() => {
            setFade(false); 
            setTimeout(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % sliderImages.length);
                setFade(true); 
            }, 500); 
        }, 10000); 

        return () => clearInterval(intervalId);
    }, []); 

    // --- 2. Intersection Observer Logic (Re-mapped to Nature-First Order) ---

    // Observe Why Us / Nature's Best Escape
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShowWhyWorkWithUs(true);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 }
        );
        if (whyWorkWithUsRef.current) observer.observe(whyWorkWithUsRef.current);
        return () => {
            if (whyWorkWithUsRef.current) observer.unobserve(whyWorkWithUsRef.current);
        };
    }, []);

    // Observe Popular Destinations
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShowDiscoverPlaces(true);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 }
        );
        if (discoverPlacesRef.current) observer.observe(discoverPlacesRef.current);
        return () => {
            if (discoverPlacesRef.current) observer.unobserve(discoverPlacesRef.current);
        };
    }, []);

    // Observe What We Offer (How It Works)
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShowHowItWorks(true);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 }
        );
        if (howItWorksRef.current) observer.observe(howItWorksRef.current);
        return () => {
            if (howItWorksRef.current) observer.unobserve(howItWorksRef.current);
            
        };
    }, []);

    // --- 3. Destination Slider Scroll Logic ---
    useEffect(() => {
        const container = popularDestinationsContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const cardTotalWidth = 320 + 20; 
            const newIndex = Math.round(scrollLeft / cardTotalWidth);
            setDestinationDotIndex(newIndex);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleReadMoreClick = (path) => {
        navigate(path);
    };

    return (
        <div className="home-page-content">
            
            {/* 1. 🏞️ HERO SECTION (Slider) */}
            <section className="hero-section">
                <div className="app-image-section">
                    <img
                        src={sliderImages[currentIndex]}
                        className={`resort-image ${fade ? 'fade-in' : 'fade-out'}`}
                        alt={`Slide ${currentIndex + 1}`}
                    />
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <h1>
                            Swim<br />
                            Chill<br />
                            Relax
                        </h1>
                        <button className="explore-more-button" onClick={() => handleReadMoreClick('/explore')}>EXPLORE MORE</button>
                    </div>
                    <div className="slider-dots">
                        {sliderImages.map((_, idx) => (
                            <span
                                key={idx}
                                className={`slider-dot ${idx === currentIndex ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <hr/>

            {/* 2. ⭐ WHY US / NATURE'S BEST ESCAPE */}
            <section
                ref={whyWorkWithUsRef}
                className={`why-work-with-us-section scroll-animate ${showWhyWorkWithUs ? 'is-visible' : ''}`}
            >
                <h2 className="why-work-with-us-title">EM'z Bayview Mountain Resort</h2>
                <div className="why-work-with-us-features-grid">
                    {whyWorkWithUsFeatures.map((feature, index) => (
                        <div className="feature-item" key={index}>
                            <div className="feature-icon-wrapper">
                                <span className="feature-icon">{feature.icon}</span>
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <hr/>

            {/* 3. 🗺️ POPULAR TOURIST SPOTS */}
            <section
                ref={discoverPlacesRef}
                className={`popular-destination-section scroll-animate ${showDiscoverPlaces ? 'is-visible' : ''}`}
            >
                <div className="popular-destination-header">
                    <p className="subtitle">where to sail now</p>
                    <h2 className="section-title">Popular Tourist Spots</h2>
                    <div className="destination-info">
                        <p className="destination-count">Destinations</p>
                        <p className="destination-description">These are the most popular destinations here. There are still lots destinations waiting for you, let's finish it now!</p>
                    </div>
                </div>

                <div className="popular-destination-cards-container" ref={popularDestinationsContainerRef}>
                    {popularDestinationsData.map((destination, index) => (
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
                <div className="destination-slider-dots">
                    {popularDestinationsData.slice(0, popularDestinationsData.length - 2).map((_, idx) => (
                        <span
                            key={idx}
                            className={`destination-slider-dot ${idx === destinationDotIndex ? 'active' : ''}`}
                        />
                    ))}
                </div>
                <button className="explore-more-button secondary" onClick={() => handleReadMoreClick('/destinations')}>View All Destinations</button>
            </section>

            <hr/>

            {/* 4. 🛌 WHAT WE OFFER (The Resort Features) */}
            <section
                ref={howItWorksRef}
                className={`how-it-works-section scroll-animate ${showHowItWorks ? 'is-visible' : ''}`}
            >
                <h2 className="how-it-works-title">What We Offer</h2>

                <div className="how-it-works-content-grid">
                    <div className="how-it-works-column left-column">
                        {howItWorksSteps.slice(0, 2).map((step, index) => (
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
                        {howItWorksSteps.slice(2, 4).map((step, index) => (
                            <div className="how-it-works-step" key={index + 2}>
                                <div className="step-number">{step.number}</div>
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
