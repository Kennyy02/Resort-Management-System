import React, { useEffect, useState, useCallback } from 'react';
import './service.css';

const API_BASE_URL = process.env.REACT_APP_SERVICES_API || 'http://localhost:5000';

function AdminServices() {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    type: 'room',
    name: '',
    description: '',
    price: '',
    status: 'available',
    image: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null);

  // ===================== FETCH SERVICES =====================
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/services`);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Received non-JSON response: ${res.statusText}`);
      }

      const data = await res.json();
      setServices(data);

    } catch (err) {
      console.error("Fetch Services Error:", err);
      setError(`Failed to load services: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // ===================== FORM HANDLERS =====================
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

  // ===================== ADD SERVICE =====================
  const handleAdd = async () => {
    const data = new FormData();

    for (const key in formData) {
      // Ensure price is included as an empty string for non-payment types if missing, 
      // but still skip price for payment type.
      if (formData.type === "payment" && key === "price") continue;
      
      // Ensure non-file data is treated as string
      if (key === 'image' && !(formData[key] instanceof File)) {
        continue; // Skip if it's not a new file being uploaded
      }
      
      data.append(key, formData[key]);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/services`, {
        method: 'POST',
        body: data,
      });

      if (!res.ok) throw new Error('Failed to add service.');

      resetForm();
      await fetchServices();

    } catch (err) {
      console.error("Add failed:", err);
      setError(`Add failed: ${err.message}`);
    }
  };

  // ===================== EDIT SERVICE =====================
  const handleEditClick = (service) => {
    setEditingServiceId(service.id);
    setFormData({
      type: service.type,
      name: service.name,
      description: service.description || '', // Set to empty string for clean input
      price: service.price || '', // Set to empty string for clean input
      status: service.status,
      image: null,
    });

    setPreviewImage(service.image_url ? `${API_BASE_URL}${service.image_url}` : null);
  };

  // ===================== UPDATE SERVICE =====================
  const handleUpdate = async () => {
    const data = new FormData();

    for (const key in formData) {
      if (formData.type === "payment" && key === "price") continue;
      
      // Only append 'image' if a new file has been selected
      if (key !== 'image' || formData[key] instanceof File) {
        data.append(key, formData[key]);
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/services/${editingServiceId}`, {
        method: 'PUT',
        body: data,
      });

      if (!res.ok) throw new Error('Failed to update service.');

      resetForm();
      await fetchServices();

    } catch (err) {
      console.error("Update failed:", err);
      setError(`Update failed: ${err.message}`);
    }
  };

  // ===================== DELETE SERVICE =====================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/services/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete service.');

      setServices(prev => prev.filter(s => s.id !== id));

    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  // ===================== RENDER =====================
  if (loading) return <div className="admin-services-container loading-message">Loading services...</div>;
  if (error) return <div className="admin-services-container error-message">Error: {error}</div>;

  return (
    <div className="admin-services-container">
      <h2>Manage Services</h2>

      {/* ---------- SERVICE FORM ---------- */}
      {/* NOTE: If this is wrapped in a <form> tag, add noValidate to disable HTML5 validation */}
      <div className="service-form"> 
        <h3>{editingServiceId ? 'Edit Service' : 'Add New Service'}</h3>

        <div className="form-row">
          <label>Type</label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="room">Room</option>
            <option value="cottage">Cottage</option>
            <option value="island_hopping">Island Hopping</option>
            <option value="payment">Mode of Payment</option>
          </select>

          <label>Name</label>
          <input
            name="name"
            type="text"
            placeholder="Name / Title"
            value={formData.name}
            onChange={handleChange}
            required // Name should be required
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

          {/* Price hidden when type = payment */}
          {formData.type !== "payment" && (
            <>
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
            </>
          )}
        </div>

        <div className="form-row">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <label>Image (QR for payment, photo for others)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        {previewImage && (
          <div className="image-preview-area">
            <strong>Current Image:</strong>
            <img src={previewImage} alt="Preview" />
          </div>
        )}

        <div className="form-actions">
          {editingServiceId ? (
            <>
              {/* FIX: Set type="button" to prevent accidental form submission/validation failure */}
              <button type="button" onClick={handleUpdate} className="update-button">Update Service</button>
              <button type="button" onClick={resetForm} className="cancel-button">Cancel Edit</button>
            </>
          ) : (
            {/* FIX: Set type="button" to prevent accidental form submission/validation failure */}
            <button type="button" onClick={handleAdd} className="add-button">Add Service</button>
          )}
        </div>
      </div>

      {/* ---------- SERVICES LIST ---------- */}
      <h3>Services List ({services.length})</h3>
      <ul className="services-list">
        {services.length === 0 ? (
          <li className="no-services">No services found.</li>
        ) : (
          services.map(s => (
            <li key={s.id} className="service-item">
              <div className="service-details-text">
                <strong>{s.name}</strong> ({s.type})

                {s.type !== "payment" && (
                  <> - ₱{parseFloat(s.price).toFixed(2)}</>
                )}

                <span className={`status-${s.status}`}> ({s.status})</span>
              </div>

              {s.image_url && (
                <img
                  src={`${API_BASE_URL}${s.image_url}`}
                  alt={s.name}
                  className="service-list-image"
                />
              )}

              <div className="service-actions">
                <button type="button" onClick={() => handleEditClick(s)} className="edit-button">Edit</button>
                <button type="button" onClick={() => handleDelete(s.id)} className="delete-button">Delete</button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default AdminServices;
