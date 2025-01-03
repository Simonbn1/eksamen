import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Circles } from "react-loader-spinner";
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
  const [loading, setLoading] = useState<boolean>(true);
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
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="loader-container">
        <Circles height="80" width="80" color="#4fa94d" ariaLabel="loading" />
      </div>
    );
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="profile-container">
      <h1>{user.name}'s Profil</h1>
      <img src={user.picture} alt="User" />
      <h2>Mine kommende arrangementer</h2>
      {joinedEvents.length === 0 ? (
        <p>Ingen kommende arrangamenter.</p>
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
        Tilbake til registrering
      </button>
    </div>
  );
};

export default Profile;
