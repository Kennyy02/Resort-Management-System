import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./styles/aboutus.css";
import aboutusbg from "../components/pictures/aboutusbg.jpg";

const BASE_URL = process.env.REACT_APP_ABOUTUS_API;

const GENERAL_API_URL = `${BASE_URL}/pre/api/aboutus`;
const POLICIES_API_URL = `${BASE_URL}/pre/api/policies`;

const AboutUs = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [aboutUsData, setAboutUsData] = useState({
    general: "",
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
        const [generalRes, policyRes] = await Promise.allSettled([
          axios.get(GENERAL_API_URL),
          axios.get(POLICIES_API_URL),
        ]);

        const safeGetData = (res) =>
          res.status === "fulfilled" && res.value.data
            ? res.value.data
            : [];

        const generalData = safeGetData(generalRes);
        const policiesData = safeGetData(policyRes);

        const generalContent =
          generalData.length > 0
            ? generalData[0].content
            : "No general information available.";

        setAboutUsData({
          general: generalContent,
          policies: policiesData,
        });

        if (generalRes.status === "rejected" || policyRes.status === "rejected") {
          setError("Warning: Some content failed to load.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load About Us information.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const groupedPolicies = useMemo(() => {
    return aboutUsData.policies.reduce((acc, policy) => {
      const label = policy.category
        ? policyCategories[policy.category] || "Uncategorized"
        : "Uncategorized";
      if (!acc[label]) acc[label] = [];
      acc[label].push(policy);
      return acc;
    }, {});
  }, [aboutUsData.policies, policyCategories]);

  const renderContent = () => {
    if (loading) return <p>Loading...</p>;

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
              <p>No policies found.</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="aboutus-page">
      <div className="aboutus-hero-section">
        <img src={aboutusbg} alt="About Us" className="aboutus-hero-image" />
        <div className="aboutus-hero-overlay" />
        <div className="aboutus-hero-content">
          <h1 className="hero-title">ABOUT US</h1>
        </div>
      </div>

      <div className="aboutus-content-container">
        <div className="tabs">
          <button
            className={activeTab === "general" ? "tab active" : "tab"}
            onClick={() => setActiveTab("general")}
          >
            General Information
          </button>

          <button
            className={activeTab === "policies" ? "tab active" : "tab"}
            onClick={() => setActiveTab("policies")}
          >
            Policies
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
        <div className="content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default AboutUs;
