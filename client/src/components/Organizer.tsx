import React, { useState } from "react";

interface Event {
  title: string;
  date: string;
  description: string;
}

interface Props {
  onNewEvent: (event: Event) => void;
}

export function Organizer({ onNewEvent }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNewEvent({ title, date, description });
    setTitle("");
    setDate("");
    setDescription("");
  }

  return (
    <div>
      <h1>Organizer</h1>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Add Event</button>
      </form>
    </div>
  );
}

export default Organizer;
