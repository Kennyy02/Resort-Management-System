import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './aboutus.css';

const GENERAL_API_URL = 'http://localhost:5006/pre/api/aboutus';
const FACILITIES_API_URL = 'http://localhost:5006/pre/api/facilities';
const POLICIES_API_URL = 'http://localhost:5006/pre/api/policies';

const AdminAboutUs = () => {
    const [generalContent, setGeneralContent] = useState('');

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

    const handleGeneralSubmit = async () => {
        setLoading(true); setMessage(''); setError('');
        try {
            const response = await axios.post(GENERAL_API_URL, { type: 'general', content: generalContent });
            setMessage(response.data.message);
            fetchAllContent();
        } catch (err) {
            console.error(err);
            setError('Failed to save general content.');
        } finally { setLoading(false); }
    };

    const handleGeneralDelete = async () => {
        if (!window.confirm('Delete general content?')) return;
        setLoading(true); setMessage(''); setError('');
        try {
            const response = await axios.delete(`${GENERAL_API_URL}/general`);
            setMessage(response.data.message);
            setGeneralContent('');
        } catch (err) { setError('Failed to delete general content.'); }
        finally { setLoading(false); }
    };

    // Facilities
    const handleAddUpdateFacility = async () => {
        if (!newFacilityName.trim()) { setError('Facility name cannot be empty'); return; }
        setLoading(true); setMessage(''); setError('');
        try {
            if (editingFacility) {
                await axios.put(`${FACILITIES_API_URL}/${editingFacility.id}`, { name: newFacilityName, description: newFacilityDescription });
                setEditingFacility(null);
            } else {
                await axios.post(FACILITIES_API_URL, { name: newFacilityName, description: newFacilityDescription });
            }
            setNewFacilityName(''); setNewFacilityDescription('');
            fetchAllContent();
        } catch (err) { setError('Failed to save facility'); }
        finally { setLoading(false); }
    };

    const handleDeleteFacility = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        setLoading(true); setMessage(''); setError('');
        try { await axios.delete(`${FACILITIES_API_URL}/${id}`); fetchAllContent(); } 
        catch { setError('Failed to delete facility'); } 
        finally { setLoading(false); }
    };

    const startEditFacility = (f) => { setEditingFacility(f); setNewFacilityName(f.name); setNewFacilityDescription(f.description || ''); };
    const cancelEditFacility = () => { setEditingFacility(null); setNewFacilityName(''); setNewFacilityDescription(''); };

    // Policies
    const handleAddUpdatePolicy = async () => {
        if (!newPolicyText.trim() || !newPolicyCategory) { setError('Policy text/category required'); return; }
        setLoading(true); setMessage(''); setError('');
        try {
            if (editingPolicy) {
                await axios.put(`${POLICIES_API_URL}/${editingPolicy.id}`, { policy_text: newPolicyText, category: newPolicyCategory });
                setEditingPolicy(null);
            } else {
                await axios.post(POLICIES_API_URL, { policy_text: newPolicyText, category: newPolicyCategory });
            }
            setNewPolicyText(''); setNewPolicyCategory(policyCategories[0].value);
            fetchAllContent();
        } catch (err) { setError('Failed to save policy'); }
        finally { setLoading(false); }
    };

    const handleDeletePolicy = async (id) => {
        if (!window.confirm('Delete this policy?')) return;
        setLoading(true); setMessage(''); setError('');
        try { await axios.delete(`${POLICIES_API_URL}/${id}`); fetchAllContent(); } 
        catch { setError('Failed to delete policy'); } 
        finally { setLoading(false); }
    };

    const startEditPolicy = (p) => { setEditingPolicy(p); setNewPolicyText(p.policy_text); setNewPolicyCategory(p.category); };
    const cancelEditPolicy = () => { setEditingPolicy(null); setNewPolicyText(''); setNewPolicyCategory(policyCategories[0].value); };

    const policiesByCategory = useMemo(() => {
        return policiesList.reduce((acc, policy) => {
            const catLabel = policyCategories.find(c => c.value === policy.category)?.label || 'Uncategorized';
            if (!acc[catLabel]) acc[catLabel] = [];
            acc[catLabel].push(policy);
            return acc;
        }, {});
    }, [policiesList, policyCategories]);

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
                <div className="admin-section general-info-section">
                    <h2>General Information</h2>
                    <textarea value={generalContent} onChange={e=>setGeneralContent(e.target.value)} rows="10" placeholder="Enter general info..."></textarea>
                    <div className="admin-actions">
                        <button onClick={handleGeneralSubmit}>{generalContent ? 'Update' : 'Add'} General Info</button>
                        {generalContent && <button onClick={handleGeneralDelete} className="delete-btn">Delete</button>}
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
                                {Array.from({length: Math.ceil(facilitiesList.length/pageSize)}, (_,i)=>(
                                    <button key={i} className={facilityPage===i+1?'active':'inactive'} onClick={()=>setFacilityPage(i+1)}>{i+1}</button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Policies */}
                <div className="admin-section policies-section">
                    <h2>Resort Policies</h2>
                    <div className="form-group">
                        <label>Policy Category</label>
                        <select value={newPolicyCategory} onChange={e=>setNewPolicyCategory(e.target.value)}>
                            {policyCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Policy Text</label>
                        <textarea value={newPolicyText} onChange={e=>setNewPolicyText(e.target.value)} rows="4" placeholder="Enter policy..."/>
                    </div>
                    <div className="admin-actions">
                        {editingPolicy && <button onClick={cancelEditPolicy} className="cancel-btn">Cancel Edit</button>}
                        <button onClick={handleAddUpdatePolicy}>{editingPolicy ? 'Update' : 'Add'} Policy</button>
                    </div>

                    {Object.keys(policiesByCategory).length > 0 && (
                        <>
                            <h3>Existing Policies</h3>
                            {Object.entries(policiesByCategory).map(([catLabel, policies]) => (
                                <div key={catLabel} className="policy-category-group">
                                    <h4>{catLabel}</h4>
                                    <div className="item-list">
                                        {paginate(policies, policyPage).map(p => (
                                            <div key={p.id} className="item-card">
                                                <div className="item-details"><p>{p.policy_text}</p></div>
                                                <div className="item-actions">
                                                    <button onClick={()=>startEditPolicy(p)} className="edit-btn">Edit</button>
                                                    <button onClick={()=>handleDeletePolicy(p.id)} className="delete-btn">Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pagination">
                                        {Array.from({length: Math.ceil(policies.length/pageSize)}, (_,i)=>(
                                            <button key={i} className={policyPage===i+1?'active':'inactive'} onClick={()=>setPolicyPage(i+1)}>{i+1}</button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminAboutUs;
