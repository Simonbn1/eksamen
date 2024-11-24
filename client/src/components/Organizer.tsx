import React, { useState } from "react";
import AddEvent from "./AddEvent";
import YourEvents from "./YourEvents";
import "./style/Organizer.css";
import { useNavigate } from "react-router-dom";

const Organizer: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<"add" | "view">("add");

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
            {/*<button*/}
            {/*    className={`submit-button ${selectedSection === "add" ? "active" : ""}`}*/}
            {/*    onClick={() => setSelectedSection("add")}*/}
            {/*    >*/}
            {/*        Add Event*/}
            {/*    </button>*/}
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
