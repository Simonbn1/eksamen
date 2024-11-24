import React, { useState } from "react";

interface Event {
  title: string;
  description: string;
  date: string;
  category: string;
  place: string;
}

const AddEvent: React.FC = () => {
  const [eventData, setEventData] = useState<Event>({
    title: "",
    description: "",
    date: "",
    category: "",
    place: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });
      if (response.ok) {
        alert("Event added successfully!");
        setEventData({
          title: "",
          description: "",
          date: "",
          category: "",
          place: "",
        });
      } else {
        alert("Failed to add event. Please try again.");
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  return (
    <form className="add-event-form" onSubmit={handleSubmit}>
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
          <option value="Category 1">Category 1</option>
          <option value="Category 2">Category 2</option>
          <option value="Category 3">Category 3</option>
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
        Submit Event
      </button>
    </form>
  );
};

export default AddEvent;
