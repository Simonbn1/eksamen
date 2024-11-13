import React, { useEffect, useState } from "react";

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
        console.log("Fetched events:", data); // Debugging line
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch registered events:", error);
      }
    }

    fetchRegisteredEvents();
  }, []);

  return (
    <div>
      <h1>My Registered Events</h1>
      {events.length === 0 ? (
        <p>No events joined yet.</p> // Conditional message for empty data
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
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
  );
};

export default Profile;
