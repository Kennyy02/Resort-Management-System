import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './styles/userinterface.css';

// Static assets (for the main slider background, which isn't changing dynamically)
import resortImage from '../components/pictures/resort.jpg';
import mountainView from '../components/pictures/mountainView.jpg';

const sliderImages = [
    resortImage,
    mountainView,
];

const UserInterface = () => {
    const navigate = useNavigate();
    
    // State for the main image slider
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(true);

    // State for dynamic content (fetched from APIs)
    const [featuredRooms, setFeaturedRooms] = useState([]);
    const [aboutUsData, setAboutUsData] = useState({}); 
    const [latestFeedbacks, setLatestFeedbacks] = useState([]);
    const [popularDestinations, setPopularDestinations] = useState([]);

    // State for UI management
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [destinationDotIndex, setDestinationDotIndex] = useState(0);

    // Refs for Intersection Observer (for scroll animations)
    const howItWorksRef = useRef(null);
    const discoverPlacesRef = useRef(null);
    const whyWorkWithUsRef = useRef(null);
    const popularDestinationsContainerRef = useRef(null);

    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [showDiscoverPlaces, setShowDiscoverPlaces] = useState(false);
    const [showWhyWorkWithUs, setShowWhyWorkWithUs] = useState(false);


    // =========================================================
    // 1. API DATA FETCHING 🌐
    // =========================================================
    useEffect(() => {
        const fetchDynamicData = async () => {
            // Defined API Endpoints
            const FEEDBACK_URL = 'https://ratings-and-feedbacks-production.up.railway.app/api/feedback/latest';
            const ABOUT_URL = 'https://about-us-production.up.railway.app/api/homepage';
            const ROOMS_URL = 'https://manage-service-production.up.railway.app/api/rooms/featured';
            const DESTINATIONS_URL = 'https://manage-service-production.up.railway.app/api/destinations/popular'; 

            try {
                // Fetch all necessary data concurrently
                const [feedbackRes, aboutRes, roomsRes, destinationsRes] = await Promise.all([
                    fetch(FEEDBACK_URL),
                    fetch(ABOUT_URL),
                    fetch(ROOMS_URL),
                    fetch(DESTINATIONS_URL),
                ]);

                // Check for HTTP errors
                if (!feedbackRes.ok) throw new Error(`Feedback fetch failed: ${feedbackRes.statusText}`);
                if (!aboutRes.ok) throw new Error(`About Us fetch failed: ${aboutRes.statusText}`);
                if (!roomsRes.ok) throw new Error(`Rooms fetch failed: ${roomsRes.statusText}`);
                if (!destinationsRes.ok) throw new Error(`Destinations fetch failed: ${destinationsRes.statusText}`);

                const feedbackData = await feedbackRes.json();
                const aboutData = await aboutRes.json();
                const roomsData = await roomsRes.json();
                const destinationsData = await destinationsRes.json();

                // Update States with fetched data
                setLatestFeedbacks(feedbackData);
                setAboutUsData(aboutData);
                setFeaturedRooms(roomsData);
                setPopularDestinations(destinationsData);

                setIsLoading(false);

            } catch (err) {
                console.error("Failed to fetch homepage data:", err);
                setError(err.message);
                setIsLoading(false);
            }
        };

        fetchDynamicData();
    }, []); 

    // =========================================================
    // 2. SLIDER AND ANIMATION LOGIC ⚙️
    // =========================================================
    // Image Slider Auto-Advance
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

    // Intersection Observers for Scroll Animations (Re-using your existing logic)
    // Note: These need to be repeated for each ref (howItWorksRef, discoverPlacesRef, whyWorkWithUsRef)
    // The implementation for these are kept in your original structure.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.target === howItWorksRef.current && entry.isIntersecting) {
                        setShowHowItWorks(true);
                        observer.unobserve(entry.target);
                    }
                    if (entry.target === discoverPlacesRef.current && entry.isIntersecting) {
                        setShowDiscoverPlaces(true);
                        observer.unobserve(entry.target);
                    }
                    if (entry.target === whyWorkWithUsRef.current && entry.isIntersecting) {
                        setShowWhyWorkWithUs(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (howItWorksRef.current) observer.observe(howItWorksRef.current);
        if (discoverPlacesRef.current) observer.observe(discoverPlacesRef.current);
        if (whyWorkWithUsRef.current) observer.observe(whyWorkWithUsRef.current);

        return () => {
            if (howItWorksRef.current) observer.unobserve(howItWorksRef.current);
            if (discoverPlacesRef.current) observer.unobserve(discoverPlacesRef.current);
            if (whyWorkWithUsRef.current) observer.unobserve(whyWorkWithUsRef.current);
        };
    }, []);

    // Destination Card Scroll Logic
    useEffect(() => {
        const container = popularDestinationsContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            // Assuming card width + margin is around 340px
            const cardTotalWidth = 340; 
            const newIndex = Math.round(scrollLeft / cardTotalWidth);
            setDestinationDotIndex(newIndex);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [popularDestinations]); 
    
    // Data mapping from fetched object (assuming aboutUsData contains these properties)
    const howItWorksSteps = Array.isArray(aboutUsData.offers) ? aboutUsData.offers : [];
    const whyWorkWithUsFeatures = Array.isArray(aboutUsData.features) ? aboutUsData.features : [];

    // =========================================================
    // 3. RENDER LOGIC (Loading/Error/Content) 🧱
    // =========================================================
    
    if (isLoading) {
        return <div className="loading-screen">Loading resort data... Please wait.</div>;
    }

    if (error) {
        return <div className="error-screen">An error occurred while loading resort data: **{error}**.</div>;
    }
    
    return (
        <div className="home-page-content">
            
            {/* --- HERO SECTION --- */}
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
                        <button className="explore-more-button" onClick={() => navigate('/rooms')}>EXPLORE ROOMS</button>
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

            {/* --- WHY WORK WITH US (ABOUT US FEATURES) SECTION --- */}
            <section
                ref={whyWorkWithUsRef}
                className={`why-work-with-us-section scroll-animate ${showWhyWorkWithUs ? 'is-visible' : ''}`}
            >
                <h2 className="why-work-with-us-title">{aboutUsData.resortName || "EM'z Bayview Mountain Resort"}</h2>
                <div className="why-work-with-us-features-grid">
                    {/* Maps over dynamic features */}
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

            {/* --- FEATURED ROOMS & SUITES SECTION (Based on the design image) --- */}
            <section className="featured-rooms-section">
                <div className="section-header">
                    <h2>Rooms & Suites</h2>
                    <p>Pick a room that best suits your taste and budget.</p>
                </div>
                <div className="rooms-grid">
                    {/* Maps over dynamic featured rooms */}
                    {featuredRooms.slice(0, 4).map((room, index) => (
                        <div className="room-card" key={index}>
                            {/* Assumes room object has imageUrl, name, description, and pricePerNight fields */}
                            <img src={room.imageUrl} alt={room.name} className="room-image" />
                            <div className="room-content">
                                <h3>{room.name}</h3>
                                <p>Leverage agile frameworks to pro vide a robust synthesis...</p>
                                <p className="room-price">
                                    **${room.pricePerNight ? room.pricePerNight.toFixed(2) : 'N/A'}** <span className="per-night">per night</span>
                                </p>
                                <Link to={`/rooms/${room.id}`} className="details-button">DETAILS</Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- WHAT WE OFFER SECTION (How It Works) --- */}
            <section
                ref={howItWorksRef}
                className={`how-it-works-section scroll-animate ${showHowItWorks ? 'is-visible' : ''}`}
            >
                <h2 className="how-it-works-title">What We Offer</h2>

                <div className="how-it-works-content-grid">
                    <div className="how-it-works-column left-column">
                        {/* Maps over the dynamically fetched steps */}
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
                        {/* Static image for the center, replace with dynamic if needed */}
                        <img src={resortImage} alt="Resort overview" className="central-image" />
                    </div>

                    <div className="how-it-works-column right-column">
                        {/* Maps over the dynamically fetched steps */}
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

            {/* --- POPULAR TOURIST SPOTS SECTION --- */}
            <section
                ref={discoverPlacesRef}
                className={`popular-destination-section scroll-animate ${showDiscoverPlaces ? 'is-visible' : ''}`}
            >
                <div className="popular-destination-header">
                    <p className="subtitle">where to sail now</p>
                    <h2 className="section-title">Popular Tourist Spots</h2>
                    <div className="destination-info">
                        <p className="destination-count">{popularDestinations.length} Destinations</p>
                        <p className="destination-description">These are the most popular destinations here. There are still lots of destinations waiting for you, let's explore them now!</p>
                    </div>
                </div>

                <div className="popular-destination-cards-container" ref={popularDestinationsContainerRef}>
                    {/* Maps over dynamic destinations */}
                    {popularDestinations.map((destination, index) => (
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
                
                {/* Destination dots logic */}
                <div className="destination-slider-dots">
                    {/* Show a dot for every card that can be centered in the view */}
                    {popularDestinations.slice(0, Math.max(1, popularDestinations.length - 2)).map((_, idx) => (
                        <span
                            key={idx}
                            className={`destination-slider-dot ${idx === destinationDotIndex ? 'active' : ''}`}
                        />
                    ))}
                </div>
            </section>

            {/* --- GUEST FEEDBACK SECTION --- */}
            <section className="feedback-section">
                <h2 className="feedback-title">Guest Testimonials</h2>
                <p className="feedback-subtitle">Hear what our amazing guests have to say about their stay.</p>
                <div className="feedback-grid">
                    {/* Maps over dynamic feedback */}
                    {latestFeedbacks.slice(0, 3).map((feedback, index) => (
                        <div className="feedback-card" key={index}>
                            <p className="feedback-text">"{feedback.reviewText}"</p>
                            <div className="feedback-author">
                                <p className="author-name">**{feedback.guestName}**</p>
                                <p className="author-details">Stayed in {feedback.roomType}</p>
                            </div>
                             <div className="feedback-rating">
                                {'⭐'.repeat(feedback.rating)}
                            </div>
                        </div>
                    ))}
                </div>
                {latestFeedbacks.length > 0 && (
                    <button className="all-reviews-button" onClick={() => navigate('/feedback')}>READ ALL REVIEWS</button>
                )}
            </section>

        </div>
    );
};

export default UserInterface;
