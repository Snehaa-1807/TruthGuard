import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="fade-in" style={{ width: "100%", maxWidth: 420 }}>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>🛡</div>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Truth<span style={{ color: "var(--primary)" }}>Guard</span>
          </h1>
          <p style={{ color: "var(--text3)", fontSize: "0.875rem", marginTop: 4 }}>AI-Powered Fake News Detection</p>
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text)" }}>Welcome back</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <input className="form-input" type="text" placeholder="Enter email or username"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            {error && (
              <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "1rem", padding: "10px 14px", background: "var(--danger-light)", borderRadius: 8, border: "1px solid var(--danger-border)" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: "center", height: 44 }}>
              {loading ? <><span className="spinner" /> Signing in…</> : "Sign In →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "var(--text3)" }}>
            No account?{" "}
            <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}