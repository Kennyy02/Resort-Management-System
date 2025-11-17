import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './aboutus.css'; // Assuming your styles are here

const BASE_URL = process.env.REACT_APP_ABOUTUS_API;

const GENERAL_API_URL = `${BASE_URL}/pre/api/aboutus`;
const FACILITIES_API_URL = `${BASE_URL}/pre/api/facilities`;
const POLICIES_API_URL = `${BASE_URL}/pre/api/policies`;

const AdminAboutUs = () => {
    const [generalContent, setGeneralContent] = useState('');
    const [generalId, setGeneralId] = useState(null);

    const [facilitiesList, setFacilitiesList] = useState([]);
    const [newFacilityName, setNewFacilityName] = useState('');
    const [newFacilityDescription, setNewFacilityDescription] = useState('');
    const [editingFacility, setEditingFacility] = useState(null);

    const [policiesList, setPoliciesList] = useState([]);
    const [newPolicyText, setNewPolicyText] = useState('');
    const [newPolicyCategory, setNewPolicyCategory] = useState('');
    const [editingPolicy, setEditingPolicy] = useState(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Pagination
    const [facilityPage, setFacilityPage] = useState(1);
    const [policyPage, setPolicyPage] = useState(1);
    const pageSize = 5;

    const policyCategories = useMemo(() => ([
        { value: 'terms_booking', label: 'Terms of Payment & Booking Policies' },
        { value: 'check_in_out', label: 'Check-in & Check-out Policies' },
        { value: 'occupancy_room_service', label: 'Occupancy & Room Service' },
        { value: 'safety_conduct', label: 'Safety Precautions, Risk Control & Proper Conduct' },
        { value: 'swimming_pool_rules', label: 'Swimming Pool Rules' },
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
            if(generalResponse.data.length) {
                setGeneralContent(generalResponse.data[0].content);
                setGeneralId(generalResponse.data[0].id);
            } else {
                setGeneralContent('');
                setGeneralId(null);
            }

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
    
    // General Info Functions
    const handleGeneralSubmit = async () => {
        if (!generalContent.trim()) { setError('General content cannot be empty'); return; }
        setLoading(true); setMessage(''); setError('');
        try {
            const data = { type: 'general', content: generalContent };
            await axios.post(GENERAL_API_URL, data);
            setMessage('General content saved successfully!');
            fetchAllContent();
        } catch (err) { setError('Failed to save general content'); }
        finally { setLoading(false); }
    };

    const handleGeneralDelete = async () => {
        if (!window.confirm('Are you sure you want to delete the General Content?')) return;
        setLoading(true); setMessage(''); setError('');
        try {
            await axios.delete(`${GENERAL_API_URL}/general`);
            setMessage('General content deleted!');
            setGeneralContent('');
            setGeneralId(null);
        } catch (err) { setError('Failed to delete general content'); }
        finally { setLoading(false); }
    };

    // Facilities Functions - IMAGE LOGIC REMOVED
    const handleAddUpdateFacility = async () => {
        if (!newFacilityName.trim()) { setError('Facility name cannot be empty'); return; }

        setLoading(true); setMessage(''); setError('');
        
        try {
            // Data no longer includes image_url
            const data = { 
                name: newFacilityName, 
                description: newFacilityDescription
            };

            if (editingFacility) {
                await axios.put(`${FACILITIES_API_URL}/${editingFacility.id}`, data);
                setMessage('Facility updated successfully!');
                setEditingFacility(null);
            } else {
                await axios.post(FACILITIES_API_URL, data);
                setMessage('Facility added successfully!');
            }
            // Reset fields
            setNewFacilityName(''); 
            setNewFacilityDescription('');
            fetchAllContent();
        } catch (err) { setError('Failed to save facility'); }
        finally { setLoading(false); }
    };

    const handleDeleteFacility = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        setLoading(true); setMessage(''); setError('');
        try {
            await axios.delete(`${FACILITIES_API_URL}/${id}`);
            setMessage(`Facility "${name}" deleted!`);
            fetchAllContent();
        } catch (err) { setError('Failed to delete facility'); }
        finally { setLoading(false); }
    };

    const startEditFacility = (f) => { 
        setEditingFacility(f); 
        setNewFacilityName(f.name); 
        setNewFacilityDescription(f.description || ''); 
        setEditingPolicy(null);
        setNewPolicyText('');
    };

    const cancelEditFacility = () => { 
        setEditingFacility(null); 
        setNewFacilityName(''); 
        setNewFacilityDescription(''); 
    };

    // Policies Functions (remain unchanged)
    const handleAddUpdatePolicy = async () => {
        if (!newPolicyText.trim()) { setError('Policy text cannot be empty'); return; }
        if (!newPolicyCategory) { setError('Policy category cannot be empty'); return; }

        setLoading(true); setMessage(''); setError('');

        try {
            const data = { 
                policy_text: newPolicyText, 
                category: newPolicyCategory 
            };
            if (editingPolicy) {
                await axios.put(`${POLICIES_API_URL}/${editingPolicy.id}`, data);
                setMessage('Policy updated successfully!');
                setEditingPolicy(null);
            } else {
                await axios.post(POLICIES_API_URL, data);
                setMessage('Policy added successfully!');
            }
            setNewPolicyText('');
            setNewPolicyCategory(policyCategories[0].value);
            fetchAllContent();
        } catch (err) {
            setError('Failed to save policy');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeletePolicy = async (id) => {
        if (!window.confirm('Delete this policy?')) return;
        setLoading(true); setMessage(''); setError('');

        try {
            await axios.delete(`${POLICIES_API_URL}/${id}`);
            setMessage('Policy deleted!');
            fetchAllContent();
        } catch (err) {
            setError('Failed to delete policy');
        } finally {
            setLoading(false);
        }
    };

    const startEditPolicy = (p) => {
        setEditingPolicy(p);
        setNewPolicyText(p.policy_text);
        setNewPolicyCategory(p.category);
        setEditingFacility(null);
        setNewFacilityName('');
    };

    const cancelEditPolicy = () => {
        setEditingPolicy(null);
        setNewPolicyText('');
        setNewPolicyCategory(policyCategories[0].value);
    };

    // Pagination helpers
    const paginate = (items, page) => items.slice((page-1)*pageSize, page*pageSize);
    const totalFacilityPages = Math.ceil(facilitiesList.length / pageSize);
    const totalPolicyPages = Math.ceil(policiesList.length / pageSize);
    const getCategoryLabel = (value) => {
        const category = policyCategories.find(c => c.value === value);
        return category ? category.label : 'N/A';
    };

    return (
        <div className="aboutus-container full-page">
            <h1>Manage About Us Content</h1>

            {loading && <p className="info-message">Loading...</p>}
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="main-content-wrapper">

                {/* General Info */}
                <div className="admin-section general-section">
                    <h2>General Information</h2>
                    <div className="form-group">
                        <label>Content</label>
                        <textarea value={generalContent} onChange={e => setGeneralContent(e.target.value)} rows="8" placeholder="Enter general resort information..."/>
                    </div>
                    <div className="admin-actions">
                        <button onClick={handleGeneralSubmit}>{generalId ? 'Update Content' : 'Save Content'}</button>
                        {generalId && <button onClick={handleGeneralDelete} className="delete-btn">Delete Content</button>}
                    </div>
                </div>

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
                    
                    {/* REMOVED: Image URL/File Input Field HERE */}

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
                                        </div>
                                        <div className="item-actions">
                                            <button onClick={()=>startEditFacility(f)} className="edit-btn">Edit</button>
                                            <button onClick={()=>handleDeleteFacility(f.id, f.name)} className="delete-btn">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pagination">
                                {Array.from({length: totalFacilityPages}, (_,i)=>(
                                    <button key={i} className={facilityPage===i+1?'active':'inactive'} onClick={()=>setFacilityPage(i+1)}>{i+1}</button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                
                {/* Policies (unchanged) */}
                <div className="admin-section policies-section">
                    <h2>Manage Policies</h2>
                    {/* ... Policy form and list rendering ... */}
                    <div className="form-group">
                        <label>Policy Text</label>
                        <textarea value={newPolicyText} onChange={e => setNewPolicyText(e.target.value)} rows="3" placeholder="Enter policy text (e.g., Check-out is strictly 12:00 PM)"/>
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select value={newPolicyCategory} onChange={e => setNewPolicyCategory(e.target.value)}>
                            {policyCategories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-actions">
                        {editingPolicy && <button onClick={cancelEditPolicy} className="cancel-btn">Cancel Edit</button>}
                        <button onClick={handleAddUpdatePolicy}>{editingPolicy ? 'Update' : 'Add'} Policy</button>
                    </div>

                    {policiesList.length > 0 && (
                        <>
                            <h3>Existing Policies</h3>
                            <div className="item-list">
                                {paginate(policiesList, policyPage).map(p => (
                                    <div key={p.id} className="item-card policy-card">
                                        <div className="item-details">
                                            <p className="policy-text-display"><strong>{p.policy_text}</strong></p>
                                            <small className="policy-category-display">Category: {getCategoryLabel(p.category)}</small>
                                        </div>
                                        <div className="item-actions">
                                            <button onClick={() => startEditPolicy(p)} className="edit-btn">Edit</button>
                                            <button onClick={() => handleDeletePolicy(p.id)} className="delete-btn">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pagination">
                                {Array.from({length: totalPolicyPages}, (_, i) => (
                                    <button key={i} className={policyPage === i + 1 ? 'active' : 'inactive'} onClick={() => setPolicyPage(i + 1)}>{i + 1}</button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAboutUs;
