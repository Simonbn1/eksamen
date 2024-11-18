import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./style/Profile.css"; // Profile-specific CSS

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  category?: string;
  place?: string;
}

const Profile: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function fetchRegisteredEvents() {
      try {
        const userId = "6734bd3a7ccc910302792384"; // Replace with actual user ID
        const response = await fetch(
          `http://localhost:3000/api/user/events/${userId}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch registered events:", error);
      }
    }

    fetchRegisteredEvents();
  }, []);

  return (
    <div className="profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <h1>My Registered Events</h1>
      </div>

      {/* Navigation Button */}
      <div className="profile-navigation">
        <button className="back-button">
          <Link to="/Registered">Back to Registered</Link>
        </button>
      </div>

      {/* Main Content Section */}
      <div className="profile-main">
        {events.length === 0 ? (
          <p>No events joined yet.</p>
        ) : (
          <ul className="profile-event-list">
            {events.map((event) => (
              <li key={event.id} className="profile-event-card">
                <h2>{event.title}</h2>
                <p>{event.date}</p>
                <p>{event.description}</p>
                <p>{event.category}</p>
                <p>{event.place}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Profile;
