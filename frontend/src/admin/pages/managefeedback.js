import React, { useState, useEffect } from "react";
import "./managefeedback.css";

const FEEDBACKS_PER_PAGE = 10;

export default function ManageFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showHidden, setShowHidden] = useState(false);

  const fetchFeedbacks = () => {
    setLoading(true);
    // FIX: Added /api/ to the endpoint
    const url = `${process.env.REACT_APP_RATINGS_API}/api/feedbacks?showDeleted=${showHidden}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const sortedData = data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setFeedbacks(sortedData);
        setLoading(false);
        setError(null);
      })
      .catch(() => {
        setError("Failed to fetch feedbacks");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [showHidden]);

  const handleHide = (id) => {
    if (!window.confirm(`Are you sure you want to hide feedback ID ${id}?`)) return;

    // FIX: Added /api/ to the endpoint
    fetch(`${process.env.REACT_APP_RATINGS_API}/api/feedbacks/${id}/delete`, {
      method: "PUT",
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => fetchFeedbacks())
      .catch(() => setError("Failed to hide feedback"));
  };

  const handleRestore = (id) => {
    if (!window.confirm(`Are you sure you want to restore feedback ID ${id}?`)) return;

    // FIX: Added /api/ to the endpoint
    fetch(`${process.env.REACT_APP_RATINGS_API}/api/feedbacks/${id}/restore`, {
      method: "PUT",
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => fetchFeedbacks())
      .catch(() => setError("Failed to restore feedback"));
  };

  const indexOfLastFeedback = currentPage * FEEDBACKS_PER_PAGE;
  const indexOfFirstFeedback = indexOfLastFeedback - FEEDBACKS_PER_PAGE;
  const currentFeedbacks = feedbacks.slice(indexOfFirstFeedback, indexOfLastFeedback);

  const totalPages = Math.ceil(feedbacks.length / FEEDBACKS_PER_PAGE);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p className="status-message loading">Loading feedbacks...</p>;
  if (error) return <p className="status-message error">{error}</p>;

  return (
    <div className="managefeedback-container">
      <h2>Em'z Bayview Feedbacks</h2>

      <div className="filter-buttons">
        <button
          className={showHidden ? "" : "active-filter"}
          onClick={() => setShowHidden(false)}
        >
          Active Feedbacks
        </button>
        <button
          className={showHidden ? "active-filter" : ""}
          onClick={() => setShowHidden(true)}
        >
          Hidden Feedbacks
        </button>
      </div>

      {feedbacks.length === 0 ? (
        <p className="status-message no-feedback">No feedbacks found.</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="feedback-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Images</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {currentFeedbacks.map((fb) => {
                  const photos = fb.photos ? fb.photos.split(",") : [];

                  return (
                    <tr key={fb.id} className={fb.deleted ? "deleted-row" : ""}>
                      <td>{fb.name}</td>
                      <td>{fb.message}</td>
                      <td>{new Date(fb.created_at).toLocaleString()}</td>

                      <td>
                        {photos.length > 0 ? (
                          <div className="photo-preview-admin">
                            {photos.slice(0, 3).map((photo, index) => (
                              <img
                                key={index}
                                src={`${process.env.REACT_APP_RATINGS_API}/uploads/feedbacks/${photo}`}
                                alt=""
                                className="admin-feedback-image"
                              />
                            ))}

                            {photos.length > 3 && (
                              <span className="photo-count-indicator">
                                +{photos.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>No Images</span>
                        )}
                      </td>

                      <td>{fb.deleted ? "Hidden" : "Active"}</td>

                      <td>
                        {fb.deleted ? (
                          <button className="restore-btn" onClick={() => handleRestore(fb.id)}>
                            Restore
                          </button>
                        ) : (
                          <button className="hide-btn" onClick={() => handleHide(fb.id)}>
                            Hide
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {feedbacks.length > FEEDBACKS_PER_PAGE && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>

              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={`pagination-button ${
                    currentPage === number ? "active" : ""
                  }`}
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
        </>
      )}
    </div>
  );
}
