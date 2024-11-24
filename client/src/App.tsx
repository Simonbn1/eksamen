import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import EventList from "./components/EventList";
import Organizer from "./components/Organizer";
import Registered from "./components/Registered";
import Profile from "./components/Profile";
import EditEvent from "./components/EditEvent";
import LoginCallback from "./components/LoginCallback";
import { JoinedEventsProvider } from "./components/JoinedEventsContext";
import EventDetails from "./components/EventDetails";

const root = createRoot(document.getElementById("root")!);

const App: React.FC = () => {
  return (
    <JoinedEventsProvider>
      <Router>
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="EventList" element={<EventList />} />
            <Route path="Organizer" element={<Organizer />} />
            <Route path="Registered" element={<Registered />} />
            <Route path="Profile" element={<Profile />} />
            <Route path="EditEvent/:eventId" element={<EditEvent />} />
            <Route path="event/:eventTitle" element={<EventDetails />} />
            <Route
              path="/login/:provider/callback"
              element={<LoginCallback />}
            />
          </Routes>
        </main>
      </Router>
    </JoinedEventsProvider>
  );
};

root.render(<App />);
