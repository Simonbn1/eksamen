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
  const [selectedEventName, setSelectedEventName] = useState<string | null>(
    null,
  );

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

  async function handleDelete(eventName: string) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/event/name/${eventName}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete the event");
      }

      // Filter out the deleted event in the front-end state
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.title !== eventName),
      );

      console.log(`Event with name ${eventName} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  }

  return (
    <div>
      <h1>Your Events</h1>
      <select
        onChange={(e) => setSelectedEventName(e.target.value)}
        value={selectedEventName || ""}
      >
        <option value="" disabled>
          Select an event
        </option>
        {events.map((event) => (
          <option key={event.id} value={event.title}>
            {event.title}
          </option>
        ))}
      </select>
      {selectedEventName && (
        <>
          <Link to={`/EditEvent/${selectedEventName}`}>
            <button>Edit Event</button>
          </Link>
          <button onClick={() => handleDelete(selectedEventName)}>
            Delete Event
          </button>
        </>
      )}
    </div>
  );
};

export default YourEvents;
