import { useState } from "react";

const API = import.meta.env.VITE_API || "/api";

export default function Login({ onLogin, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    setError("");
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      onLogin(data);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Login</h2>
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
      <button onClick={login}>Login</button>
      <p>
        Don't have an account?{' '}
        <a href="#" onClick={e => { e.preventDefault(); switchToRegister(); }}>
          Register
        </a>
      </p>
    </div>
  );
}
