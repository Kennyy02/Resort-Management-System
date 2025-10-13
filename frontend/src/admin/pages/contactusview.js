import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./contactview.css";
import { ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_CONTACT_API || 'http://localhost:8081';
const MESSAGES_PER_PAGE = 10;

// Utility function to safely format the date and handle potential 'Invalid Date' issues
const formatDisplayDate = (dateString) => {
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return "---"; // Display fallback for invalid dates
        }
        return date.toLocaleString();
    } catch (e) {
        return "---";
    }
};

export default function ContactView() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Handler to reset page when filter changes
    const handleFilterChange = (value) => {
        setFilter(value);
        setCurrentPage(1);
    };

    // Handler to reset page when sort changes
    const handleSortChange = (value) => {
        setSort(value);
        setCurrentPage(1);
    };

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/messages`);
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
            await axios.put(`${API_BASE_URL}/api/messages/${id}/status`, { status: newStatus });
            // Optimistically update the local state
            setMessages(messages.map(msg => msg.id === id ? { ...msg, status: newStatus } : msg));
        } catch (err) {
            // Replaced alert() with console error and visible error message
            console.error('Failed to update status:', err);
            setError('Failed to update status.');
        }
    };

    // 1. Filter Messages
    let filteredMessages = [...messages];
    if (filter === 'answered') filteredMessages = filteredMessages.filter(m => m.status === 'answered');
    if (filter === 'notAnswered') filteredMessages = filteredMessages.filter(m => m.status !== 'answered');
    
    // 2. Sort Messages
    if (sort === 'newest') filteredMessages.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (sort === 'oldest') filteredMessages.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

    // 3. Pagination calculation
    const totalPages = Math.max(1, Math.ceil(filteredMessages.length / MESSAGES_PER_PAGE));
    const startIndex = (currentPage - 1) * MESSAGES_PER_PAGE;
    const currentMessages = filteredMessages.slice(startIndex, startIndex + MESSAGES_PER_PAGE);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    if (loading) return <p className="status-message loading-message">Loading messages...</p>;
    // Display general errors if they occur
    if (error && error !== 'Failed to update status.') return <p className="status-message error-message">{error}</p>;

    return (
        <div className="admin-contact-card">
            <h2>Guest Messages</h2>
            
            {/* Filter and Sort Controls */}
            <div className="filter-controls">
                <div>
                    <label>Filter: </label>
                    <select value={filter} onChange={e => handleFilterChange(e.target.value)}>
                        <option value="all">All</option>
                        <option value="answered">Answered</option>
                        <option value="notAnswered">Not Answered</option>
                    </select>
                </div>
                <div>
                    <label>Sort: </label>
                    <select value={sort} onChange={e => handleSortChange(e.target.value)}>
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                    </select>
                </div>
            </div>

            {currentMessages.length === 0 && filteredMessages.length > 0 && currentPage > 1 ? (
                 <p className="status-message no-data">No messages on this page. Go back to page 1.</p>
            ) : currentMessages.length === 0 ? (
                 <p className="status-message no-data">No messages found matching the filter/sort criteria.</p>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="contact-table">
                            <thead>
                                <tr>
                                    <th style={{width: '15%'}}>Name</th>
                                    <th style={{width: '20%'}}>Email</th>
                                    <th style={{width: '30%'}}>Message</th>
                                    <th style={{width: '15%'}}>Date Submitted</th>
                                    <th style={{width: '10%'}}>Status</th>
                                    <th style={{width: '10%'}}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentMessages.map(msg => (
                                    // CRITICAL FIX: Added data-label attributes for correct responsive display
                                    <tr key={msg.id}>
                                        <td data-label="Name">{msg.name}</td>
                                        <td data-label="Email">{msg.email}</td>
                                        <td data-label="Message" className="message-content">{msg.message}</td>
                                        <td data-label="Date Submitted">{formatDisplayDate(msg.created_at)}</td>
                                        <td data-label="Status">
                                            <span className={`status-badge status-${msg.status === 'answered' ? 'answered' : 'pending'}`}>
                                                {/* Added icons for better status visibility */}
                                                {msg.status === 'answered' ? <CheckCircle size={14} className="icon-badge" /> : <Clock size={14} className="icon-badge" />}
                                                {msg.status === 'answered' ? ' Answered' : ' Not Answered'}
                                            </span>
                                        </td>
                                        <td data-label="Action">
                                            {msg.status !== 'answered' && (
                                                <button 
                                                    className="action-button answered-button"
                                                    onClick={() => toggleStatus(msg.id, msg.status)}
                                                >
                                                    Mark as Answered
                                                </button>
                                            )}
                                            {/* Show a disabled button if answered */}
                                            {msg.status === 'answered' && (
                                                <button 
                                                    className="action-button answered-button answered-disabled"
                                                    disabled
                                                >
                                                    Answered
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
                        <div className="pagination-container">
                            <span className="pagination-summary">
                                Showing {startIndex + 1} - {Math.min(startIndex + MESSAGES_PER_PAGE, filteredMessages.length)} of {filteredMessages.length} messages
                            </span>
                            <div className="pagination">
                                <button
                                    className="pagination-button"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    aria-label="Previous Page"
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>
                                {pageNumbers.map((number) => (
                                    <button
                                        key={number}
                                        onClick={() => handlePageChange(number)}
                                        className={`pagination-button page-number ${
                                            currentPage === number ? "active" : ""
                                        }`}
                                        aria-label={`Page ${number}`}
                                    >
                                        {number}
                                    </button>
                                ))}
                                <button
                                    className="pagination-button"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    aria-label="Next Page"
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
