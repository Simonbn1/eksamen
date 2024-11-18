import React, { useState } from "react";
import AddEvent from "./AddEvent";
import YourEvents from "./YourEvents";
import "./style/Organizer.css";

const Organizer: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<"add" | "view">("add");

  return (
    <div className="organizer-container">
      <h1 className="organizer-title">Organizer</h1>
      <nav className="button-group">
        <button
          className={`submit-button ${selectedSection === "add" ? "active" : ""}`}
          onClick={() => setSelectedSection("add")}
        >
          Add Event
        </button>
        <button
          className={`back-button ${selectedSection === "view" ? "active" : ""}`}
          onClick={() => setSelectedSection("view")}
        >
          Your Events
        </button>
      </nav>
      <div className="event-form">
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
