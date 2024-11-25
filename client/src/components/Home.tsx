import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style/Home.css";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
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
          <button onClick={() => navigate("/EventList")}>Active Classes</button>
          <button onClick={() => navigate("/Registered")}>Member Login</button>
          <button onClick={() => setShowLogin((prev) => !prev)}>Admin</button>
        </div>
      </nav>

      <main className="content">
        <div className="content-card">
          <h2>Group Classes</h2>
        </div>
        <div className="content-card">
          <h2>Personal Training</h2>
        </div>
        <div className="content-card">
          <h2>Modern Equipment</h2>
        </div>
      </main>

      {showLogin && (
        <div className="Admin-login">
          <h2>Admin Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Log In</button>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>
          &copy; 2024 GymHub. All rights reserved. | <a href="#">Contact Us</a>
        </p>
      </footer>
    </div>
  );
};

export default Home;
