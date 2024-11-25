import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJoinedEvents } from "./JoinedEventsContext";
import "./style/Registered.css";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  category?: string;
  place?: string;
}

function LoginButton({
  provider,
  children,
}: {
  provider: string;
  children: React.ReactNode;
}) {
  return (
    <a href={`/api/login/${provider}/start`} className="button-link">
      {children}
    </a>
  );
}

const Registered: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState({
    category: "",
    date: "",
    place: "",
    search: "",
  });
  const navigate = useNavigate();
  const { addJoinedEvent } = useJoinedEvents();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/userinfo");
        if (res.ok) {
          const userData = await res.json();
          localStorage.setItem("userId", userData.id || "");
          setUser(userData);
        } else {
          setError(`Error: ${res.status} ${res.statusText}`);
        }
      } catch (err) {
        setError("Network error. Please try again.");
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch(`/api/event`);
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setEvents(
          data.map((event: any) => ({
            id: event._id,
            title: event.title,
            date: event.date,
            description: event.description,
            category: event.category,
            place: event.place,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    }
    fetchEvents();
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      let filtered = events;

      if (filters.category) {
        filtered = filtered.filter((event) =>
          event.category?.includes(filters.category),
        );
      }

      if (filters.date) {
        filtered = filtered.filter(
          (event) =>
            new Date(event.date).toLocaleDateString() ===
            new Date(filters.date).toLocaleDateString(),
        );
      }

      if (filters.place) {
        filtered = filtered.filter((event) =>
          event.place?.includes(filters.place),
        );
      }

      if (filters.search) {
        filtered = filtered.filter((event) =>
          event.title.toLowerCase().includes(filters.search.toLowerCase()),
        );
      }

      setFilteredEvents(filtered);
    };

    applyFilters();
  }, [filters, events]);

  const handleJoinEvent = async (eventTitle: string) => {
    try {
      if (!user?.id) throw new Error("Invalid or missing userId");

      const event = events.find((event) => event.title === eventTitle);
      if (!event) throw new Error("Event not found");

      const response = await fetch("/api/user/join-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, eventId: event.id }),
      });

      if (!response.ok) throw new Error("Failed to join event");

      addJoinedEvent(event);
      alert(`You have successfully joined the event: ${event.title}!`);
    } catch (error) {
      console.error("Failed to join event:", error);
    }
  };

  const handleViewDetails = (eventTitle: string) =>
    navigate(`/event/${eventTitle}`);

  if (!user) {
    return (
      <div className="grid-container">
        <header className="header">
          <h1>
            <span className="event">Gym</span>
            <span className="logger">Hub</span>
          </h1>
          <p>Din ultimate treningsdestinasjon</p>
        </header>
        <div className="login-links">
        <LoginButton provider="google">Logg inn med Google</LoginButton>
          <LoginButton provider="linkedin">Logg inn med LinkedIn</LoginButton>
          <LoginButton provider="entraid">Logg inn med EntraID</LoginButton>
          <button onClick={() => navigate("/")} className="back-home-button">
            Tilbake
          </button>
        </div>
        <div className="login-text">
          <h2>Logg inn for å melde deg på arrangementer</h2>
        </div>
      </div>
    );
  }

  if (error) return <div>{error}</div>;

  return (
    <div className="user-grid-container">
      <header className="header">
        <h1>
          <span className="event">Gym</span>
          <span className="logger">Hub</span>
        </h1>
        <p>Din ultimate treningsdestinasjon</p>
      </header>
      <aside className="sidebar">
      <h2>Velkommen {user.name}</h2>
        <div>Email: {user.email}</div>
        <img src={user.picture} alt="User" />
        <button
          onClick={() => {
            fetch("/api/login/end_session").then(() => {
              setUser(null);
              navigate("/");
            });
          }}
          className="logout-button"
        >
          Logg ut
        </button>
        <button className="profile-button" onClick={() => navigate("/Profile")}>
          Min side
        </button>
      </aside>
      <main className="content">
        <h2>Tilgjengelige arrangementer</h2>
        <div className="filters">
          <input
            type="text"
            placeholder="Søk med navn"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <input
            type="text"
            placeholder="Kategori"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          />
          <input
            type="date"
            placeholder=""
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
          <input
            type="text"
            placeholder="Sted"
            value={filters.place}
            onChange={(e) => setFilters({ ...filters, place: e.target.value })}
          />
        </div>
        {filteredEvents.length === 0 ? (
          <p>Ingen tilgjengelige arrangementer</p>
        ) : (
          <ul className="event-list">
            {filteredEvents.map((event) => (
              <li key={event.id} className="event-card">
                <h3>{event.title}</h3>
                <p>{event.date}</p>
                <p>{event.description}</p>
                <p>{event.category}</p>
                <p>{event.place}</p>
                <div>
                  <button onClick={() => handleJoinEvent(event.title)}>
                    Meld deg på
                  </button>
                </div>
                <button onClick={() => handleViewDetails(event.title)}>
                  Detaljer
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default Registered;
