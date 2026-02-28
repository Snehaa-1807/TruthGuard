import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { historyAPI } from "../services/api";

const CATEGORY_COLORS = {
  sensationalist:"#EF4444", medical:"#F59E0B", pseudoscience:"#8B5CF6",
  political:"#3B82F6", economic:"#10B981", science:"#0EA5E9", unknown:"#94A3B8"
};

export default function Bookmarks() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    historyAPI.getAll({ bookmarked: "true", limit: 50 })
      .then(r => setItems(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removeBookmark = async (id, e) => {
    e.stopPropagation();
    await historyAPI.toggleBookmark(id);
    setItems(items.filter(i => i._id !== id));
  };

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300 }}><span className="spinner" style={{ width:32, height:32 }} /></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--text)", letterSpacing:"-0.02em", marginBottom:4 }}>🔖 Bookmarks</h1>
        <p style={{ color:"var(--text3)", fontSize:"0.875rem" }}>Articles you've saved for reference — {items.length} saved</p>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"4rem 2rem", borderStyle:"dashed", borderColor:"var(--border2)" }}>
          <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>🔖</div>
          <h3 style={{ fontSize:"1.25rem", fontWeight:700, marginBottom:8 }}>No bookmarks yet</h3>
          <p style={{ color:"var(--text3)", marginBottom:"1.5rem", fontSize:"0.875rem" }}>
            Bookmark any analysis result to save it here for quick reference.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/check")}>Check an Article</button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:"1rem" }}>
          {items.map(item => {
            const isFake = item.verdict === "FAKE";
            const conf   = Math.round(item.confidence * 100);
            const catColor = CATEGORY_COLORS[item.category] || "#94A3B8";
            return (
              <div key={item._id} className="card" style={{ cursor:"pointer", transition:"box-shadow 0.2s, transform 0.2s", borderLeft:`4px solid ${isFake?"var(--danger)":"var(--success)"}` }}
                onClick={() => navigate(`/result/${item._id}`)}
                onMouseEnter={e => { e.currentTarget.style.boxShadow="var(--shadow)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow="var(--shadow-sm)"; e.currentTarget.style.transform="none"; }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem" }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span className={`badge badge-${isFake?"fake":"real"}`}>{item.verdict}</span>
                    <span style={{ fontSize:"0.875rem", fontWeight:700, color: isFake?"var(--danger)":"var(--success)" }}>{conf}%</span>
                  </div>
                  <button style={{ background:"none", border:"none", cursor:"pointer", color:"#F59E0B", fontSize:"1.1rem" }}
                    onClick={e => removeBookmark(item._id, e)} title="Remove bookmark">🔖</button>
                </div>
                <p style={{ fontSize:"0.875rem", color:"var(--text)", lineHeight:1.5, marginBottom:"0.75rem" }}>{item.textSnippet}</p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {item.category && item.category !== "unknown" && (
                      <span style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"capitalize", color:catColor, background:catColor+"15", padding:"2px 8px", borderRadius:99 }}>{item.category}</span>
                    )}
                    {item.userNote && <span style={{ fontSize:"0.68rem", color:"var(--accent)" }}>📝 has note</span>}
                    {item.suspiciousKeywords?.length > 0 && <span style={{ fontSize:"0.68rem", color:"var(--warning)" }}>⚠ {item.suspiciousKeywords.length} flags</span>}
                  </div>
                  <span style={{ fontSize:"0.72rem", color:"var(--text3)" }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}