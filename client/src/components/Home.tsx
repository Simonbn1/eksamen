import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Circles } from "react-loader-spinner";
import "./style/Home.css";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/login-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        localStorage.setItem("auth", "true");
        navigate("/Organizer");
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Home-grid-container">
      <header className="header">
        <h1>
          <span className="event">Gym</span>
          <span className="logger">Hub</span>
        </h1>
        <p>Din ultimate treningsdestinasjon</p>
      </header>

      <nav className="menu">
        <div className="Home-menu-buttons">
          <button onClick={() => navigate("/EventList")}>
            Aktive arrangementer
          </button>
          <button onClick={() => navigate("/Registered")}>
            Bruker logg inn
          </button>
          <button onClick={() => setShowLogin((prev) => !prev)}>Admin</button>
        </div>
      </nav>

      <main className="content">
        <div className="content-card">
          <h2>Gruppetimer</h2>
        </div>
        <div className="content-card">
          <h2>Personlig trener</h2>
        </div>
        <div className="content-card">
          <h2></h2>
        </div>
      </main>

      {showLogin && (
        <div className="Admin-login">
          <h2>Admin</h2>
          <input
            type="text"
            placeholder="Brukernavn"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Logg Inn</button>
          {loading && (
            <div className="loader-container">
              <Circles
                height="80"
                width="80"
                color="#4fa94d"
                ariaLabel="loading"
              />
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      )}

      <footer className="footer">
        <p>
          &copy; 2024 GymHub. All rights reserved. | <a href="#">Kontakt oss</a>
        </p>
      </footer>
    </div>
  );
};

export default Home;
