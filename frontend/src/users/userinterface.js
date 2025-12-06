import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import mountainView from "../components/pictures/mountainView.jpg";
import "./styles/userinterface.css";

/* ---------------- CONSTANTS ---------------- */

const BASE_URLS = {
  ABOUT: "https://about-us-production.up.railway.app",
  SERVICES: "https://manage-service-production.up.railway.app",
  FEEDBACKS: "https://ratings-and-feedbacks-production.up.railway.app"
};

/* ---------------- UTILS ---------------- */

const tryFetch = async (candidates, config = {}) => {
  for (const url of candidates) {
    try {
      const res = await axios.get(url, config);
      if (res && res.data) return { data: res.data, url };
    } catch {
      continue;
    }
  }
  return { data: null, url: null };
};

const getImage = (item) =>
  item?.image || item?.imageUrl || item?.photo || item?.thumbnail || null;

/* ---------------- CUSTOM HOOK ---------------- */

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

    if (Array.isArray(aboutData) && aboutData.length > 0) {
      dataToProcess = aboutData[0];
    }

    if (typeof dataToProcess === "object" && dataToProcess !== null) {
      content = dataToProcess.content || dataToProcess.description || "";
      videoUrl = dataToProcess.videoUrl || dataToProcess.video || null;
    }

    return {
      content: content || "About info unavailable",
      videoUrl,
    };
  };

  const filterServices = (servicesData) => {
    if (!Array.isArray(servicesData)) {
      return { rooms: [], islandHops: [] };
    }

    const rooms = servicesData
      .filter(
        (i) =>
          i?.type?.toLowerCase().includes("room") ||
          i?.category?.toLowerCase().includes("room") ||
          /room|suite|cottage/i.test(i?.title)
      )
      .slice(0, 4);

    const islandHops = servicesData
      .filter(
        (i) =>
          i?.type?.toLowerCase().includes("island") ||
          i?.category?.toLowerCase().includes("island") ||
          /island|hop|boat|tour|package/i.test(i?.title)
      )
      .slice(0, 4);

    return { rooms, islandHops };
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [aboutResp, servicesResp, feedbackResp] = await Promise.all([
          tryFetch([
            `${BASE_URLS.ABOUT}/pre/api/aboutus`,
            `${BASE_URLS.ABOUT}/api/aboutus`,
            `${BASE_URLS.ABOUT}/aboutus`,
          ]),

          tryFetch([
            `${BASE_URLS.SERVICES}/api/services`,
            `${BASE_URLS.SERVICES}/services`,
          ]),

          tryFetch([
            `${BASE_URLS.FEEDBACKS}/api/feedbacks`,
            `${BASE_URLS.FEEDBACKS}/feedbacks`,
          ]),
        ]);

        const about = normalizeAbout(aboutResp.data);
        const { rooms, islandHops } = filterServices(servicesResp.data);

        const feedbacks = Array.isArray(feedbackResp.data)
          ? feedbackResp.data.slice(0, 4)
          : [];

        setData({ about, rooms, islandHops, feedbacks, loading: false });
      } catch (error) {
        console.error("Home error:", error);
        setData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchAll();
  }, []);

  return data;
};

/* ---------------- COMPONENT ---------------- */

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
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (e.target.classList.contains("about-section")) setVisible(v => ({ ...v, about: true }));
          if (e.target.classList.contains("rooms-section")) setVisible(v => ({ ...v, rooms: true }));
          if (e.target.classList.contains("island-section")) setVisible(v => ({ ...v, island: true }));
          if (e.target.classList.contains("feedbacks-section")) setVisible(v => ({ ...v, feedbacks: true }));
        }
      });
    };

    const observer = new IntersectionObserver(callback, { threshold: 0.15 });
    document.querySelectorAll(".scroll-animate").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const defaultVideoUrl = "https://www.youtube.com/embed/f4eLvLbREEI";
  const videoToUse = about.videoUrl
    ? about.videoUrl.replace("watch?v=", "embed/")
    : defaultVideoUrl;

  return (
    <div className="homepage-root">

      {/* HERO */}
      <header className="hero" style={{ backgroundImage: `url(${mountainView})` }}>
        <div className="hero-overlay"></div>

        <div className="hero-inner">
          <h1>EM'z Bayview Mountain Resort</h1>
          <p>A peaceful escape</p>

          <div className="hero-cta">
            <button onClick={() => navigate("/services")}>Explore Rooms</button>
            <button className="ghost" onClick={() => navigate("/services")}>
              Island hopping
            </button>
          </div>

          <form className="hero-search-box" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              name="roomName"
              placeholder="Room name"
              value={searchQuery.roomName}
              onChange={handleSearchChange}
            />

            <input
              type="date"
              name="checkInDate"
              value={searchQuery.checkInDate}
              onChange={handleSearchChange}
              required
            />

            <input
              type="date"
              name="checkOutDate"
              value={searchQuery.checkOutDate}
              onChange={handleSearchChange}
              required
            />

            <button type="submit">Check Availability</button>
          </form>
        </div>
      </header>

      {/* ABOUT */}
      <section className={`about-section scroll-animate ${visible.about ? "is-visible" : ""}`}>
        <p>{about.content}</p>
        <iframe src={videoToUse} title="Resort video" allowFullScreen />
      </section>

      {/* ROOMS */}
      <section className={`rooms-section scroll-animate ${visible.rooms ? "is-visible" : ""}`}>
        {rooms.map((r, i) => (
          <div className="card" key={i}>
            <img src={getImage(r)} alt="room" />
            <h4>{r.title || r.name}</h4>
          </div>
        ))}
      </section>

      {/* FEEDBACK */}
      <section className={`feedbacks-section scroll-animate ${visible.feedbacks ? "is-visible" : ""}`}>
        {feedbacks.map((f, i) => (
          <blockquote key={i}>
            <p>"{f.message}"</p>
            <small>{f.name}</small>
          </blockquote>
        ))}
      </section>

    </div>
  );
}
