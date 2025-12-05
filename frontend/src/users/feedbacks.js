import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/feedbacks.css";
import feedbacksbg from '../components/pictures/feedbacksbg.jpg';

const FEEDBACKS_PER_PAGE = 10;

const renderStars = (rating) => {
    const fullStar = '★';
    const emptyStar = '☆';
    return fullStar.repeat(rating) + emptyStar.repeat(5 - rating);
};

export default function Feedbacks({ user, approvedBookings }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lightbox, setLightbox] = useState({ open: false, src: "" });

    const navigate = useNavigate();

    // Fetch all feedbacks
    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_RATINGS_API}/feedbacks`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch feedbacks");
            setFeedbacks(data);
            setError(null);
        } catch (err) {
            setError("Failed to fetch feedbacks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    // Can the user write feedback?
    const canWriteFeedback = user && approvedBookings?.length > 0;

    // Pagination
    const startIndex = (currentPage - 1) * FEEDBACKS_PER_PAGE;
    const currentFeedbacks = feedbacks.slice(startIndex, startIndex + FEEDBACKS_PER_PAGE);
    const totalPages = Math.ceil(feedbacks.length / FEEDBACKS_PER_PAGE);

    if (loading) return <p className="status-message loading">Loading feedbacks...</p>;
    if (error) return <p className="status-message error">{error}</p>;

    return (
        <div className="feedbacks-page">

            {/* HERO SECTION */}
            <div className="feedbacks-hero-section">
                <img
                    src={feedbacksbg}
                    alt="Feedbacks Background"
                    className="feedbacks-hero-image"
                />
                <div className="feedbacks-hero-overlay" />
                <div className="feedbacks-hero-content">
                    <h1 className="hero-title">Guest Feedbacks</h1>
                </div>
            </div>

            <div className="feedbacks-content-container">

                {/* WRITE FEEDBACK BUTTON */}
                {canWriteFeedback ? (
                    <div className="write-feedback-btn">
                        <button onClick={() => navigate("/create-feedback")}>
                            Write Feedback
                        </button>
                    </div>
                ) : (
                    user && (
                        <p className="status-message info">
                            You cannot write feedback until you have an approved booking.
                        </p>
                    )
                )}

                {/* FILTERS (disabled for read-only page) */}
                <div className="filters">
                    <select disabled>
                        <option>All Ratings</option>
                    </select>
                    <select disabled>
                        <option>All Feedbacks</option>
                    </select>
                    <input type="date" disabled />
                </div>

                {/* FEEDBACK CARDS */}
                {currentFeedbacks.map((fb) => (
                    <div key={fb.id} className="feedback-card">

                        <div className="feedback-header">
                            <img src={fb.profilePicture || "https://www.gravatar.com/avatar/?d=mp"} alt={fb.name} />
                            <div>
                                <strong>{fb.name}</strong>
                                <div className="stars">{renderStars(fb.rating)}</div>
                                <small>{new Date(fb.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</small>
                            </div>
                        </div>

                        <p className="feedback-message">{fb.message}</p>

                        {/* PHOTOS CLICKABLE */}
                        {fb.photos && String(fb.photos).length > 0 && (
                            <div className="feedback-photos">
                                {String(fb.photos).split(",").map((photo, idx) => (
                                    <img
                                        key={idx}
                                        src={`${process.env.REACT_APP_RATINGS_API}/uploads/feedbacks/${photo.trim()}`}
                                        alt={`Feedback Photo ${idx + 1}`}
                                        onClick={() => setLightbox({ open: true, src: `${process.env.REACT_APP_RATINGS_API}/uploads/feedbacks/${photo.trim()}` })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* PAGINATION */}
                <div className="pagination">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                </div>
            </div>

            {/* LIGHTBOX MODAL */}
            {lightbox.open && (
                <div className="lightbox-overlay" onClick={() => setLightbox({ open: false, src: "" })}>
                    <img className="lightbox-image" src={lightbox.src} alt="Full size feedback" />
                </div>
            )}
        </div>
    );
}
