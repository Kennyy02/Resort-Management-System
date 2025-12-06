import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/feedbacks.css";
import feedbacksbg from '../components/pictures/feedbacksbg.jpg';

const FEEDBACKS_PER_PAGE = 10;

// Function to render stars
const renderStars = (rating) => {
    const fullStar = '★';
    const emptyStar = '☆';
    return fullStar.repeat(rating) + emptyStar.repeat(5 - rating);
};

// Ensure this component receives 'user' as a prop
export default function Feedbacks({ user }) { 
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ stars: "", withPhoto: null, date: "" });
    // FIX: Initialize eligibility based on user presence
    const [userEligible, setUserEligible] = useState(!!user); 
    const navigate = useNavigate();

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            // Backend route is correct: /api/feedbacks
            const res = await fetch(`${process.env.REACT_APP_RATINGS_API}/api/feedbacks`); 
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch feedbacks");
            setFeedbacks(data.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
            setError(null);
        } catch (err) {
            setError("Failed to fetch feedbacks");
        } finally {
            setLoading(false);
        }
    };

    // FIX: Simplified logic - runs when component mounts and whenever 'user' state changes.
    useEffect(() => {
        fetchFeedbacks();
        // Check if user object exists (logged in)
        setUserEligible(!!user);
    }, [user]); 

    // Filter feedbacks
    const filteredFeedbacks = feedbacks.filter((fb) => {
        if (filters.stars && fb.rating !== Number(filters.stars)) return false;
        if (filters.withPhoto !== null) {
            if (filters.withPhoto && (!fb.photos || fb.photos.length === 0)) return false;
            if (!filters.withPhoto && fb.photos && fb.photos.length > 0) return false;
        }
        if (filters.date && new Date(fb.created_at).toDateString() !== new Date(filters.date).toDateString())
            return false;
        return true;
    });

    const startIndex = (currentPage - 1) * FEEDBACKS_PER_PAGE;
    const currentFeedbacks = filteredFeedbacks.slice(startIndex, startIndex + FEEDBACKS_PER_PAGE);
    const totalPages = Math.ceil(filteredFeedbacks.length / FEEDBACKS_PER_PAGE);

    if (loading) return <p className="status-message loading">Loading feedbacks...</p>;
    if (error) return <p className="status-message error">{error}</p>;

    return (
        <div className="feedbacks-page">
            <div className="feedbacks-hero-section">
                <img src={feedbacksbg} alt="Feedbacks Background" className="feedbacks-hero-image" />
                <div className="feedbacks-hero-overlay" />
                <div className="feedbacks-hero-content">
                    <h1 className="hero-title">Guest Feedbacks</h1>
                </div>
            </div>

            <div className="feedbacks-content-container">
                {/* Button is visible if user is logged in */}
                {userEligible && (
                    <div className="write-feedback-btn">
                        <button onClick={() => navigate("/create-feedback")}>✍️ Write Feedback</button>
                    </div>
                )}

                {/* Filters */}
                <div className="filters">
                    <select value={filters.stars} onChange={(e) => setFilters({ ...filters, stars: e.target.value })}>
                        <option value="">All Ratings</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>

                    <select
                        value={filters.withPhoto ?? ""}
                        onChange={(e) =>
                            setFilters({ ...filters, withPhoto: e.target.value === "" ? null : e.target.value === "yes" })
                        }
                    >
                        <option value="">All Feedbacks</option>
                        <option value="yes">With Photo</option>
                        <option value="no">Without Photo</option>
                    </select>

                    <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    />
                </div>

                {/* Feedback cards */}
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

                        {fb.photos && fb.photos.length > 0 && (
                            <div className="feedback-photos">
                                {fb.photos.split(",").map((photo, idx) => (
                                    <a
                                        key={idx}
                                        href={`${process.env.REACT_APP_RATINGS_API}/uploads/feedbacks/${photo.trim()}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <img
                                            src={`${process.env.REACT_APP_RATINGS_API}/uploads/feedbacks/${photo.trim()}`}
                                            alt={`Feedback Photo ${idx + 1}`}
                                        />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Pagination */}
                <div className="pagination">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                </div>
            </div>
        </div>
    );
}
