import React, { useEffect, useState, useCallback } from 'react';
import './booknow.css'; 

const BOOKINGS_PER_PAGE = 10;

const BOOKING_API_URL = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_BOOKING_API_URL
    : 'http://localhost:5003';

function AdminBookNow() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionDetails, setActionDetails] = useState(null); // { id, newStatus }

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // *** USING BOOKING_API_URL VARIABLE ***
            const res = await fetch(`${BOOKING_API_URL}/api/bookings`);
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to fetch bookings: ${res.status} ${res.statusText} - ${errorText}`);
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setBookings(data);
            } else {
                setError('Invalid data format received: Expected an array.');
                setBookings([]);
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError(`Error fetching bookings: ${err.message}`);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Function to show the custom confirmation modal
    const showConfirm = (id, newStatus) => {
        setActionDetails({ id, newStatus });
        setShowConfirmModal(true);
    };

    // Function to handle the actual status update after confirmation
    const confirmUpdateStatus = async () => {
        if (!actionDetails) return;
        const { id, newStatus } = actionDetails;

        setShowConfirmModal(false); // Hide modal immediately

        try {
            // *** USING BOOKING_API_URL VARIABLE ***
            const res = await fetch(`${BOOKING_API_URL}/api/bookings/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update status');
            }

            // Refetch data to show the updated status
            fetchBookings();
        } catch (err) {
            console.error('Error updating status:', err);
            // Replace alert() with a state-based message display in a real app
            console.error(`Failed to update status: ${err.message}`); 
        }
    };

    const indexOfLastBooking = currentPage * BOOKINGS_PER_PAGE;
    const indexOfFirstBooking = indexOfLastBooking - BOOKINGS_PER_PAGE;
    const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);

    const totalPages = Math.ceil(bookings.length / BOOKINGS_PER_PAGE);
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="admin-bookings-card">
            <h2 className="admin-bookings-title">Booking Management</h2>
            {loading ? (
                <p className="status-message loading-message">Loading bookings...</p>
            ) : error ? (
                <p className="status-message error-message">
                    Error: {error}
                    <br />
                    Please ensure the backend service is running and accessible at 
                    `{BOOKING_API_URL}`.
                </p>
            ) : bookings.length === 0 ? (
                <p className="status-message no-bookings-message">No bookings found.</p>
            ) : (
                <div className="table-responsive">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone Number</th>
                                <th>Service</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Mode of Payment</th>
                                <th>Date Submitted</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentBookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td>{booking.id}</td>
                                    <td>{booking.name}</td>
                                    <td>{booking.email}</td>
                                    <td>{booking.phoneNumber || 'N/A'}</td>
                                    <td>{booking.serviceName}</td>
                                    <td>{booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : 'N/A'}</td>
                                    <td>{booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="capitalize">{booking.modeOfPayment || 'N/A'}</td>
                                    <td>{booking.created_at ? new Date(booking.created_at).toLocaleString() : 'N/A'}</td>
                                    <td>
                                        <span className={`status-badge status-${booking.status}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="action-buttons">
                                        {booking.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => showConfirm(booking.id, 'approved')}
                                                    className="action-button approve-button"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => showConfirm(booking.id, 'declined')}
                                                    className="action-button decline-button"
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        )}
                                        {booking.status === 'approved' && <span>✅ Approved</span>}
                                        {booking.status === 'declined' && <span>❌ Declined</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {bookings.length > BOOKINGS_PER_PAGE && (
                <div className="pagination-controls">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="pagination-button"
                    >
                        Previous
                    </button>
                    {pageNumbers.map(number => (
                        <button
                            key={number}
                            onClick={() => handlePageChange(number)}
                            className={`pagination-button ${currentPage === number ? 'active' : ''}`}
                        >
                            {number}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="pagination-button"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Custom Confirmation Modal UI (Replaces window.confirm/alert) */}
            {showConfirmModal && actionDetails && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Status Change</h3>
                        <p>Are you sure you want to change the status of booking ID {actionDetails.id} to 
                           <strong className={`status-${actionDetails.newStatus}`}> "{actionDetails.newStatus}"</strong>?
                        </p>
                        <div className="modal-actions">
                            <button onClick={() => setShowConfirmModal(false)} className="action-button decline-button">Cancel</button>
                            <button onClick={confirmUpdateStatus} className="action-button approve-button">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminBookNow;
