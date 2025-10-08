import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './styles/aboutus.css';

// API URLs
const BASE_URL = process.env.REACT_APP_ABOUTUS_API;

const GENERAL_API_URL = `${BASE_URL}/pre/api/aboutus`;
const FACILITIES_API_URL = `${BASE_URL}/pre/api/facilities`;
const POLICIES_API_URL = `${BASE_URL}/pre/api/policies`;

const AboutUs = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [aboutUsData, setAboutUsData] = useState({
    general: 'Loading General Information...',
    facilities: [],
    policies: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const policyCategories = useMemo(() => ({
    'terms_booking': 'Terms of Payment & Booking Policies',
    'check_in_out': 'Check-in & Check-out Policies',
    'occupancy_room_service': 'Occupancy & Room Service',
    'safety_conduct': 'Safety Precautions, Risk Control & Proper Conduct',
    'swimming_pool_rules': 'Swimming Pool Rules',
    'other_policies': 'Other Resort Policies',
  }), []);

  useEffect(() => {
    const fetchAboutUsContent = async () => {
      try {
        const generalResponse = await axios.get(GENERAL_API_URL);
        const generalContent = generalResponse.data.length > 0
          ? generalResponse.data[0].content
          : 'No general information available.';

        const facilitiesResponse = await axios.get(FACILITIES_API_URL);
        const facilitiesList = facilitiesResponse.data;

        const policiesResponse = await axios.get(POLICIES_API_URL);
        const policiesList = policiesResponse.data;

        setAboutUsData({
          general: generalContent,
          facilities: facilitiesList,
          policies: policiesList,
        });
      } catch (err) {
        console.error('Error fetching About Us content:', err);
        setError('Failed to load About Us content. Please try again later.');
        setAboutUsData({
          general: 'Could not load general information.',
          facilities: [],
          policies: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAboutUsContent();
  }, []);

  const groupedPolicies = useMemo(() => {
    return aboutUsData.policies.reduce((acc, policy) => {
      const categoryLabel = policyCategories[policy.category] || 'Uncategorized';
      if (!acc[categoryLabel]) acc[categoryLabel] = [];
      acc[categoryLabel].push(policy);
      return acc;
    }, {});
  }, [aboutUsData.policies, policyCategories]);

  const renderContent = () => {
    if (loading) return <p>Loading content...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    switch (activeTab) {
      case 'general':
        return (
          <>
            <h2>General Information</h2>
            <ul>
              {aboutUsData.general
                .split(/\r?\n/) // split by new line
                .filter(line => line.trim() !== "")
                .map((line, index) => (
                  <li key={index} dangerouslySetInnerHTML={{ __html: line }}></li>
              ))}
            </ul>
          </>
        );
      case 'facilities':
        return (
          <>
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
          </>
        );
      case 'policies':
        return (
          <>
            <h2>Resort Policies</h2>
            {Object.keys(groupedPolicies).length > 0 ? (
              Object.entries(groupedPolicies).map(([categoryLabel, policies]) => (
                <div key={categoryLabel}>
                  <h3>{categoryLabel}</h3>
                  <ul>
                    {policies.map((policy) => (
                      <li key={policy.id} dangerouslySetInnerHTML={{ __html: policy.policy_text }}></li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p>No policies information available.</p>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="aboutus-fullpage">
      <h1>About Us</h1>
      <div className="tabs">
        <button
          className={activeTab === 'general' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('general')}
        >
          General Information
        </button>
        <button
          className={activeTab === 'facilities' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('facilities')}
        >
          Facilities
        </button>
        <button
          className={activeTab === 'policies' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('policies')}
        >
          Policies
        </button>
      </div>
      <div className="tab-content">{renderContent()}</div>
    </div>
  );
};

export default AboutUs;
