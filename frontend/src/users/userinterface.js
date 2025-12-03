import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import mountainView from "../components/pictures/mountainView.jpg";
import "./styles/userinterface.css";

const ABOUT_BASE = "https://about-us-production.up.railway.app";
const SERVICES_BASE = "https://manage-service-production.up.railway.app";
const FEEDBACKS_BASE = "https://ratings-and-feedbacks-production.up.railway.app";

const tryFetch = async (candidates, config = {}) => {
  for (const url of candidates) {
    try {
      const res = await axios.get(url, config);
      if (res && res.data !== undefined) return { data: res.data, url };
    } catch (err) {}
  }
  return { data: null, url: null };
};

export default function Homepage() {
  const navigate = useNavigate();
  const [about, setAbout] = useState({ content: "Loading about info...", videoUrl: null });
  const [rooms, setRooms] = useState([]);
  const [islandHops, setIslandHops] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState({
    about: false,
    rooms: false,
    island: false,
    feedbacks: false,
  });

  useEffect(() => {
    const fetchAll = async () => {
      // About section
      const aboutResp = await tryFetch([
        `${ABOUT_BASE}/pre/api/aboutus`,
        `${ABOUT_BASE}/api/aboutus`,
        `${ABOUT_BASE}/aboutus`,
        `${ABOUT_BASE}/api/v1/about`,
      ]);

      if (aboutResp.data) {
        let content = "";
        let videoUrl = null;
        if (Array.isArray(aboutResp.data) && aboutResp.data.length > 0) {
          content = aboutResp.data[0].content || aboutResp.data[0].description || "";
          videoUrl = aboutResp.data[0].videoUrl || aboutResp.data[0].video || null;
        } else if (typeof aboutResp.data === "object") {
          content = aboutResp.data.content || aboutResp.data.description || "";
          videoUrl = aboutResp.data.videoUrl || aboutResp.data.video || null;
        }
        setAbout({ content, videoUrl });
      } else {
        setAbout({ content: "About information currently unavailable.", videoUrl: null });
      }

      // Services section
      const servicesResp = await tryFetch([
        `${SERVICES_BASE}/api/services`,
        `${SERVICES_BASE}/services`,
        `${SERVICES_BASE}/api/v1/services`,
        `${SERVICES_BASE}/service`,
        `${SERVICES_BASE}/api/service`,
      ]);

      if (servicesResp.data && Array.isArray(servicesResp.data)) {
        const items = servicesResp.data;
        const roomsList = items.filter((i) =>
          (i.type && i.type.toLowerCase().includes("room")) ||
          (i.category && i.category.toLowerCase().includes("room")) ||
          (i.title && /room|suite|cottage/i.test(i.title))
        ).slice(0, 4); // Only first 4 rooms
        const islandList = items.filter((i) =>
          (i.type && i.type.toLowerCase().includes("island")) ||
          (i.category && i.category.toLowerCase().includes("island")) ||
          (i.title && /island|hop|boat|tour|package/i.test(i.title))
        ).slice(0, 4); // Only first 4 island hopping packages
        setRooms(roomsList.length ? roomsList : items.slice(0, 4));
        setIslandHops(islandList.length ? islandList : items.slice(0, 4));
      }

      // Feedbacks
      const feedbackResp = await tryFetch([
        `${FEEDBACKS_BASE}/api/feedback`,
        `${FEEDBACKS_BASE}/api/feedbacks`,
        `${FEEDBACKS_BASE}/feedback`,
        `${FEEDBACKS_BASE}/ratings`,
        `${FEEDBACKS_BASE}/api/ratings`,
      ]);

      if (feedbackResp.data && Array.isArray(feedbackResp.data)) {
        const sortedFeedbacks = feedbackResp.data.sort((a, b) => {
          const dateA = new Date(a.created_at || a.date || 0);
          const dateB = new Date(b.created_at || b.date || 0);
          return dateB - dateA; // Newest first
        });
        setFeedbacks(sortedFeedbacks.slice(0, 4)); // Only latest 4 feedbacks
      }

      setLoading(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const callback = (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (e.target.classList.contains("about-section"))
            setVisible((v) => ({ ...v, about: true }));
          if (e.target.classList.contains("rooms-section"))
            setVisible((v) => ({ ...v, rooms: true }));
          if (e.target.classList.contains("island-section"))
            setVisible((v) => ({ ...v, island: true }));
          if (e.target.classList.contains("feedbacks-section"))
            setVisible((v) => ({ ...v, feedbacks: true }));
        }
      });
    };
    const observer = new IntersectionObserver(callback, { threshold: 0.15 });
    document.querySelectorAll(".scroll-animate").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const getImage = (item) =>
    item?.image || item?.imageUrl || item?.photo || item?.thumbnail || null;

  return (
    <div className="homepage-root">
      {/* HERO */}
      <header className="hero large-hero">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">EM'z Bayview Mountain Resort</h1>
            <p className="hero-sub">
              A peaceful escape — book rooms, join island hopping, and make memories.
            </p>
            <div className="hero-cta">
              <button onClick={() => navigate("/services")}>Explore Rooms</button>
              <button className="ghost" onClick={() => navigate("/services")}>
                Island Hopping
              </button>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <img src={mountainView} alt="Mountain view resort" />
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* ABOUT */}
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
                <iframe
                  src={about.videoUrl || "https://www.youtube.com/embed/f4eLvLbREEI"}
                  title="Resort Preview Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <a
                  href={about.videoUrl || "https://youtu.be/f4eLvLbREEI"}
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

        {/* ROOMS */}
        <section className={`rooms-section scroll-animate ${visible.rooms ? "is-visible" : ""}`}>
          <div className="section-header">
            <h3>Rooms & Accommodations</h3>
            <p>Comfortable rooms curated for a relaxing stay.</p>
          </div>

          <div className="cards-grid scrollable">
            {rooms.map((r, idx) => (
              <article className="card" key={r.id || idx}>
                <div className="card-media">
                  <img src={getImage(r) || "/placeholder-room.jpg"} alt={r.title || "room"} />
                </div>
                <div className="card-body">
                  <h4>{r.title || r.name || `Room ${idx + 1}`}</h4>
                  <p className="muted">
                    {r.description ? r.description.slice(0, 120) + (r.description.length > 120 ? "..." : "") : "No description."}
                  </p>
                  <div className="card-footer">
                    <span className="price">{r.price ? `₱${r.price}` : "Contact"}</span>
                    <a className="btn small" onClick={() => navigate("/services")}>Book</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ISLAND HOPPING */}
        <section className={`island-section scroll-animate ${visible.island ? "is-visible" : ""}`}>
          <div className="section-header">
            <h3>Island Hopping & Tours</h3>
            <p>Explore nearby islands with guided tours and boat trips.</p>
          </div>

          <div className="cards-grid scrollable">
            {islandHops.map((p, idx) => (
              <article className="card wide" key={p.id || idx}>
                <div className="card-media">
                  <img src={getImage(p) || "/placeholder-island.jpg"} alt={p.title || "package"} />
                </div>
                <div className="card-body">
                  <h4>{p.title || p.name || `Package ${idx + 1}`}</h4>
                  <p className="muted">{p.description?.slice(0, 140) + (p.description?.length > 140 ? "..." : "") || "No description."}</p>
                  <div className="card-footer">
                    <span className="price">{p.price ? `₱${p.price}` : "Contact"}</span>
                    <a className="btn small" onClick={() => navigate("/services")}>View</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* FEEDBACK */}
        <section className={`feedbacks-section scroll-animate ${visible.feedbacks ? "is-visible" : ""}`}>
          <div className="section-header">
            <h3>Guest Feedback</h3>
            <p>What our guests say about their stay.</p>
          </div>

          <div className="feedback-carousel scrollable">
            {feedbacks.map((f, i) => (
              <blockquote className="feedback-card" key={f.id || i}>
                <p className="msg">“{f.message || f.content || f.feedback || "No message."}”</p>
                <footer className="meta">
                  <strong>{f.name || f.user || "Guest"}</strong>
                  <span className="date">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</span>
                </footer>
              </blockquote>
            ))}
            {feedbacks.length === 0 && <p className="muted">No feedbacks yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
