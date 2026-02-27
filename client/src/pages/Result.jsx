import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { historyAPI } from "../services/api";

function highlightKeywords(text, keywords) {
  if (!keywords?.length) return text;
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex   = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(regex).map((p, i) =>
    keywords.some(k => p.toLowerCase() === k.toLowerCase())
      ? <mark key={i} className="keyword">{p}</mark>
      : p
  );
}

export default function Result() {
  const { id }    = useParams();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [data,    setData]    = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    if (!data) {
      historyAPI.getOne(id)
        .then(res  => setData(res.data))
        .catch(()  => navigate("/history"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>;
  if (!data)   return null;

  const isFake  = data.verdict === "FAKE";
  const confPct = Math.round(data.confidence * 100);
  const color   = isFake ? "var(--danger)" : "var(--success)";
  const lightBg = isFake ? "var(--danger-light)" : "var(--success-light)";
  const border  = isFake ? "var(--danger-border)" : "var(--success-border)";

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: "7px 14px" }}>← Back</button>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>Analysis Result</h1>
          <p style={{ color: "var(--text3)", fontSize: "0.75rem" }}>
            {data.checkedAt ? new Date(data.checkedAt).toLocaleString() : new Date(data.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Verdict banner */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.75rem 2rem", borderRadius: 16, marginBottom: "1.5rem", background: lightBg, border: `1.5px solid ${border}` }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff", border: `2.5px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, boxShadow: `0 4px 16px ${color}22` }}>
          {isFake ? "🚨" : "✅"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{data.verdict}</div>
          <div style={{ color: "var(--text2)", fontSize: "0.9rem", marginTop: 5, fontWeight: 500 }}>
            This article is <strong>{isFake ? "likely misinformation" : "likely credible news"}</strong>
          </div>
        </div>
        <span className={`badge badge-${isFake ? "fake" : "real"}`} style={{ fontSize: "0.85rem", padding: "7px 16px" }}>
          {confPct}% Confidence
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Confidence */}
        <div className="card">
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Confidence Score</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "3.5rem", fontWeight: 900, color, lineHeight: 1 }}>{confPct}%</span>
            <span style={{ color: "var(--text3)", fontSize: "0.875rem", marginBottom: 10 }}>confidence</span>
          </div>
          <div className="progress-track" style={{ height: 10, marginBottom: "0.5rem" }}>
            <div className="progress-fill" style={{ width: `${confPct}%`, background: color }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text3)", marginBottom: "1.25rem" }}>
            <span>Uncertain</span><span>Likely</span><span>Certain</span>
          </div>
          {data.probabilities && Object.entries(data.probabilities).map(([cls, prob]) => (
            <div key={cls} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                <span style={{ color: cls === "FAKE" ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>{cls}</span>
                <span style={{ color: "var(--text2)", fontWeight: 600 }}>{Math.round(prob * 100)}%</span>
              </div>
              <div className="progress-track" style={{ height: 6 }}>
                <div className="progress-fill" style={{ width: `${Math.round(prob * 100)}%`, background: cls === "FAKE" ? "var(--danger)" : "var(--success)" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Word importance */}
        <div className="card">
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Top Influential Words</h3>
          {data.wordImportance?.length > 0 ? data.wordImportance.slice(0, 8).map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: 9 }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text)", fontWeight: 500, width: 90, flexShrink: 0 }}>{w.word}</span>
              <div style={{ flex: 1, height: 6, background: "var(--surface3)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(100, Math.abs(w.score) * 200)}%`, background: w.score > 0 ? "var(--danger)" : "var(--success)" }} />
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text3)", width: 44, textAlign: "right" }}>{w.score > 0 ? "↑ fake" : "↓ real"}</span>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text3)", fontSize: "0.875rem" }}>Word importance available with full ML model</div>
          )}
        </div>
      </div>

      {/* Reasoning */}
      {data.reasoning && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>AI Reasoning</h3>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "var(--text)" }}>{data.reasoning}</p>
        </div>
      )}

      {/* Flagged keywords */}
      {data.suspiciousKeywords?.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            Flagged Keywords ({data.suspiciousKeywords.length})
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {data.suspiciousKeywords.map(k => (
              <span key={k} style={{ padding: "4px 12px", background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A", borderRadius: 8, fontSize: "0.8rem", fontWeight: 500 }}>⚠ {k}</span>
            ))}
          </div>
        </div>
      )}

      {/* Article text with highlights */}
      {data.text && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Article Text</h3>
            <button style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600 }} onClick={() => setShowFull(f => !f)}>
              {showFull ? "Show less ▲" : "Show full ▼"}
            </button>
          </div>
          <div style={{ fontSize: "0.875rem", lineHeight: 1.8, color: "var(--text2)", maxHeight: showFull ? "none" : 120, overflow: "hidden" }}>
            {highlightKeywords(showFull ? data.text : data.text.slice(0, 400), data.suspiciousKeywords)}
            {!showFull && data.text.length > 400 && "…"}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button className="btn btn-primary" onClick={() => navigate("/check")}>⚡ Check Another</button>
        <button className="btn btn-ghost" onClick={() => navigate("/history")}>View History</button>
        <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(`TruthGuard Result\nVerdict: ${data.verdict} (${confPct}% confidence)\n${data.reasoning || ""}`)}>
          Copy Report
        </button>
      </div>
    </div>
  );
}