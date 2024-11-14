import React, { useState } from "react";

interface Event {
  title: string;
  date: string;
  description: string;
  category: string;
  place: string;
}

const AddEvent: React.FC = () => {
  const [newEvent, setNewEvent] = useState<Event>({
    title: "",
    date: "",
    description: "",
    category: "",
    place: "",
  });
  const [error, setError] = useState<string | null>(null);

  function handleInputChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setNewEvent((prevEvent) => ({
      ...prevEvent,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { title, date, category, place } = newEvent;

    if (!title || !date || !category || !place) {
      setError("All fields are required.");
      alert("All fields are required.");
      return;
    }

    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        const data = await response.json();
        if (
          response.status === 400 &&
          data.message === "Event with the same title already exists"
        ) {
          alert("Event with the same title already exists");
        } else {
          alert("Error submitting event");
        }
        return;
      }

      console.log("Event submitted:", newEvent);
      // Reset the form fields
      setNewEvent({
        title: "",
        date: "",
        description: "",
        category: "",
        place: "",
      });
    } catch (error) {
      console.error("Error submitting event:", error);
      alert("Error submitting event");
    }
  }

  return (
    <div>
      <h1>Add Event</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={newEvent.title}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Date:</label>
          <input
            type="datetime-local"
            name="date"
            value={newEvent.date}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            name="description"
            value={newEvent.description}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Category:</label>
          <select
            name="category"
            value={newEvent.category}
            onChange={handleInputChange}
          >
            <option value="">Select a category</option>
            <option value="Music">Music</option>
            <option value="Sports">Sports</option>
            <option value="Education">Education</option>
            <option value="Health">Health</option>
          </select>
        </div>
        <div>
          <label>Place:</label>
          <select
            name="place"
            value={newEvent.place}
            onChange={handleInputChange}
          >
            <option value="">Select a place</option>
            <option value="Auditorium">Auditorium</option>
            <option value="Conference Room">Conference Room</option>
            <option value="Outdoor">Outdoor</option>
            <option value="Online">Online</option>
          </select>
        </div>
        <button type="submit">Submit Event</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
};

export default AddEvent;
