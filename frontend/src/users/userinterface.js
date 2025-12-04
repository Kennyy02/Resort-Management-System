import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import mountainView from "../components/pictures/mountainView.jpg";
import "./styles/userinterface.css";

// --- Constants & Utilities ---

const BASE_URLS = {
  ABOUT: "https://about-us-production.up.railway.app",
  SERVICES: "https://manage-service-production.up.railway.app",
  FEEDBACKS: "https://ratings-and-feedbacks-production.up.railway.app",
};

/**
 * Tries to fetch data from a list of URLs sequentially until one succeeds.
 * @param {string[]} candidates - Array of URLs to try.
 * @param {object} config - Axios request config.
 * @returns {Promise<{data: any, url: string | null}>}
 */
const tryFetch = async (candidates, config = {}) => {
  for (const url of candidates) {
    try {
      const res = await axios.get(url, config);
      // Ensure the response has data and it's not null/undefined/empty string
      if (res && res.data !== null && res.data !== undefined && res.data !== "") {
        return { data: res.data, url };
      }
    } catch (err) {
      // Continue to the next URL on error
      continue;
    }
  }
  return { data: null, url: null };
};

const getImage = (item) =>
  item?.image || item?.imageUrl || item?.photo || item?.thumbnail || null;


// --- Custom Hook for Data Fetching ---

const useResortData = () => {
  const [data, setData] = useState({
    about: { content: "Loading about info...", videoUrl: null },
    rooms: [],
    islandHops: [],
    feedbacks: [],
    loading: true,
  });

  const normalizeAbout = (aboutData) => {
    let content = "";
    let videoUrl = null;
    let dataToProcess = aboutData;

    // Handle array response (if the API returns an array of one item)
    if (Array.isArray(aboutData) && aboutData.length > 0) {
      dataToProcess = aboutData[0];
    }

    if (typeof dataToProcess === "object" && dataToProcess !== null) {
      content = dataToProcess.content || dataToProcess.description || "";
      videoUrl = dataToProcess.videoUrl || dataToProcess.video || null;
    }
    
    return { 
        content: content || "About information currently unavailable.", 
        videoUrl 
    };
  };

  const filterServices = (servicesData) => {
    if (!Array.isArray(servicesData)) {
      return { rooms: [], islandHops: [] };
    }

    const items = servicesData;
    
    // Logic to filter rooms (first 4)
    const roomsList = items.filter((i) =>
      (i.type && i.type.toLowerCase().includes("room")) ||
      (i.category && i.category.toLowerCase().includes("room")) ||
      (i.title && /room|suite|cottage/i.test(i.title))
    ).slice(0, 4);

    // Logic to filter island hops/tours (first 4)
    const islandList = items.filter((i) =>
      (i.type && i.type.toLowerCase().includes("island")) ||
      (i.category && i.category.toLowerCase().includes("island")) ||
      (i.title && /island|hop|boat|tour|package/i.test(i.title))
    ).slice(0, 4);

    return { rooms: roomsList, islandHops: islandList };
  };

  useEffect(() => {
    const fetchAll = async () => {
      // 1. Define all fetch promises using Promise.all for parallel execution
      const aboutPromise = tryFetch([
        `${BASE_URLS.ABOUT}/pre/api/aboutus`,
        `${BASE_URLS.ABOUT}/api/aboutus`,
        `${BASE_URLS.ABOUT}/aboutus`,
        `${BASE_URLS.ABOUT}/api/v1/about`,
      ]);

      const servicesPromise = tryFetch([
        `${BASE_URLS.SERVICES}/api/services`,
        `${BASE_URLS.SERVICES}/services`,
        `${BASE_URLS.SERVICES}/service`,
        `${BASE_URLS.SERVICES}/api/v1/services`,
      ]);

      const feedbackPromise = tryFetch([
        `${BASE_URLS.FEEDBACKS}/api/feedbacks`,
        `${BASE_URLS.FEEDBACKS}/api/feedback`,
        `${BASE_URLS.FEEDBACKS}/feedbacks`,
        `${BASE_URLS.FEEDBACKS}/feedback`,
        `${BASE_URLS.FEEDBACKS}/ratings`,
        `${BASE_URLS.FEEDBACKS}/api/ratings`,
      ]);
      
      try {
        // 2. Execute promises in parallel
        const [aboutResp, servicesResp, feedbackResp] = await Promise.all([
          aboutPromise,
          servicesPromise,
          feedbackPromise,
        ]);

        // 3. Process and normalize data
        const aboutData = normalizeAbout(aboutResp.data);
        const { rooms, islandHops } = filterServices(servicesResp.data);
        
        const feedbacks = Array.isArray(feedbackResp.data) 
            ? feedbackResp.data.slice(0, 4) // first 4 feedbacks
            : [];

        // 4. Update state
        setData({
          about: aboutData,
          rooms,
          islandHops,
          feedbacks,
          loading: false,
        });

      } catch (error) {
        // Log the error but stop the loading state
        console.error("Error fetching homepage data:", error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAll();
  }, []);

  return data;
};


// --- Component ---

export default function Homepage() {
  const navigate = useNavigate();
  const { about, rooms, islandHops, feedbacks, loading } = useResortData();
  
  // State for scroll animations, retained from original component
  const [visible, setVisible] = useState({
    about: false,
    rooms: false,
    island: false,
    feedbacks: false,
  });

  // State for the new Search Box
  const [searchQuery, setSearchQuery] = useState({
    roomName: '',
    checkInDate: '',
    checkOutDate: '',
  });

  const handleSearchChange = (e) => {
    setSearchQuery({
      ...searchQuery,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Logic to handle search/redirect to booking page with query parameters
    const queryString = new URLSearchParams(searchQuery).toString();
    // Navigate to a dedicated availability page or the services page with the search query
    navigate(`/availability?${queryString}`); 
    console.log("Searching with:", searchQuery);
  };

  // Effect for IntersectionObserver (scroll animation), retained from original
  useEffect(() => {
    const callback = (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const cls = e.target.classList;
          if (cls.contains("about-section")) setVisible((v) => ({ ...v, about: true }));
          if (cls.contains("rooms-section")) setVisible((v) => ({ ...v, rooms: true }));
          if (cls.contains("island-section")) setVisible((v) => ({ ...v, island: true }));
          if (cls.contains("feedbacks-section")) setVisible((v) => ({ ...v, feedbacks: true }));
        }
      });
    };
    const observer = new IntersectionObserver(callback, { threshold: 0.15 });
    
    // Observe all elements with the 'scroll-animate' class
    document.querySelectorAll(".scroll-animate").forEach((el) => observer.observe(el));
    
    // Cleanup function
    return () => observer.disconnect();
  }, []);

  // Default YouTube URL to display if the API doesn't provide one
  const defaultVideoUrl = "https://www.youtube.com/embed/f4eLvLbREEI";
  const videoToUse = about.videoUrl ? about.videoUrl.replace('watch?v=', 'embed/') : defaultVideoUrl;
  const videoLinkUrl = about.videoUrl || "https://youtu.be/f4eLvLbREEI";

  return (
    <div className="homepage-root">
      {/* Hero Section: UPDATED to use mountainView as full background and added an overlay */}
      <header 
        className="hero large-hero"
        style={{ backgroundImage: `url(${mountainView})` }} 
      >
        {/* Darkening Overlay (positioning is handled in CSS) */}
        <div className="hero-overlay"></div> 
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">EM'z Bayview Mountain Resort</h1>
            <p className="hero-sub">
              A peaceful escape — book rooms, join island hopping, and make memories.
            </p>
            {/* These buttons are explicitly kept as requested */}
            <div className="hero-cta">
              <button onClick={() => navigate("/services")}>Explore Rooms</button>
              <button className="ghost" onClick={() => navigate("/services")}>
                Island Hopping
              </button>
            </div>
          </div>

          {/* --- NEW Availability Search Box --- */}
          {/* This element is absolutely positioned via CSS to float in the lower half */}
          <form className="hero-search-box" onSubmit={handleSearchSubmit}>
            <div className="search-fields">
              <div className="search-field-group">
                <label htmlFor="roomName">Room Name</label>
                <input
                  type="text"
                  id="roomName"
                  name="roomName"
                  placeholder="e.g., Family Suite"
                  value={searchQuery.roomName}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="search-field-group">
                <label htmlFor="checkInDate">Check-in</label>
                <input
                  type="date"
                  id="checkInDate"
                  name="checkInDate"
                  value={searchQuery.checkInDate}
                  onChange={handleSearchChange}
                  required
                />
              </div>
              <div className="search-field-group">
                <label htmlFor="checkOutDate">Check-out</label>
                <input
                  type="date"
                  id="checkOutDate"
                  name="checkOutDate"
                  value={searchQuery.checkOutDate}
                  onChange={handleSearchChange}
                  required
                />
              </div>
              <div className="search-field-group search-button-container">
                <button type="submit" className="btn search-button">
                  Check Availability
                </button>
              </div>
            </div>
          </form>
          {/* ------------------------------- */}

          {/* The image wrapper and image are REMOVED as the image is now the background of the header */}
        </div>
      </header>

      <main className="main-content">
        {/* ABOUT Section */}
        <section
          className={`about-section scroll-animate ${visible.about ? "is-visible" : ""}`}
        >
          <div className="about-grid">
            <div className="about-text">
              <div className="about-video-title">Swim, Chill, Chillax</div>
              <div className="about-content">
                {loading
                  ? <p>Loading information...</p>
                  : about.content.split("\n").map((l, i) => <p key={i}>{l}</p>)}
              </div>
              <div className="about-actions">
                <a className="btn" onClick={() => navigate("/aboutus")}>
                  Read Full Story
                </a>
              </div>
            </div>

            <div className="about-media">
              <div className="youtube-wrapper">
                {/* Simplified iframe logic: attempts to convert a watch URL to an embed URL */}
                <iframe
                  src={videoToUse}
                  title="Resort Preview Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <a
                  href={videoLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="video-link"
                >
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ROOMS Section */}
        <section className={`rooms-section scroll-animate ${visible.rooms ? "is-visible" : ""}`}>
          <div className="section-header">
            <h3>Rooms & Accommodations</h3>
            <p>Comfortable rooms curated for a relaxing stay.</p>
          </div>

          <div className="cards-grid horizontal-scroll">
            {rooms.map((r, idx) => (
              <article className="card" key={r.id || idx}>
                <div className="card-media">
                  <img src={getImage(r) || "/placeholder-room.jpg"} alt={r.title || "room"} />
                </div>
                <div className="card-body">
                  <h4>{r.title || r.name || `Room ${idx + 1}`}</h4>
                  <p className="muted">
                    {r.description
                      ? r.description.slice(0, 120) + (r.description.length > 120 ? "..." : "")
                      : "No description."}
                  </p>
                  <div className="card-footer">
                    <span className="price">{r.price ? `₱${r.price}` : "Contact"}</span>
                    <a className="btn small" onClick={() => navigate("/services")}>
                      Book
                    </a>
                  </div>
                </div>
              </article>
            ))}
            {loading && rooms.length === 0 && <p className="muted">Loading rooms...</p>}
            {!loading && rooms.length === 0 && <p className="muted">No rooms found.</p>}
          </div>
        </section>

        {/* ISLAND HOPPING Section */}
        <section className={`island-section scroll-animate ${visible.island ? "is-visible" : ""}`}>
          <div className="section-header">
            <h3>Island Hopping & Tours</h3>
            <p>Explore nearby islands with guided tours and boat trips.</p>
          </div>

          <div className="cards-grid horizontal-scroll">
            {islandHops.map((p, idx) => (
              <article className="card wide" key={p.id || idx}>
                <div className="card-media">
                  <img
                    src={getImage(p) || "/placeholder-island.jpg"}
                    alt={p.title || "package"}
                  />
                </div>
                <div className="card-body">
                  <h4>{p.title || p.name || `Package ${idx + 1}`}</h4>
                  <p className="muted">
                    {p.description
                      ? p.description.slice(0, 140) + (p.description.length > 140 ? "..." : "")
                      : "No description."}
                  </p>
                  <div className="card-footer">
                    <span className="price">{p.price ? `₱${p.price}` : "Contact"}</span>
                    <a className="btn small" onClick={() => navigate("/services")}>
                      View
                    </a>
                  </div>
                </div>
              </article>
            ))}
            {loading && islandHops.length === 0 && <p className="muted">Loading island tours...</p>}
            {!loading && islandHops.length === 0 && <p className="muted">No tours found.</p>}
          </div>
        </section>

        {/* FEEDBACK Section */}
        <section className={`feedbacks-section scroll-animate ${visible.feedbacks ? "is-visible" : ""}`}>
          <div className="section-header">
            <h3>Guest Feedback</h3>
            <p>What our guests say about their stay.</p>
          </div>

          <div className="feedback-carousel horizontal-scroll">
            {feedbacks.map((f, i) => (
              <blockquote className="feedback-card" key={f.id || i}>
                <p className="msg">“{f.message || f.content || f.feedback || "No message."}”</p>
                <footer className="meta">
                  <strong>{f.name || f.user || "Guest"}</strong>
                  <span className="date">
                    {f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}
                  </span>
                </footer>
              </blockquote>
            ))}
            {loading && feedbacks.length === 0 && <p className="muted">Loading feedbacks...</p>}
            {!loading && feedbacks.length === 0 && <p className="muted">No feedbacks yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
