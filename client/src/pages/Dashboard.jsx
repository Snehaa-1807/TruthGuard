import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { historyAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const StatCard = ({ label, value, color, sub, icon }) => (
  <div className="card" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
    </div>
    <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--text)", lineHeight: 1, marginBottom: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyAPI.stats()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const pieData = stats ? [
    { name: "Fake", value: stats.fakeCount, color: "#EF4444" },
    { name: "Real", value: stats.realCount, color: "#10B981" },
  ] : [];

  const recentBar = stats?.recentActivity?.map((r, i) => ({
    name:  `#${i + 1}`,
    conf:  Math.round(r.confidence * 100),
    color: r.verdict === "FAKE" ? "#EF4444" : "#10B981",
  })) || [];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
          {greeting}, {user?.username} 👋
        </h1>
        <p style={{ color: "var(--text3)", fontSize: "0.875rem" }}>Your misinformation detection overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Total Checks"   value={stats?.total     ?? 0} color="var(--primary)"  icon="🔍" />
        <StatCard label="Fake Detected"  value={stats?.fakeCount ?? 0} color="var(--danger)"   icon="🚨" sub={`${stats?.fakePercent ?? 0}% of all checks`} />
        <StatCard label="Real News"      value={stats?.realCount ?? 0} color="var(--success)"  icon="✅" />
        <StatCard label="Avg Confidence" value={`${Math.round((stats?.avgConfidence ?? 0) * 100)}%`} color="var(--accent)" icon="📊" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text)" }}>Verdict Distribution</h3>
          {!stats?.total ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text3)" }}>No data yet</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <PieChart width={130} height={130}>
                <Pie data={pieData} cx={60} cy={60} innerRadius={36} outerRadius={56} dataKey="value" strokeWidth={2} stroke="#fff">
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
              <div style={{ flex: 1 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                      <span style={{ fontSize: "0.85rem", color: "var(--text2)", fontWeight: 500 }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text)" }}>Recent Confidence Scores</h3>
          {!recentBar.length ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text3)" }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={recentBar} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: "var(--text3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, boxShadow: "var(--shadow-sm)" }}
                  formatter={v => [`${v}%`, "Confidence"]}
                />
                <Bar dataKey="conf" radius={[6,6,0,0]}>
                  {recentBar.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {stats?.recentActivity?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text)" }}>Recent Activity</h3>
          {stats.recentActivity.map(item => (
            <div key={item._id} onClick={() => navigate(`/result/${item._id}`)}
              style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 0", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <span className={`badge badge-${item.verdict.toLowerCase()}`}>{item.verdict}</span>
              <span style={{ flex: 1, fontSize: "0.875rem", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.textSnippet}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text3)", whiteSpace: "nowrap" }}>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {!stats?.total && (
        <div className="card" style={{ textAlign: "center", padding: "3.5rem 2rem", borderStyle: "dashed", borderColor: "var(--border2)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Ready to detect misinformation?</h3>
          <p style={{ color: "var(--text3)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>Paste any news article to get an instant AI-powered verdict.</p>
          <button className="btn btn-primary" onClick={() => navigate("/check")}>Check Your First Article →</button>
        </div>
      )}
    </div>
  );
}