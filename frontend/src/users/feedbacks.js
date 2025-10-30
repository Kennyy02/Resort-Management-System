import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/feedbacks.css";
// 1. Import the background image
import feedbacksbg from '../components/pictures/feedbacksbg.jpg';

const FEEDBACKS_PER_PAGE = 10;

// Function to render stars (uses an empty star character)
const renderStars = (rating) => {
    const fullStar = '★';
    const emptyStar = '☆';
    return fullStar.repeat(rating) + emptyStar.repeat(5 - rating);
};

export default function Feedbacks({ user }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [replyInputs, setReplyInputs] = useState({});
    const [showReplyBox, setShowReplyBox] = useState({});
    const [anonymousReplies, setAnonymousReplies] = useState({});
    const [filters, setFilters] = useState({ stars: "", withPhoto: null, date: "" });
    const navigate = useNavigate();

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            // Note: The /feedbacks endpoint is often slow/large, consider pagination on the backend later.
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

    const handleLike = async (feedbackId) => {
        if (!user) return alert("Login to like feedback");
        try {
            const res = await fetch(`${process.env.REACT_APP_RATINGS_API}/feedbacks/${feedbackId}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.email }),
            });
            if (!res.ok) throw new Error("Already liked or error");
            fetchFeedbacks();
        } catch (err) {
            alert(err.message);
        }
    };

    const submitReply = async (feedbackId) => {
        if (!user) return alert("Login to reply");

        const message = replyInputs[feedbackId];
        if (!message) return alert("Reply cannot be empty");

        const anonymous = anonymousReplies[feedbackId] || false;

        try {
            const res = await fetch(`${process.env.REACT_APP_RATINGS_API}/feedbacks/${feedbackId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.email,
                    userName: user.name,
                    message,
                    anonymous,
                }),
            });
            if (!res.ok) throw new Error("Failed to reply");
            setReplyInputs({ ...replyInputs, [feedbackId]: "" });
            setAnonymousReplies({ ...anonymousReplies, [feedbackId]: false });
            setShowReplyBox({ ...showReplyBox, [feedbackId]: true });
            fetchFeedbacks();
        } catch (err) {
            alert(err.message);
        }
    };

    const editFeedback = async (feedback) => {
        const newMessage = prompt("Edit your feedback:", feedback.message);
        if (!newMessage) return;

        try {
            const res = await fetch(`${process.env.REACT_APP_RATINGS_API}/feedbacks/${feedback.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: newMessage }),
            });
            if (!res.ok) throw new Error("Failed to edit feedback");
            fetchFeedbacks();
        } catch (err) {
            alert(err.message);
        }
    };

    const deleteFeedback = async (feedbackId) => {
        if (!window.confirm("Are you sure you want to delete this feedback?")) return;
        try {
            const res = await fetch(`${process.env.REACT_APP_RATINGS_API}/feedbacks/${feedbackId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete feedback");
            fetchFeedbacks();
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredFeedbacks = feedbacks.filter((fb) => {
        if (filters.stars && fb.rating !== Number(filters.stars)) return false;
        if (filters.withPhoto !== null) {
            if (filters.withPhoto && (!fb.photos || String(fb.photos).length === 0)) return false;
            // The logic below means: if filter is NO photo, hide if photos EXIST
            if (!filters.withPhoto && fb.photos && String(fb.photos).length > 0) return false;
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
        <div className="feedbacks-page"> {/* Changed container name for full-width hero */}
            
            {/* --- HERO SECTION --- */}
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
            
            <div className="feedbacks-content-container"> {/* New container for content centering */}
                
                {/* Removed the original <h2> tag for the title */}

                {user && (
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
                                {/* 2. Star Rating FIX: Use renderStars function */}
                                <div className="stars">{renderStars(fb.rating)}</div>
                                <small>{new Date(fb.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</small>
                            </div>
                        </div>

                        <p className="feedback-message">{fb.message}</p>

                        {/* 3. Image Loading FIX: Use the correct base URL for photos */}
                        {fb.photos && String(fb.photos).length > 0 && (
                            <div className="feedback-photos">
                                {String(fb.photos).split(",").map((photo, idx) => (
                                    <img 
                                        key={idx} 
                                        // CORRECTED URL: Make sure the environment variable is the base URL
                                        src={`${process.env.REACT_APP_RATINGS_API}/uploads/feedbacks/${photo.trim()}`} 
                                        alt={`Feedback Photo ${idx + 1}`} 
                                    />
                                ))}
                            </div>
                        )}

                        <div className="feedback-actions">
                            <button onClick={() => handleLike(fb.id)} disabled={fb.likedBy?.includes(user?.email)}>
                                👍 {fb.likes || 0}
                            </button>

                            <button onClick={() => setShowReplyBox({ ...showReplyBox, [fb.id]: !showReplyBox[fb.id] })}>
                                💬 Reply
                            </button>

                            {/* Show reply box and previous replies only when clicked */}
                            {showReplyBox[fb.id] && (
                                <>
                                    <div className="replies-list">
                                        {fb.replies?.map((r) => (
                                            <div key={r.id} className="reply-card">
                                                <strong>{r.user.name}</strong>: {r.message}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="reply-box">
                                        <input
                                            type="text"
                                            placeholder="Write a reply..."
                                            value={replyInputs[fb.id] || ""}
                                            onChange={(e) => setReplyInputs({ ...replyInputs, [fb.id]: e.target.value })}
                                        />
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={anonymousReplies[fb.id] || false}
                                                onChange={(e) => setAnonymousReplies({ ...anonymousReplies, [fb.id]: e.target.checked })}
                                            />
                                            Reply as Anonymous
                                        </label>
                                        <button onClick={() => submitReply(fb.id)}>Submit</button>
                                    </div>
                                </>
                            )}

                            {user?.email === fb.userId && (
                                <div className="feedback-owner-actions">
                                    <button onClick={() => editFeedback(fb)}>✏️ Edit</button>
                                    <button onClick={() => deleteFeedback(fb.id)}>🗑️ Delete</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <div className="pagination">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                        Prev
                    </button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
