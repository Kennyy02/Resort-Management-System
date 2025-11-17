import React, { useEffect, useState, useCallback } from 'react';
import './service.css'; 

// NOTE: Ensure REACT_APP_SERVICES_API is defined in your .env file
// Example: REACT_APP_SERVICES_API=http://localhost:5000 
const API_BASE_URL = process.env.REACT_APP_SERVICES_API || 'http://localhost:5000'; // Default fallback

function AdminServices() {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    type: 'room',
    name: '',
    description: '',
    price: '',
    status: 'available',
    image: null, // this will store the File object
  });
  const [previewImage, setPreviewImage] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null); 

  // --- CORE API FUNCTION ---
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/services`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // If the server returns something other than JSON, it's a major issue
        throw new Error(`Received non-JSON response: ${res.statusText}`);
      }

      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Fetch Services Error:", err);
      setError(`Failed to load services. Please check server status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, image: file }));
    setPreviewImage(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setFormData({
      type: 'room',
      name: '',
      description: '',
      price: '',
      status: 'available',
      image: null,
    });
    setPreviewImage(null);
    setEditingServiceId(null);
  };

  const handleAdd = async () => {
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/services`, {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        throw new Error('Failed to add service.');
      }

      resetForm();
      await fetchServices(); // Refresh the list
    } catch (err) {
      setError(`Add failed: ${err.message}`);
    }
  };

  const handleEditClick = (service) => {
    setEditingServiceId(service.id);
    setFormData({
      type: service.type,
      name: service.name,
      description: service.description,
      price: service.price,
      status: service.status,
      // Do not populate the file input field, let it be null unless a new image is selected
      image: null, 
    });
    
    // Show existing image if available
    setPreviewImage(service.image_url ? `${API_BASE_URL}${service.image_url}` : null);
  };

  const handleUpdate = async () => {
    const data = new FormData();
    // Append fields only if they have changed or are required
    for (const key in formData) {
      // Prevent appending null image unless it's a new File object
      if (key !== 'image' || formData[key] instanceof File) {
        data.append(key, formData[key]);
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/services/${editingServiceId}`, {
        method: 'PUT',
        body: data,
      });

      if (!res.ok) {
        throw new Error('Failed to update service.');
      }

      resetForm();
      await fetchServices(); // Refresh the list
    } catch (err) {
      setError(`Update failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/services/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete service.');
      }

      // Update state directly for fast UI change
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return <div className="admin-services-container loading-message">Loading services...</div>;
  }

  if (error) {
    return <div className="admin-services-container error-message">Error: {error}</div>;
  }

  return (
    <div className="admin-services-container">
      <h2>Manage Services</h2>

      {/* Service Management Form */}
      <div className="service-form">
        <h3>{editingServiceId ? 'Edit Service' : 'Add New Service'}</h3>
        <div className="form-row">
          <label>Type</label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="room">Room</option>
            <option value="cottage">Cottage</option>
            <option value="island_hopping">Island Hopping</option> 
          </select>

          <label>Name</label>
          <input
            name="name"
            type="text"
            placeholder="Name/Number (or Tour Name)"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-row">
          <label>Description</label>
          <input
            name="description"
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
          />
          
          <label>Price</label>
          <input
            name="price"
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-row">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        {(previewImage || editingServiceId) && (
          <div className="image-preview-area">
            <strong>Current Image:</strong>
            <img
              src={previewImage}
              alt="Preview"
            />
          </div>
        )}
        
        <div className="form-actions">
          {editingServiceId ? (
            <>
              <button onClick={handleUpdate} className="update-button">Update Service</button>
              <button onClick={resetForm} className="cancel-button">Cancel Edit</button>
            </>
          ) : (
            <button onClick={handleAdd} className="add-button">Add Service</button>
          )}
        </div>
      </div>
      
      {/* Services List */}
      <h3>Services List ({services.length})</h3>
      <ul className="services-list">
        {services.length === 0 ? (
          <li className="no-services">No services found. Start by adding one above.</li>
        ) : (
          services.map(s => (
            <li key={s.id} className="service-item">
              <div className="service-details-text">
                <strong>{s.name}</strong> ({s.type}) - ₱{parseFloat(s.price).toFixed(2)} - <span className={`status-${s.status}`}>{s.status}</span>
              </div>
              {s.image_url && (
                <img
                  src={`${API_BASE_URL}${s.image_url}`}
                  alt={s.name}
                  className="service-list-image"
                />
              )}
              <div className="service-actions">
                <button onClick={() => handleEditClick(s)} className="edit-button">Edit</button>
                <button onClick={() => handleDelete(s.id)} className="delete-button">Delete</button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default AdminServices;
