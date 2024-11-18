import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LoginCallback: React.FC = () => {
  const navigate = useNavigate();
  const responseValues = Object.fromEntries(
    new URLSearchParams(window.location.search).entries(),
  );
  const { code } = responseValues; // Extract the authorization code
  const discovery_endpoint =
    "https://accounts.google.com/.well-known/openid-configuration";

  async function establishSession() {
    const res = await fetch(`/api/login/google/callback?code=${code}`, {
      method: "GET",
      credentials: "include", // Include cookies for session handling
    });
    if (res.ok) {
      navigate("/");
    } else {
      navigate("/");
    }
  }

  useEffect(() => {
    if (code) {
      establishSession();
    }
  }, [code]);

  return (
    <div>
      <div>Please wait while we complete the login process...</div>
      <pre>{code}</pre>
    </div>
  );
};

export default LoginCallback;
