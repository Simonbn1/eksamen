import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Circles } from "react-loader-spinner";
import "./style/EventList.css";

interface Event {
  title: string;
  place: string;
  category: string;
  description: string;
  date: string;
}

const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("http://localhost:3000/api/event");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <Circles height="80" width="80" color="#4fa94d" ariaLabel="loading" />
      </div>
    );
  }

  return (
    <div className="EventList-container">
      <h1 className="EventList-title">Aktive arrangementer</h1>
      <div className="event-grid">
        {events.map((event, index) => (
          <div key={index} className="event-card">
            <h2 className="event-title">{event.title}</h2>
            <div className="event-detail">
              <strong>Kategori:</strong> {event.category}
            </div>
            <div className="event-detail">
              <strong>Lokasjon:</strong> {event.place}
            </div>
            <div className="event-detail">
              <strong>Dato:</strong> {event.date}
            </div>
            <div className="event-detail">
              <strong>Beskrivelse:</strong> {event.description}
            </div>
          </div>
        ))}
      </div>
      <div className="back">
        <button className="Event-back-button" onClick={() => navigate("/")}>
          Tilbake
        </button>
      </div>
    </div>
  );
};

export default EventList;
