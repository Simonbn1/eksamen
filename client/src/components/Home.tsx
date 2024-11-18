import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style/Home.css";
// @ts-ignore
import image from "./images/image.jpg";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Google Login Button Component
  function GoogleLoginButton() {
    const client_id =
      "644511819864-3bcev31ofk0n15n1rvg68bm5fjepvkgr.apps.googleusercontent.com";
    const discoveryEndpoint =
      "https://accounts.google.com/.well-known/openid-configuration";
    const [authorizationUrl, setAuthorizationUrl] = useState<
      string | undefined
    >();

    async function createAuthorizationUrl() {
      const configuration = await fetch(discoveryEndpoint);
      const { authorization_endpoint } = await configuration.json();
      const parameters = {
        response_type: "token",
        scope: "openid profile email",
        redirect_uri: window.location.origin + "/login/google/callback",
        client_id,
      };
      setAuthorizationUrl(
        `${authorization_endpoint}?${new URLSearchParams(parameters)}`,
      );
    }

    useEffect(() => {
      createAuthorizationUrl();
    }, []);

    return authorizationUrl ? (
      <a href={authorizationUrl}>Log in with Google</a>
    ) : null;
  }

  // Loading the user information (after login)
  async function loadUser() {
    const res = await fetch("/api/userinfo");
    if (res.ok) {
      setUser(await res.json());
    } else {
      setError(`${res.status} ${res.statusText}`);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  if (error) {
    return (
      <div>
        <h1>Something went wrong</h1>
        <div>{error}</div>
        <GoogleLoginButton />
      </div>
    );
  }

  if (user) {
    return (
      <div>
        <h1>Welcome, {user.name}</h1>
        <div>Email: {user.email}</div>
        <img src={user.picture} alt="User profile" />
        <div>
          <a href="/api/login/end_session">Log out</a>
        </div>
      </div>
    );
  }

  return (
    <div className="Home-grid-container">
      <div className="item1 grid-item">
        <h1>
          <span className="event">Event</span>
          <span className="logger">Logger</span>
        </h1>
      </div>
      <div className="image">
        <img src={image} alt="Background" />
      </div>
      <div className="item2 grid-item">
        <div className="menu-buttons">
          <button onClick={() => navigate("/EventList")}>Anonymous</button>
          <button onClick={() => navigate("/login/google/start")}>
            Registered
          </button>
          <button onClick={() => navigate("/Organizer")}>Organizer</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
