import React from "react";
import { TestCase } from "../types";

interface Props { total: TestCase[]; proposed: TestCase[] }

const modelConfig = [
  { domain: "DSC",        model: "RF + GBM",  penalty: "4×",  weights: "50% / 30% / 20%", thr: "3rd percentile" },
  { domain: "FIN",        model: "RF + GBM",  penalty: "8×",  weights: "20% / 60% / 20%", thr: "3rd percentile" },
  { domain: "SD",         model: "RF + GBM",  penalty: "12×", weights: "10% / 70% / 20%", thr: "3rd percentile" },
  { domain: "All others", model: "Global RF", penalty: "6×",  weights: "—  / —  / 100%",  thr: "TopK 50%" },
];

const ReleaseHistory: React.FC<Props> = ({ total, proposed }) => {
  const hotfixTotal  = total.filter(t => t.touches_hotfix_objects === 1).length;
  const hotfixProp   = proposed.filter(t => t.touches_hotfix_objects === 1).length;
  const skip         = total.length - proposed.length;
  const reductionPct = ((skip / total.length) * 100).toFixed(1);
  const recall       = hotfixTotal > 0 ? ((hotfixProp / hotfixTotal) * 100).toFixed(1) : "—";

  const l1Count  = proposed.filter(t => t.inclusion_reason === "L1: Changed Objects").length;
  const topkCount = proposed.filter(t => t.inclusion_reason === "TopK: AI Risk").length;
  const bizCount  = proposed.filter(t => t.inclusion_reason === "L1: Business Critical").length;

  const kpis = [
    { label: "Total Test Cases",   val: total.length.toLocaleString(),    sub: "Full suite · Release 2508" },
    { label: "AI Proposed Scope",  val: proposed.length.toLocaleString(), sub: `${reductionPct}% reduction` },
    { label: "Hotfix Recall",      val: `${recall}%`,                     sub: `${hotfixProp} / ${hotfixTotal} caught` },
    { label: "Safe to Skip",       val: skip.toLocaleString(),            sub: "Tests safely excluded" },
  ];

  return (
    <div className="page-content">

      {/* KPI strip */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <div className="kpi-value" style={{ fontSize: 26 }}>{k.val}</div>
            <div className="kpi-label">{k.label}</div>
            <div style={{ fontSize: 11, color: "#8996A9" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Release record */}
      <div className="ent-card" style={{ marginBottom: 16 }}>
        <div className="ent-card-header">
          <div>
            <div className="ent-card-title">Release 2508 — Scope Summary</div>
            <div className="ent-card-subtitle">AI-proposed scope for the current active release</div>
          </div>
          <span className="badge badge-blue" style={{ fontSize: 12 }}>Active</span>
        </div>
        <div className="ent-table-wrap">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Release</th>
                <th>Total TCs</th>
                <th>AI Proposed</th>
                <th>Scope Reduction</th>
                <th>Hotfix-Prone TCs</th>
                <th>Hotfix Recall</th>
                <th>Safe to Skip</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="selected">
                <td style={{ fontWeight: 700 }}>2508</td>
                <td>{total.length.toLocaleString()}</td>
                <td>{proposed.length.toLocaleString()}</td>
                <td><span className="badge badge-green">{reductionPct}%</span></td>
                <td>{hotfixTotal}</td>
                <td><span className="badge badge-green">{recall}%</span></td>
                <td>{skip.toLocaleString()}</td>
                <td><span className="badge badge-orange">Pending Execution</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Inclusion breakdown */}
      <div className="ent-card" style={{ marginBottom: 16 }}>
        <div className="ent-card-header">
          <div>
            <div className="ent-card-title">AI Inclusion Breakdown — Release 2508</div>
            <div className="ent-card-subtitle">How test cases were selected into the proposed scope</div>
          </div>
        </div>
        <div className="ent-table-wrap">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Inclusion Reason</th>
                <th>Test Cases</th>
                <th>% of Proposed</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { reason: "L1: Changed Objects",   count: l1Count,   desc: "Test cases covering changed ABAP objects in this release" },
                { reason: "TopK: AI Risk",          count: topkCount, desc: "Top 50% highest-risk test cases ranked by ML model" },
                { reason: "L1: Business Critical",  count: bizCount,  desc: "Mandatory tests flagged as business-critical" },
              ].map(row => (
                <tr key={row.reason}>
                  <td>
                    <span className={
                      row.reason.includes("Changed") ? "badge badge-red" :
                      row.reason.includes("Critical") ? "badge badge-orange" : "badge badge-blue"
                    }>
                      {row.reason}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{row.count.toLocaleString()}</td>
                  <td>
                    <span className="badge badge-green">
                      {proposed.length > 0 ? ((row.count / proposed.length) * 100).toFixed(1) : "0"}%
                    </span>
                  </td>
                  <td style={{ color: "#8996A9", fontSize: 12 }}>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model configuration */}
      <div className="ent-card">
        <div className="ent-card-header">
          <div>
            <div className="ent-card-title">Model Configuration — Release 2508</div>
            <div className="ent-card-subtitle">Domain-specific ensemble weights and classification thresholds</div>
          </div>
        </div>
        <div className="ent-table-wrap">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Primary Model</th>
                <th>FN Penalty</th>
                <th>Weights (RF / GB / Global)</th>
                <th>Threshold</th>
              </tr>
            </thead>
            <tbody>
              {modelConfig.map(r => (
                <tr key={r.domain}>
                  <td><span className="badge badge-blue">{r.domain}</span></td>
                  <td style={{ fontWeight: 500 }}>{r.model}</td>
                  <td><span className="badge badge-red">{r.penalty}</span></td>
                  <td><code style={{ fontFamily: "monospace", fontSize: 12 }}>{r.weights}</code></td>
                  <td style={{ color: "#8996A9", fontSize: 12 }}>{r.thr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ReleaseHistory;
