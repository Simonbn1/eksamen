import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useJoinedEvents } from "./JoinedEventsContext";
import "./style/Registered.css"; // Assuming the CSS file is named "Registered.css"

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  category?: string;
  place?: string;
}

const Registered: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState({
    category: "",
    place: "",
    startTime: "",
    endTime: "",
    search: "",
  });
  const { addJoinedEvent } = useJoinedEvents();

  useEffect(() => {
    async function fetchEvents() {
      const query = new URLSearchParams(filters as any).toString();
      try {
        const response = await fetch(
          `http://localhost:3000/api/event?${query}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const mappedEvents = data.map((event: any) => ({
          id: event._id,
          title: event.title,
          date: event.date,
          description: event.description,
          category: event.category,
          place: event.place,
        }));
        setEvents(mappedEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    }

    fetchEvents();
  }, [filters]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      const userId = "6734bd3a7ccc910302792384"; // Replace with actual logged-in user ID
      const response = await fetch(
        `http://localhost:3000/api/join/${eventId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const joinedEvent = events.find((event) => event.id === eventId);
      if (joinedEvent) {
        addJoinedEvent(joinedEvent);
      }
      alert("Successfully joined the event!");
    } catch (error) {
      console.error("Failed to join event:", error);
    }
  };

  return (
    <div className="grid-container">
      {/* Header Section */}
      <div className="item1">
        <h1>
          Welcome to <span className="event">Event</span>
          <span className="logger">Logger</span>
        </h1>
      </div>

      {/* Menu Section */}
      <div className="item2">
        <nav className="menu-buttons">
          <button>
            <Link to="/Profile">View Profile</Link>
          </button>
          <button>
            <Link to="/">Back to Home</Link>
          </button>
        </nav>
      </div>

      {/* Main Content Section */}
      <div className="item3">
        <h2>Registered Events</h2>
        {/* Filters */}
        <div>
          <input
            type="text"
            name="search"
            placeholder="Search by name"
            value={filters.search}
            onChange={handleInputChange}
          />
          <select
            name="category"
            value={filters.category}
            onChange={handleInputChange}
          >
            <option value="">All Categories</option>
            <option value="Category1">Category1</option>
            <option value="Category2">Category2</option>
          </select>
          <input
            type="text"
            name="place"
            placeholder="Place"
            value={filters.place}
            onChange={handleInputChange}
          />
          <input
            type="datetime-local"
            name="startTime"
            value={filters.startTime}
            onChange={handleInputChange}
          />
          <input
            type="datetime-local"
            name="endTime"
            value={filters.endTime}
            onChange={handleInputChange}
          />
        </div>

        {/* Event List */}
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <p>{event.date}</p>
              <p>{event.description}</p>
              <p>{event.category}</p>
              <p>{event.place}</p>
              <button onClick={() => handleJoinEvent(event.id)}>
                Join Event
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Registered;
