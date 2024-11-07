import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import EventList from "./components/EventList";
import Organizer from "./components/Organizer";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="EventList" element={<EventList />} />
        <Route path="Organizer" element={<Organizer />} />
      </Routes>
    </Router>
  );
};

export default App;

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
