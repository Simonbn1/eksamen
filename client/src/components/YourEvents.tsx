import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Circles } from "react-loader-spinner";

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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendeeCount, setAttendeeCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("http://localhost:3000/api/event");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        const formattedData = data.map((event: any) => ({
          id: event._id,
          title: event.title,
          date: event.date,
          description: event.description,
          category: event.category,
          place: event.place,
        }));
        console.log("Fetched events:", formattedData); // Debug-log
        setEvents(formattedData);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    }

    fetchEvents();
  }, []);

  const handleSelectEvent = async (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    console.log("Selected event:", event); // Debug-log
    setSelectedEvent(event || null);

    if (event) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/events/${eventId}/attendees`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch attendees");
        }
        const data = await response.json();
        setAttendeeCount(data.count);
      } catch (error) {
        console.error("Error fetching attendees:", error);
      }
    }
  };

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`http://localhost:3000/api/event/id/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete the event");
      }

      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));

      console.log(`Event with id ${id} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  }

  return (
    <div>
      <h1>Your Events</h1>
      <select
        onChange={(e) => handleSelectEvent(e.target.value)}
        value={selectedEvent?.id || ""}
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
      {selectedEvent && (
        <div>
          <h2>{selectedEvent.title}</h2>
          <p>
            <strong>Description:</strong> {selectedEvent.description}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {new Date(selectedEvent.date).toLocaleString()}
          </p>
          <p>
            <strong>Category:</strong> {selectedEvent.category}
          </p>
          <p>
            <strong>Place:</strong> {selectedEvent.place}
          </p>
          {attendeeCount !== null && (
            <p>
              <strong>Attendees:</strong> {attendeeCount}
            </p>
          )}
          <Link to={`/EditEvent/${selectedEvent.id}`}>
            <button className="back-button">Edit Event</button>
          </Link>
          <button
            className="org-back-home-button"
            onClick={() => handleDelete(selectedEvent.id)}
          >
            Delete Event
          </button>
        </div>
      )}
    </div>
  );
};

export default YourEvents;
