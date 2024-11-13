import React, { useState } from "react";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  place: string;
}

interface Props {
  onNewEvent: (event: Event) => void;
}

const AddEvent: React.FC<Props> = ({ onNewEvent }) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [place, setPlace] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newEvent = { title, date, description, category, place };

    try {
      const response = await fetch("http://localhost:3000/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        throw new Error("Failed to save the event");
      }

      const savedEvent = await response.json();
      onNewEvent(savedEvent);
      setTitle("");
      setDate("");
      setDescription("");
      setCategory("");
      setPlace("");
    } catch (error) {
      console.error("Error saving event:", error);
    }
  }

  return (
    <div>
      <h1>Add Event</h1>
      <form className={"event"} onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label>Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            <option value="Category1">Category1</option>
            <option value="Category2">Category2</option>
            <option value="Category3">Category3</option>
          </select>
        </div>
        <div>
          <label>Place:</label>
          <select value={place} onChange={(e) => setPlace(e.target.value)}>
            <option value="">Select Place</option>
            <option value="Place1">Place1</option>
            <option value="Place2">Place2</option>
            <option value="Place3">Place3</option>
          </select>
        </div>
        <button type="submit">Add Event</button>
      </form>
    </div>
  );
};

export default AddEvent;
