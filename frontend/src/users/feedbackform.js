// FeedbackForm.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './styles/feedbackform.css'

export default function FeedbackForm({ onSubmitted }) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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

      setMessage("");
      setRating(5);
      setPhotos([]);

      setSuccess("✅ Feedback submitted successfully!");
      if (onSubmitted) onSubmitted();

      setTimeout(() => {
        navigate("/feedback"); // change to your actual route if different
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
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
      >
        <option value={5}>⭐⭐⭐⭐⭐</option>
        <option value={4}>⭐⭐⭐⭐</option>
        <option value={3}>⭐⭐⭐</option>
        <option value={2}>⭐⭐</option>
        <option value={1}>⭐</option>
      </select>

      <label>Message:</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />

      <label>Upload Photos:</label>
      <input type="file" multiple onChange={handleFileChange} />

      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
