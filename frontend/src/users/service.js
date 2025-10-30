import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/services.css';
// 1. Import the background image
import tower from '../components/pictures/tower.jpg';

function UserServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('rooms');
    const [sortOrder, setSortOrder] = useState('none');
    const navigate = useNavigate();

const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
        const url = `${process.env.REACT_APP_SERVICES_API}/api/services`;
        console.log("Fetching from:", url);

        const res = await fetch(url);
        const contentType = res.headers.get("content-type");

        if (!res.ok || !contentType.includes("application/json")) {
            throw new Error(`Invalid response format: ${contentType}`);
        }

        const data = await res.json();
        setServices(data);
    } catch (err) {
        setError(`Failed to load services: ${err.message}`);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchServices();
    }, []);

    const sortedServices = useMemo(() => {
        if (sortOrder === 'none') return services;

        return [...services].sort((a, b) => {
            const priceA = parseFloat(a.price);
            const priceB = parseFloat(b.price);
            return sortOrder === 'price_asc' ? priceA - priceB : priceB - priceA;
        });
    }, [services, sortOrder]);

    const handleBookNowClick = (serviceId, serviceName, servicePrice) => {
        navigate('/booknow', { state: { serviceId, serviceName, servicePrice } });
        console.log(`Navigating to Book Now for service ID: ${serviceId}, Name: ${serviceName}, Price: ${servicePrice}`);
    };

    // Note: The loading/error return must remain at the top level of the component
    if (loading) {
        return <div className="user-services-page loading">Loading services...</div>;
    }

    if (error) {
        return <div className="user-services-page error-message">{error}</div>;
    }

    const rooms = sortedServices.filter(service => service.type === 'room');
    const cottages = sortedServices.filter(service => service.type === 'cottage');

    const renderServiceCards = (serviceList) => (
        <div className="services-grid">
            {serviceList.map((service) => (
                <div className="service-card" key={service.id}>
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
            
            {/* 2. Hero Image Section */}
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
                {/* Removed the original h2 tag "Our Services" */}
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
                            </div>
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
                            {activeTab === 'rooms' && rooms.length > 0 && (
                                <div className="service-section">
                                    <h3 className="section-title">Rooms</h3>
                                    {renderServiceCards(rooms)}
                                </div>
                            )}
                            {activeTab === 'cottages' && cottages.length > 0 && (
                                <div className="service-section">
                                    <h3 className="section-title">Cottages</h3>
                                    {renderServiceCards(cottages)}
                                </div>
                            )}
                            {(activeTab === 'rooms' && rooms.length === 0) || (activeTab === 'cottages' && cottages.length === 0) ? (
                                <p className="no-services-message">No {activeTab} available at the moment.</p>
                            ) : null}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default UserServices;
