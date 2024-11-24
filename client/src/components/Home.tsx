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
    // Mock validation for simplicity
    if (username === "admin" && password === "admin") {
      localStorage.setItem("auth", "true");
      navigate("/Organizer");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="Home-grid-container">
      <div className="item1 grid-item">
        <h1>
          <span className="event">Event</span>
          <span className="logger">Logger</span>
        </h1>
      </div>
      <div className="item2 grid-item">
        <div className="Home-menu-buttons">
          <button onClick={() => navigate("/EventList")}>
            Aktive arrangementer
          </button>
          <button onClick={() => navigate("/Registered")}>
            Login for brukere
          </button>
          <button onClick={() => setShowLogin((prev) => !prev)}>Admin</button>
        </div>
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
      </div>
    </div>
  );
};

export default Home;
