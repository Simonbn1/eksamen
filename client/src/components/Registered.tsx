import React, { useEffect, useState } from "react";

interface Event {
  title: string;
  date: string;
  description: string;
  category: string;
  place: string;
}

const Registered: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ category: "", place: "", time: "" });

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/event");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    }
    fetchEvents();

    const ws = new WebSocket("ws://localhost:3000");
    ws.onmessage = (event) => {
      const newEvent = JSON.parse(event.data);
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    };

    return () => {
      ws.close();
    };
  }, []);

  const filteredEvents = events.filter((event) => {
    return (
      event.title.toLowerCase().includes(search.toLowerCase()) &&
      (filter.category ? event.category === filter.category : true) &&
      (filter.place ? event.place === filter.place : true) &&
      (filter.time ? event.date === filter.time : true)
    );
  });

  return (
    <div>
      <h1>Event List</h1>
      <input
        type="text"
        placeholder="Search by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        onChange={(e) => setFilter({ ...filter, category: e.target.value })}
      >
        <option value="">All Categories</option>
        <option value="Category1">Category1</option>
        <option value="Category2">Category2</option>
      </select>
      <select onChange={(e) => setFilter({ ...filter, place: e.target.value })}>
        <option value="">All Places</option>
        <option value="Place1">Place1</option>
        <option value="Place2">Place2</option>
      </select>
      <input
        type="date"
        onChange={(e) => setFilter({ ...filter, time: e.target.value })}
      />
      <ul>
        {filteredEvents.map((event, index) => (
          <li key={index}>
            <h2>{event.title}</h2>
            <p>{event.date}</p>
            <p>{event.description}</p>
            <p>{event.category}</p>
            <p>{event.place}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Registered;
