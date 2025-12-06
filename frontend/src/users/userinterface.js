import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import mountainView from "../components/pictures/mountainView.jpg";
import "./styles/userinterface.css";

const BASE_URLS = {
  ABOUT: "https://about-us-production.up.railway.app",
  SERVICES: "https://manage-service-production.up.railway.app",
  FEEDBACKS: "https://ratings-and-feedbacks-production.up.railway.app",
};

const tryFetch = async (urls, config = {}) => {
  for (const url of urls) {
    try {
      const res = await axios.get(url, config);
      if (res && res.data) return { data: res.data, url };
    } catch (error) {
      continue;
    }
  }
  return { data: null, url: null };
};

const getImage = (item) =>
  item?.image || item?.imageUrl || item?.photo || item?.thumbnail || null;

/* --------------------- CUSTOM HOOK ---------------------- */

const useResortData = () => {
  const [data, setData] = useState({
    about: { content: "Loading...", videoUrl: null },
    rooms: [],
    islandHops: [],
    feedbacks: [],
    loading: true,
  });

  const normalizeAbout = (aboutData) => {
    let content = "";
    let videoUrl = null;
    let dataToProcess = aboutData;

    if (Array.isArray(aboutData) && aboutData.length > 0) {
      dataToProcess = aboutData[0];
    }

    if (typeof dataToProcess === "object" && dataToProcess !== null) {
      content =
        dataToProcess.content ||
        dataToProcess.description ||
        "About information unavailable.";
      videoUrl = dataToProcess.videoUrl || dataToProcess.video || null;
    }

    return { content, videoUrl };
  };

  const filterServices = (servicesData) => {
    if (!Array.isArray(servicesData)) return { rooms: [], islandHops: [] };

    const rooms = servicesData
      .filter(
        (i) =>
          (i.type && i.type.toLowerCase().includes("room")) ||
          (i.category && i.category.toLowerCase().includes("room")) ||
          (i.title && /room|suite|cottage/i.test(i.title))
      )
      .slice(0, 4);

    const islandHops = servicesData
      .filter(
        (i) =>
          (i.type && i.type.toLowerCase().includes("island")) ||
          (i.category && i.category.toLowerCase().includes("island")) ||
          (i.title && /island|hop|boat|tour|package/i.test(i.title))
      )
      .slice(0, 4);

    return { rooms, islandHops };
  };

  useEffect(() => {
    const fetchAll = async () => {
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
        `${BASE_URLS.FEEDBACKS}/feedbacks`,
        `${BASE_URLS.FEEDBACKS}/ratings`,
      ]);

      try {
        const [aboutResp, servicesResp, feedbackResp] = await Promise.all([
          aboutPromise,
          servicesPromise,
          feedbackPromise,
        ]);

        const about = normalizeAbout(aboutResp.data);
        const { rooms, islandHops } = filterServices(servicesResp.data);

        const feedbacks = Array.isArray(feedbackResp.data)
          ? feedbackResp.data.slice(0, 4)
          : [];

        setData({
          about,
          rooms,
          islandHops,
          feedbacks,
          loading: false,
        });
      } catch (error) {
        console.error("Homepage fetch error:", error);
        setData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchAll();
  }, []);

  return data;
};

/* --------------------- MAIN COMPONENT ---------------------- */

export default function Homepage() {
  const navigate = useNavigate();
  const { about, rooms, islandHops, feedbacks, loading } = useResortData();

  const [visible, setVisible] = useState({
    about: false,
    rooms: false,
    island: false,
    feedbacks: false,
  });

  const [searchQuery, setSearchQuery] = useState({
    roomName: "",
    checkInDate: "",
    checkOutDate: "",
  });

  const handleSearchChange = (e) => {
    setSearchQuery({ ...searchQuery, [e.target.name]: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const queryString = new URLSearchParams(searchQuery).toString();
    navigate(`/availability?${queryString}`);
  };

  useEffect(() => {
    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cls = entry.target.classList;
          if (cls.contains("about-section")) setVisible((v) => ({ ...v, about: true }));
          if (cls.contains("rooms-section")) setVisible((v) => ({ ...v, rooms: true }));
          if (cls.contains("island-section")) setVisible((v) => ({ ...v, island: true }));
          if (cls.contains("feedbacks-section"))
            setVisible((v) => ({ ...v, feedbacks: true }));
        }
      });
    };

    const observer = new IntersectionObserver(callback, { threshold: 0.15 });
    document
      .querySelectorAll(".scroll-animate")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const defaultVideoUrl = "https://www.youtube.com/embed/f4eLvLbREEI";
  const videoToUse = about.videoUrl
    ? about.videoUrl.replace("watch?v=", "embed/")
    : defaultVideoUrl;

  return (
    <div className="homepage-root">
      {/* HERO */}
      <header
        className="hero large-hero"
        style={{ backgroundImage: `url(${mountainView})` }}
      >
        <div className="hero-overlay"></div>

        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">EM'z Bayview Mountain Resort</h1>
            <p className="hero-sub">
              A peaceful escape — book rooms, join island hopping, and make memories.
            </p>

            <div className="hero-cta">
              <button onClick={() => navigate("/services")}>
                Explore Rooms
              </button>
              <button className="ghost" onClick={() => navigate("/services")}>
                Island Hopping
              </button>
            </div>
          </div>

          {/* SEARCH BOX */}
          <form className="hero-search-box" onSubmit={handleSearchSubmit}>
            <div className="search-fields">
              <div className="search-field-group">
                <label>Room Name</label>
                <input
                  type="text"
                  name="roomName"
                  placeholder="Family Room"
                  value={searchQuery.roomName}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="search-field-group">
                <label>Check-in</label>
                <input
                  type="date"
                  name="checkInDate"
                  value={searchQuery.checkInDate}
                  onChange={handleSearchChange}
                  required
                />
              </div>

              <div className="search-field-group">
                <label>Check-out</label>
                <input
                  type="date"
                  name="checkOutDate"
                  value={searchQuery.checkOutDate}
                  onChange={handleSearchChange}
                  required
                />
              </div>

              <div className="search-field-group search-button-container">
                <button type="submit" className="btn search-button">
                  CHECK AVAILABILITY
                </button>
              </div>
            </div>
          </form>
        </div>
      </header>

      <main className="main-content">
        {/* ABOUT */}
        <section className={`about-section scroll-animate ${visible.about ? "is-visible" : ""}`}>
          <div className="about-grid">
            <div className="about-text">
              <h2>Swim, Chill, Chillax</h2>
              {loading ? <p>Loading...</p> : <p>{about.content}</p>}
            </div>

            <div className="about-media">
              <iframe
                src={videoToUse}
                title="Resort Video"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
