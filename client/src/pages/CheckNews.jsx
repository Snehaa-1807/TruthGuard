import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { predictAPI } from "../services/api";

const STAGES = [
  "Preprocessing text (tokenize → stopwords → lemmatize)…",
  "Extracting TF-IDF features (unigrams + bigrams)…",
  "Running Logistic Regression…",
  "Running Naive Bayes…",
  "Running Random Forest…",
  "Selecting best model…",
  "Generating report…",
];
const PIPELINE = ["Tokenize","TF-IDF","LR","NB","RF","Ensemble","Report"];
const MARKERS  = ["Sensationalist language","Emotional manipulation","Missing citations","All-caps emphasis","Conspiracy terminology","Excessive punctuation","Unverifiable claims","Fear-mongering","Source credibility signals"];

export default function CheckNews() {
  const [text,    setText]    = useState("");
  const [loading, setLoading] = useState(false);
  const [stage,   setStage]   = useState(0);
  const [error,   setError]   = useState("");
  const navigate = useNavigate();

  const analyze = async () => {
    if (text.trim().length < 20) { setError("Please enter at least 20 characters."); return; }
    setError(""); setLoading(true); setStage(0);
    const interval = setInterval(() => setStage(s => (s + 1) % STAGES.length), 700);
    try {
      const res = await predictAPI.analyze(text.trim());
      clearInterval(interval);
      navigate(`/result/${res.data.historyId}`, { state: res.data });
    } catch (err) {
      clearInterval(interval);
      setError(err.response?.data?.error || "Analysis failed. Is the ML service running on port 5001?");
    } finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>Check News</h1>
        <p style={{ color: "var(--text3)", fontSize: "0.875rem" }}>Paste any article text and get an instant AI-powered verdict</p>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Article Text</label>
          <textarea
            className="form-input"
            style={{ minHeight: 260 }}
            placeholder="Paste the full news article here. The more text you provide, the more accurate the analysis will be…"
            value={text}
            onChange={e => { setText(e.target.value); setError(""); }}
            disabled={loading}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text3)" }}>
              {text.length.toLocaleString()} characters · {text.split(/\s+/).filter(Boolean).length} words
            </span>
            {text && <button style={{ background: "none", border: "none", color: "var(--danger)", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-body)" }} onClick={() => setText("")}>Clear</button>}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem", padding: "12px 16px", background: "var(--danger-light)", borderRadius: 10, border: "1px solid var(--danger-border)" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button className="btn btn-primary" onClick={analyze} disabled={loading || text.trim().length < 20} style={{ minWidth: 180 }}>
          {loading ? <><span className="spinner" /> Analyzing…</> : "⚡ Analyze Article"}
        </button>
        {loading && <span style={{ fontSize: "0.82rem", color: "var(--text3)" }} className="pulse">{STAGES[stage]}</span>}
      </div>

      {loading && (
        <div className="card scan" style={{ textAlign: "center", padding: "3rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--primary-glow)", border: "2px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 1.5rem" }}>🛡</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>NLP Pipeline Running</h3>
          <p style={{ color: "var(--text3)", fontSize: "0.85rem", marginBottom: "2rem" }}>{STAGES[stage]}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            {PIPELINE.map((s, i) => (
              <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: i <= stage ? "var(--primary)" : "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: i <= stage ? "#fff" : "var(--text3)", fontWeight: 700, transition: "all 0.3s", border: `1px solid ${i <= stage ? "var(--primary)" : "var(--border)"}` }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: "0.68rem", color: i <= stage ? "var(--primary)" : "var(--text3)", fontWeight: i <= stage ? 600 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
        <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text2)", marginBottom: "0.75rem" }}>What our ML pipeline detects</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {MARKERS.map(m => <span key={m} className="badge badge-neutral">{m}</span>)}
        </div>
      </div>
    </div>
  );
}