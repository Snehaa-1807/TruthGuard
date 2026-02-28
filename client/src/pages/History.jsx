import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { historyAPI } from "../services/api";

const CATEGORY_COLORS = {
  sensationalist:"#EF4444", medical:"#F59E0B", pseudoscience:"#8B5CF6",
  political:"#3B82F6", economic:"#10B981", science:"#0EA5E9", unknown:"#94A3B8"
};

export default function History() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [exporting, setExporting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const LIMIT = 10;

  useEffect(() => {
    if (searchParams.get("verdict")) setFilter(searchParams.get("verdict").toLowerCase());
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filter !== "all") params.verdict = filter.toUpperCase();
      if (search) params.search = search;
      if (searchParams.get("bookmarked")) params.bookmarked = "true";
      const res = await historyAPI.getAll(params);
      setItems(res.data.items);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, [filter, page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchHistory(); };
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this entry?")) return;
    await historyAPI.delete(id); fetchHistory();
  };
  const handleClearAll = async () => {
    if (!confirm("Clear ALL history? Cannot be undone.")) return;
    await historyAPI.clear(); fetchHistory();
  };
  const handleExport = async () => {
    setExporting(true);
    try {
      const res  = await historyAPI.export();
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url; link.download = "truthguard-history.csv"; link.click();
      window.URL.revokeObjectURL(url);
    } catch { alert("Export failed."); }
    finally { setExporting(false); }
  };

  const handleBookmark = async (id, e) => {
    e.stopPropagation();
    try {
      await historyAPI.toggleBookmark(id);
      setItems(items.map(it => it._id === id ? { ...it, bookmarked: !it.bookmarked } : it));
    } catch {}
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.75rem" }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--text)", letterSpacing:"-0.02em", marginBottom:4 }}>Analysis History</h1>
          <p style={{ color:"var(--text3)", fontSize:"0.875rem" }}>{total} total checks</p>
        </div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <button className="btn btn-ghost" onClick={handleExport} disabled={exporting || total===0} style={{ fontSize:"0.82rem" }}>
            {exporting ? <><span className="spinner" /> Exporting…</> : "⬇ Export CSV"}
          </button>
          {total > 0 && (
            <button className="btn btn-ghost" onClick={handleClearAll} style={{ color:"var(--danger)", borderColor:"var(--danger-border)", fontSize:"0.82rem" }}>
              🗑 Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:"1.25rem", padding:"1rem" }}>
        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
          <form onSubmit={handleSearch} style={{ flex:1, minWidth:200, display:"flex", gap:"0.5rem" }}>
            <input className="form-input" placeholder="Search articles…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ height:38 }} />
            <button type="submit" className="btn btn-ghost" style={{ height:38, padding:"0 14px" }}>🔍</button>
          </form>
          <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
            {["all","fake","real"].map(f => (
              <button key={f} className={`btn ${filter===f?"btn-primary":"btn-ghost"}`}
                onClick={() => { setFilter(f); setPage(1); }}
                style={{ padding:"7px 14px", fontSize:"0.8rem" }}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden" style={{ padding:0 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 80px 80px 90px 44px", gap:"0.75rem", padding:"10px 1.25rem", borderBottom:"1px solid var(--border)", fontSize:"0.68rem", color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.07em", background:"var(--surface2)", fontWeight:700 }}>
          <span>Article</span><span>Verdict</span><span>Confidence</span><span>Category</span><span>Date</span><span></span>
        </div>

        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}><span className="spinner" style={{ width:28, height:28 }} /></div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text3)" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:"1rem" }}>📋</div>
            <p style={{ fontWeight:500 }}>{total===0 ? "No articles checked yet." : "No results match your filter."}</p>
            {total===0 && <button className="btn btn-primary" style={{ marginTop:"1rem" }} onClick={() => navigate("/check")}>Check First Article</button>}
          </div>
        ) : items.map(item => (
          <div key={item._id} onClick={() => navigate(`/result/${item._id}`)}
            style={{ display:"grid", gridTemplateColumns:"1fr 90px 80px 80px 90px 44px", gap:"0.75rem", alignItems:"center", padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", cursor:"pointer", transition:"background 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.background="var(--surface2)"}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            <div>
              <div style={{ fontSize:"0.85rem", color:"var(--text)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:380 }}>{item.textSnippet}</div>
              <div style={{ display:"flex", gap:6, marginTop:3, alignItems:"center" }}>
                {item.bookmarked && <span style={{ fontSize:"0.65rem", color:"#F59E0B" }}>🔖</span>}
                {item.userNote && <span style={{ fontSize:"0.65rem", color:"var(--accent)" }}>📝 Note</span>}
                {item.suspiciousKeywords?.length > 0 && <span style={{ fontSize:"0.65rem", color:"var(--warning)", fontWeight:600 }}>⚠ {item.suspiciousKeywords.length} flags</span>}
              </div>
            </div>
            <span className={`badge badge-${item.verdict.toLowerCase()}`}>{item.verdict}</span>
            <span style={{ fontSize:"0.875rem", color:"var(--text2)", fontWeight:700 }}>{Math.round(item.confidence*100)}%</span>
            <span style={{ fontSize:"0.7rem", fontWeight:600, textTransform:"capitalize", color:CATEGORY_COLORS[item.category]||"var(--text3)" }}>{item.category||"—"}</span>
            <span style={{ fontSize:"0.72rem", color:"var(--text3)" }}>{new Date(item.createdAt).toLocaleDateString()}</span>
            <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1rem", opacity: item.bookmarked ? 1 : 0.4, transition:"opacity 0.15s" }}
              title={item.bookmarked ? "Remove bookmark" : "Bookmark"}
              onClick={e => handleBookmark(item._id, e)}>🔖</button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", marginTop:"1.5rem" }}>
          <button className="btn btn-ghost" disabled={page===1} onClick={() => setPage(p=>p-1)} style={{ padding:"7px 14px" }}>←</button>
          {Array.from({ length:Math.min(pages,7) }, (_,i) => (
            <button key={i} className={`btn ${page===i+1?"btn-primary":"btn-ghost"}`}
              onClick={() => setPage(i+1)} style={{ padding:"7px 14px", minWidth:40 }}>{i+1}</button>
          ))}
          <button className="btn btn-ghost" disabled={page===pages} onClick={() => setPage(p=>p+1)} style={{ padding:"7px 14px" }}>→</button>
        </div>
      )}
    </div>
  );
}