// FeedbackForm.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './styles/feedbackform.css'

// Star Component for Reusability and Clean Code
const StarRatingInput = ({ rating, setRating }) => {
    return (
        <div className="star-rating">
            {[...Array(5)].map((_, index) => {
                const starValue = 5 - index; // 5, 4, 3, 2, 1
                return (
                    <span
                        key={starValue}
                        className={`star ${starValue <= rating ? 'filled' : ''}`}
                        onClick={() => setRating(starValue)}
                        // Use a non-emoji star character
                        dangerouslySetInnerHTML={{ __html: '&#9733;' }} // Unicode BLACK STAR (★)
                    />
                );
            })}
        </div>
    );
};

export default function FeedbackForm({ onSubmitted }) {
    const [message, setMessage] = useState("");
    const [rating, setRating] = useState(5); // Default to 5 stars
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]); // State for image URLs
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const files = [...e.target.files];
        setPhotos(files);

        // Create URLs for image previews
        const previews = files.map(file => URL.createObjectURL(file));
        setPhotoPreviews(previews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (!storedUser) {
                setError("You must be logged in to submit feedback.");
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append("name", storedUser.name);
            formData.append(
                "profilePicture",
                storedUser.picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        storedUser.name
                    )}`
            );
            formData.append("message", message);
            formData.append("rating", rating);

            photos.forEach((file) => {
                formData.append("photos", file);
            });

            const res = await fetch(`${process.env.REACT_APP_RATINGS_API}/feedbacks`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to submit feedback");

            // Reset form fields
            setMessage("");
            setRating(5);
            setPhotos([]);
            setPhotoPreviews([]);

            setSuccess("✅ Feedback submitted successfully!");
            if (onSubmitted) onSubmitted();

            setTimeout(() => {
                navigate("/feedback");
            }, 2000);
        } catch (err) {
            console.error(err);
            setError("❌ Failed to submit feedback");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="feedback-form" onSubmit={handleSubmit}>
            <h3>Write Feedback</h3>

            {error && <p className="error">{error}</p>}
            {success && <p className="success-toast">{success}</p>}

            <label>Rating:</label>
            {/* Replaced select with custom StarRatingInput component */}
            <StarRatingInput rating={rating} setRating={setRating} />

            <label>Message:</label>
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
            />

            <label>Upload Photos (Optional):</label>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} />
            
            {/* Photo Preview Section */}
            {photoPreviews.length > 0 && (
                <div className="photo-preview">
                    {photoPreviews.map((src, index) => (
                        <img 
                            key={index} 
                            src={src} 
                            alt={`Preview ${index + 1}`} 
                            // Revoke URL when component is unmounted or previews change to prevent memory leaks
                            onLoad={() => URL.revokeObjectURL(src)} 
                        />
                    ))}
                </div>
            )}

            <button type="submit" disabled={loading || !message}>
                {loading ? "Submitting..." : "Submit Feedback"}
            </button>
        </form>
    );
}
