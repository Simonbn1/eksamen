import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  place: string;
}

const YourEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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

  async function handleDelete(eventId: string) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/event/${eventId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete the event");
      }

      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== eventId),
      );
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  }

  return (
    <div>
      <h1>Your Events</h1>
      <select
        onChange={(e) => setSelectedEventId(e.target.value)}
        value={selectedEventId || ""}
      >
        <option value="" disabled>
          Select an event
        </option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>
      {selectedEventId && (
        <>
          <Link to={`/EditEvent/${selectedEventId}`}>
            <button>Edit Event</button>
          </Link>
          <button onClick={() => handleDelete(selectedEventId)}>
            Delete Event
          </button>
        </>
      )}
    </div>
  );
};

export default YourEvents;
