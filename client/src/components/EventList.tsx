import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "";

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch(`${apiBaseUrl}/event`);
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching events:", error);
        throw error;
      }
    }

    fetchEvents();
  }, []);

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
