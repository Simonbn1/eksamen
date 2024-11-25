import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style/Profile.css";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  category?: string;
  place?: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/userinfo");
        if (res.ok) {
          const userData = await res.json();
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
    async function fetchJoinedEvents() {
      if (!user || !user.id) {
        console.error("No user logged in or missing userId");
        return;
      }

      try {
        const response = await fetch(
          `/api/user/joined-events?userId=${user.id}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setJoinedEvents(data);
      } catch (error) {
        console.error("Failed to fetch joined events:", error);
      }
    }

    if (user) {
      fetchJoinedEvents();
    }
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="profile-container">
      <h1>{user.name}'s Profile</h1>
      <p>Email: {user.email}</p>
      <img src={user.picture} alt="User" />
      <h2>Joined Events</h2>
      {joinedEvents.length === 0 ? (
        <p>No joined events.</p>
      ) : (
        <ul className="event-list">
          {joinedEvents.map((event) => (
            <li key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <p>{event.date}</p>
              <p>{event.description}</p>
              <p>{event.category}</p>
              <p>{event.place}</p>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => navigate("/Registered")} className="back-button">
        Back to Registered
      </button>
    </div>
  );
};

export default Profile;
