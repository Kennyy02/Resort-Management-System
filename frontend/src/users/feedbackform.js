// FeedbackForm.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/feedbackform.css";

// Star Component
const StarRatingInput = ({ rating, setRating }) => {
  return (
    <div className="star-rating">
      {[...Array(5)].map((_, index) => {
        const starValue = 5 - index;

        return (
          <span
            key={starValue}
            className={`star ${starValue <= rating ? "filled" : ""}`}
            onClick={() => setRating(starValue)}
            dangerouslySetInnerHTML={{ __html: "&#9733;" }}
          />
        );
      })}
    </div>
  );
};

export default function FeedbackForm({ onSubmitted }) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const files = [...e.target.files];
    setPhotos(files);

    const previews = files.map((file) => URL.createObjectURL(file));
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

      // ✅ FIXED URL (THIS WAS THE MAIN ERROR)
      const res = await fetch(
        `${process.env.REACT_APP_RATINGS_API}/api/feedbacks`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit feedback");
      }

      setMessage("");
      setRating(5);
      setPhotos([]);
      setPhotoPreviews([]);

      setSuccess("✅ Feedback submitted successfully!");
      if (onSubmitted) onSubmitted();

      setTimeout(() => {
        navigate("/feedbacks"); // make sure this route is correct
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("❌ " + err.message);
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
      <StarRatingInput rating={rating} setRating={setRating} />

      <label>Message:</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />

      <label>Upload Photos (Optional):</label>
      <input type="file" multiple accept="image/*" onChange={handleFileChange} />

      {photoPreviews.length > 0 && (
        <div className="photo-preview">
          {photoPreviews.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Preview ${index + 1}`}
              onLoad={() => URL.revokeObjectURL(src)}
            />
          ))}
        </div>
      )}

      <button type="submit" disabled={loading || !message.trim()}>
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
