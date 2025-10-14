import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./styles/aboutus.css";

const BASE_URL = process.env.REACT_APP_ABOUTUS_API;

const GENERAL_API_URL = `${BASE_URL}/pre/api/aboutus`;
const FACILITIES_API_URL = `${BASE_URL}/pre/api/facilities`;
const POLICIES_API_URL = `${BASE_URL}/pre/api/policies`;

const AboutUs = () => {
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
        const [generalRes, facilitiesRes, policiesRes] = await Promise.all([
          axios.get(GENERAL_API_URL),
          axios.get(FACILITIES_API_URL),
          axios.get(POLICIES_API_URL),
        ]);

        const generalContent =
          generalRes.data.length > 0
            ? generalRes.data[0].content
            : "No general information available.";

        setAboutUsData({
          general: generalContent,
          facilities: facilitiesRes.data,
          policies: policiesRes.data,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load content.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupedPolicies = useMemo(() => {
    return aboutUsData.policies.reduce((acc, policy) => {
      const label = policyCategories[policy.category] || "Uncategorized";
      if (!acc[label]) acc[label] = [];
      acc[label].push(policy);
      return acc;
    }, {});
  }, [aboutUsData.policies, policyCategories]);

  const renderContent = () => {
    if (loading) return <p>Loading content...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    switch (activeTab) {
      case "general":
        return (
          <div className="plain-section">
            <h2>General Information</h2>
            <ul>
              {aboutUsData.general
                .split(/\r?\n/)
                .filter((line) => line.trim() !== "")
                .map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
            </ul>
          </div>
        );

      case "facilities":
        return (
          <div className="plain-section">
            <h2>Our Facilities</h2>
            {aboutUsData.facilities.length > 0 ? (
              <ul>
                {aboutUsData.facilities.map((facility) => (
                  <li key={facility.id}>
                    <strong>{facility.name}</strong>
                    {facility.description && <p>{facility.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No facilities information available.</p>
            )}
          </div>
        );

      case "policies":
        return (
          <div className="plain-section">
            <h2>Resort Policies</h2>
            {Object.keys(groupedPolicies).map((category) => (
              <div key={category} className="policy-block">
                <h3>{category}</h3>
                <ol>
                  {groupedPolicies[category].map((policy) => (
                    <li key={policy.id}>{policy.policy_text}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="aboutus-page">
      <h1>About Us</h1>
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
      <div className="content">{renderContent()}</div>
    </div>
  );
};

export default AboutUs;
