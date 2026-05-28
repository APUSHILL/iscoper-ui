import React, { useState } from "react";
import { TestCase } from "../types";
import {
  X, ChevronRight, TrendingDown, TrendingUp,
  Layers, Cpu, ShieldCheck, Flame, BarChart3, Circle,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface Props { total: TestCase[]; proposed: TestCase[] }

const AREA_COLORS: Record<string, string> = {
  DSC:"#0070f2", FIN:"#256f3a", SD:"#e76500", EWM:"#6c32a0",
  SPEND_MNGT:"#aa0808", FND:"#0a6a8a", CLD_FND:"#354a5e",
  S4C:"#c35500", TRADE:"#364794", EPPM:"#0d6d5e", IDEA_PLM:"#6d1f8a", TM:"#1a5c2e",
};

function riskLabel(s: number) { return s >= 0.7 ? "High" : s >= 0.4 ? "Medium" : "Low"; }
function riskClass(s: number) { return s >= 0.7 ? "badge badge-red" : s >= 0.4 ? "badge badge-orange" : "badge badge-green"; }
function trunc(s: string, n = 32) { return s.length > n ? s.slice(0, n) + "…" : s; }

/* ── Domain Deep-Dive Modal (unchanged logic) ── */
interface DomainModalProps {
  area: string; cases: TestCase[];
  stats: { total: number; proposed: number; hotfix: number };
  color: string; onClose: () => void;
}
const DomainModal: React.FC<DomainModalProps> = ({ area, cases, stats, color, onClose }) => {
  const sorted   = [...cases].sort((a, b) => b.risk_score - a.risk_score);
  const avgRisk  = cases.length > 0 ? cases.reduce((s, t) => s + t.risk_score, 0) / cases.length : 0;
  const highRisk = cases.filter(t => t.risk_score >= 0.7).length;
  return (
    <div className="domain-modal-overlay" onClick={onClose}>
      <div className="domain-modal" onClick={e => e.stopPropagation()}>
        <div className="domain-modal-header">
          <div>
            <div className="domain-modal-title" style={{ color }}>{area} — Domain Deep-Dive</div>
            <div className="domain-modal-sub">Proposed test cases sorted by risk score</div>
          </div>
          <button className="domain-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="domain-modal-kpis">
          {[
            { val: stats.total,                       label: "Suite Total",      c: undefined },
            { val: cases.length,                      label: "Proposed",         c: color },
            { val: stats.hotfix,                      label: "Hotfix-Prone",     c: "#aa0808" },
            { val: highRisk,                          label: "High Risk (≥0.7)", c: highRisk > 0 ? "#aa0808" : "#256f3a" },
            { val: `${(avgRisk*100).toFixed(1)}%`,    label: "Avg Risk Score",   c: undefined },
          ].map(({ val, label, c }) => (
            <div key={label} className="domain-modal-kpi">
              <div className="domain-modal-kpi-val" style={c ? { color: c } : {}}>{val}</div>
              <div className="domain-modal-kpi-label">{label}</div>
            </div>
          ))}
        </div>
        <div className="domain-modal-body">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Rank</th><th>Test Case</th><th>Sub Area</th>
                <th>Risk Score</th><th>Risk</th><th>Inclusion</th><th>Hotfix</th><th>Complexity</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(tc => (
                <tr key={tc.testcaseIdentifier}>
                  <td style={{ color: "#556b82", fontWeight: 500 }}>{tc.rank ?? "—"}</td>
                  <td><span style={{ fontFamily: "monospace", fontSize: 12 }} title={tc.testcaseAutomateConfigurationName}>{trunc(tc.testcaseAutomateConfigurationName, 38)}</span></td>
                  <td style={{ fontSize: 12, color: "#556b82" }}>{tc.subArea || "—"}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div className="risk-bar-wrap" style={{ minWidth: 80 }}>
                        <div className="risk-bar-fill" style={{ width: `${(tc.risk_score*100).toFixed(1)}%`, background: tc.risk_score >= 0.7 ? "#aa0808" : tc.risk_score >= 0.4 ? "#e76500" : "#256f3a" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#556b82", minWidth: 40 }}>{tc.risk_score.toFixed(3)}</span>
                    </div>
                  </td>
                  <td><span className={riskClass(tc.risk_score)}>{riskLabel(tc.risk_score)}</span></td>
                  <td>
                    <span className={tc.inclusion_reason === "L1: Changed Objects" ? "badge badge-red" : tc.inclusion_reason === "L1: Business Critical" ? "badge badge-orange" : "badge badge-blue"} style={{ fontSize: 11 }}>
                      {tc.inclusion_reason}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{tc.touches_hotfix_objects === 1 ? <span className="badge badge-red">Yes</span> : <span style={{ color: "#556b82" }}>—</span>}</td>
                  <td style={{ textAlign: "center" }}>{tc.Complexity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ── Main Dashboard ── */
const Dashboard: React.FC<Props> = ({ total, proposed }) => {
  const [domainModal, setDomainModal] = useState<string | null>(null);

  const skip         = total.length - proposed.length;
  const hotfixTotal  = total.filter(t => t.touches_hotfix_objects === 1).length;
  const hotfixProp   = proposed.filter(t => t.touches_hotfix_objects === 1).length;
  const recall       = hotfixTotal > 0 ? hotfixProp / hotfixTotal : 0;
  const biz          = proposed.filter(t => t.inclusion_reason === "L1: Business Critical").length;
  const l1           = proposed.filter(t => t.inclusion_reason === "L1: Changed Objects").length;
  const topk         = proposed.length - l1 - biz;
  const reductionPct = ((skip / total.length) * 100).toFixed(1);
  const proposedPct  = ((proposed.length / total.length) * 100).toFixed(1);
  const recallPct    = (recall * 100).toFixed(0);

  const areaMap: Record<string, { total: number; proposed: number; hotfix: number }> = {};
  total.forEach(t => {
    if (!areaMap[t.area]) areaMap[t.area] = { total: 0, proposed: 0, hotfix: 0 };
    areaMap[t.area].total++;
    if (t.touches_hotfix_objects === 1) areaMap[t.area].hotfix++;
  });
  proposed.forEach(t => { if (areaMap[t.area]) areaMap[t.area].proposed++; });

  const proposedByArea: Record<string, TestCase[]> = {};
  proposed.forEach(t => {
    if (!proposedByArea[t.area]) proposedByArea[t.area] = [];
    proposedByArea[t.area].push(t);
  });

  const sortedAreas = Object.entries(areaMap).sort((a, b) => b[1].total - a[1].total);

  const distData = [
    { name: "Hotfix-Negative", value: total.length - hotfixTotal, color: "#256f3a" },
    { name: "Hotfix-Positive", value: hotfixTotal,                color: "#e76500" },
  ];

  const complexityData = (() => {
    const low  = proposed.filter(t => t.Complexity <= 10).length;
    const med  = proposed.filter(t => t.Complexity > 10 && t.Complexity <= 30).length;
    const high = proposed.filter(t => t.Complexity > 30).length;
    return [
      { name: "Low",    value: low,  fill: "#256f3a" },
      { name: "Medium", value: med,  fill: "#e76500" },
      { name: "High",   value: high, fill: "#aa0808" },
    ];
  })();

  return (
    <div className="page-content" style={{ background: "#f0f2f5", minHeight: "100%" }}>

      {/* ── Command Strip ── */}
      <div className="cmd-strip">
        <div className="cmd-strip-brand">
          <div className="cmd-strip-release-tag">RELEASE 2508</div>
          <div className="cmd-strip-title">AI Scope Intelligence</div>
          <div className="cmd-strip-subtitle">Domain Ensemble · RF + GBM · 24 stable features</div>
        </div>

        <div className="cmd-strip-divider" />

        <div className="cmd-metric">
          <div className="cmd-metric-val">{total.length.toLocaleString()}</div>
          <div className="cmd-metric-label">Total Suite</div>
          <div className="cmd-metric-sub">full test scope</div>
        </div>

        <div className="cmd-strip-divider" />

        <div className="cmd-metric">
          <div className="cmd-metric-val" style={{ color: "#0070f2" }}>{proposed.length.toLocaleString()}</div>
          <div className="cmd-metric-label">AI Proposed</div>
          <div className="cmd-metric-sub">{proposedPct}% of suite</div>
        </div>

        <div className="cmd-strip-divider" />

        <div className="cmd-metric">
          <div className="cmd-metric-val" style={{ color: "#256f3a" }}>{reductionPct}%</div>
          <div className="cmd-metric-label">Scope Reduction</div>
          <div className="cmd-metric-sub">{skip.toLocaleString()} TCs safe to skip</div>
        </div>

        <div className="cmd-strip-divider" />

        <div className="cmd-metric">
          <div className="cmd-metric-val" style={{ color: recallPct === "100" ? "#256f3a" : "#e76500" }}>{recallPct}%</div>
          <div className="cmd-metric-label">Hotfix Recall</div>
          <div className="cmd-metric-sub">{hotfixProp}/{hotfixTotal} defect TCs caught</div>
        </div>

        <div className="cmd-strip-divider" />

        <div className="cmd-metric">
          <div className="cmd-metric-val" style={{ color: "#aa0808" }}>{hotfixTotal - hotfixProp}</div>
          <div className="cmd-metric-label">Defects Missed</div>
          <div className="cmd-metric-sub">
            {hotfixTotal - hotfixProp === 0
              ? <span style={{ color: "#256f3a" }}>✓ perfect recall</span>
              : "review recommended"}
          </div>
        </div>
      </div>

      {/* ── Insight Cards ── */}
      <div className="insight-row">
        <div className="insight-card">
          <div className="insight-card-icon" style={{ background: "#ffeaf4", color: "#aa0808" }}>
            <Flame size={20} />
          </div>
          <div className="insight-card-body">
            <div className="insight-card-val" style={{ color: "#aa0808" }}>{l1}</div>
            <div className="insight-card-label">Changed-Object TCs</div>
            <div className="insight-card-desc">Directly covering modified ABAP objects in this release</div>
          </div>
          <div className="insight-card-pct">{((l1 / proposed.length) * 100).toFixed(0)}%</div>
        </div>

        <div className="insight-card">
          <div className="insight-card-icon" style={{ background: "#e8f0fc", color: "#0070f2" }}>
            <Cpu size={20} />
          </div>
          <div className="insight-card-body">
            <div className="insight-card-val" style={{ color: "#0070f2" }}>{topk}</div>
            <div className="insight-card-label">TopK AI Risk TCs</div>
            <div className="insight-card-desc">Highest-risk cases ranked by ML ensemble model</div>
          </div>
          <div className="insight-card-pct">{((topk / proposed.length) * 100).toFixed(0)}%</div>
        </div>

        <div className="insight-card">
          <div className="insight-card-icon" style={{ background: "#fff8d6", color: "#e76500" }}>
            <ShieldCheck size={20} />
          </div>
          <div className="insight-card-body">
            <div className="insight-card-val" style={{ color: "#e76500" }}>{biz}</div>
            <div className="insight-card-label">Business-Critical TCs</div>
            <div className="insight-card-desc">Mandatory tests flagged by business criticality rules</div>
          </div>
          <div className="insight-card-pct">{((biz / proposed.length) * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* ── Main body: Scope Layer + Domain Table ── */}
      <div className="dash-main-grid">

        {/* Left: Scope layers + charts stacked */}
        <div className="dash-main-left">

          {/* Scope layer bar */}
          <div className="ent-card" style={{ marginBottom: 16 }}>
            <div className="ent-card-header">
              <div>
                <div className="ent-card-title">Scope Layers</div>
                <div className="ent-card-subtitle">Proposed vs skipped vs hotfix coverage</div>
              </div>
              <Layers size={16} style={{ color: "#556b82" }} />
            </div>
            <div className="ent-card-body">
              {/* Stacked visual bar */}
              <div className="scope-layer-bar-wrap">
                <div className="scope-layer-segment" style={{ width: `${(l1 / total.length * 100).toFixed(2)}%`, background: "#aa0808" }} title={`Changed Objects: ${l1}`} />
                <div className="scope-layer-segment" style={{ width: `${(biz / total.length * 100).toFixed(2)}%`, background: "#e76500" }} title={`Business Critical: ${biz}`} />
                <div className="scope-layer-segment" style={{ width: `${(topk / total.length * 100).toFixed(2)}%`, background: "#0070f2" }} title={`TopK AI: ${topk}`} />
                <div className="scope-layer-segment" style={{ flex: 1, background: "#eaecee" }} title={`Skipped: ${skip}`} />
              </div>
              <div className="scope-layer-legend">
                {[
                  { label: "Changed Objects",   val: l1,    color: "#aa0808", pct: (l1/total.length*100).toFixed(1) },
                  { label: "Business Critical",  val: biz,   color: "#e76500", pct: (biz/total.length*100).toFixed(1) },
                  { label: "TopK AI Risk",        val: topk,  color: "#0070f2", pct: (topk/total.length*100).toFixed(1) },
                  { label: "Safe to Skip",        val: skip,  color: "#b3b3b3", pct: (skip/total.length*100).toFixed(1) },
                ].map(({ label, val, color, pct }) => (
                  <div key={label} className="scope-layer-legend-item">
                    <span className="scope-layer-dot" style={{ background: color }} />
                    <span className="scope-layer-legend-label">{label}</span>
                    <span className="scope-layer-legend-val">{val.toLocaleString()}</span>
                    <span className="scope-layer-legend-pct">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Donut */}
            <div className="ent-card">
              <div className="ent-card-header">
                <div>
                  <div className="ent-card-title">TC Distribution</div>
                  <div className="ent-card-subtitle">Hotfix vs non-hotfix</div>
                </div>
              </div>
              <div className="ent-card-body" style={{ paddingTop: 4 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={distData} cx="50%" cy="48%"
                      innerRadius={55} outerRadius={80}
                      dataKey="value" startAngle={90} endAngle={-270}
                      strokeWidth={3} stroke="#f0f2f5"
                    >
                      {distData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: 18, fontWeight: 800, fill: "#131e29" }}>
                      {total.length.toLocaleString()}
                    </text>
                    <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: 10, fill: "#556b82" }}>
                      Total TCs
                    </text>
                    <Tooltip contentStyle={{ border: "1px solid #d9d9d9", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [typeof v === "number" ? v.toLocaleString() : v]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {distData.map(d => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "#556b82" }}>{d.name}</span>
                      <span style={{ fontWeight: 700, color: "#131e29" }}>{d.value.toLocaleString()}</span>
                      <span style={{ color: "#b3b3b3", minWidth: 36, textAlign: "right" }}>
                        {((d.value / total.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Complexity bar */}
            <div className="ent-card">
              <div className="ent-card-header">
                <div>
                  <div className="ent-card-title">Complexity Mix</div>
                  <div className="ent-card-subtitle">Proposed TCs by tier</div>
                </div>
              </div>
              <div className="ent-card-body" style={{ paddingTop: 4 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={complexityData} barCategoryGap="35%" margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaecee" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#556b82" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#556b82" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ border: "1px solid #d9d9d9", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [String(v), "TCs"]} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {complexityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {complexityData.map(d => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: d.fill, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "#556b82" }}>{d.name} complexity</span>
                      <span style={{ fontWeight: 700, color: "#131e29" }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Domain heatmap table */}
        <div className="dash-main-right">
          <div className="ent-card" style={{ height: "100%" }}>
            <div className="ent-card-header">
              <div>
                <div className="ent-card-title">Domain Risk Heatmap</div>
                <div className="ent-card-subtitle">Click a row to deep-dive into proposed TCs</div>
              </div>
              <BarChart3 size={16} style={{ color: "#556b82" }} />
            </div>
            <div className="ent-table-wrap">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Proposed</th>
                    <th>Reduction</th>
                    <th>Hotfix</th>
                    <th>Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAreas.map(([area, s]) => {
                    const color    = AREA_COLORS[area] || "#131e29";
                    const redPct   = ((s.total - s.proposed) / s.total * 100).toFixed(0);
                    const scopePct = ((s.proposed / s.total) * 100);
                    return (
                      <tr key={area} style={{ cursor: "pointer" }} onClick={() => setDomainModal(area)}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 3, height: 18, borderRadius: 999, background: color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#131e29" }}>{area}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color }}>{s.proposed}</span>
                          <span style={{ color: "#b3b3b3", fontSize: 11, marginLeft: 4 }}>/ {s.total}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "#256f3a", fontSize: 12 }}>↓{redPct}%</span>
                        </td>
                        <td>
                          {s.hotfix > 0
                            ? <span className="badge badge-red" style={{ fontSize: 10 }}>{s.hotfix}</span>
                            : <span style={{ color: "#256f3a", fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ minWidth: 110 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ flex: 1, height: 6, background: "#eaecee", borderRadius: 999, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${scopePct.toFixed(1)}%`, background: color, borderRadius: 999 }} />
                            </div>
                            <span style={{ fontSize: 10, color: "#556b82", minWidth: 30, textAlign: "right" }}>
                              {scopePct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Domain Cards Grid ── */}
      <div className="cc-section-header">
        <div className="cc-section-eyebrow">
          <Circle size={6} fill="#0070f2" color="#0070f2" />
          Domain Breakdown
        </div>
        <div className="cc-section-sub">Click any card for a full test-case deep-dive</div>
      </div>

      <div className="cc-domain-grid">
        {sortedAreas.map(([area, s]) => {
          const color    = AREA_COLORS[area] || "#131e29";
          const scopePct = ((s.proposed / s.total) * 100).toFixed(1);
          const redPct   = ((s.total - s.proposed) / s.total * 100).toFixed(0);
          const avgRisk  = proposedByArea[area]
            ? (proposedByArea[area].reduce((acc, t) => acc + t.risk_score, 0) / proposedByArea[area].length)
            : 0;
          return (
            <div key={area} className="cc-domain-card" onClick={() => setDomainModal(area)}>
              <div className="cc-domain-card-bar" style={{ background: color }} />
              <div className="cc-domain-card-inner">
                <div className="cc-domain-card-head">
                  <span className="cc-domain-name" style={{ color }}>{area}</span>
                  <span className="cc-domain-chip" style={{ background: color + "15", color }}>↓{redPct}%</span>
                </div>
                <div className="cc-domain-figures">
                  <div className="cc-domain-fig">
                    <span className="cc-domain-fig-val" style={{ color }}>{s.proposed}</span>
                    <span className="cc-domain-fig-label">proposed</span>
                  </div>
                  <div className="cc-domain-fig-div" />
                  <div className="cc-domain-fig">
                    <span className="cc-domain-fig-val">{s.total}</span>
                    <span className="cc-domain-fig-label">total</span>
                  </div>
                  <div className="cc-domain-fig-div" />
                  <div className="cc-domain-fig">
                    <span className="cc-domain-fig-val" style={{ color: s.hotfix > 0 ? "#aa0808" : "#256f3a" }}>
                      {s.hotfix}
                    </span>
                    <span className="cc-domain-fig-label">hotfix</span>
                  </div>
                </div>
                <div className="cc-domain-risk-row">
                  <span style={{ fontSize: 10, color: "#556b82" }}>Avg risk</span>
                  <div style={{ flex: 1, height: 4, background: "#eaecee", borderRadius: 999, overflow: "hidden", margin: "0 8px" }}>
                    <div style={{
                      height: "100%", borderRadius: 999,
                      width: `${(avgRisk * 100).toFixed(1)}%`,
                      background: avgRisk >= 0.7 ? "#aa0808" : avgRisk >= 0.4 ? "#e76500" : "#256f3a",
                    }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#131e29", minWidth: 28, textAlign: "right" }}>
                    {(avgRisk * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="cc-domain-prog-wrap">
                  <div className="cc-domain-prog-bar">
                    <div className="cc-domain-prog-fill" style={{ width: `${scopePct}%`, background: color }} />
                  </div>
                  <div className="cc-domain-card-footer">
                    <span style={{ fontSize: 10, color: "#556b82" }}>{scopePct}% coverage</span>
                    <span className="cc-domain-cta">Details <ChevronRight size={11} /></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Model Config strip ── */}
      <div className="cc-model-strip">
        {[
          { label: "Model",     val: "Domain Ensemble" },
          { label: "Algorithm", val: "RF + GBM" },
          { label: "Domains",   val: String(Object.keys(areaMap).length) },
          { label: "Features",  val: "24 stable" },
          { label: "Trained on", val: "Release 2502" },
          { label: "FN Penalty", val: "4×–12× adaptive" },
          { label: "Threshold",  val: "3rd pctile / TopK 50%" },
          { label: "PSI Cutoff", val: "> 0.25 excluded" },
        ].map(({ label, val }) => (
          <div key={label} className="cc-model-item">
            <span className="cc-model-label">{label}</span>
            <span className="cc-model-val">{val}</span>
          </div>
        ))}
      </div>

      {domainModal && (
        <DomainModal
          area={domainModal}
          cases={proposedByArea[domainModal] || []}
          stats={areaMap[domainModal] || { total: 0, proposed: 0, hotfix: 0 }}
          color={AREA_COLORS[domainModal] || "#131e29"}
          onClose={() => setDomainModal(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
