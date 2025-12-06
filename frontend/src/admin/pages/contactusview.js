import React, { useEffect, useState } from "react";
import axios from "axios";
import "./contactview.css";

const MESSAGES_PER_PAGE = 10;

export default function ContactView() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_CONTACT_API}/api/messages`
      );
      setMessages(data);
      setError(null);
    } catch (err) {
      setError("Failed to load messages. Please check the server and API endpoint.");
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    if (currentStatus === "answered") return;

    try {
      await axios.put(
        `${process.env.REACT_APP_CONTACT_API}/api/messages/${id}/status`,
        { status: "answered" }
      );
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, status: "answered" } : msg))
      );
    } catch (err) {
      alert("Failed to update status.");
      console.error(err);
    }
  };

  // --- Filtering and Sorting ---
  let visibleMessages = [...messages];

  if (filter === "answered") visibleMessages = visibleMessages.filter((m) => m.status === "answered");
  if (filter === "notAnswered") visibleMessages = visibleMessages.filter((m) => m.status !== "answered");

  visibleMessages.sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sort === "newest" ? dateB - dateA : dateA - dateB;
  });

  // --- Pagination ---
  const totalPages = Math.ceil(visibleMessages.length / MESSAGES_PER_PAGE);
  const currentMessages = visibleMessages.slice(
    (currentPage - 1) * MESSAGES_PER_PAGE,
    currentPage * MESSAGES_PER_PAGE
  );

  const MAX_VISIBLE_PAGES = 3;
  const startPage = Math.floor((currentPage - 1) / MAX_VISIBLE_PAGES) * MAX_VISIBLE_PAGES + 1;
  const endPage = Math.min(startPage + MAX_VISIBLE_PAGES - 1, totalPages);
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  // --- Render Loading / Error ---
  if (loading) return <p className="status-message loading-message">Loading messages...</p>;
  if (error) return <p className="status-message error-message">{error}</p>;

  return (
    <div className="admin-contact-card">
      <h2>Guest Messages</h2>

      {/* Filter & Sort */}
      <div className="filter-controls">
        <div>
          <label>Filter: </label>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="answered">Answered</option>
            <option value="notAnswered">Not answered</option>
          </select>
        </div>
        <div>
          <label>Sort: </label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Messages Table */}
      {currentMessages.length === 0 ? (
        <p className="status-message no-data">No messages found.</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="contact-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentMessages.map((msg) => (
                  <tr key={msg.id}>
                    <td>{msg.name}</td>
                    <td>{msg.email}</td>
                    <td>{msg.message}</td>
                    <td>
                      {/* <-- FIX: Check if date exists before attempting to format it */}
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleString()
                        : 'N/A'} 
                    </td>
                    <td>
                      <span
                        className={`status-badge status-${msg.status === "answered" ? "answered" : "pending"}`}
                      >
                        {msg.status === "answered" ? "Answered" : "Not Answered"}
                      </span>
                    </td>
                    <td>
                      {msg.status !== "answered" && (
                        <button
                          className="action-button answered-button"
                          onClick={() => toggleStatus(msg.id, msg.status)}
                        >
                          Mark as Answered
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-button ${currentPage === page ? "active" : ""}`}
                >
                  {page}
                </button>
              ))}

              <button
                className="pagination-button"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
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
