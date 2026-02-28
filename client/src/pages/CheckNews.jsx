import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { predictAPI } from "../services/api";

const STAGES = [
  "Preprocessing text…",
  "Extracting TF-IDF features (unigrams + trigrams)…",
  "Running Logistic Regression…",
  "Running Naive Bayes…",
  "Running Random Forest…",
  "Applying rule-based scoring…",
  "Blending ML + rules…",
  "Generating report…",
];
const PIPELINE = ["Preprocess","TF-IDF","LR","NB","RF","Rules","Blend","Report"];

const RED_FLAGS = [
  { icon:"📢", label:"ALL CAPS emphasis" },
  { icon:"❗", label:"Excessive !!! punctuation" },
  { icon:"🕵️", label:"Anonymous sources" },
  { icon:"🌀", label:"Conspiracy language" },
  { icon:"📵", label:"No official statement" },
  { icon:"🔗", label:"Missing citations" },
  { icon:"📲", label:"\"Share before deleted\"" },
  { icon:"💊", label:"Unverified health claims" },
  { icon:"🌐", label:"Vague \"experts say\"" },
  { icon:"🔥", label:"Fear-mongering language" },
];

export default function CheckNews() {
  const [mode,    setMode]    = useState("text"); // "text" | "url"
  const [text,    setText]    = useState("");
  const [url,     setUrl]     = useState("");
  const [loading, setLoading] = useState(false);
  const [stage,   setStage]   = useState(0);
  const [error,   setError]   = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const navigate = useNavigate();
  const textRef  = useRef(null);

  // Fetch text from URL via a simple proxy (just extract pasted content)
  const fetchFromUrl = async () => {
    if (!url.trim()) return;
    setUrlLoading(true); setError("");
    try {
      // Use a CORS proxy to fetch the URL content
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url.trim())}`;
      const res = await fetch(proxyUrl);
      const data = await res.json();
      // Extract text content from HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, "text/html");
      // Remove scripts, styles, nav, header, footer
      ["script","style","nav","header","footer","aside"].forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => el.remove());
      });
      // Get article or main content
      const article = doc.querySelector("article") || doc.querySelector("main") || doc.body;
      const extracted = article.innerText || article.textContent || "";
      const cleaned = extracted.replace(/\s+/g, " ").trim().slice(0, 8000);
      if (cleaned.length < 50) { setError("Could not extract article text from this URL. Try pasting the text directly."); return; }
      setText(cleaned);
      setMode("text");
    } catch {
      setError("Could not fetch URL. The site may block external requests. Try pasting the text directly.");
    } finally { setUrlLoading(false); }
  };

  const analyze = async () => {
    const input = text.trim();
    if (input.length < 20) { setError("Please enter at least 20 characters."); return; }
    setError(""); setLoading(true); setStage(0);
    const interval = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 600);
    try {
      const res = await predictAPI.analyze(input);
      clearInterval(interval);
      navigate(`/result/${res.data.historyId}`, { state: res.data });
    } catch (err) {
      clearInterval(interval);
      setError(err.response?.data?.error || "Analysis failed. Is the ML service running on port 5001?");
    } finally { setLoading(false); }
  };

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--text)", letterSpacing:"-0.02em", marginBottom:4 }}>Check News</h1>
        <p style={{ color:"var(--text3)", fontSize:"0.875rem" }}>Paste article text or enter a URL to get an instant AI verdict</p>
      </div>

      {/* Mode tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem" }}>
        {[["text","📝 Paste Text"],["url","🔗 From URL"]].map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); setError(""); }}
            className={`btn ${mode===m ? "btn-primary" : "btn-ghost"}`}
            style={{ padding:"8px 18px", fontSize:"0.85rem" }}>
            {label}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom:"1.25rem" }}>
        {mode === "text" ? (
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Article Text</label>
            <textarea ref={textRef} className="form-input" style={{ minHeight:240 }}
              placeholder="Paste the full news article here. The more text you provide, the more accurate the analysis…"
              value={text} onChange={e => { setText(e.target.value); setError(""); }} disabled={loading} />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, alignItems:"center" }}>
              <span style={{ fontSize:"0.75rem", color:"var(--text3)" }}>
                {text.length.toLocaleString()} chars · {wordCount} words
                {wordCount < 30 && wordCount > 0 && <span style={{ color:"var(--warning)", marginLeft:8 }}>⚠ More text = better accuracy</span>}
              </span>
              <div style={{ display:"flex", gap:8 }}>
                {text && <button style={{ background:"none", border:"none", color:"var(--danger)", fontSize:"0.75rem", cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={() => setText("")}>Clear</button>}
              </div>
            </div>
          </div>
        ) : (
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Article URL</label>
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <input className="form-input" type="url" placeholder="https://example.com/article"
                value={url} onChange={e => { setUrl(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && fetchFromUrl()} />
              <button className="btn btn-primary" onClick={fetchFromUrl} disabled={urlLoading || !url.trim()} style={{ whiteSpace:"nowrap", minWidth:120 }}>
                {urlLoading ? <><span className="spinner" /> Fetching…</> : "Extract Text"}
              </button>
            </div>
            <p style={{ fontSize:"0.75rem", color:"var(--text3)", marginTop:6 }}>
              We'll extract the article text from the URL, then analyse it. Some sites block this — if it fails, paste the text directly.
            </p>
            {text && (
              <div style={{ marginTop:"0.75rem", padding:"0.75rem", background:"var(--success-light)", borderRadius:8, border:"1px solid var(--success-border)", fontSize:"0.8rem", color:"var(--success)" }}>
                ✅ Extracted {wordCount} words. Switch to "Paste Text" to review, or click Analyse below.
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ color:"var(--danger)", fontSize:"0.875rem", marginBottom:"1rem", padding:"12px 16px", background:"var(--danger-light)", borderRadius:10, border:"1px solid var(--danger-border)" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"2rem" }}>
        <button className="btn btn-primary" onClick={analyze} disabled={loading || text.trim().length < 20} style={{ minWidth:180 }}>
          {loading ? <><span className="spinner" /> Analysing…</> : "⚡ Analyse Article"}
        </button>
        {loading && <span style={{ fontSize:"0.82rem", color:"var(--text3)" }} className="pulse">{STAGES[stage]}</span>}
      </div>

      {/* Pipeline visualiser */}
      {loading && (
        <div className="card" style={{ textAlign:"center", padding:"2.5rem", marginBottom:"1.5rem" }}>
          <div style={{ width:60, height:60, borderRadius:"50%", background:"var(--primary-glow)", border:"2px solid var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 1.25rem" }}>🛡</div>
          <h3 style={{ fontSize:"1.05rem", fontWeight:700, color:"var(--text)", marginBottom:6 }}>NLP Pipeline Running</h3>
          <p style={{ color:"var(--text3)", fontSize:"0.82rem", marginBottom:"1.75rem" }} className="pulse">{STAGES[stage]}</p>
          <div style={{ display:"flex", justifyContent:"center", gap:"0.75rem", flexWrap:"wrap" }}>
            {PIPELINE.map((s, i) => (
              <div key={s} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background: i<=stage ? "var(--primary)" : "var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.65rem", color: i<=stage ? "#fff" : "var(--text3)", fontWeight:700, transition:"all 0.3s", border:`1px solid ${i<=stage ? "var(--primary)" : "var(--border)"}` }}>
                  {i < stage ? "✓" : i+1}
                </div>
                <span style={{ fontSize:"0.62rem", color: i<=stage ? "var(--primary)" : "var(--text3)", fontWeight: i<=stage ? 600 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red flags guide */}
      <div className="card" style={{ background:"var(--surface2)" }}>
        <h4 style={{ fontSize:"0.875rem", fontWeight:700, color:"var(--text)", marginBottom:"0.75rem" }}>🚩 What TruthGuard detects</h4>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
          {RED_FLAGS.map(f => (
            <div key={f.label} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"#fff", borderRadius:8, border:"1px solid var(--border)", fontSize:"0.78rem", color:"var(--text2)" }}>
              <span>{f.icon}</span><span>{f.label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize:"0.75rem", color:"var(--text3)", marginTop:"0.75rem" }}>
          Want to understand these patterns? <a href="/learn" style={{ color:"var(--primary)", fontWeight:600 }}>Visit the Learn page →</a>
        </p>
      </div>
    </div>
  );
}