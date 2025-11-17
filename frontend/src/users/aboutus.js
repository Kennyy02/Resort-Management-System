import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; // NEW IMPORT
import "./styles/aboutus.css";
import aboutusbg from "../components/pictures/aboutusbg.jpg"; 

const BASE_URL = process.env.REACT_APP_ABOUTUS_API;

const GENERAL_API_URL = `${BASE_URL}/pre/api/aboutus`;
const FACILITIES_API_URL = `${BASE_URL}/pre/api/facilities`;
const POLICIES_API_URL = `${BASE_URL}/pre/api/policies`;

const AboutUs = () => {
  // REMOVED: const [selectedFacilityImage, setSelectedFacilityImage] = useState(null); 
  const navigate = useNavigate(); // NEW: Initialize navigation
  const [activeTab, setActiveTab] = useState("general");
  const [aboutUsData, setAboutUsData] = useState({
    general: "",
    facilities: [],
    policies: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const policyCategories = useMemo(
    () => ({
      terms_booking: "Terms of Payment & Booking Policies",
      check_in_out: "Check-in & Check-out Policies",
      occupancy_room_service: "Occupancy & Room Service",
      safety_conduct: "Safety Precautions, Risk Control & Proper Conduct",
      swimming_pool_rules: "Swimming Pool Rules",
      other_policies: "Other Resort Policies",
    }),
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [generalRes, facilitiesRes, policiesRes] = await Promise.allSettled([
          axios.get(GENERAL_API_URL),
          axios.get(FACILITIES_API_URL),
          axios.get(POLICIES_API_URL),
        ]);

        const safeGetData = (res) => (res.status === 'fulfilled' && res.value.data) ? res.value.data : [];

        const generalData = safeGetData(generalRes);
        const facilitiesData = safeGetData(facilitiesRes);
        const policiesData = safeGetData(policiesRes);

        const generalContent =
          generalData.length > 0
            ? generalData[0].content
            : "No general information available.";
            
        if (generalRes.status === 'rejected' || facilitiesRes.status === 'rejected' || policiesRes.status === 'rejected') {
             setError("Warning: Some content failed to load from the server. Check console for details.");
        }

        setAboutUsData({
          general: generalContent,
          // Facilities data no longer contains image_url from the clean backend
          facilities: facilitiesData, 
          policies: policiesData,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load content due to a critical network error.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // NEW: Handler for clicking a facility, which navigates
  const handleFacilityClick = (facilityName) => {
        // Use encodeURIComponent to safely pass the name in the URL
        const encodedName = encodeURIComponent(facilityName);
        // Navigate to the dedicated details page 
        navigate(`/facility-details/${encodedName}`); 
  };


  const groupedPolicies = useMemo(() => {
    return aboutUsData.policies.reduce((acc, policy) => {
      const label = policy.category ? policyCategories[policy.category] || "Uncategorized" : "Uncategorized";
      if (!acc[label]) acc[label] = [];
      acc[label].push(policy);
      return acc;
    }, {});
  }, [aboutUsData.policies, policyCategories]);

  const renderContent = () => {
    if (loading) return <p>Loading content...</p>;
    
    switch (activeTab) {
      case "general":
        return (
          <div className="plain-section">
            <h2 className="section-title">General Information</h2>
            <div className="plain-text">
              {aboutUsData.general
                .split(/\r?\n/)
                .filter((line) => line.trim() !== "")
                .map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
            </div>
          </div>
        );

      case "facilities":
        return (
          <div className="plain-section">
            <h2 className="section-title">Facilities</h2>
            <div className="plain-text facilities-grid"> 
              {aboutUsData.facilities.length > 0 ? (
                aboutUsData.facilities.map((facility) => (
                  // Facility item is now a clickable button/div that calls the handler
                  <div
                    key={facility.id} 
                    className="facility-card-button" // Renamed class for clarity
                    onClick={() => handleFacilityClick(facility.name)} // Calls new navigation handler
                    role="button"
                    tabIndex={0}
                  >
                    <span className="facility-name">
                      <strong>{facility.name}</strong>
                    </span>
                    {facility.description && <p className="facility-desc">{facility.description}</p>}
                    <span className="view-photo-label">Click to View Photos ➡️</span>
                  </div>
                ))
              ) : (
                <p>No facilities information available.</p>
              )}
            </div>
          </div>
        );

      case "policies":
        return (
          <div className="plain-section">
            <h2 className="section-title">Resort Policies</h2>
            {aboutUsData.policies.length > 0 ? (
                Object.keys(groupedPolicies).map((category) => (
                    <div key={category} className="policy-block">
                      <h3>{category}</h3>
                      <ol>
                        {groupedPolicies[category].map((policy) => (
                          <li key={policy.id}>{policy.policy_text}</li>
                        ))}
                      </ol>
                    </div>
                ))
            ) : (
                <p>No policies information available.</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="aboutus-page">
      
      {/* 2. Hero Image Section */}
      <div className="aboutus-hero-section">
        <img
          src={aboutusbg}
          alt="About Us Background"
          className="aboutus-hero-image"
        />
        <div className="aboutus-hero-overlay" />
        <div className="aboutus-hero-content">
          <h1 className="hero-title">ABOUT US</h1>
        </div>
      </div>

      <div className="aboutus-content-container">
        {/* 3. Navigation Tabs */}
        <div className="tabs">
          <button
            className={activeTab === "general" ? "tab active" : "tab"}
            onClick={() => setActiveTab("general")}
          >
            General Information
          </button>
          <button
            className={activeTab === "facilities" ? "tab active" : "tab"}
            onClick={() => setActiveTab("facilities")}
          >
            Facilities
          </button>
          <button
            className={activeTab === "policies" ? "tab active" : "tab"}
            onClick={() => setActiveTab("policies")}
          >
            Policies
          </button>
        </div>
        
        {/* Display Error/Warning outside content area */}
        {error && <p className="error-message">{error}</p>}
        
        {/* 4. Tab Content */}
        <div className="content">{renderContent()}</div>
      </div>

      {/* REMOVED: Photo Modal Component JSX */}
    </div>
  );
};

export default AboutUs;
