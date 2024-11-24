import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LoginCallback: React.FC = () => {
  const navigate = useNavigate();
  const responseValues = Object.fromEntries(
    new URLSearchParams(window.location.hash.substring(1)).entries(),
  );
  const { access_token } = responseValues;
  const discovery_endpoint =
    "https://accounts.google.com/.well-known/openid-configuration";

  async function establishSession() {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ access_token, discovery_endpoint }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      navigate("/Registered");
    }
  }

  useEffect(() => {
    establishSession();
  }, [access_token]);

  return (
    <>
      <div>Logging you in, please wait...</div>
      <pre>{access_token}</pre>
    </>
  );
};

export default LoginCallback;
