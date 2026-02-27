import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { historyAPI } from "../services/api";

export default function History() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const navigate = useNavigate();
  const LIMIT = 10;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filter !== "all") params.verdict = filter.toUpperCase();
      if (search)           params.search  = search;
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
    await historyAPI.delete(id);
    fetchHistory();
  };

  const handleClearAll = async () => {
    if (!confirm("Clear all history? This cannot be undone.")) return;
    await historyAPI.clear();
    fetchHistory();
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>Analysis History</h1>
          <p style={{ color: "var(--text3)", fontSize: "0.875rem" }}>{total} total checks</p>
        </div>
        {total > 0 && (
          <button className="btn btn-ghost" onClick={handleClearAll} style={{ color: "var(--danger)", borderColor: "var(--danger-border)" }}>
            🗑 Clear All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "1.25rem", padding: "1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 200 }}>
            <input className="form-input" placeholder="Search articles…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ height: 38 }} />
          </form>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["all", "fake", "real"].map(f => (
              <button key={f} className={`btn ${filter === f ? "btn-primary" : "btn-ghost"}`}
                onClick={() => { setFilter(f); setPage(1); }}
                style={{ padding: "7px 16px", fontSize: "0.8rem" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: "1rem", padding: "10px 1.25rem", borderBottom: "1px solid var(--border)", fontSize: "0.7rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", background: "var(--surface2)" }}>
          <span>Article</span><span>Verdict</span><span>Confidence</span><span>Date</span><span></span>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text3)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📋</div>
            <p style={{ fontWeight: 500 }}>{total === 0 ? "No articles checked yet." : "No results match your filter."}</p>
            {total === 0 && <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => navigate("/check")}>Check First Article</button>}
          </div>
        ) : items.map(item => (
          <div key={item._id} onClick={() => navigate(`/result/${item._id}`)}
            style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: "1rem", alignItems: "center", padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div>
              <div style={{ fontSize: "0.875rem", color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>{item.textSnippet}</div>
              {item.suspiciousKeywords?.length > 0 && (
                <span style={{ fontSize: "0.7rem", color: "var(--warning)", fontWeight: 600 }}>⚠ {item.suspiciousKeywords.length} flagged keywords</span>
              )}
            </div>
            <span className={`badge badge-${item.verdict.toLowerCase()}`}>{item.verdict}</span>
            <span style={{ fontSize: "0.875rem", color: "var(--text2)", fontWeight: 600 }}>{Math.round(item.confidence * 100)}%</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text3)", whiteSpace: "nowrap" }}>{new Date(item.createdAt).toLocaleDateString()}</span>
            <button className="btn btn-ghost"
              style={{ padding: "5px 10px", color: "var(--danger)", borderColor: "var(--danger-border)", fontSize: "0.75rem" }}
              onClick={e => handleDelete(item._id, e)}>🗑</button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: "7px 14px" }}>←</button>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={`btn ${page === i + 1 ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPage(i + 1)} style={{ padding: "7px 14px", minWidth: 40 }}>{i + 1}</button>
          ))}
          <button className="btn btn-ghost" disabled={page === pages} onClick={() => setPage(p => p + 1)} style={{ padding: "7px 14px" }}>→</button>
        </div>
      )}
    </div>
  );
}