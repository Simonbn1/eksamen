import React from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Logg inn</h1>
      <div>
        {" "}
        <button onClick={() => navigate("/EventList")}>Anonymous</button>{" "}
      </div>
      <div>
        <button onClick={() => navigate("/Registered")}>Registered</button>
      </div>
      <div>
        <button onClick={() => navigate("/Organizer")}>Organizer</button>
      </div>
    </div>
  );
};

export default Home;
