import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import './styles/aboutus.css'; 

// Assuming this is your base API URL for the aboutus service
const FACILITIES_API_URL = `${process.env.REACT_APP_ABOUTUS_API}/pre/api/facilities`;

const Facilities = () => {
    const [facilitiesList, setFacilitiesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Initialize navigation hook
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                // We no longer expect image_url from the backend
                const response = await axios.get(FACILITIES_API_URL);
                setFacilitiesList(response.data);
            } catch (err) {
                console.error("Error fetching facilities:", err);
                setError('Failed to load facilities. Check backend connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchFacilities();
    }, []);

    // Function to handle the click event and navigate
    const handleFacilityClick = (facilityName) => {
        // Encode the name to make it safe for the URL (e.g., "Swimming Pool" -> "Swimming%20Pool")
        const encodedName = encodeURIComponent(facilityName);
        
        // Navigate to a new detail page where you will display photos 
        // using data fetched from the manageservice API.
        navigate(`/facility-details/${encodedName}`); 
    };

    if (loading) return <p>Loading Facilities...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="aboutus-section facilities-section">
            <h2>Facilities</h2>
            <div className="facilities-list-container">
                {facilitiesList.length > 0 ? (
                    facilitiesList.map(facility => (
                        // Render each facility as a clickable card/button
                        <div 
                            key={facility.id} 
                            className="facility-item clickable-card" 
                            onClick={() => handleFacilityClick(facility.name)}
                            role="button" 
                            tabIndex={0} 
                        >
                            <h3>{facility.name}</h3>
                            {facility.description && <p>{facility.description}</p>}
                            
                            <span className="click-indicator">Click to View Photos ➡️</span>
                        </div>
                    ))
                ) : (
                    <p>No facilities have been added yet.</p>
                )}
            </div>
        </div>
    );
};

export default Facilities;
