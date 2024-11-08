import React, { useState } from "react"
import axios from "axios";

const Organizer: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post("/api/events", { title, description, date });
    setTitle("");
    setDescription("");
    setDate("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Lag et arrangement</h1>
      <div>
        <label>Navn</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Beskrivelse</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Dato</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <button type="submit">Bekreft</button>
    </form>
  );
};

export default Organizer;
