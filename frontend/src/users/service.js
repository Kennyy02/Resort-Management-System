import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/services.css';
import tower from '../components/pictures/tower.jpg';

function UserServices() {
    const [services, setServices] = useState([]);
    const [payments, setPayments] = useState([]); // 🔥 New state for GCASH / BANK QR
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('rooms');
    const [sortOrder, setSortOrder] = useState('none');
    const [hasRoomOrCottageBooking, setHasRoomOrCottageBooking] = useState(false);
    const [isLoggedIn] = useState(true);
    const [userEmail] = useState('user@example.com');

    const navigate = useNavigate();

    const checkBookingPrerequisite = useCallback(async (email) => {
        if (!email) return false;
        try {
            const url = `${process.env.REACT_APP_BOOKINGS_API}/api/bookings/check-prerequisite/${email}`;
            const res = await fetch(url);
            if (!res.ok) return false;
            const data = await res.json();
            return data.hasRoomOrCottageBooking;
        } catch (err) {
            console.error("Error checking booking prerequisite:", err);
            return false;
        }
    }, []);

    const handleBookNowClick = useCallback(async (serviceId, serviceName, servicePrice, serviceType) => {
        if (serviceType === 'island_hopping') {
            if (!isLoggedIn || !userEmail) {
                alert("Please log in and book a Room or Cottage first before booking an Island Hopping Tour.");
                return;
            }
            if (!hasRoomOrCottageBooking) {
                alert("You must have an APPROVED Room or Cottage booking first.");
                return;
            }
        }
        navigate('/booknow', { state: { serviceId, serviceName, servicePrice } });
    }, [navigate, isLoggedIn, userEmail, hasRoomOrCottageBooking]);

    const fetchServices = async () => {
        setError(null);
        try {
            const url = `${process.env.REACT_APP_SERVICES_API}/api/services`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`Invalid response format: ${contentType}`);
            }

            const data = await res.json();

            // 🔥 Filter payment QR codes
            const paymentQR = data.filter(s => s.type === "payment");
            setPayments(paymentQR);

            // keep only services
            const filtered = data.filter(s => s.type !== "payment");
            setServices(filtered);

            return true;
        } catch (err) {
            setError(`Failed to load services: ${err.message}`);
            return false;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const servicesFetched = await fetchServices();
            if (servicesFetched && isLoggedIn && userEmail) {
                const hasPrerequisite = await checkBookingPrerequisite(userEmail);
                setHasRoomOrCottageBooking(hasPrerequisite);
            }
            setLoading(false);
        };
        loadData();
    }, [userEmail, isLoggedIn, checkBookingPrerequisite]);

    const sortedServices = useMemo(() => {
        if (sortOrder === 'none') return services;
        return [...services].sort((a, b) => {
            const priceA = parseFloat(a.price);
            const priceB = parseFloat(b.price);
            return sortOrder === 'price_asc' ? priceA - priceB : priceB - priceA;
        });
    }, [services, sortOrder]);

    const rooms = sortedServices.filter(service => service.type === 'room');
    const cottages = sortedServices.filter(service => service.type === 'cottage');
    const islandHopping = sortedServices.filter(service => service.type === 'island_hopping');

    if (loading) return <div className="user-services-page loading">Loading services...</div>;
    if (error) return <div className="user-services-page error-message">{error}</div>;

    const renderServiceCards = (serviceList, serviceType) => (
        <div className="services-grid">
            {serviceList.map((service) => {
                const isAvailable = service.status === 'available';
                return (
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
                            <p><strong>Price:</strong> ₱{parseFloat(service.price).toFixed(2)}</p>
                            <p>
                                <strong>Status:</strong>{' '}
                                <span className={isAvailable ? 'status-available' : 'status-unavailable'}>
                                    {service.status}
                                </span>
                            </p>
                            <p className="service-description">{service.description}</p>
                            {isAvailable && (
                                <button
                                    className="book-now-button"
                                    onClick={() => handleBookNowClick(service.id, service.name, service.price, serviceType)}
                                >
                                    Book Now
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="user-services-page">
            <div className="services-hero-section">
                <img src={tower} alt="Services Background" className="services-hero-image" />
                <div className="services-hero-overlay" />
                <div className="services-hero-content">
                    <h1 className="hero-title">Our Services</h1>
                </div>
            </div>

            <div className="user-services-container">
                {services.length === 0 && payments.length === 0 ? (
                    <p>No services available at the moment.</p>
                ) : (
                    <>
                        <div className="controls-container">
                            <div className="tabs">

                                <button
                                    className={activeTab === 'rooms' ? 'tab-button active' : 'tab-button'}
                                    onClick={() => setActiveTab('rooms')}
                                >Rooms</button>

                                <button
                                    className={activeTab === 'cottages' ? 'tab-button active' : 'tab-button'}
                                    onClick={() => setActiveTab('cottages')}
                                >Cottages</button>

                                <button
                                    className={activeTab === 'island_hopping' ? 'tab-button active' : 'tab-button'}
                                    onClick={() => setActiveTab('island_hopping')}
                                >Island Hopping</button>

                                {/* 🔥 NEW TAB: Mode of Payment */}
                                <button
                                    className={activeTab === 'payment' ? 'tab-button active' : 'tab-button'}
                                    onClick={() => setActiveTab('payment')}
                                >Mode of Payment</button>
                            </div>

                            {/* sort only for services */}
                            {activeTab !== "payment" && (
                                <div className="sort-controls">
                                    <label htmlFor="sort-by">Sort by:</label>
                                    <select id="sort-by" onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
                                        <option value="none">Default</option>
                                        <option value="price_asc">Price: Low to High</option>
                                        <option value="price_desc">Price: High to Low</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="services-content">

                            {activeTab === 'rooms' && rooms.length > 0 && (
                                <div className="service-section">
                                    <h3 className="section-title">Rooms</h3>
                                    {renderServiceCards(rooms, 'room')}
                                </div>
                            )}

                            {activeTab === 'cottages' && cottages.length > 0 && (
                                <div className="service-section">
                                    <h3 className="section-title">Cottages</h3>
                                    {renderServiceCards(cottages, 'cottage')}
                                </div>
                            )}

                            {activeTab === 'island_hopping' && islandHopping.length > 0 && (
                                <div className="service-section">
                                    <h3 className="section-title">Island Hopping Tours</h3>
                                    {renderServiceCards(islandHopping, 'island_hopping')}
                                    {!hasRoomOrCottageBooking && (
                                        <p className="booking-requirement-note">
                                            ⚠️ Island Hopping Tours require an APPROVED Room or Cottage booking.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* 🔥 PAYMENT QR DISPLAY (FIX APPLIED HERE) */}
                            {activeTab === 'payment' && (
                                <div className="payment-section">
                                    <h3 className="section-title">Mode of Payment</h3>

                                    {payments.length === 0 ? (
                                        <p>No payment methods available.</p>
                                    ) : (
                                        <div className="payment-grid">
                                            {payments.map((p) => (
                                                <div className="payment-card" key={p.id}>
                                                    <h4>{p.name}</h4>
                                                    {p.image_url ? ( {/* FIX: Changed p.qr_url to p.image_url */}
                                                        <img
                                                            src={`${process.env.REACT_APP_SERVICES_API}${p.image_url}`} {/* FIX: Changed p.qr_url to p.image_url */}
                                                            alt={`${p.name} QR`}
                                                            className="payment-qr-image"
                                                        />
                                                    ) : (
                                                        <p>No QR uploaded</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default UserServices;
