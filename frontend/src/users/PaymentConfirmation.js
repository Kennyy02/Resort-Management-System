import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/confirmation.css'; // <--- IMPORT THE NEW CSS FILE HERE

function PaymentConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const bookingDetails = location.state?.bookingDetails; // Safely access state

    useEffect(() => {
        // Log received details for debugging
        console.log('Payment Confirmation Page Loaded!');
        console.log('Received Booking Details:', bookingDetails);

        // Optional: Redirect if no booking details are found (e.g., direct access to this URL)
        if (!bookingDetails) {
            console.warn('No booking details found in location state. Redirecting to home.');
            navigate('/'); // You might want to redirect to the services page or home page
        }
    }, [bookingDetails, navigate]);

    // If bookingDetails are not available, render a message or redirect
    if (!bookingDetails) {
        return (
            <div className="confirmation-wrapper no-details-wrapper">
                <div className="confirmation-card no-details-card">
                    <h2 className="confirmation-title error-title">No Booking Details Found</h2>
                    <p className="confirmation-message error-message">
                        This page is typically accessed after a successful booking.
                        Please go back to the <a href="/services" className="link-text">services page</a> to make a new booking.
                    </p>
                </div>
            </div>
        );
    }

    // If bookingDetails exist, render the confirmation details
    return (
        <div className="confirmation-wrapper">
            <div className="confirmation-card">
                <h2 className="confirmation-title success-title">
                    Booking Confirmed!
                </h2>
                <p className="confirmation-message">
                    Your booking request has been successfully submitted.
                </p>

                <div className="booking-details-list">
                    <div className="detail-item">
                        <span className="detail-label">Service:</span>
                        <span className="detail-value">{bookingDetails.serviceName}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Check-in Date:</span>
                        <span className="detail-value">{bookingDetails.checkInDate}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Check-out Date:</span>
                        <span className="detail-value">{bookingDetails.checkOutDate}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Number of Nights:</span>
                        <span className="detail-value">{bookingDetails.numberOfNights}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Your Name:</span>
                        <span className="detail-value">{bookingDetails.name}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{bookingDetails.email}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Payment Option:</span>
                        {/* Ensure modeOfPayment is always displayed, with N/A as fallback */}
                        <span className="detail-value capitalize">{bookingDetails.modeOfPayment || 'N/A'}</span>
                    </div>
                    <div className="detail-item total-price-item">
                        <span className="detail-label">Total Booking Price:</span>
                        <span className="detail-value">₱{bookingDetails.totalPrice}</span>
                    </div>
                    <div className="detail-item amount-paid-item">
                        <span className="detail-label">Amount Paid Online:</span>
                        <span className="detail-value">₱{bookingDetails.amountPaidOnline}</span>
                    </div>
                    {bookingDetails.remainingBalance > 0 && (
                        <div className="detail-item remaining-balance-item">
                            <span className="detail-label">Remaining Balance Due:</span>
                            <span className="detail-value">₱{bookingDetails.remainingBalance}</span>
                        </div>
                    )}
                </div>

                <p className="final-message">
                    You will receive an email confirmation shortly.
                </p>
                <div className="button-container">
                    <button
                        onClick={() => navigate('/')} // Or to services page: navigate('/services')
                        className="home-button"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentConfirmation;