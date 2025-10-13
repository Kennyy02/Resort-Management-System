import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./contactview.css";

const MESSAGES_PER_PAGE = 10; // Constant for pagination limit

export default function ContactView() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1); // Added state for current page

    const fetchMessages = async () => {
        setLoading(true);
        try {
            // --- CRITICAL FIX 1: Use the CONTACT API environment variable ---
            const response = await axios.get(`${process.env.REACT_APP_CONTACT_API}/api/messages`);
            setMessages(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load messages. Please check the server and database connection.');
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const toggleStatus = async (id, currentStatus) => {
        if (currentStatus === 'answered') {
            return;
        }

        const newStatus = 'answered';
        try {
            // --- CRITICAL FIX 2: Use the CONTACT API environment variable ---
            await axios.put(`${process.env.REACT_APP_CONTACT_API}/api/messages/${id}/status`, { status: newStatus });
            setMessages(messages.map(msg => msg.id === id ? { ...msg, status: newStatus } : msg));
        } catch (err) {
            alert('Failed to update status.');
            console.error(err);
        }
    };

    // --- Filtering and Sorting Logic (Applied to all messages) ---
    let filteredMessages = [...messages];
    if (filter === 'answered') filteredMessages = filteredMessages.filter(m => m.status === 'answered');
    if (filter === 'notAnswered') filteredMessages = filteredMessages.filter(m => m.status !== 'answered');
    
    if (sort === 'newest') filteredMessages.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (sort === 'oldest') filteredMessages.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredMessages.length / MESSAGES_PER_PAGE);
    const startIndex = (currentPage - 1) * MESSAGES_PER_PAGE;
    const currentMessages = filteredMessages.slice(startIndex, startIndex + MESSAGES_PER_PAGE);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <p className="status-message loading-message">Loading messages...</p>;
    if (error) return <p className="status-message error-message">{error}</p>;

    return (
        <div className="admin-contact-card">
            <h2>Guest Messages</h2>
            
            <div className="filter-controls">
                <div>
                    <label>Filter: </label>
                    <select value={filter} onChange={e => { setFilter(e.target.value); setCurrentPage(1); }}> {/* Reset page on filter change */}
                        <option value="all">All</option>
                        <option value="answered">Answered</option>
                        <option value="notAnswered">Not answered</option>
                    </select>
                </div>
                <div>
                    <label>Sort: </label>
                    <select value={sort} onChange={e => { setSort(e.target.value); setCurrentPage(1); }}> {/* Reset page on sort change */}
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                    </select>
                </div>
            </div>

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
                                {currentMessages.map(msg => (
                                    <tr key={msg.id}>
                                        <td>{msg.name}</td>
                                        <td>{msg.email}</td>
                                        <td>{msg.message}</td>
                                        <td>{new Date(msg.created_at).toLocaleString()}</td>
                                        <td>
                                            <span className={`status-badge status-${msg.status === 'answered' ? 'answered' : 'pending'}`}>
                                                {msg.status === 'answered' ? 'Answered' : 'Not Answered'}
                                            </span>
                                        </td>
                                        <td>
                                            {msg.status !== 'answered' && (
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
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
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
