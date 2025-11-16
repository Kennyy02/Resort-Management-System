import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/services.css';
// 1. Import the background image
import tower from '../components/pictures/tower.jpg';

function UserServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // 🎯 CHANGE: Set default activeTab to 'rooms' and be ready for 'island_hopping'
    const [activeTab, setActiveTab] = useState('rooms'); 
    const [sortOrder, setSortOrder] = useState('none');
    const navigate = useNavigate();

    // ... (fetchServices, useEffect, sortedServices, handleBookNowClick functions remain the same)
    
    // Note: The loading/error return must remain at the top level of the component
    if (loading) {
        return <div className="user-services-page loading">Loading services...</div>;
    }

    if (error) {
        return <div className="user-services-page error-message">{error}</div>;
    }

    // 🎯 NEW: Filter for Island Hopping services
    const rooms = sortedServices.filter(service => service.type === 'room');
    const cottages = sortedServices.filter(service => service.type === 'cottage');
    const islandHopping = sortedServices.filter(service => service.type === 'island_hopping');

    const renderServiceCards = (serviceList) => (
        <div className="services-grid">
            {serviceList.map((service) => (
                <div className="service-card" key={service.id}>
                    {/* ... (service-card content remains the same) ... */}
                    <div className="service-image-wrapper">
                        {service.image_url ? (
                            <img
                                src={`${process.env.REACT_APP_SERVICES_API}${service.image_url}`}
                                alt={service.name}
                                className="service-image"
                            />
                        ) : (
                            <div className="no-image">No Image</div>
                        )}
                    </div>
                    <div className="service-details">
                        <h3>{service.name}</h3>
                        <p><strong>Description:</strong> {service.description}</p>
                        <p><strong>Price:</strong> ₱{parseFloat(service.price).toFixed(2)}</p>
                        <p>
                            <strong>Status:</strong>{' '}
                            <span className={service.status === 'available' ? 'status-available' : 'status-unavailable'}>
                                {service.status}
                            </span>
                        </p>
                        {service.status === 'available' && (
                            <button
                                className="book-now-button"
                                onClick={() => handleBookNowClick(service.id, service.name, service.price)}
                            >
                                Book Now
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="user-services-page">
            
            {/* 2. Hero Image Section (remains the same) */}
            <div className="services-hero-section">
                <img
                    src={tower}
                    alt="Services Background"
                    className="services-hero-image"
                />
                <div className="services-hero-overlay" />
                <div className="services-hero-content">
                    <h1 className="hero-title">Our Services</h1>
                </div>
            </div>

            {/* 3. Main Content Container */}
            <div className="user-services-container">
                {services.length === 0 ? (
                    <p>No services available at the moment.</p>
                ) : (
                    <>
                        <div className="controls-container">
                            <div className="tabs">
                                <button
                                    className={activeTab === 'rooms' ? 'tab-button active' : 'tab-button'}
                                    onClick={() => setActiveTab('rooms')}
                                >
                                    Rooms
                                </button>
                                <button
                                    className={activeTab === 'cottages' ? 'tab-button active' : 'tab-button'}
                                    onClick={() => setActiveTab('cottages')}
                                >
                                    Cottages
                                </button>
                                {/* 🎯 NEW: Island Hopping Tab Button */}
                                <button
                                    className={activeTab === 'island_hopping' ? 'tab-button active' : 'tab-button'}
                                    onClick={() => setActiveTab('island_hopping')}
                                >
                                    Island Hopping
                                </button>
                            </div>
                            {/* ... (sort-controls remain the same) ... */}
                            <div className="sort-controls">
                                <label htmlFor="sort-by">Sort by:</label>
                                <select id="sort-by" onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
                                    <option value="none">Default</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="services-content">
                            {/* Rooms Section */}
                            {activeTab === 'rooms' && rooms.length > 0 && (
                                <div className="service-section">
                                    <h3 className="section-title">Rooms</h3>
                                    {renderServiceCards(rooms)}
                                </div>
                            )}
                            
                            {/* Cottages Section */}
                            {activeTab === 'cottages' && cottages.length > 0 && (
                                <div className="service-section">
                                    <h3 className="section-title">Cottages</h3>
                                    {renderServiceCards(cottages)}
                                </div>
                            )}

                            {/* 🎯 NEW: Island Hopping Section */}
                            {activeTab === 'island_hopping' && islandHopping.length > 0 && (
                                <div className="service-section">
                                    <h3 className="section-title">Island Hopping Tours</h3>
                                    {renderServiceCards(islandHopping)}
                                </div>
                            )}
                            
                            {/* No Services Message Update */}
                            {((activeTab === 'rooms' && rooms.length === 0) || 
                              (activeTab === 'cottages' && cottages.length === 0) ||
                              (activeTab === 'island_hopping' && islandHopping.length === 0)) ? (
                                <p className="no-services-message">No {activeTab.replace('_', ' ')} available at the moment.</p>
                            ) : null}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default UserServices;
