import { useState } from "react";

const API = import.meta.env.VITE_API || "/api";

export default function Register({ onRegister, switchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const register = async () => {
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      alert("Please use a Gmail address (@gmail.com)");
      setError("Only Gmail addresses are allowed");
      return;
    }
    setError("");
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      alert("Registered successfully");
      if (onRegister) onRegister();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Register</h2>
      {error && <div style={{ color: "salmon" }}>{error}</div>}
      <input
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={register}>Register</button>
      <p>
        Already have an account?{' '}
        <a href="#" onClick={e => { e.preventDefault(); switchToLogin(); }}>
          Login
        </a>
      </p>
    </div>
  );
}
