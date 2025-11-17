import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './aboutus.css';

const BASE_URL = process.env.REACT_APP_ABOUTUS_API;

const GENERAL_API_URL = `${BASE_URL}/pre/api/aboutus`;
const FACILITIES_API_URL = `${BASE_URL}/pre/api/facilities`;
const POLICIES_API_URL = `${BASE_URL}/pre/api/policies`;

const AdminAboutUs = () => {
    const [generalContent, setGeneralContent] = useState('');

    const [facilitiesList, setFacilitiesList] = useState([]);
    const [newFacilityName, setNewFacilityName] = useState('');
    const [newFacilityDescription, setNewFacilityDescription] = useState('');
    // ADDED STATE: For Facility Image URL
    const [newFacilityImageUrl, setNewFacilityImageUrl] = useState('');
    const [editingFacility, setEditingFacility] = useState(null);

    const [policiesList, setPoliciesList] = useState([]);
// ... (rest of policy states)

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Pagination
    const [facilityPage, setFacilityPage] = useState(1);
    const [policyPage, setPolicyPage] = useState(1);
    const pageSize = 5;

    const policyCategories = useMemo(() => ([
        { value: 'terms_booking', label: 'Terms of Payment & Booking Policies' },
// ... (rest of policy categories)
        { value: 'other_policies', label: 'Other Resort Policies' },
    ]), []);

    useEffect(() => {
        fetchAllContent();
        if (policyCategories.length > 0) setNewPolicyCategory(policyCategories[0].value);
    }, [policyCategories]);

    const fetchAllContent = async () => {
        setLoading(true);
        setError('');
        try {
            const generalResponse = await axios.get(GENERAL_API_URL);
            setGeneralContent(generalResponse.data.length ? generalResponse.data[0].content : '');

            const facilitiesResponse = await axios.get(FACILITIES_API_URL);
            setFacilitiesList(facilitiesResponse.data);

            const policiesResponse = await axios.get(POLICIES_API_URL);
            setPoliciesList(policiesResponse.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch content. Check backend.');
        } finally {
            setLoading(false);
        }
    };

    // ... (handleGeneralSubmit and handleGeneralDelete functions)

    // Facilities
    const handleAddUpdateFacility = async () => {
        if (!newFacilityName.trim()) { setError('Facility name cannot be empty'); return; }
        setLoading(true); setMessage(''); setError('');
        try {
            const data = { 
                name: newFacilityName, 
                description: newFacilityDescription, 
                image_url: newFacilityImageUrl // ADDED: Image URL in payload
            };

            if (editingFacility) {
                await axios.put(`${FACILITIES_API_URL}/${editingFacility.id}`, data);
                setEditingFacility(null);
            } else {
                await axios.post(FACILITIES_API_URL, data);
            }
            // Reset fields
            setNewFacilityName(''); 
            setNewFacilityDescription('');
            setNewFacilityImageUrl(''); // ADDED: Reset Image URL field
            fetchAllContent();
        } catch (err) { setError('Failed to save facility'); }
        finally { setLoading(false); }
    };

    const handleDeleteFacility = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
// ... (rest of delete logic)
    };

    const startEditFacility = (f) => { 
        setEditingFacility(f); 
        setNewFacilityName(f.name); 
        setNewFacilityDescription(f.description || ''); 
        setNewFacilityImageUrl(f.image_url || ''); // ADDED: Set existing image URL
    };
    const cancelEditFacility = () => { 
        setEditingFacility(null); 
        setNewFacilityName(''); 
        setNewFacilityDescription(''); 
        setNewFacilityImageUrl(''); // ADDED: Clear image URL field
    };

    // ... (Policies functions)

    // Pagination helpers
    const paginate = (items, page) => items.slice((page-1)*pageSize, page*pageSize);

    return (
        <div className="aboutus-container full-page">
            <h1>Manage About Us Content</h1>

            {loading && <p className="info-message">Loading...</p>}
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="main-content-wrapper">

                {/* General Info */}
// ... (General Info section)

                {/* Facilities */}
                <div className="admin-section facilities-section">
                    <h2>Manage Facilities</h2>
                    <div className="form-group">
                        <label>Facility Name</label>
                        <input value={newFacilityName} onChange={e=>setNewFacilityName(e.target.value)} placeholder="e.g., Swimming Pool"/>
                    </div>
                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea value={newFacilityDescription} onChange={e=>setNewFacilityDescription(e.target.value)} rows="3" placeholder="Description..."/>
                    </div>
                    {/* NEW INPUT FIELD: Image URL */}
                    <div className="form-group">
                        <label>Image URL (Optional)</label>
                        <input value={newFacilityImageUrl} onChange={e=>setNewFacilityImageUrl(e.target.value)} placeholder="https://example.com/photo.jpg"/>
                    </div>
                    <div className="admin-actions">
                        {editingFacility && <button onClick={cancelEditFacility} className="cancel-btn">Cancel Edit</button>}
                        <button onClick={handleAddUpdateFacility}>{editingFacility ? 'Update' : 'Add'} Facility</button>
                    </div>

                    {facilitiesList.length > 0 && (
                        <>
                            <h3>Existing Facilities</h3>
                            <div className="item-list">
                                {paginate(facilitiesList, facilityPage).map(f => (
                                    <div key={f.id} className="item-card">
                                        <div className="item-details">
                                            <strong>{f.name}</strong>
                                            {f.description && <p>{f.description}</p>}
                                            {/* Display image status */}
                                            <p className="image-status-text">Image: {f.image_url ? '✅ Set' : '❌ None'}</p>
                                        </div>
                                        <div className="item-actions">
                                            <button onClick={()=>startEditFacility(f)} className="edit-btn">Edit</button>
                                            <button onClick={()=>handleDeleteFacility(f.id, f.name)} className="delete-btn">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pagination">
                                {Array.from({length: Math.ceil(facilitiesList.length/pageSize)}, (_,i)=>(
                                    <button key={i} className={facilityPage===i+1?'active':'inactive'} onClick={()=>setFacilityPage(i+1)}>{i+1}</button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Policies */}
// ... (Policies section)

                </div>

            </div>
        </div>
    );
};

export default AdminAboutUs;
