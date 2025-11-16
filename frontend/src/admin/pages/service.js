import React, { useEffect, useState } from 'react';
import './service.css'; 

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

  // ... (fetchServices, useEffect, handleChange, handleImageChange, resetForm functions remain the same)
  // ... (handleAdd, handleDelete, handleEditClick, handleUpdate functions remain the same)
  
  const fetchServices = async () => { /* ... existing code ... */ };
  useEffect(() => { /* ... existing code ... */ }, []);
  const handleChange = (e) => { /* ... existing code ... */ };
  const handleImageChange = (e) => { /* ... existing code ... */ };
  const resetForm = () => { /* ... existing code ... */ };
  const handleAdd = async () => { /* ... existing code ... */ };
  const handleDelete = async (id) => { /* ... existing code ... */ };
  const handleEditClick = (service) => { /* ... existing code ... */ };
  const handleUpdate = async () => { /* ... existing code ... */ };

  if (loading) {
    return <div className="admin-services-container">Loading services...</div>;
  }

  if (error) {
    return <div className="admin-services-container error-message">{error}</div>;
  }

  return (
    <div className="admin-services-container">
      <h2>Manage Services</h2>

      <div className="form-row">
        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="room">Room</option>
          <option value="cottage">Cottage</option>
          {/* 🎯 NEW: Add option for Island Hopping */}
          <option value="island_hopping">Island Hopping</option> 
        </select>

        <input
          name="name"
          type="text"
          placeholder="Name/Number (or Tour Name)"
          value={formData.name}
          onChange={handleChange}
        />
        
        <input
          name="description"
          type="text"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />

        {/* ... (price, status, image input fields remain the same) ... */}
        
        <input
          name="price"
          type="number"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          min="0"
          step="0.01"
        />

        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />

        {previewImage && (
          <img
            src={previewImage}
            alt="Preview"
            style={{ width: '150px', height: 'auto', marginTop: '10px', borderRadius: '8px' }}
          />
        )}

        {editingServiceId ? (
          <>
            <button onClick={handleUpdate} className="update-button">Update Service</button>
            <button onClick={resetForm} className="cancel-button">Cancel Edit</button>
          </>
        ) : (
          <button onClick={handleAdd} className="add-button">Add Service</button>
        )}
      </div>

      {/* ... (Services List display remains the same, it automatically handles the new type) ... */}
      <h3>Services List</h3>
      <ul>
        {services.length === 0 ? (
          <li>No services found.</li>
        ) : (
          services.map(s => (
            <li key={s.id}>
              <div>
                <strong>{s.name}</strong> ({s.type}) - ₱{parseFloat(s.price).toFixed(2)} - {s.status}
              </div>
              {s.image_url && (
                <img
                  src={`${process.env.REACT_APP_SERVICES_API}${s.image_url}`}
                  alt={s.name}
                  style={{ width: '100px', height: 'auto', marginTop: '5px', borderRadius: '5px' }}
                />
              )}
              <div className="service-actions"> {/* Wrap buttons for better layout */}
                <button onClick={() => handleEditClick(s)} className="edit-button">Edit</button> {/* NEW EDIT BUTTON */}
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
