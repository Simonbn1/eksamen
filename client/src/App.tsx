import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import EventList from "./components/EventList";
import Organizer from "./components/Organizer";
import Registered from "./components/Registered";

const root = createRoot(document.getElementById("root")!);

const App: React.FC = () => {
  async function handleNewEvent(event: {
    title: string;
    date: string;
    description: string;
  }) {
    await fetch("/api/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="EventList" element={<EventList />} />
        <Route
          path="Organizer"
          element={<Organizer onNewEvent={handleNewEvent} />}
        />
        <Route path="Registered" element={<Registered />} />
      </Routes>
    </Router>
  );
};

root.render(<App />);
