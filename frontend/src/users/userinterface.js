import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './styles/userinterface.css';

// --- IMAGE IMPORTS ---
import resortImage from '../components/pictures/resort.jpg';
import mountainView from '../components/pictures/mountainView.jpg'; 
import juniorSuiteImage from '../components/pictures/junior_suite.jpg'; 
import familyRoomImage from '../components/pictures/family_room.jpg';
import standardRoomImage from '../components/pictures/standard_room.jpg';
import deluxeRoomImage from '../components/pictures/deluxe_room.jpg';

import aslomImage from '../components/pictures/aslom.jpg';
import bulalacaoImage from '../components/pictures/bulalacao.jpeg';
import bulalacaoTownAndBayImage from '../components/pictures/bulalacaotownandbay.jpeg';
import featureImage from '../components/pictures/feature.jpg';
import targetIslandImage from '../components/pictures/targetisland.jpeg';


// --- STATIC DATA (Used until API calls are fixed) ---

// Placeholder data for Featured Rooms to match the design layout
const featuredRoomsData = [
    { id: 1, name: 'Junior Suite', price: 135.00, imageUrl: juniorSuiteImage },
    { id: 2, name: 'Family Room', price: 135.00, imageUrl: familyRoomImage },
    { id: 3, name: 'Standard Room', price: 135.00, imageUrl: standardRoomImage },
    { id: 4, name: 'Deluxe Room', price: 135.00, imageUrl: deluxeRoomImage },
];

const popularDestinationsData = [
    { name: 'Aslom Beach', image: aslomImage, description: 'Discover the pristine shores and serene waters of Aslom Beach.' },
    { name: 'Bulalacao Town', image: bulalacaoImage, description: 'Explore the charming town of Bulalacao with its vibrant local life.' },
    { name: 'Bulalacao Bay', image: bulalacaoTownAndBayImage, description: 'Enjoy breathtaking panoramic views of Bulalacao Bay and its surroundings.' },
    { name: 'Target Island', image: targetIslandImage, description: 'Embark on an exciting adventure to the secluded and picturesque Target Island.' },
    { name: 'Coastal Wonders', image: featureImage, description: 'Experience the unique natural features of our stunning coastline.' },
    { name: 'Hidden Coves', image: aslomImage, description: 'Unwind in tranquil hidden coves perfect for peaceful escapes.' },
];

const howItWorksSteps = [
    { number: '01', title: 'Rooms', description: 'Discover spacious and comfortable rooms, designed for ultimate relaxation and stunning bay views.' },
    { number: '02', title: 'Pools', description: 'Dive into our refreshing swimming pools, perfect for a leisurely dip or family fun.' },
    { number: '03', title: 'Towers', description: 'Ascend our iconic observation tower for breathtaking panoramic views of the entire resort and surrounding nature.' },
    { number: '04', title: 'Other Offerings', description: 'Explore a variety of dining options, recreational activities, and personalized services to enhance your stay.' },
];

const whyWorkWithUsFeatures = [
    { icon: '🚗', title: 'Car Rental', description: 'We offer reliable car rental services so you can explore the region at your own pace.' },
    { icon: '📶', title: 'Free Wifi', description: 'Stay connected with high-speed internet access available throughout the resort area.' },
    { icon: '🏊', title: 'Swimming Pool', description: 'Enjoy our clean and refreshing swimming pools suitable for all ages and skill levels.' },
];


const UserInterface = () => {
    const navigate = useNavigate();
    // Removed: [currentIndex, setCurrentIndex] and [fade, setFade] - Hero image is static
    const [destinationDotIndex, setDestinationDotIndex] = useState(0);

    // Refs for Intersection Observer (Scroll Animations)
    const howItWorksRef = useRef(null);
    const discoverPlacesRef = useRef(null);
    const whyWorkWithUsRef = useRef(null);
    const popularDestinationsContainerRef = useRef(null);

    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [showDiscoverPlaces, setShowDiscoverPlaces] = useState(false);
    const [showWhyWorkWithUs, setShowWhyWorkWithUs] = useState(false);

    // REMOVED: useEffect for the auto-sliding image interval.

    // --- Intersection Observer Effects (Unchanged) ---
    useEffect(() => {
        const observerOptions = { threshold: 0.1 };
        const observerCallback = (entries, observer) => {
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
        }
        
        const observer = new IntersectionObserver(observerCallback, observerOptions);

        if (howItWorksRef.current) observer.observe(howItWorksRef.current);
        if (discoverPlacesRef.current) observer.observe(discoverPlacesRef.current);
        if (whyWorkWithUsRef.current) observer.observe(whyWorkWithUsRef.current);

        return () => {
            if (howItWorksRef.current) observer.unobserve(howItWorksRef.current);
            if (discoverPlacesRef.current) observer.unobserve(discoverPlacesRef.current);
            if (whyWorkWithUsRef.current) observer.unobserve(whyWorkWithUsRef.current);
        };
    }, []);

    // --- Destination Scroll Dot Logic (Unchanged) ---
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
            
            {/* --- 1. HERO SECTION: STATIC IMAGE & "SWIM, CHILL, RELAX" TEXT --- */}
            <section className="hero-section">
                <div className="app-image-section">
                    <img
                        src={resortImage} // Using a single static image
                        className="resort-image" 
                        alt="Resort Overview"
                    />
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <h1>
                            Swim<br />
                            Chill<br />
                            Relax
                        </h1>
                        <button className="explore-more-button">EXPLORE ROOMS</button> {/* Changed text to "EXPLORE ROOMS" */}
                    </div>
                </div>
                {/* --- ROOM AVAILABILITY BAR (Placeholder structure matching the image) --- */}
                 <div className="availability-bar">
                    <input type="text" placeholder="Arrival Date" className="availability-input" />
                    <input type="text" placeholder="Departure Date" className="availability-input" />
                    <select className="availability-select"><option>Adults</option></select>
                    <select className="availability-select"><option>Children</option></select>
                    <button className="check-availability-button">CHECK AVAILABILITY</button>
                </div>
            </section>

            {/* --- 2. INTRO SECTION: WELCOME TO OUR HOTEL CHARLOSTIN (Structure kept, text generic) --- */}
            <section className="intro-section">
                <div className="intro-images-container">
                    <img src={mountainView} alt="Pool view" className="intro-image" />
                    <img src={aslomImage} alt="Person relaxing" className="intro-image" />
                    <img src={bulalacaoImage} alt="Beach view" className="intro-image" />
                </div>
                <div className="intro-content">
                    <h2 className="intro-title">Welcome to our Hotel</h2>
                    <p className="intro-text-highlight">
                        A perfect blend of comfort and nature awaits you.
                    </p>
                    <p className="intro-text-body">
                        Experience tranquility by the bay, surrounded by majestic mountains. Our resort offers an unforgettable escape for every guest.
                    </p>
                    <button className="know-more-button-small">KNOW MORE</button>
                </div>
            </section>
            
            {/* --- 3. FEATURED ROOMS & SUITES SECTION (Structure kept, text generic) --- */}
            <section className="featured-rooms-section">
                <div className="rooms-header-row">
                    <div>
                        <h2 className="rooms-section-title">Rooms And Suites</h2>
                        <p className="rooms-section-subtitle">Discover your ideal stay with us</p>
                    </div>
                    <div className="rooms-navigation-arrows">
                        <span className="arrow">{'<'}</span>
                        <span className="arrow">{'>'}</span>
                    </div>
                </div>
                
                <div className="rooms-grid">
                    {featuredRoomsData.map((room) => (
                        <div className="room-card" key={room.id}>
                            <img src={room.imageUrl} alt={room.name} className="room-image" />
                            <div className="room-content">
                                <h3>{room.name}</h3>
                                <p className="room-description">Spacious and comfortable, designed for your ultimate relaxation.</p>
                                <p className="room-price">**${room.price.toFixed(2)}** <span className="per-night">per night</span></p>
                                <Link to={`/rooms/${room.id}`} className="details-button">DETAILS</Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- 4. OUR SERVICES & FEATURES SECTION (Structure kept, text generic) --- */}
            <section
                ref={whyWorkWithUsRef}
                className={`why-work-with-us-section scroll-animate ${showWhyWorkWithUs ? 'is-visible' : ''}`}
            >
                <div className="section-content-wrapper">
                    <h2 className="section-title">Our Services & Features</h2>
                    <p className="section-subtitle">Everything you need for a comfortable and memorable stay.</p>
                    
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
                </div>
            </section>

            {/* --- 5. WHAT WE OFFER SECTION (Unchanged, uses existing howItWorksSteps) --- */}
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

            {/* --- 6. POPULAR TOURIST SPOTS SECTION (Unchanged, uses existing popularDestinationsData) --- */}
            <section
                ref={discoverPlacesRef}
                className={`popular-destination-section scroll-animate ${showDiscoverPlaces ? 'is-visible' : ''}`}
            >
                <div className="popular-destination-header">
                    <p className="subtitle">where to sail now</p>
                    <h2 className="section-title">Popular Tourist Spots</h2>
                    <div className="destination-info">
                        <p className="destination-count">Destinations</p>
                        <p className="destination-description">These are the most popular destinations here. There are still lots destinations waiting for you, let's explore them now!</p>
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
            </section>
        </div>
    );
};

export default UserInterface;
