import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { historyAPI } from "../services/api";

const CATEGORY_COLORS = {
  sensationalist:"#EF4444", medical:"#F59E0B", pseudoscience:"#8B5CF6",
  political:"#3B82F6", economic:"#10B981", science:"#0EA5E9", unknown:"#94A3B8"
};

function highlightKeywords(text, keywords) {
  if (!keywords?.length) return text;
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex   = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(regex).map((p, i) =>
    keywords.some(k => p.toLowerCase() === k.toLowerCase())
      ? <mark key={i} className="keyword">{p}</mark> : p
  );
}

function ShareCard({ data }) {
  const isFake = data.verdict === "FAKE";
  const conf   = Math.round(data.confidence * 100);
  return (
    <div style={{ background: isFake ? "#FEF2F2" : "#ECFDF5", border:`2px solid ${isFake?"#FECACA":"#A7F3D0"}`, borderRadius:16, padding:"1.5rem", maxWidth:480 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"1rem" }}>
        <div style={{ width:44, height:44, borderRadius:12, background:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🛡</div>
        <div>
          <div style={{ fontWeight:800, fontSize:"1.1rem", color:"var(--text)" }}>TruthGuard Analysis</div>
          <div style={{ fontSize:"0.75rem", color:"var(--text3)" }}>AI-powered fake news detection</div>
        </div>
      </div>
      <div style={{ fontSize:"2rem", fontWeight:900, color: isFake?"var(--danger)":"var(--success)", marginBottom:4 }}>
        {isFake ? "🚨 FAKE" : "✅ REAL"}
      </div>
      <div style={{ fontSize:"0.9rem", color:"var(--text2)", marginBottom:"0.75rem" }}>
        Confidence: <strong>{conf}%</strong>
        {data.category && data.category !== "unknown" && (
          <span style={{ marginLeft:10, padding:"2px 8px", borderRadius:99, fontSize:"0.7rem", fontWeight:700, textTransform:"capitalize", background:(CATEGORY_COLORS[data.category]||"#94A3B8")+"18", color:CATEGORY_COLORS[data.category]||"#94A3B8" }}>{data.category}</span>
        )}
      </div>
      {data.textSnippet && <div style={{ fontSize:"0.78rem", color:"var(--text3)", fontStyle:"italic", borderTop:"1px solid rgba(0,0,0,0.08)", paddingTop:"0.75rem" }}>"{data.textSnippet}"</div>}
      <div style={{ fontSize:"0.7rem", color:"var(--text3)", marginTop:"0.5rem" }}>checked {new Date(data.checkedAt||data.createdAt).toLocaleString()}</div>
    </div>
  );
}

export default function Result() {
  const { id }     = useParams();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [data,     setData]     = useState(location.state || null);
  const [loading,  setLoading]  = useState(!location.state);
  const [showFull, setShowFull] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [note,     setNote]     = useState("");
  const [noteSaved,setNoteSaved]= useState(false);
  const [noteEdit, setNoteEdit] = useState(false);
  const [showShare,setShowShare]= useState(false);
  const [copied,   setCopied]   = useState(false);
  const noteRef = useRef(null);

  useEffect(() => {
    if (!data) {
      historyAPI.getOne(id)
        .then(res => { setData(res.data); setBookmarked(res.data.bookmarked||false); setNote(res.data.userNote||""); })
        .catch(() => navigate("/history"))
        .finally(() => setLoading(false));
    } else {
      setBookmarked(data.bookmarked||false);
      setNote(data.userNote||"");
    }
  }, [id]);

  const toggleBookmark = async () => {
    try {
      const res = await historyAPI.toggleBookmark(id);
      setBookmarked(res.data.bookmarked);
    } catch {}
  };

  const saveNote = async () => {
    try {
      await historyAPI.saveNote(id, note);
      setNoteSaved(true); setNoteEdit(false);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch {}
  };

  const copyReport = () => {
    const isFake = data.verdict === "FAKE";
    const conf   = Math.round(data.confidence * 100);
    const text   = [
      `TruthGuard Analysis Report`,
      `═══════════════════════════`,
      `Verdict   : ${data.verdict}`,
      `Confidence: ${conf}%`,
      `Category  : ${data.category || "unknown"}`,
      data.suspiciousKeywords?.length ? `Red Flags : ${data.suspiciousKeywords.join(", ")}` : "",
      `Checked   : ${new Date(data.checkedAt||data.createdAt).toLocaleString()}`,
      ``,
      `Article Snippet:`,
      data.textSnippet || "",
    ].filter(Boolean).join("\n");
    navigator.clipboard?.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300 }}><span className="spinner" style={{ width:32, height:32 }} /></div>;
  if (!data)   return null;

  const isFake  = data.verdict === "FAKE";
  const confPct = Math.round(data.confidence * 100);
  const color   = isFake ? "var(--danger)" : "var(--success)";
  const lightBg = isFake ? "var(--danger-light)" : "var(--success-light)";
  const border  = isFake ? "var(--danger-border)" : "var(--success-border)";

  // Credibility score breakdown for display
  const credibilityItems = [
    { label:"ML Model Score",    value: data.mlProbabilities ? Math.round((isFake ? data.mlProbabilities.FAKE : data.mlProbabilities.REAL)*100) : confPct, icon:"🤖", desc:"Machine learning prediction" },
    { label:"Rule-Based Score",  value: data.ruleScore != null ? (isFake ? Math.round(data.ruleScore*100) : Math.round((1-data.ruleScore)*100)) : null, icon:"📐", desc:"Pattern & keyword analysis" },
    { label:"Flagged Signals",   value: data.suspiciousKeywords?.length || 0, icon:"🚩", desc:"Suspicious patterns found", raw:true },
  ].filter(x => x.value != null);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding:"7px 14px" }}>← Back</button>
          <div>
            <h1 style={{ fontSize:"1.6rem", fontWeight:800, color:"var(--text)", letterSpacing:"-0.02em" }}>Analysis Result</h1>
            <p style={{ color:"var(--text3)", fontSize:"0.75rem" }}>{new Date(data.checkedAt||data.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <button className="btn btn-ghost" style={{ padding:"7px 12px", fontSize:"0.8rem", color: bookmarked ? "#F59E0B" : "var(--text2)", borderColor: bookmarked ? "#FDE68A" : "var(--border2)", background: bookmarked ? "#FFFBEB" : "transparent" }}
            onClick={toggleBookmark} title={bookmarked ? "Remove bookmark" : "Bookmark"}>
            {bookmarked ? "🔖 Bookmarked" : "🔖 Bookmark"}
          </button>
          <button className="btn btn-ghost" style={{ padding:"7px 12px", fontSize:"0.8rem" }} onClick={() => setShowShare(s=>!s)}>
            📤 Share
          </button>
        </div>
      </div>

      {/* Share card */}
      {showShare && (
        <div className="card fade-in" style={{ marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <h3 style={{ fontSize:"0.95rem", fontWeight:700 }}>📤 Share Result</h3>
            <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", fontSize:"1.1rem" }} onClick={() => setShowShare(false)}>✕</button>
          </div>
          <ShareCard data={data} />
          <div style={{ display:"flex", gap:"0.75rem", marginTop:"1rem" }}>
            <button className="btn btn-primary" onClick={copyReport} style={{ fontSize:"0.85rem" }}>
              {copied ? "✓ Copied!" : "📋 Copy Report Text"}
            </button>
            <button className="btn btn-ghost" style={{ fontSize:"0.85rem" }}
              onClick={() => window.print()}>🖨 Print</button>
          </div>
        </div>
      )}

      {/* Verdict banner */}
      <div style={{ display:"flex", alignItems:"center", gap:"1.5rem", padding:"1.5rem 2rem", borderRadius:16, marginBottom:"1.5rem", background:lightBg, border:`1.5px solid ${border}` }}>
        <div style={{ width:68, height:68, borderRadius:"50%", background:"#fff", border:`2.5px solid ${color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
          {isFake ? "🚨" : "✅"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"2.25rem", fontWeight:900, color, lineHeight:1, letterSpacing:"-0.02em" }}>{data.verdict}</div>
          <div style={{ color:"var(--text2)", fontSize:"0.875rem", marginTop:4, fontWeight:500 }}>
            This article is <strong>{isFake ? "likely misinformation" : "likely credible news"}</strong>
          </div>
          {data.category && data.category !== "unknown" && (
            <span style={{ display:"inline-block", marginTop:6, padding:"2px 10px", borderRadius:99, fontSize:"0.7rem", fontWeight:700, textTransform:"capitalize", background:(CATEGORY_COLORS[data.category]||"#94A3B8")+"20", color:CATEGORY_COLORS[data.category]||"#94A3B8", border:`1px solid ${CATEGORY_COLORS[data.category]||"#94A3B8"}40` }}>
              {data.category} misinformation
            </span>
          )}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"2.2rem", fontWeight:900, color }}>{confPct}%</div>
          <div style={{ fontSize:"0.75rem", color:"var(--text3)" }}>confidence</div>
        </div>
      </div>

      {/* Score breakdown + word importance */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"1.5rem" }}>
        <div className="card">
          <h3 style={{ fontSize:"0.82rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"1rem" }}>Score Breakdown</h3>
          <div className="progress-track" style={{ height:10, marginBottom:"0.5rem" }}>
            <div className="progress-fill" style={{ width:`${confPct}%`, background:color }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.7rem", color:"var(--text3)", marginBottom:"1.25rem" }}>
            <span>Uncertain (50%)</span><span>Certain (100%)</span>
          </div>
          {credibilityItems.map(item => (
            <div key={item.label} style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.875rem" }}>
              <span style={{ fontSize:"1rem" }}>{item.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", marginBottom:3 }}>
                  <span style={{ color:"var(--text2)", fontWeight:500 }}>{item.label}</span>
                  <span style={{ fontWeight:700, color:"var(--text)" }}>{item.raw ? item.value : `${item.value}%`}</span>
                </div>
                {!item.raw && (
                  <div className="progress-track" style={{ height:5 }}>
                    <div className="progress-fill" style={{ width:`${item.value}%`, background:color }} />
                  </div>
                )}
                <div style={{ fontSize:"0.68rem", color:"var(--text3)" }}>{item.desc}</div>
              </div>
            </div>
          ))}
          {data.probabilities && (
            <div style={{ borderTop:"1px solid var(--border)", paddingTop:"0.75rem", marginTop:"0.25rem" }}>
              {Object.entries(data.probabilities).map(([cls, prob]) => (
                <div key={cls} style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:6 }}>
                  <span style={{ fontSize:"0.75rem", fontWeight:600, color: cls==="FAKE"?"var(--danger)":"var(--success)", width:36 }}>{cls}</span>
                  <div style={{ flex:1, height:5, background:"var(--surface3)", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${Math.round(prob*100)}%`, background: cls==="FAKE"?"var(--danger)":"var(--success)", borderRadius:99 }} />
                  </div>
                  <span style={{ fontSize:"0.75rem", color:"var(--text2)", fontWeight:600, width:36, textAlign:"right" }}>{Math.round(prob*100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize:"0.82rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"1rem" }}>Top Influential Words</h3>
          {data.wordImportance?.length > 0 ? data.wordImportance.slice(0,9).map((w,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:8 }}>
              <span style={{ fontSize:"0.78rem", color:"var(--text)", fontWeight:500, width:85, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.word}</span>
              <div style={{ flex:1, height:5, background:"var(--surface3)", borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min(100,Math.abs(w.score)*250)}%`, background: w.score>0?"var(--danger)":"var(--success)", borderRadius:99 }} />
              </div>
              <span style={{ fontSize:"0.65rem", color: w.score>0?"var(--danger)":"var(--success)", width:40, textAlign:"right", fontWeight:600 }}>{w.score>0?"↑ fake":"↓ real"}</span>
            </div>
          )) : (
            <div style={{ padding:"2rem", textAlign:"center", color:"var(--text3)", fontSize:"0.85rem" }}>Retrain model for word importance</div>
          )}
        </div>
      </div>

      {/* Flagged keywords */}
      {data.suspiciousKeywords?.length > 0 && (
        <div className="card" style={{ marginBottom:"1.5rem" }}>
          <h3 style={{ fontSize:"0.82rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"0.75rem" }}>
            🚩 Flagged Signals ({data.suspiciousKeywords.length})
          </h3>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
            {data.suspiciousKeywords.map(k => (
              <span key={k} style={{ padding:"4px 12px", background:"#FFFBEB", color:"#92400E", border:"1px solid #FDE68A", borderRadius:8, fontSize:"0.78rem", fontWeight:500 }}>⚠ {k}</span>
            ))}
          </div>
        </div>
      )}

      {/* Article text */}
      {data.text && (
        <div className="card" style={{ marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
            <h3 style={{ fontSize:"0.82rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Article Text</h3>
            <button style={{ background:"none", border:"none", color:"var(--primary)", fontSize:"0.8rem", cursor:"pointer", fontFamily:"var(--font-body)", fontWeight:600 }} onClick={() => setShowFull(f=>!f)}>
              {showFull ? "Show less ▲" : "Show full ▼"}
            </button>
          </div>
          <div style={{ fontSize:"0.875rem", lineHeight:1.8, color:"var(--text2)", maxHeight:showFull?"none":110, overflow:"hidden" }}>
            {highlightKeywords(showFull ? data.text : data.text.slice(0,400), data.suspiciousKeywords)}
            {!showFull && data.text.length>400 && "…"}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="card" style={{ marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
          <h3 style={{ fontSize:"0.82rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em" }}>📝 Your Notes</h3>
          {!noteEdit && <button style={{ background:"none", border:"none", color:"var(--primary)", fontSize:"0.8rem", cursor:"pointer", fontFamily:"var(--font-body)", fontWeight:600 }} onClick={() => { setNoteEdit(true); setTimeout(()=>noteRef.current?.focus(),50); }}>{note ? "Edit" : "+ Add note"}</button>}
        </div>
        {noteEdit ? (
          <div>
            <textarea ref={noteRef} className="form-input" style={{ minHeight:90, fontSize:"0.875rem" }}
              placeholder="Add your personal notes about this article… (e.g. context, source you verified against)"
              value={note} onChange={e => setNote(e.target.value)} maxLength={500} />
            <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.5rem", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:"0.72rem", color:"var(--text3)" }}>{note.length}/500</span>
              <div style={{ display:"flex", gap:"0.5rem" }}>
                <button className="btn btn-ghost" style={{ padding:"6px 14px", fontSize:"0.8rem" }} onClick={() => setNoteEdit(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ padding:"6px 14px", fontSize:"0.8rem" }} onClick={saveNote}>Save Note</button>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize:"0.875rem", color: note ? "var(--text)" : "var(--text3)", fontStyle: note ? "normal" : "italic", lineHeight:1.6 }}>
            {note || "No notes yet. Click '+ Add note' to annotate this analysis."}
          </p>
        )}
        {noteSaved && <div style={{ color:"var(--success)", fontSize:"0.8rem", marginTop:4 }}>✓ Note saved</div>}
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
        <button className="btn btn-primary" onClick={() => navigate("/check")}>⚡ Check Another</button>
        <button className="btn btn-ghost"   onClick={() => navigate("/history")}>View History</button>
        <button className="btn btn-ghost"   onClick={copyReport}>{copied ? "✓ Copied!" : "📋 Copy Report"}</button>
        <button className="btn btn-ghost"   onClick={() => navigate("/learn")} style={{ marginLeft:"auto" }}>📚 Learn to spot fake news</button>
      </div>
    </div>
  );
}