import React, { useState, useEffect } from "react";
import AddEvent from "./AddEvent";
import YourEvents from "./YourEvents";
import "./style/Organizer.css";
import { useNavigate } from "react-router-dom";
import { Circles } from "react-loader-spinner";

const Organizer: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<"add" | "view">("add");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate a loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <Circles height="80" width="80" color="#4fa94d" ariaLabel="loading" />
      </div>
    );
  }

  return (
    <div className="grid-container">
      <div className="header">
        <h1>
          Welcome to <span className="event">Event</span>
          <span className="logger">Logger</span>
        </h1>
      </div>
      <div>
        <nav className="button-group">
          <button
            className={`back-button ${selectedSection === "view" ? "active" : ""}`}
            onClick={() => setSelectedSection("view")}
          >
            Your Events
          </button>
          <button
            onClick={() => navigate("/")}
            className="org-back-home-button"
          >
            Back
          </button>
        </nav>
      </div>
      <div>
        {selectedSection === "add" && (
          <div className="form-group title-group">
            <AddEvent />
          </div>
        )}
        {selectedSection === "view" && (
          <div className="form-group description-group">
            <YourEvents />
          </div>
        )}
      </div>
    </div>
  );
};

export default Organizer;
