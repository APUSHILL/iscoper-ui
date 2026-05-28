import React, { useState, useMemo } from "react";
import { TestCase } from "../types";
import { Search, X, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface Props { proposed: TestCase[] }

const PAGE_SIZE = 20;

function riskLabel(s: number) { return s >= 0.7 ? "High" : s >= 0.4 ? "Medium" : "Low"; }
function riskClass(s: number) { return s >= 0.7 ? "badge badge-red" : s >= 0.4 ? "badge badge-orange" : "badge badge-green"; }
function inclusionClass(r: string) {
  if (r === "L1: Changed Objects")   return "badge badge-red";
  if (r === "L1: Business Critical") return "badge badge-orange";
  return "badge badge-blue";
}
function trunc(s: string, n = 34) { return s.length > n ? s.slice(0, n) + "…" : s; }

const ScopeProposal: React.FC<Props> = ({ proposed }) => {
  const [areaFilter,    setAreaFilter]    = useState("All");
  const [subAreaFilter, setSubAreaFilter] = useState("All");
  const [reasonFilter,  setReasonFilter]  = useState("All");
  const [riskFilter,    setRiskFilter]    = useState("All");
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [selected,      setSelected]      = useState<TestCase | null>(null);

  const areas = useMemo(() =>
    ["All", ...Array.from(new Set(proposed.map(t => t.area))).sort()],
  [proposed]);

  // SubAreas cascade from selected area
  const subAreas = useMemo(() => {
    const base = areaFilter === "All" ? proposed : proposed.filter(t => t.area === areaFilter);
    return ["All", ...Array.from(new Set(base.map(t => t.subArea).filter(Boolean))).sort()];
  }, [proposed, areaFilter]);

  const reasons = useMemo(() =>
    ["All", ...Array.from(new Set(proposed.map(t => t.inclusion_reason || ""))).filter(Boolean).sort()],
  [proposed]);

  // Actual counts from data
  const l1Count   = useMemo(() => proposed.filter(t => t.inclusion_reason === "L1: Changed Objects").length, [proposed]);
  const topkCount = useMemo(() => proposed.filter(t => t.inclusion_reason !== "L1: Changed Objects" && t.inclusion_reason !== "L1: Business Critical").length, [proposed]);
  const bizCount  = useMemo(() => proposed.filter(t => t.inclusion_reason === "L1: Business Critical").length, [proposed]);

  const filtered = useMemo(() => proposed.filter(t => {
    if (areaFilter !== "All"    && t.area    !== areaFilter)    return false;
    if (subAreaFilter !== "All" && t.subArea !== subAreaFilter) return false;
    if (reasonFilter !== "All"  && t.inclusion_reason !== reasonFilter) return false;
    if (riskFilter === "High"   && t.risk_score < 0.7) return false;
    if (riskFilter === "Medium" && (t.risk_score < 0.4 || t.risk_score >= 0.7)) return false;
    if (riskFilter === "Low"    && t.risk_score >= 0.4) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.testcaseAutomateConfigurationName.toLowerCase().includes(q) &&
          !t.testplanName.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [proposed, areaFilter, subAreaFilter, reasonFilter, riskFilter, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const reset = (fn: () => void) => { fn(); setPage(1); };

  const handleAreaChange = (val: string) => {
    reset(() => { setAreaFilter(val); setSubAreaFilter("All"); });
  };

  const exportCSV = () => {
    const headers = ["Rank","TestCase","TestPlan","Area","SubArea","RiskScore","Complexity","HotfixProne","InclusionReason","Confidence"];
    const rows = filtered.map(t => [
      t.rank ?? "",
      `"${t.testcaseAutomateConfigurationName.replace(/"/g, '""')}"`,
      `"${t.testplanName.replace(/"/g, '""')}"`,
      t.area,
      t.subArea,
      t.risk_score.toFixed(4),
      t.Complexity,
      t.touches_hotfix_objects === 1 ? "Yes" : "No",
      `"${(t.inclusion_reason || "").replace(/"/g, '""')}"`,
      t.confidence ?? "",
    ].join(","));
    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `proposed_scope_2508${filtered.length < proposed.length ? "_filtered" : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content">

      {/* Info banner — real counts */}
      <div className="info-banner">
        <strong>{proposed.length} test cases</strong> recommended by AI ensemble &nbsp;·&nbsp;
        <strong>{l1Count}</strong> via changed objects &nbsp;·&nbsp;
        <strong>{topkCount}</strong> via TopK AI risk &nbsp;·&nbsp;
        <strong>{bizCount}</strong> via business criticality
        <div style={{ marginLeft: "auto" }}>
          <button className="btn-secondary" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-search-wrap">
          <Search size={14} className="filter-search-icon" />
          <input
            className="filter-search"
            placeholder="Search test case or plan…"
            value={search}
            onChange={e => reset(() => setSearch(e.target.value))}
          />
        </div>

        <label className="filter-label">Area</label>
        <select className="filter-select" value={areaFilter} onChange={e => handleAreaChange(e.target.value)}>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <label className="filter-label">Sub Area</label>
        <select
          className="filter-select"
          value={subAreaFilter}
          onChange={e => reset(() => setSubAreaFilter(e.target.value))}
          disabled={areaFilter === "All"}
          style={{ opacity: areaFilter === "All" ? 0.5 : 1 }}
        >
          {subAreas.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label className="filter-label">Inclusion</label>
        <select className="filter-select" value={reasonFilter} onChange={e => reset(() => setReasonFilter(e.target.value))}>
          {reasons.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <label className="filter-label">Risk</label>
        <select className="filter-select" value={riskFilter} onChange={e => reset(() => setRiskFilter(e.target.value))}>
          {["All", "High", "Medium", "Low"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <span className="filter-count">{filtered.length} results</span>
      </div>

      {/* Table + detail panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ent-card">
            <div className="ent-card-header">
              <div>
                <div className="ent-card-title">Proposed Test Cases</div>
                <div className="ent-card-subtitle">AI-selected scope for Release 2508</div>
              </div>
            </div>
            <div className="ent-table-wrap">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Test Case</th>
                    <th>Test Plan</th>
                    <th>Area</th>
                    <th>Sub Area</th>
                    <th>Risk Score</th>
                    <th>Risk</th>
                    <th>Inclusion</th>
                    <th>Hotfix</th>
                    <th>Complexity</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map(tc => (
                    <tr
                      key={tc.testcaseIdentifier}
                      className={selected?.testcaseIdentifier === tc.testcaseIdentifier ? "selected" : ""}
                      onClick={() => setSelected(tc)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ color: "#8996A9", fontWeight: 500 }}>{tc.rank ?? "—"}</td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: 12 }} title={tc.testcaseAutomateConfigurationName}>
                          {trunc(tc.testcaseAutomateConfigurationName, 30)}
                        </span>
                      </td>
                      <td style={{ color: "#8996A9", fontSize: 12 }} title={tc.testplanName}>
                        {trunc(tc.testplanName, 28)}
                      </td>
                      <td><span className="badge badge-blue">{tc.area}</span></td>
                      <td style={{ fontSize: 12, color: "#5F738C" }}>{tc.subArea || "—"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div className="risk-bar-wrap">
                            <div className="risk-bar-fill" style={{ width: `${(tc.risk_score * 100).toFixed(1)}%`, background: tc.risk_score >= 0.7 ? "#BB0000" : tc.risk_score >= 0.4 ? "#E9730C" : "#188918" }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#8996A9", minWidth: 40 }}>{tc.risk_score.toFixed(3)}</span>
                        </div>
                      </td>
                      <td><span className={riskClass(tc.risk_score)}>{riskLabel(tc.risk_score)}</span></td>
                      <td><span className={inclusionClass(tc.inclusion_reason || "")} style={{ fontSize: 11 }}>{tc.inclusion_reason}</span></td>
                      <td style={{ textAlign: "center" }}>
                        {tc.touches_hotfix_objects === 1
                          ? <span className="badge badge-red">Yes</span>
                          : <span style={{ color: "#8996A9" }}>—</span>}
                      </td>
                      <td style={{ textAlign: "center" }}>{tc.Complexity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <span className="pagination-info">
                Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
                  const p = start + i;
                  return p <= pageCount ? (
                    <button key={p} className={`page-btn${p === page ? " active" : ""}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ) : null;
                })}
                <button className="page-btn" disabled={page === pageCount || pageCount === 0} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={14} />
                </button>
                <button className="page-btn" disabled={page === pageCount || pageCount === 0} onClick={() => setPage(pageCount)}>»</button>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="detail-panel">
            <div className="detail-panel-header">
              <span className="detail-panel-title">Test Case Detail</span>
              <button className="detail-panel-close" onClick={() => setSelected(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="detail-panel-body">
              {([
                ["Config Name",   selected.testcaseAutomateConfigurationName],
                ["Test Plan",     selected.testplanName],
                ["Area",          selected.area],
                ["Sub Area",      selected.subArea || "—"],
                ["App Component", selected.applicationComponent || "—"],
                ["Risk Score",    selected.risk_score.toFixed(4)],
                ["Confidence",    selected.confidence != null ? `${selected.confidence}%` : "—"],
                ["Rank",          String(selected.rank ?? "—")],
                ["Inclusion",     selected.inclusion_reason || "—"],
                ["Hotfix-Prone",  selected.touches_hotfix_objects === 1 ? "Yes ⚠️" : "No"],
                ["Complexity",    String(selected.Complexity)],
                ["Changed Obj.",  String(selected.changed_objects_count)],
                ["Impact Score",  typeof selected.usageCustomerImpactScore === "number"
                  ? selected.usageCustomerImpactScore.toLocaleString() : "—"],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="detail-row">
                  <span className="detail-row-label">{k}</span>
                  <span className="detail-row-val">{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "#8996A9", marginBottom: 6 }}>Risk Score</div>
                <div className="risk-bar-wrap" style={{ height: 10 }}>
                  <div
                    className="risk-bar-fill"
                    style={{
                      width: `${(selected.risk_score * 100).toFixed(1)}%`,
                      background: selected.risk_score >= 0.7 ? "#BB0000" : selected.risk_score >= 0.4 ? "#E9730C" : "#188918",
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#8996A9", marginTop: 4 }}>
                  {(selected.risk_score * 100).toFixed(1)}% · {riskLabel(selected.risk_score)} Risk
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScopeProposal;
