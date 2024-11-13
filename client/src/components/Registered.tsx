import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useJoinedEvents } from "./JoinedEventsContext";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
}

const Registered: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const { addJoinedEvent } = useJoinedEvents();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("http://localhost:3000/api/event");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const mappedEvents = data.map((event: any) => ({
          id: event._id,
          title: event.title,
          date: event.date,
          description: event.description,
        }));
        setEvents(mappedEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    }

    fetchEvents();
  }, []);

  const handleJoinEvent = async (eventId: string) => {
    try {
      const userId = "6734bd3a7ccc910302792384"; // Replace with actual logged-in user ID
      const response = await fetch(
        `http://localhost:3000/api/join/${eventId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const joinedEvent = events.find((event) => event.id === eventId);
      if (joinedEvent) {
        addJoinedEvent(joinedEvent);
      }
      alert("Successfully joined the event!");
    } catch (error) {
      console.error("Failed to join event:", error);
    }
  };

  return (
    <div className="registered-container">
      <nav className="nav">
        <ul>
          <li>
            <Link to="/Profile">View Profile</Link>
          </li>
        </ul>
      </nav>
      <div className="content">
        <h1>Registered Events</h1>
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <h2>{event.title}</h2>
              <p>{event.date}</p>
              <p>{event.description}</p>
              <button onClick={() => handleJoinEvent(event.id)}>
                Join Event
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Registered;
