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
  const navigate = useNavigate();
  const { addJoinedEvent } = useJoinedEvents();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/userinfo");
        if (res.ok) {
          const userData = await res.json();
          console.log("Loaded user data:", userData);

          if (userData.id) {
            localStorage.setItem("userId", userData.id);
          } else {
            console.error("No id found in userData:", userData);
          }

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
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched events:", data);
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
  }, []);

  const handleJoinEvent = async (eventTitle: string) => {
    try {
      if (!user || !user.id) {
        console.error("Invalid or missing userId:", user);
        throw new Error("Invalid or missing userId");
      }

      const event = events.find((event) => event.title === eventTitle);
      if (!event) {
        console.error("Event not found:", eventTitle);
        throw new Error("Event not found");
      }

      console.log(
        "Joining event with userId:",
        user.id,
        "and eventId:",
        event.id,
      );

      const response = await fetch(`/api/join/${event.title}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        throw new Error(
          errorMessage.message || `HTTP error! Status: ${response.status}`,
        );
      }

      addJoinedEvent(event);
      alert(`You have successfully joined the event: ${event.title}!`);
    } catch (error) {
      console.error("Failed to join event:", error);
    }
  };

  const handleViewDetails = (eventTitle: string) => {
    navigate(`/event/${eventTitle}`);
  };

  if (!user) {
    return (
      <div className="grid-container">
        <div className="header">
          <h1>
            Welcome to <span className="event">Event</span>
            <span className="logger">Logger</span>
          </h1>
        </div>
        <div className="login-links">
          <LoginButton provider="google">Log in with Google</LoginButton>
          <LoginButton provider="linkedin">Log in with LinkedIn</LoginButton>
          <LoginButton provider="entraid">Log in with EntraID</LoginButton>
          <button onClick={() => navigate("/")} className="back-home-button">
            Back
          </button>
        </div>
        <div className="login-text">
          <h2>Log in to see your registered events</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="user-grid-container">
      <div className="header">
        <h1>
          Welcome to <span className="event">Event</span>
          <span className="logger">Logger</span>
        </h1>
      </div>
      <div className="sidebar">
        <h2>Welcome {user.name}</h2>
        <p>User details:</p>
        <div>Email: {user.email}</div>
        <img src={user.picture} alt="User" />
        <button
          onClick={() => {
            fetch("/api/login/end_session").then(() => {
              setUser(null);
              navigate("/");
            });
          }}
          className="back-home-button"
        >
          Log out
        </button>
      </div>
      <div className="content">
        <h2>Available Events</h2>
        {events.length === 0 ? (
          <p>No events available at the moment.</p>
        ) : (
          <ul className="event-list">
            {events.map((event) => (
              <li key={event.id} className="event-card">
                <h3>{event.title}</h3>
                <p>{event.date}</p>
                <p>{event.description}</p>
                <p>{event.category}</p>
                <p>{event.place}</p>
                <button onClick={() => handleJoinEvent(event.title)}>
                  Join Event
                </button>
                <button onClick={() => handleViewDetails(event.title)}>
                  View Details
                </button>
              </li>
            ))}
          </ul>
        )}
        <button className="profile-button" onClick={() => navigate("/Profile")}>
          View My Profile
        </button>
      </div>
    </div>
  );
};

export default Registered;
