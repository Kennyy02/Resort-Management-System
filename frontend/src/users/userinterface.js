import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/userinterface.css";

const ABOUT_BASE = "https://about-us-production.up.railway.app";
const SERVICES_BASE = "https://manage-service-production.up.railway.app";
const FEEDBACKS_BASE = "https://ratings-and-feedbacks-production.up.railway.app";

const tryFetch = async (candidates, config = {}) => {
  for (const url of candidates) {
    try {
      const res = await axios.get(url, config);
      if (res && (res.data !== undefined)) return { data: res.data, url };
    } catch (err) {
      // try next
    }
  }
  return { data: null, url: null };
};

export default function Homepage() {
  const [about, setAbout] = useState({ content: "Loading about info...", videoUrl: null });
  const [rooms, setRooms] = useState([]);
  const [islandHops, setIslandHops] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const howRef = useRef(null);
  const [visible, setVisible] = useState({ about: false, rooms: false, island: false, feedbacks: false });

  useEffect(() => {
    const fetchAll = async () => {
      // 1) About Us - try several common paths
      const aboutCandidates = [
        `${ABOUT_BASE}/pre/api/aboutus`,
        `${ABOUT_BASE}/api/aboutus`,
        `${ABOUT_BASE}/aboutus`,
        `${ABOUT_BASE}/api/v1/about`,
      ];
      const aboutResp = await tryFetch(aboutCandidates);
      if (aboutResp.data) {
        // support either array or object
        let content = "";
        let videoUrl = null;
        if (Array.isArray(aboutResp.data) && aboutResp.data.length > 0) {
          content = aboutResp.data[0].content || aboutResp.data[0].description || JSON.stringify(aboutResp.data[0]);
          videoUrl = aboutResp.data[0].videoUrl || aboutResp.data[0].video || null;
        } else if (typeof aboutResp.data === "object") {
          content = aboutResp.data.content || aboutResp.data.description || JSON.stringify(aboutResp.data);
          videoUrl = aboutResp.data.videoUrl || aboutResp.data.video || null;
        } else {
          content = String(aboutResp.data);
        }
        setAbout({ content, videoUrl });
      } else {
        setAbout({ content: "About information currently unavailable.", videoUrl: null });
      }

      // 2) Services (rooms & island hopping)
      const servicesCandidates = [
        `${SERVICES_BASE}/services`,
        `${SERVICES_BASE}/api/services`,
        `${SERVICES_BASE}/api/v1/services`,
        `${SERVICES_BASE}/service`,
        `${SERVICES_BASE}/api/service`,
      ];
      const servicesResp = await tryFetch(servicesCandidates);
      if (servicesResp.data && Array.isArray(servicesResp.data)) {
        // try to detect by type/category fields
        const items = servicesResp.data;
        const roomsList = items.filter(i =>
          (i.type && i.type.toLowerCase().includes("room")) ||
          (i.category && i.category.toLowerCase().includes("room")) ||
          (i.title && /room|suite|cottage/i.test(i.title))
        );
        const islandList = items.filter(i =>
          (i.type && i.type.toLowerCase().includes("island")) ||
          (i.category && i.category.toLowerCase().includes("island")) ||
          (i.title && /island|hop|boat|tour|package/i.test(i.title))
        );

        // If no typed separation, fallback: take first N as rooms, next N as island
        setRooms(roomsList.length ? roomsList : items.slice(0, Math.min(6, items.length)));
        setIslandHops(islandList.length ? islandList : items.slice(Math.min(6, items.length)));
      } else {
        // Try separate endpoints
        const roomsCandidates = [
          `${SERVICES_BASE}/services?type=rooms`,
          `${SERVICES_BASE}/services?type=room`,
          `${SERVICES_BASE}/rooms`,
          `${SERVICES_BASE}/api/rooms`,
        ];
        const islandCandidates = [
          `${SERVICES_BASE}/services?type=island`,
          `${SERVICES_BASE}/services?type=island_hopping`,
          `${SERVICES_BASE}/island-hopping`,
          `${SERVICES_BASE}/api/island-hopping`,
          `${SERVICES_BASE}/packages?category=island`,
        ];

        const roomsResp = await tryFetch(roomsCandidates);
        const islandResp = await tryFetch(islandCandidates);

        setRooms(Array.isArray(roomsResp.data) ? roomsResp.data : []);
        setIslandHops(Array.isArray(islandResp.data) ? islandResp.data : []);
      }

      // 3) Feedbacks/ratings
      const feedbackCandidates = [
        `${FEEDBACKS_BASE}/api/feedback`,
        `${FEEDBACKS_BASE}/api/feedbacks`,
        `${FEEDBACKS_BASE}/feedback`,
        `${FEEDBACKS_BASE}/ratings`,
        `${FEEDBACKS_BASE}/api/ratings`,
      ];
      const feedbackResp = await tryFetch(feedbackCandidates);
      if (feedbackResp.data && Array.isArray(feedbackResp.data)) {
        setFeedbacks(feedbackResp.data.slice(0, 12));
      } else {
        setFeedbacks([]);
      }

      setLoading(false);
    };

    fetchAll();
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (entry.target.dataset => true) {}
          }
        });
      },
      { threshold: 0.15 }
    );
    // Observe specific sections
    document.querySelectorAll(".scroll-animate").forEach(el => io.observe(el));
    const cb = (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          if (e.target.classList.contains("about-section")) setVisible(v => ({ ...v, about: true }));
          if (e.target.classList.contains("rooms-section")) setVisible(v => ({ ...v, rooms: true }));
          if (e.target.classList.contains("island-section")) setVisible(v => ({ ...v, island: true }));
          if (e.target.classList.contains("feedbacks-section")) setVisible(v => ({ ...v, feedbacks: true }));
        }
      });
    };
    const obs = new IntersectionObserver(cb, { threshold: 0.15 });
    document.querySelectorAll(".scroll-animate").forEach(el => obs.observe(el));
    return () => {
      obs.disconnect();
      io.disconnect();
    };
  }, []);

  const getImage = (item) => item.image || item.imageUrl || item.photo || item.thumbnail || null;

  return (
    <div className="homepage-root">
      <header className="hero large-hero">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">EM'z Bayview Mountain Resort</h1>
            <p className="hero-sub">A peaceful escape — book rooms, join island hopping, and make memories.</p>
            <div className="hero-cta">
              <button onClick={() => window.scrollTo({ top: 700, behavior: "smooth" })}>Explore Rooms</button>
              <button className="ghost" onClick={() => window.scrollTo({ top: 1500, behavior: "smooth" })}>Island Hopping</button>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <img src={getImage(rooms[0]) || "/placeholder-resort.jpg"} alt="resort hero" />
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className={`about-section scroll-animate ${visible.about ? "is-visible" : ""}`}>
          <div className="about-grid">
            <div className="about-text">
              <h2>About the Resort</h2>
              <div className="about-content">
                {loading ? <p>Loading information...</p> : about.content.split("\n").map((l, i) => <p key={i}>{l}</p>)}
              </div>
              <div className="about-actions">
                <a className="btn" href="/aboutus">Read Full Story</a>
              </div>
            </div>

            <div className="about-media">
              {about.videoUrl ? (
                <video controls playsInline className="resort-video" src={about.videoUrl} />
              ) : (
                <div className="video-placeholder">
                  <img src={getImage(rooms[0]) || "/placeholder-resort.jpg"} alt="resort preview" />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`rooms-section scroll-animate ${visible.rooms ? "is-visible" : ""}`}>
          <div className="section-header">
            <h3>Rooms & Accommodations</h3>
            <p>Comfortable rooms curated for a relaxing stay.</p>
          </div>

          <div className="cards-grid">
            {rooms.length === 0 && !loading ? <p className="muted">No rooms found.</p> : null}
            {rooms.map((r, idx) => (
              <article className="card" key={r.id || idx}>
                <div className="card-media">
                  <img src={getImage(r) || "/placeholder-room.jpg"} alt={r.title || "room"} />
                </div>
                <div className="card-body">
                  <h4>{r.title || r.name || `Room ${idx + 1}`}</h4>
                  <p className="muted">{r.description ? r.description.slice(0, 120) + (r.description.length > 120 ? "..." : "") : "No description."}</p>
                  <div className="card-footer">
                    <span className="price">{r.price ? `₱${r.price}` : "Contact"}</span>
                    <a className="btn small" href={`/services/${r.id || idx}`}>Book</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`island-section scroll-animate ${visible.island ? "is-visible" : ""}`}>
          <div className="section-header">
            <h3>Island Hopping & Tours</h3>
            <p>Explore nearby islands with guided tours and boat trips.</p>
          </div>

          <div className="cards-grid">
            {islandHops.length === 0 && !loading ? <p className="muted">No packages found.</p> : null}
            {islandHops.map((p, idx) => (
              <article className="card wide" key={p.id || idx}>
                <div className="card-media">
                  <img src={getImage(p) || "/placeholder-island.jpg"} alt={p.title || "package"} />
                </div>
                <div className="card-body">
                  <h4>{p.title || p.name || `Package ${idx + 1}`}</h4>
                  <p className="muted">{p.description ? p.description.slice(0, 140) + (p.description.length > 140 ? "..." : "") : "No description."}</p>
                  <div className="card-footer">
                    <span className="price">{p.price ? `₱${p.price}` : "Contact"}</span>
                    <a className="btn small" href={`/packages/${p.id || idx}`}>View</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`feedbacks-section scroll-animate ${visible.feedbacks ? "is-visible" : ""}`}>
          <div className="section-header">
            <h3>Guest Feedback</h3>
            <p>What our guests say about their stay.</p>
          </div>

          <div className="feedback-carousel">
            {feedbacks.length === 0 ? (
              <p className="muted">No feedbacks yet.</p>
            ) : (
              feedbacks.slice(0, 6).map((f, i) => (
                <blockquote className="feedback-card" key={f.id || i}>
                  <p className="msg">“{f.message || f.content || f.feedback || "No message."}”</p>
                  <footer className="meta">
                    <strong>{f.name || f.user || "Guest"}</strong>
                    <span className="date">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</span>
                  </footer>
                </blockquote>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
