import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import EventList from "./components/EventList";
import Organizer from "./components/Organizer";
import Registered from "./components/Registered";
import Profile from "./components/Profile";
import EditEvent from "./components/EditEvent";
import { JoinedEventsProvider } from "./components/JoinedEventsContext";
import "./styles.css";

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
    <JoinedEventsProvider>
      <Router>
        <div className="grid-container">
          <header className="header">Website</header>
          <nav className="nav">
            <ul>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/EventList">Events</a>
              </li>
              <li>
                <a href="/Organizer">Organizer</a>
              </li>
              <li>
                <a href="/Registered">Registered</a>
              </li>
            </ul>
          </nav>
          <main className="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="EventList" element={<EventList />} />
              <Route path="Organizer" element={<Organizer />} />
              <Route path="Registered" element={<Registered />} />
              <Route path="Profile" element={<Profile />} />
              <Route path="EditEvent/:eventId" element={<EditEvent />} />
            </Routes>
          </main>
          <footer className="footer">© Website</footer>
        </div>
      </Router>
    </JoinedEventsProvider>
  );
};

root.render(<App />);
