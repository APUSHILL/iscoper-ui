import React, { useState, useMemo } from "react";
import { TestCase, ExecStatus } from "../types";
import { Search, RotateCcw, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";

interface Props { proposed: TestCase[] }

const STORAGE_KEY = "iscoper-tracker-statuses";
const PAGE_SIZE = 20;

const STATUS_CONFIG: Record<ExecStatus, { label: string; badge: string; color: string; colColor: string }> = {
  "not-started": { label: "Not Started", badge: "badge-gray",   color: "#556b82", colColor: "#eaecee" },
  "in-progress":  { label: "In Progress", badge: "badge-blue",   color: "#0070f2", colColor: "#a9c8ff" },
  "passed":       { label: "Passed",      badge: "badge-green",  color: "#256f3a", colColor: "#30914c" },
  "failed":       { label: "Failed",      badge: "badge-red",    color: "#aa0808", colColor: "#e90b0b" },
  "blocked":      { label: "Blocked",     badge: "badge-orange", color: "#e76500", colColor: "#dd6100" },
};

const STATUSES = Object.keys(STATUS_CONFIG) as ExecStatus[];
const COLUMNS: ExecStatus[] = ["not-started", "in-progress", "passed", "failed", "blocked"];

function trunc(s: string, n = 32) { return s.length > n ? s.slice(0, n) + "…" : s; }
function riskClass(s: number) { return s >= 0.7 ? "badge badge-red" : s >= 0.4 ? "badge badge-orange" : "badge badge-green"; }
function riskLabel(s: number) { return s >= 0.7 ? "High" : s >= 0.4 ? "Med" : "Low"; }

const ExecutionTracker: React.FC<Props> = ({ proposed }) => {
  const [statuses, setStatuses] = useState<Record<string, ExecStatus>>(() =>
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  );
  const [view,         setView]         = useState<"table" | "kanban">("table");
  const [statusFilter, setStatusFilter] = useState("All");
  const [areaFilter,   setAreaFilter]   = useState("All");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);

  const getStatus = (id: string): ExecStatus =>
    statuses[id] ?? "not-started";

  const updateStatus = (id: string, status: ExecStatus) => {
    const next = { ...statuses, [id]: status };
    setStatuses(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const resetAll = () => {
    setStatuses({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const areas = useMemo(() =>
    ["All", ...Array.from(new Set(proposed.map(t => t.area))).sort()],
  [proposed]);

  const filtered = useMemo(() => proposed.filter(t => {
    const st = getStatus(t.testcaseIdentifier);
    if (statusFilter !== "All" && st !== statusFilter) return false;
    if (areaFilter   !== "All" && t.area !== areaFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.testcaseAutomateConfigurationName.toLowerCase().includes(q) &&
          !t.testplanName.toLowerCase().includes(q)) return false;
    }
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [proposed, statusFilter, areaFilter, search, statuses]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const reset     = (fn: () => void) => { fn(); setPage(1); };

  // KPI counts
  const counts = useMemo(() => {
    const c: Record<ExecStatus, number> = { "not-started": 0, "in-progress": 0, passed: 0, failed: 0, blocked: 0 };
    proposed.forEach(t => { c[getStatus(t.testcaseIdentifier)]++; });
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposed, statuses]);

  const passedPct = proposed.length > 0 ? ((counts.passed / proposed.length) * 100).toFixed(1) : "0.0";
  const donePct   = proposed.length > 0 ? (((counts.passed + counts.failed + counts.blocked) / proposed.length) * 100).toFixed(1) : "0.0";

  return (
    <div className="page-content">

      {/* KPI strip */}
      <div className="tracker-kpi-strip">
        <div className="tracker-kpi">
          <div className="tracker-kpi-val">{proposed.length}</div>
          <div className="tracker-kpi-label">Total Proposed</div>
        </div>
        {STATUSES.map(s => (
          <div key={s} className="tracker-kpi">
            <div className="tracker-kpi-val" style={{ color: STATUS_CONFIG[s].color }}>{counts[s]}</div>
            <div className="tracker-kpi-label">{STATUS_CONFIG[s].label}</div>
          </div>
        ))}
        <div className="tracker-kpi" style={{ flex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span className="tracker-kpi-label">Execution Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#256f3a" }}>{passedPct}% passed · {donePct}% done</span>
          </div>
          <div className="tracker-progress-bar">
            <div className="tracker-progress-passed" style={{ width: `${passedPct}%` }} />
            <div className="tracker-progress-done"   style={{ width: `${parseFloat(donePct) - parseFloat(passedPct)}%` }} />
          </div>
        </div>
      </div>

      {/* View toggle + filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
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
        <select className="filter-select" value={areaFilter} onChange={e => reset(() => setAreaFilter(e.target.value))}>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <label className="filter-label">Status</label>
        <select className="filter-select" value={statusFilter} onChange={e => reset(() => setStatusFilter(e.target.value))}>
          <option value="All">All</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>

        <span className="filter-count">{filtered.length} results</span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div className="tracker-view-toggle">
            <button className={`tracker-toggle-btn${view === "table" ? " active" : ""}`} onClick={() => setView("table")}>
              <List size={15} /> Table
            </button>
            <button className={`tracker-toggle-btn${view === "kanban" ? " active" : ""}`} onClick={() => setView("kanban")}>
              <LayoutGrid size={15} /> Kanban
            </button>
          </div>
          <button className="btn-secondary" style={{ gap: 6, fontSize: 12 }} onClick={resetAll}>
            <RotateCcw size={13} /> Reset All
          </button>
        </div>
      </div>

      {/* Table view */}
      {view === "table" && (
        <div className="ent-card">
          <div className="ent-card-header">
            <div>
              <div className="ent-card-title">Execution Tracker — Release 2508</div>
              <div className="ent-card-subtitle">Update test case status as execution progresses · auto-saved</div>
            </div>
          </div>
          <div className="ent-table-wrap">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Test Case</th>
                  <th>Area</th>
                  <th>Risk</th>
                  <th>Inclusion</th>
                  <th>Hotfix</th>
                  <th style={{ minWidth: 160 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map(tc => {
                  const st = getStatus(tc.testcaseIdentifier);
                  const cfg = STATUS_CONFIG[st];
                  return (
                    <tr key={tc.testcaseIdentifier}>
                      <td style={{ color: "#556b82", fontWeight: 500 }}>{tc.rank ?? "—"}</td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: 12 }} title={tc.testcaseAutomateConfigurationName}>
                          {trunc(tc.testcaseAutomateConfigurationName, 36)}
                        </span>
                      </td>
                      <td><span className="badge badge-blue">{tc.area}</span></td>
                      <td><span className={riskClass(tc.risk_score)}>{riskLabel(tc.risk_score)}</span></td>
                      <td>
                        <span className={
                          tc.inclusion_reason === "L1: Changed Objects" ? "badge badge-red" :
                          tc.inclusion_reason === "L1: Business Critical" ? "badge badge-orange" : "badge badge-blue"
                        } style={{ fontSize: 11 }}>{tc.inclusion_reason}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {tc.touches_hotfix_objects === 1
                          ? <span className="badge badge-red">Yes</span>
                          : <span style={{ color: "#556b82" }}>—</span>}
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={st}
                          style={{ color: cfg.color, borderColor: cfg.color }}
                          onChange={e => updateStatus(tc.testcaseIdentifier, e.target.value as ExecStatus)}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
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
                  <button key={p} className={`page-btn${p === page ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ) : null;
              })}
              <button className="page-btn" disabled={page === pageCount || pageCount === 0} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
              <button className="page-btn" disabled={page === pageCount || pageCount === 0} onClick={() => setPage(pageCount)}>»</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const cfg   = STATUS_CONFIG[col];
            const cards = proposed.filter(t => {
              const st = getStatus(t.testcaseIdentifier);
              if (st !== col) return false;
              if (areaFilter !== "All" && t.area !== areaFilter) return false;
              if (search) {
                const q = search.toLowerCase();
                if (!t.testcaseAutomateConfigurationName.toLowerCase().includes(q) &&
                    !t.testplanName.toLowerCase().includes(q)) return false;
              }
              return true;
            });
            // For not-started, also show unset (not in statuses map)
            const notStartedCards = col === "not-started"
              ? proposed.filter(t => {
                  if (getStatus(t.testcaseIdentifier) !== "not-started") return false;
                  if (areaFilter !== "All" && t.area !== areaFilter) return false;
                  if (search) {
                    const q = search.toLowerCase();
                    if (!t.testcaseAutomateConfigurationName.toLowerCase().includes(q) &&
                        !t.testplanName.toLowerCase().includes(q)) return false;
                  }
                  return true;
                })
              : cards;
            const displayCards = col === "not-started" ? notStartedCards : cards;

            return (
              <div key={col} className="kanban-col">
                <div className="kanban-col-header" style={{ borderTopColor: cfg.colColor }}>
                  <span className="kanban-col-title">{cfg.label}</span>
                  <span className="badge" style={{ background: cfg.colColor + "22", color: cfg.color, fontSize: 11 }}>
                    {counts[col]}
                  </span>
                </div>
                <div className="kanban-col-body">
                  {displayCards.length === 0 && (
                    <div className="kanban-empty">No cases</div>
                  )}
                  {displayCards.map(tc => (
                    <div key={tc.testcaseIdentifier} className="kanban-card">
                      <div className="kanban-card-name" title={tc.testcaseAutomateConfigurationName}>
                        {trunc(tc.testcaseAutomateConfigurationName, 28)}
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        <span className="badge badge-blue" style={{ fontSize: 10 }}>{tc.area}</span>
                        <span className={riskClass(tc.risk_score)} style={{ fontSize: 10 }}>{riskLabel(tc.risk_score)}</span>
                        {tc.touches_hotfix_objects === 1 && (
                          <span className="badge badge-red" style={{ fontSize: 10 }}>Hotfix</span>
                        )}
                      </div>
                      <select
                        className="status-select"
                        value={getStatus(tc.testcaseIdentifier)}
                        style={{ color: cfg.color, borderColor: cfg.colColor, marginTop: 8, width: "100%" }}
                        onChange={e => updateStatus(tc.testcaseIdentifier, e.target.value as ExecStatus)}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExecutionTracker;
