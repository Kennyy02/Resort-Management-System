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

export default function UserInterface() {
  const navigate = useNavigate();
  const [about, setAbout] = useState({ content: "Loading about info...", videoUrl: null });
  const [rooms, setRooms] = useState([]);
  const [islandHops, setIslandHops] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const roomsList = items.filter(i => i.type?.toLowerCase().includes("room")).slice(0, 4);
        const islandList = items.filter(i => i.type?.toLowerCase().includes("island")).slice(0, 4);
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
        const sorted = feedbackResp.data
          .sort((a,b) => new Date(b.created_at||0)-new Date(a.created_at||0))
          .slice(0,4);
        setFeedbacks(sorted);
      }

      setLoading(false);
    };
    fetchAll();
  }, []);

  const getImage = item => item?.image || item?.imageUrl || item?.photo || item?.thumbnail || null;

  if (loading) return <div className="homepage-root loading">Loading...</div>;

  const renderCards = (items, type) => (
    <div className="cards-grid scrollable">
      {items.map((item, idx) => (
        <article className="card" key={item.id || idx}>
          <div className="card-media">
            <img src={getImage(item) || "/placeholder.jpg"} alt={item.title || item.name || type}/>
          </div>
          <div className="card-body">
            <h4>{item.title || item.name || `${type} ${idx+1}`}</h4>
            {item.description && <p className="muted">{item.description.slice(0, 120)+(item.description.length>120?'...':'')}</p>}
            <div className="card-footer">
              {item.price && <span className="price">₱{item.price}</span>}
              <button className="btn small" onClick={() => navigate("/services")}>
                {type === "rooms" ? "Book" : "View"}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  const renderFeedbacks = () => (
    <div className="cards-grid scrollable">
      {feedbacks.map((f, i) => (
        <blockquote className="feedback-card" key={f.id || i}>
          <p className="msg">“{f.message || f.content || f.feedback || "No message."}”</p>
          <footer className="meta">
            <strong>{f.name || f.user || "Guest"}</strong>
            <span className="date">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</span>
          </footer>
        </blockquote>
      ))}
      {feedbacks.length===0 && <p>No feedback yet.</p>}
    </div>
  );

  return (
    <div className="homepage-root">
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">EM'z Bayview Mountain Resort</h1>
            <p className="hero-sub">A peaceful escape — book rooms, join island hopping, and make memories.</p>
            <div className="hero-cta">
              <button onClick={()=>navigate("/services")}>Explore Rooms</button>
              <button className="ghost" onClick={()=>navigate("/services")}>Island Hopping</button>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <img src={mountainView} alt="Mountain view resort"/>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="about-section">
          <div className="about-grid">
            <div className="about-text">
              <h3>About EM'z Bayview</h3>
              {about.content.split("\n").map((line,i)=><p key={i}>{line}</p>)}
              <button className="btn" onClick={()=>navigate("/aboutus")}>Read Full Story</button>
            </div>
            {about.videoUrl && 
              <div className="about-media">
                <iframe src={about.videoUrl} title="Resort Preview" frameBorder="0" allowFullScreen/>
              </div>
            }
          </div>
        </section>

        <section className="rooms-section">
          <div className="section-header"><h3>Rooms & Accommodations</h3></div>
          {renderCards(rooms,"rooms")}
        </section>

        <section className="island-section">
          <div className="section-header"><h3>Island Hopping & Tours</h3></div>
          {renderCards(islandHops,"islands")}
        </section>

        <section className="feedbacks-section">
          <div className="section-header"><h3>Guest Feedback</h3></div>
          {renderFeedbacks()}
        </section>
      </main>
    </div>
  );
}
