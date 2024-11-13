import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  category?: string;
  place?: string;
}

const EditEvent: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(
          `http://localhost:3000/api/event/${eventId}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error("Failed to fetch event:", error);
      }
    }

    fetchEvent();
  }, [eventId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEvent((prevEvent) =>
      prevEvent ? { ...prevEvent, [name]: value } : null,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/event/${eventId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      alert("Event updated successfully!");
      navigate("/Organizer");
    } catch (error) {
      console.error("Failed to update event:", error);
    }
  };

  if (!event) return <div>Loading...</div>;

  return (
    <div>
      <h1>Edit Event</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={event.title}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Date:</label>
          <input
            type="datetime-local"
            name="date"
            value={event.date}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            name="description"
            value={event.description}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Category:</label>
          <input
            type="text"
            name="category"
            value={event.category}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Place:</label>
          <input
            type="text"
            name="place"
            value={event.place}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit">Update Event</button>
      </form>
    </div>
  );
};

export default EditEvent;
