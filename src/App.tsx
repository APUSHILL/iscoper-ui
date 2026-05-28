import React, { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Target, BarChart2, AlertTriangle, History,
  Wrench, Bell, HelpCircle, Grid3x3, ChevronRight, Menu,
  CalendarDays, ChevronDown, ClipboardList,
} from "lucide-react";
import { Page, TestCase } from "./types";
import { loadTotalScope, loadProposedScope } from "./data/loader";
import Dashboard from "./pages/Dashboard";
import ScopeProposal from "./pages/ScopeProposal";
import ScopeComparison from "./pages/ScopeComparison";
import RiskAnalysis from "./pages/RiskAnalysis";
import ReleaseHistory from "./pages/ReleaseHistory";
import ExportReports from "./pages/ExportReports";
import ExecutionTracker from "./pages/ExecutionTracker";
import SmartSearch from "./components/SmartSearch";

interface NavItem { key: Page; label: string; icon: React.ReactNode; chevron?: boolean }

const NAV_OVERVIEW: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
];
const NAV_ANALYSIS: NavItem[] = [
  { key: "scope",      label: "Scope Proposal",    icon: <Target        size={18} strokeWidth={1.8} />, chevron: true  },
  { key: "comparison", label: "Scope Comparison",  icon: <BarChart2     size={18} strokeWidth={1.8} /> },
  { key: "risk",       label: "Risk Analysis",      icon: <AlertTriangle size={18} strokeWidth={1.8} /> },
  { key: "history",    label: "Release History",    icon: <History       size={18} strokeWidth={1.8} /> },
  { key: "tracker",    label: "Execution Tracker",  icon: <ClipboardList size={18} strokeWidth={1.8} /> },
];

const RELEASES = ["2508", "2602", "2608", "2702", "2708", "2802"];

const PAGE_TITLES: Record<Page, string> = {
  dashboard:  "Release Dashboard",
  scope:      "AI Scope Proposal",
  comparison: "Scope Comparison",
  risk:       "Risk Analysis",
  history:    "Release History",
  tools:      "Export & Reports",
  tracker:    "Execution Tracker",
};
const PAGE_SUBS: Record<Page, string> = {
  dashboard:  "AI-powered test scope optimization · Release 2508",
  scope:      "Proposed test cases for Release 2508",
  comparison: "Scope layers comparison · Release 2508",
  risk:       "Feature drift and domain risk · Release 2508",
  history:    "Model performance across releases",
  tools:      "Download test scope data and generate reports",
  tracker:    "Track execution status for Release 2508 · auto-saved",
};

const App: React.FC = () => {
  const [page, setPage]               = useState<Page>("dashboard");
  const [total, setTotal]             = useState<TestCase[]>([]);
  const [proposed, setProposed]       = useState<TestCase[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [release, setRelease]         = useState("2508");
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [unavailableRelease, setUnavailableRelease] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const releaseRef                    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([loadTotalScope(), loadProposedScope()])
      .then(([t, p]) => { setTotal(t); setProposed(p); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  // Cmd+K / Ctrl+K global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (releaseRef.current && !releaseRef.current.contains(e.target as Node)) {
        setReleaseOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="app-shell">

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>

        <div className="sidebar-logo-row">
          <button className="sidebar-hamburger" onClick={() => setSidebarCollapsed(c => !c)}><Menu size={20} /></button>
          {!sidebarCollapsed && <img src="/sap-logo.png" alt="SAP" className="sidebar-sap-logo" />}
          {!sidebarCollapsed && (
            <div className="sidebar-app-name">
              <span className="sidebar-app-name-top">AI enabled</span>
              <span className="sidebar-app-name-bottom">i-ScOper</span>
            </div>
          )}
        </div>

        <div className="sidebar-section">
          {!sidebarCollapsed && <div className="sidebar-section-label">Overview</div>}
          {NAV_OVERVIEW.map(n => (
            <button
              key={n.key}
              className={`sidebar-item${page === n.key ? " active" : ""}`}
              onClick={() => setPage(n.key)}
              title={sidebarCollapsed ? "Dashboard" : undefined}
            >
              <span className="item-icon">{n.icon}</span>
              {!sidebarCollapsed && <span className="item-label">Dashboard</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section">
          {!sidebarCollapsed && <div className="sidebar-section-label">Analysis</div>}
          {NAV_ANALYSIS.map(n => (
            <button
              key={n.key}
              className={`sidebar-item${page === n.key ? " active" : ""}`}
              onClick={() => setPage(n.key)}
              title={sidebarCollapsed ? n.label : undefined}
            >
              <span className="item-icon">{n.icon}</span>
              {!sidebarCollapsed && <span className="item-label">{n.label}</span>}
              {!sidebarCollapsed && n.chevron && <ChevronRight size={14} className="item-chevron" />}
            </button>
          ))}
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section">
          {!sidebarCollapsed && <div className="sidebar-section-label">Tools</div>}
          <button
            className={`sidebar-item${page === "tools" ? " active" : ""}`}
            onClick={() => setPage("tools")}
            title={sidebarCollapsed ? "Export & Reports" : undefined}
          >
            <span className="item-icon"><Wrench size={18} strokeWidth={1.8} /></span>
            {!sidebarCollapsed && <span className="item-label">Export &amp; Reports</span>}
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <div className="sidebar-footer">
          {!sidebarCollapsed ? (
            <div className="sidebar-release">
              <span className="sidebar-release-label">Release</span>
              <span className="sidebar-release-val">{release} ▾</span>
            </div>
          ) : (
            <div className="sidebar-release-collapsed" title={`Release ${release}`}>
              <CalendarDays size={16} />
            </div>
          )}
        </div>

      </aside>

      <div className="app-body-right">
        {/* ── Top Header ── */}
        <header className="top-header">
          <div className="top-header-left">
            <div className="breadcrumb-header">
              <a href="#/">Home</a>
              <span className="breadcrumb-sep">/</span>
              <span>{PAGE_TITLES[page]}</span>
            </div>
            <div className="top-header-title">{PAGE_TITLES[page]}</div>
            <div className="top-header-sub">{PAGE_SUBS[page]}</div>
          </div>

          <div className="top-header-spacer" />

          {/* Release dropdown */}
          <div className="release-dropdown-wrap" ref={releaseRef}>
            <button
              className={`release-dropdown-btn${releaseOpen ? " open" : ""}`}
              onClick={() => setReleaseOpen(o => !o)}
            >
              <CalendarDays size={15} strokeWidth={1.8} />
              <span>Release <strong>{release}</strong></span>
              <ChevronDown size={14} strokeWidth={2} className="release-chevron" />
            </button>
            {releaseOpen && (
              <div className="release-dropdown-menu">
                <div className="release-dropdown-label">Select Release</div>
                {RELEASES.map(r => (
                  <button
                    key={r}
                    className={`release-dropdown-item${r === release ? " active" : ""}`}
                    onClick={() => {
                      setReleaseOpen(false);
                      if (r === "2508") {
                        setRelease(r);
                      } else {
                        setUnavailableRelease(r);
                      }
                    }}
                  >
                    <CalendarDays size={13} strokeWidth={1.8} />
                    Release {r}
                    {r === release && <span className="release-dropdown-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="top-header-actions">
            <button className="cmd-k-hint" onClick={() => setSearchOpen(true)} title="Global search">
              <span>⌘K</span>
            </button>
            <button className="header-icon-btn" title="Notifications">
              <Bell size={18} />
              <span className="header-notif-badge">3</span>
            </button>
            <button className="header-icon-btn" title="Help">
              <HelpCircle size={18} />
            </button>
            <button className="header-icon-btn" title="App Launcher">
              <Grid3x3 size={18} />
            </button>
            <div className="header-avatar">VM</div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="app-main">
          {loading && (
            <div className="loading-wrap">
              <div className="spinner" />
              <span style={{ color: "#1D2D3E", fontWeight: 500 }}>Loading release data…</span>
              <span style={{ color: "#8996A9", fontSize: 13 }}>Fetching scope data for Release 2508</span>
            </div>
          )}
          {error && (
            <div className="page-content">
              <div className="warn-banner">⚠️ <strong>Error loading data:</strong> {error}</div>
            </div>
          )}
          {!loading && !error && (
            <>
              {page === "dashboard"  && <Dashboard  total={total} proposed={proposed} />}
              {page === "scope"      && <ScopeProposal proposed={proposed} />}
              {page === "comparison" && <ScopeComparison total={total} proposed={proposed} />}
              {page === "risk"       && <RiskAnalysis total={total} proposed={proposed} />}
              {page === "history"    && <ReleaseHistory total={total} proposed={proposed} />}
              {page === "tools"      && <ExportReports total={total} proposed={proposed} />}
              {page === "tracker"    && <ExecutionTracker proposed={proposed} />}
            </>
          )}
        </main>
      </div>

      {/* ── Smart Search ── */}
      {searchOpen && !loading && (
        <SmartSearch
          total={total}
          proposed={proposed}
          onClose={() => setSearchOpen(false)}
          onNavigate={(p) => { setPage(p); setSearchOpen(false); }}
        />
      )}

      {/* ── Data Unavailable Modal ── */}
      {unavailableRelease && (
        <div className="modal-overlay" onClick={() => setUnavailableRelease(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-icon-wrap">
              <CalendarDays size={32} strokeWidth={1.5} />
            </div>
            <div className="modal-title">Data Not Available</div>
            <div className="modal-body">
              Scope data for Release <strong>{unavailableRelease}</strong> has not been processed yet.
              Currently only <strong>Release 2508</strong> data is available.
            </div>
            <button className="modal-close-btn" onClick={() => setUnavailableRelease(null)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
