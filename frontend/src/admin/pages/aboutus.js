import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./aboutus.css";

const BASE_URL = process.env.REACT_APP_ABOUTUS_API;

const GENERAL_API_URL = `${BASE_URL}/pre/api/aboutus`;
const POLICIES_API_URL = `${BASE_URL}/pre/api/policies`;

const AdminAboutUs = () => {
  const [generalContent, setGeneralContent] = useState("");
  const [generalId, setGeneralId] = useState(null);

  const [policiesList, setPoliciesList] = useState([]);
  const [newPolicyText, setNewPolicyText] = useState("");
  const [newPolicyCategory, setNewPolicyCategory] = useState("");
  const [editingPolicy, setEditingPolicy] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const policyCategories = useMemo(
    () => [
      { value: "terms_booking", label: "Terms of Payment & Booking Policies" },
      { value: "check_in_out", label: "Check-in & Check-out Policies" },
      { value: "occupancy_room_service", label: "Occupancy & Room Service" },
      { value: "safety_conduct", label: "Safety & Conduct" },
      { value: "swimming_pool_rules", label: "Swimming Pool Rules" },
      { value: "other_policies", label: "Other Resort Policies" },
    ],
    []
  );

  useEffect(() => {
    fetchAllContent();
    if (policyCategories.length > 0)
      setNewPolicyCategory(policyCategories[0].value);
  }, []);

  const fetchAllContent = async () => {
    setLoading(true);
    setError("");
    try {
      const generalRes = await axios.get(GENERAL_API_URL);

      if (generalRes.data.length) {
        setGeneralContent(generalRes.data[0].content);
        setGeneralId(generalRes.data[0].id);
      }

      const policiesRes = await axios.get(POLICIES_API_URL);
      setPoliciesList(policiesRes.data);
    } catch (err) {
      setError("Failed to fetch content.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralSubmit = async () => {
    if (!generalContent.trim()) return setError("Content cannot be empty");
    setLoading(true);
    try {
      const data = { type: "general", content: generalContent };
      await axios.post(GENERAL_API_URL, data);
      setMessage("General content saved!");
      fetchAllContent();
    } catch {
      setError("Failed to save general content");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralDelete = async () => {
    if (!window.confirm("Delete general content?")) return;
    setLoading(true);
    try {
      await axios.delete(`${GENERAL_API_URL}/general`);
      setGeneralContent("");
      setGeneralId(null);
      setMessage("General content deleted.");
    } catch {
      setError("Failed to delete.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdatePolicy = async () => {
    if (!newPolicyText.trim())
      return setError("Policy text cannot be empty");

    setLoading(true);
    try {
      const data = {
        policy_text: newPolicyText,
        category: newPolicyCategory,
      };

      if (editingPolicy) {
        await axios.put(`${POLICIES_API_URL}/${editingPolicy.id}`, data);
        setMessage("Policy updated!");
        setEditingPolicy(null);
      } else {
        await axios.post(POLICIES_API_URL, data);
        setMessage("Policy added!");
      }

      setNewPolicyText("");
      fetchAllContent();
    } catch {
      setError("Failed to save policy");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (id) => {
    if (!window.confirm("Delete this policy?")) return;
    setLoading(true);
    try {
      await axios.delete(`${POLICIES_API_URL}/${id}`);
      setMessage("Policy deleted!");
      fetchAllContent();
    } catch {
      setError("Failed to delete policy");
    } finally {
      setLoading(false);
    }
  };

  const startEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setNewPolicyText(policy.policy_text);
    setNewPolicyCategory(policy.category);
  };

  const cancelEdit = () => {
    setEditingPolicy(null);
    setNewPolicyText("");
    setNewPolicyCategory(policyCategories[0].value);
  };

  const getCategoryLabel = (value) =>
    policyCategories.find((c) => c.value === value)?.label || "N/A";

  return (
    <div className="aboutus-container full-page">
      <h1>Manage About Us</h1>

      {loading && <p>Loading...</p>}
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="admin-section general-section">
        <h2>General Information</h2>
        <textarea
          rows="8"
          value={generalContent}
          onChange={(e) => setGeneralContent(e.target.value)}
        />

        <div className="admin-actions">
          <button onClick={handleGeneralSubmit}>
            {generalId ? "Update" : "Save"}
          </button>
          {generalId && (
            <button className="delete-btn" onClick={handleGeneralDelete}>
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="admin-section policies-section">
        <h2>Policies</h2>

        <textarea
          rows="3"
          value={newPolicyText}
          onChange={(e) => setNewPolicyText(e.target.value)}
          placeholder="Enter policy text..."
        />

        <select
          value={newPolicyCategory}
          onChange={(e) => setNewPolicyCategory(e.target.value)}
        >
          {policyCategories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="admin-actions">
          {editingPolicy && (
            <button className="cancel-btn" onClick={cancelEdit}>
              Cancel Edit
            </button>
          )}
          <button onClick={handleAddUpdatePolicy}>
            {editingPolicy ? "Update Policy" : "Add Policy"}
          </button>
        </div>

        <h3>Existing Policies</h3>
        {policiesList.map((p) => (
          <div key={p.id} className="item-card policy-card">
            <div>
              <strong>{p.policy_text}</strong>
              <div>Category: {getCategoryLabel(p.category)}</div>
            </div>

            <div className="item-actions">
              <button onClick={() => startEditPolicy(p)} className="edit-btn">
                Edit
              </button>
              <button
                onClick={() => handleDeletePolicy(p.id)}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAboutUs;
