import React, { useState } from "react";
import AddEvent from "./AddEvent";
import YourEvents from "./YourEvents";

const Organizer: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<"add" | "view">("add");

  return (
    <div>
      <h1>Organizer</h1>
      <nav>
        <ul>
          <li>
            <button onClick={() => setSelectedSection("add")}>Add Event</button>
          </li>
          <li>
            <button onClick={() => setSelectedSection("view")}>
              Your Events
            </button>
          </li>
        </ul>
      </nav>
      {selectedSection === "add" && <AddEvent onNewEvent={() => {}} />}
      {selectedSection === "view" && <YourEvents />}
    </div>
  );
};

export default Organizer;
