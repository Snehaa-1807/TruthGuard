import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/check",     label: "Check",     icon: "⚡" },
  { to: "/history",   label: "History",   icon: "◷" },
  { to: "/bookmarks", label: "Bookmarks", icon: "🔖" },
  { to: "/learn",     label: "Learn",     icon: "📚" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"var(--bg)" }}>
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 2rem", height:64, background:"#fff", borderBottom:"1px solid var(--border)", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", position:"sticky", top:0, zIndex:100 }}>
        <NavLink to="/dashboard" style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🛡</div>
          <span style={{ fontSize:"1.15rem", fontWeight:800, color:"var(--text)", letterSpacing:"-0.02em" }}>
            Truth<span style={{ color:"var(--primary)" }}>Guard</span>
          </span>
        </NavLink>

        <div style={{ display:"flex", gap:"0.25rem" }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} style={({ isActive }) => ({
              display:"flex", alignItems:"center", gap:6, padding:"7px 13px", borderRadius:8,
              fontSize:"0.85rem", fontWeight:600,
              color:      isActive ? "var(--primary)" : "var(--text2)",
              background: isActive ? "var(--primary-glow)" : "transparent",
              transition:"all 0.15s",
            })}>
              <span style={{ fontSize:"0.9rem" }}>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:20, background:"var(--surface2)", border:"1px solid var(--border)", fontSize:"0.8rem", color:"var(--text2)", fontWeight:500 }}>
            👤 {user?.username}
          </div>
          <button className="btn btn-ghost" style={{ padding:"6px 14px", fontSize:"0.82rem" }} onClick={() => { logout(); navigate("/login"); }}>
            Sign Out
          </button>
        </div>
      </nav>

      <main style={{ flex:1, maxWidth:1200, width:"100%", margin:"0 auto", padding:"2rem 1.5rem" }}>
        <Outlet />
      </main>

      <footer style={{ textAlign:"center", padding:"1.25rem", borderTop:"1px solid var(--border)", fontSize:"0.75rem", color:"var(--text3)", background:"#fff" }}>
        TruthGuard · AI-Powered Fake News Detection
      </footer>
    </div>
  );
}