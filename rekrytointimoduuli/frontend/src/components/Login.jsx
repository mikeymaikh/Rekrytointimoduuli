import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Access environment variables using import.meta.env
    const envUsername = import.meta.env.VITE_LOGIN_USERNAME;
    const envPassword = import.meta.env.VITE_LOGIN_PASSWORD;

    // Check if environment variables are defined
    if (!envUsername || !envPassword) {
      setError(
        "Login configuration is missing. Please contact the administrator."
      );
      return;
    }

    // Validate login credentials
    if (username === envUsername && password === envPassword) {
      localStorage.setItem("isAuthenticated", "true");
      navigate("/review");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2 className="text-center">Login</h2>
        {error && <p className="text-danger">{error}</p>}
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            id="username"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
