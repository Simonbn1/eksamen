import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  place: string;
}

const EditEvent: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [eventData, setEventData] = useState<Event | null>(null);

  useEffect(() => {
    async function fetchEventDetails() {
      try {
        const response = await fetch(
          `http://localhost:3000/api/event/id/${eventId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch event details");
        }
        const data = await response.json();
        setEventData(data);
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    }

    fetchEventDetails();
  }, [eventId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (eventData) {
      setEventData({ ...eventData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData) return;

    const { id, ...updateData } = eventData;

    try {
      const response = await fetch(
        `http://localhost:3000/api/event/id/${eventId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );
      if (response.ok) {
        alert("Event updated successfully!");
      } else {
        alert("Failed to update event. Please try again.");
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  if (!eventData) {
    return <div>Loading...</div>;
  }

  return (
    <form className="edit-event-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">Title:</label>
        <input
          type="text"
          id="title"
          name="title"
          value={eventData.title}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          value={eventData.description}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="date">Date:</label>
        <input
          type="datetime-local"
          id="date"
          name="date"
          value={eventData.date}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="category">Category:</label>
        <select
          id="category"
          name="category"
          value={eventData.category}
          onChange={handleInputChange}
          required
        >
          <option value="">Select a category</option>
          <option value="Workshop">Workshop</option>
          <option value="Seminar">Seminar</option>
          <option value="Conference">Conference</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="place">Place:</label>
        <input
          type="text"
          id="place"
          name="place"
          value={eventData.place}
          onChange={handleInputChange}
          required
        />
      </div>
      <button type="submit" className="submit-button">
        Save Changes
      </button>
      <button
        onClick={() => navigate("/Organizer")}
        className="back-home-button"
      >
        Back
      </button>
    </form>
  );
};

export default EditEvent;
