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

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVICES_API}/api/services`);
      console.log("Raw response (AdminServices):", res);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Parsed data (AdminServices):", data);
      setServices(data);
    } catch (err) {
      console.error("Fetch error (AdminServices):", err);
      setError(`Failed to fetch services: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, image: file }));

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  // Function to reset the form
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
    setEditingServiceId(null); // Exit editing mode
  };

  const handleAdd = async () => {
    // Only proceed if not in editing mode
    if (editingServiceId) {
      alert("Please click 'Update Service' to save changes or 'Cancel Edit' to add a new one.");
      return;
    }

    const { type, name, description, price, status, image } = formData;

    if (!name.trim() || !description.trim() || !price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('type', type);
      formPayload.append('name', name.trim());
      formPayload.append('description', description.trim());
      formPayload.append('price', price);
      formPayload.append('status', status);
      if (image) {
        formPayload.append('image', image);
      }

      const res = await fetch(`${process.env.REACT_APP_SERVICES_API}/api/services`, {
        method: 'POST',
        body: formPayload,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || `Failed to add service: HTTP status ${res.status}`);
        return;
      }

      alert('Service added successfully');
      fetchServices();
      resetForm(); // Reset form after successful add
    } catch (err) {
      alert(`Error connecting to server or adding service: ${err.message}`);
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_SERVICES_API}/api/services/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || `Failed to delete service: HTTP status ${res.status}`);
        return;
      }
      alert('Service deleted');
      fetchServices();
      resetForm(); // Reset form in case the deleted item was being edited
    } catch (err) {
      alert(`Error deleting service: ${err.message}`);
      console.error(err);
    }
  };

  // NEW: Function to handle clicking the Edit button
  const handleEditClick = (service) => {
    setEditingServiceId(service.id);
    setFormData({
      type: service.type,
      name: service.name,
      description: service.description,
      price: service.price,
      status: service.status,
      image: null, // Don't set image file directly, user re-uploads if needed
    });
    // If there's an existing image_url, set it as preview
    if (service.image_url) {
      setPreviewImage(`${process.env.REACT_APP_SERVICES_API}${service.image_url}`);
    } else {
      setPreviewImage(null);
    }
    // Scroll to the top of the form for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // NEW: Function to handle updating a service
  const handleUpdate = async () => {
    if (!editingServiceId) {
      alert('No service selected for editing.');
      return;
    }

    const { type, name, description, price, status, image } = formData;

    if (!name.trim() || !description.trim() || !price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('type', type);
      formPayload.append('name', name.trim());
      formPayload.append('description', description.trim());
      formPayload.append('price', price);
      formPayload.append('status', status);
      // Only append image if a new file is selected
      if (image) {
        formPayload.append('image', image);
      } else {
        // If no new image, but there was an old one, signal to keep it
        // Or your backend can handle missing 'image' field as 'keep existing'
        // If you want to explicitly remove image, you'd need a separate checkbox/button
      }

      const res = await fetch(`${process.env.REACT_APP_SERVICES_API}/api/services/${editingServiceId}`, {
        method: 'PUT', // Use PUT for updates
        body: formPayload,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || `Failed to update service: HTTP status ${res.status}`);
        return;
      }

      alert('Service updated successfully');
      fetchServices(); // Refresh the list
      resetForm(); // Exit editing mode and clear form
    } catch (err) {
      alert(`Error connecting to server or updating service: ${err.message}`);
      console.error(err);
    }
  };


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
        </select>

        <input
          name="name"
          type="text"
          placeholder="Name/Number"
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
          // You might want to add a ref here to clear the file input if needed
          // e.g., ref={fileInputRef} and fileInputRef.current.value = '' on reset
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
