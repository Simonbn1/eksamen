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
      }
    }

    fetchEvents();
  }, []);

  return (
    <div>
      <h1>Event List</h1>
      <div className="event-grid">
        {events.map((event, index) => (
          <div key={index} className="event-card">
            <h2 className="event-title">{event.title}</h2>
            <div className="event-detail">
              <strong>Category:</strong> {event.category}
            </div>
            <div className="event-detail">
              <strong>Location:</strong> {event.place}
            </div>
            <div className="event-detail">
              <strong>Date:</strong> {event.date}
            </div>
            <div className="event-detail">
              <strong>Description:</strong> {event.description}
            </div>
          </div>
        ))}
      </div>
      <div className="back">
        <button className="Event-back-button" onClick={() => navigate("/")}>
          Back
        </button>
      </div>
    </div>
  );
};
export default EventList;
