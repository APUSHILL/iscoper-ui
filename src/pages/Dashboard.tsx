import React, { useState } from "react";
import { TestCase } from "../types";
import {
  FileText, Zap, Settings, Shield, Briefcase,
  TrendingUp, TrendingDown, MoreVertical, CheckCircle, ChevronRight, X,
  Activity, Target, AlertTriangle,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar,
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

/* ── Domain Deep-Dive Modal ── */
interface DomainModalProps {
  area: string; cases: TestCase[];
  stats: { total: number; proposed: number; hotfix: number };
  color: string; onClose: () => void;
}
const DomainModal: React.FC<DomainModalProps> = ({ area, cases, stats, color, onClose }) => {
  const sorted  = [...cases].sort((a, b) => b.risk_score - a.risk_score);
  const avgRisk = cases.length > 0 ? cases.reduce((s, t) => s + t.risk_score, 0) / cases.length : 0;
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
            { val: stats.total,                         label: "Suite Total",       c: undefined },
            { val: cases.length,                        label: "Proposed",          c: color },
            { val: stats.hotfix,                        label: "Hotfix-Prone",      c: "#aa0808" },
            { val: highRisk,                            label: "High Risk (≥0.7)",  c: highRisk > 0 ? "#aa0808" : "#256f3a" },
            { val: `${(avgRisk * 100).toFixed(1)}%`,    label: "Avg Risk Score",    c: undefined },
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
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: 12 }} title={tc.testcaseAutomateConfigurationName}>
                      {trunc(tc.testcaseAutomateConfigurationName, 38)}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "#556b82" }}>{tc.subArea || "—"}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div className="risk-bar-wrap" style={{ minWidth: 80 }}>
                        <div className="risk-bar-fill" style={{ width: `${(tc.risk_score * 100).toFixed(1)}%`, background: tc.risk_score >= 0.7 ? "#aa0808" : tc.risk_score >= 0.4 ? "#e76500" : "#256f3a" }} />
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
                  <td style={{ textAlign: "center" }}>
                    {tc.touches_hotfix_objects === 1 ? <span className="badge badge-red">Yes</span> : <span style={{ color: "#556b82" }}>—</span>}
                  </td>
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

/* ── KPI Card ── */
const KpiCard: React.FC<{
  label: string; value: string; trend: string; trendUp: boolean;
  vs?: string; icon: React.ReactNode; iconBg: string; accentColor: string;
}> = ({ label, value, trend, trendUp, vs = "vs 2407", icon, iconBg, accentColor }) => (
  <div className="kpi-card-v2" style={{ "--accent": accentColor } as React.CSSProperties}>
    <div className="kpi-card-v2-accent" />
    <div className="kpi-card-v2-inner">
      <div className="kpi-icon-wrap-v2" style={{ background: iconBg }}>{icon}</div>
      <div className="kpi-label-v2">{label}</div>
      <div className="kpi-value-v2">{value}</div>
      <div className={`kpi-trend-v2 ${trendUp ? "up" : "down"}`}>
        {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{trend}</span>
        <span className="kpi-vs-v2">{vs}</span>
      </div>
    </div>
  </div>
);

/* ── Stat Pill ── */
const StatPill: React.FC<{ label: string; value: string; color: string; bg: string }> =
  ({ label, value, color, bg }) => (
    <div className="stat-pill" style={{ background: bg, borderColor: color + "33" }}>
      <span className="stat-pill-val" style={{ color }}>{value}</span>
      <span className="stat-pill-label">{label}</span>
    </div>
  );

/* ── Custom Donut Center Label ── */
const DonutCenter: React.FC<{ cx: number; cy: number; value: string; sub: string }> =
  ({ cx, cy, value, sub }) => (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 22, fontWeight: 700, fill: "#131e29" }}>{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 11, fill: "#556b82" }}>{sub}</text>
    </g>
  );

/* ── Main Dashboard ── */
const Dashboard: React.FC<Props> = ({ total, proposed }) => {
  const [domainModal, setDomainModal] = useState<string | null>(null);

  const skip         = total.length - proposed.length;
  const hotfixTotal  = total.filter(t => t.touches_hotfix_objects === 1).length;
  const hotfixProp   = proposed.filter(t => t.touches_hotfix_objects === 1).length;
  const recall       = hotfixTotal > 0 ? hotfixProp / hotfixTotal : 0;
  const biz          = proposed.filter(t => t.inclusion_reason === "L1: Business Critical").length;
  const l1           = proposed.filter(t => t.inclusion_reason === "L1: Changed Objects").length;
  const reductionPct = ((skip / total.length) * 100).toFixed(1);
  const proposedPct  = ((proposed.length / total.length) * 100).toFixed(1);

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

  const inclusionData = [
    { name: "Changed Objects",    value: l1,                                  fill: "#aa0808" },
    { name: "Business Critical",  value: biz,                                 fill: "#e76500" },
    { name: "TopK AI Risk",       value: proposed.length - l1 - biz,          fill: "#0070f2" },
  ];

  const sortedAreas = Object.entries(areaMap).sort((a, b) => b[1].total - a[1].total);

  const radialData = [{ name: "Proposed", value: parseFloat(proposedPct), fill: "#0070f2" }];

  return (
    <div className="page-content">

      {/* ── Hero Banner ── */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-hero-eyebrow">
            <Activity size={14} />
            Release 2508 · AI Scope Optimization
          </div>
          <div className="dash-hero-headline">
            AI reduced your test scope by <span className="dash-hero-highlight">{reductionPct}%</span>
          </div>
          <div className="dash-hero-sub">
            {proposed.length.toLocaleString()} test cases recommended out of {total.length.toLocaleString()} total &nbsp;·&nbsp;
            {(recall * 100).toFixed(0)}% hotfix recall &nbsp;·&nbsp; {skip.toLocaleString()} safe to skip
          </div>
          <div className="dash-hero-pills">
            <StatPill label="Changed Objects"   value={String(l1)}   color="#aa0808" bg="#ffeaf4" />
            <StatPill label="TopK AI Risk"      value={String(proposed.length - l1 - biz)} color="#0070f2" bg="#e8f0fc" />
            <StatPill label="Business Critical" value={String(biz)}  color="#e76500" bg="#fff8d6" />
          </div>
        </div>
        <div className="dash-hero-right">
          <div className="dash-hero-radial-wrap">
            <ResponsiveContainer width={160} height={160}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
                data={radialData} startAngle={90} endAngle={90 - 360 * parseFloat(proposedPct) / 100}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#eaecee" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="dash-hero-radial-center">
              <div className="dash-hero-radial-val">{proposedPct}%</div>
              <div className="dash-hero-radial-sub">Proposed</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid-v2">
        <KpiCard label="Total Test Cases"   value={total.length.toLocaleString()}
          trend="12.4%" trendUp={true} accentColor="#0070f2"
          icon={<FileText size={20} color="#0070f2" />} iconBg="#e8f0fc" />
        <KpiCard label="AI Proposed TCs"    value={proposed.length.toLocaleString()}
          trend="8.1%" trendUp={true} accentColor="#e76500"
          icon={<Zap size={20} color="#e76500" />} iconBg="#fff8d6" />
        <KpiCard label="Scope Reduction"    value={`${reductionPct}%`}
          trend="5.6%" trendUp={true} accentColor="#256f3a"
          icon={<Target size={20} color="#256f3a" />} iconBg="#f5fae5" />
        <KpiCard label="Safe to Skip"       value={skip.toLocaleString()}
          trend="18.3%" trendUp={true} accentColor="#6c32a0"
          icon={<Shield size={20} color="#6c32a0" />} iconBg="#f3eefa" />
        <KpiCard label="Hotfix Recall"      value={`${(recall * 100).toFixed(0)}%`}
          trend="2.3%" trendUp={true} accentColor="#256f3a"
          icon={<AlertTriangle size={20} color="#256f3a" />} iconBg="#f5fae5" />
        <KpiCard label="Business Critical"  value={biz.toLocaleString()}
          trend="2.1%" trendUp={false} accentColor="#aa0808"
          icon={<Briefcase size={20} color="#aa0808" />} iconBg="#ffeaf4" />
      </div>

      {/* ── Charts row ── */}
      <div className="analytics-grid-3">

        {/* Donut: TC Distribution */}
        <div className="ent-card">
          <div className="ent-card-header">
            <div>
              <div className="ent-card-title">TC Distribution</div>
              <div className="ent-card-subtitle">Hotfix vs non-hotfix</div>
            </div>
            <button className="ent-card-menu"><MoreVertical size={16} /></button>
          </div>
          <div className="ent-card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={distData} cx="50%" cy="50%"
                  innerRadius={62} outerRadius={90}
                  dataKey="value" startAngle={90} endAngle={-270}
                  strokeWidth={3} stroke="#fff"
                >
                  {distData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <DonutCenter cx={0} cy={0}
                  value={total.length.toLocaleString()}
                  sub="Total TCs" />
                <Tooltip contentStyle={{ border: "1px solid #d9d9d9", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any) => [typeof v === "number" ? v.toLocaleString() : v]} />
                <Legend layout="vertical" align="right" verticalAlign="middle"
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value, entry: any) => (
                    <span>
                      <span style={{ fontWeight: 600, color: "#131e29", display: "block" }}>{value}</span>
                      <span style={{ color: "#556b82" }}>
                        {entry.payload.value.toLocaleString()} ({((entry.payload.value / total.length) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  )} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar: Complexity */}
        <div className="ent-card">
          <div className="ent-card-header">
            <div>
              <div className="ent-card-title">Complexity Tiers</div>
              <div className="ent-card-subtitle">Proposed TCs by complexity</div>
            </div>
            <button className="ent-card-menu"><MoreVertical size={16} /></button>
          </div>
          <div className="ent-card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={complexityData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#eaecee" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#556b82" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#556b82" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: "1px solid #d9d9d9", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any) => [String(v), "Test Cases"]} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {complexityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar: Inclusion Breakdown */}
        <div className="ent-card">
          <div className="ent-card-header">
            <div>
              <div className="ent-card-title">Inclusion Breakdown</div>
              <div className="ent-card-subtitle">How TCs were selected</div>
            </div>
            <button className="ent-card-menu"><MoreVertical size={16} /></button>
          </div>
          <div className="ent-card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={inclusionData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#eaecee" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#556b82" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#556b82" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: "1px solid #d9d9d9", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any) => [String(v), "Test Cases"]} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {inclusionData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Scope Summary + Model Info ── */}
      <div className="analytics-grid-2" style={{ marginBottom: 24 }}>

        {/* Scope Summary */}
        <div className="ent-card">
          <div className="ent-card-header">
            <div>
              <div className="ent-card-title">Scope Optimization</div>
              <div className="ent-card-subtitle">AI scope reduction summary</div>
            </div>
          </div>
          <div className="ent-card-body">
            <div className="scope-stat-grid">
              {[
                { label: "Original Scope",     val: `${total.length.toLocaleString()} TCs`,      color: "#131e29" },
                { label: "AI Proposed",         val: `${proposed.length.toLocaleString()} TCs`,   color: "#0070f2" },
                { label: "Safe to Skip",        val: `${skip.toLocaleString()} TCs`,              color: "#6c32a0" },
                { label: "Scope Reduction",     val: `${reductionPct}%`,                          color: "#256f3a" },
                { label: "Hotfix TCs (Total)",  val: String(hotfixTotal),                         color: "#e76500" },
                { label: "Hotfix TCs Caught",   val: `${hotfixProp} / ${hotfixTotal}`,            color: "#256f3a" },
                { label: "Hotfix Recall",        val: `${(recall * 100).toFixed(0)}%`,             color: "#256f3a" },
                { label: "Defects Missed",      val: String(hotfixTotal - hotfixProp),            color: hotfixTotal - hotfixProp > 0 ? "#aa0808" : "#256f3a" },
              ].map(({ label, val, color }) => (
                <div key={label} className="scope-stat-item">
                  <div className="scope-stat-label">{label}</div>
                  <div className="scope-stat-val" style={{ color }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: "#556b82" }}>Proposed vs Full Suite</span>
                <span style={{ fontWeight: 700, color: "#0070f2" }}>{proposedPct}%</span>
              </div>
              <div className="scope-progress-bar">
                <div className="scope-progress-fill" style={{ width: `${proposedPct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#b3b3b3" }}>
                <span>0</span>
                <span>{proposed.length.toLocaleString()} / {total.length.toLocaleString()}</span>
                <span>{total.length.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Info */}
        <div className="ent-card">
          <div className="ent-card-header">
            <div>
              <div className="ent-card-title">Model Overview</div>
              <div className="ent-card-subtitle">Release 2508 AI ensemble configuration</div>
            </div>
          </div>
          <div className="ent-card-body">
            <div className="model-info-grid">
              {[
                ["Data Source",       "total_scope_2508.json"],
                ["Model Type",        "Domain Ensemble (RF + GBM)"],
                ["Domains Covered",   String(Object.keys(areaMap).length)],
                ["Training Release",  "2502"],
                ["Prediction Target", "2508"],
                ["Features Used",     "24 stable features"],
                ["FN Penalty",        "4× – 12× (domain-adaptive)"],
                ["Threshold",         "3rd percentile / TopK 50%"],
              ].map(([k, v]) => (
                <div key={k} className="model-info-row">
                  <span className="model-info-key">{k}</span>
                  <span className="model-info-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Domain Breakdown ── */}
      <div className="dash-section-header">
        <div className="dash-section-line" />
        <div className="dash-section-text">
          <div className="dash-section-title">Domain Breakdown</div>
          <div className="dash-section-sub">Click any domain card to view all proposed test cases</div>
        </div>
      </div>

      <div className="domain-grid-v2">
        {sortedAreas.map(([area, s]) => {
          const redPct   = ((s.total - s.proposed) / s.total * 100).toFixed(0);
          const scopePct = ((s.proposed / s.total) * 100).toFixed(1);
          const hotPct   = s.total > 0 ? ((s.hotfix / s.total) * 100).toFixed(0) : "0";
          const color    = AREA_COLORS[area] || "#131e29";
          return (
            <div key={area} className="domain-card-v2" style={{ "--area-color": color } as React.CSSProperties}
              onClick={() => setDomainModal(area)}>
              <div className="domain-card-v2-top">
                <div className="domain-card-v2-accent" style={{ background: color }} />
                <div className="domain-card-v2-header">
                  <span className="domain-card-v2-name">{area}</span>
                  <span className="domain-card-v2-reduction" style={{ color, background: color + "18" }}>
                    ↓{redPct}%
                  </span>
                </div>
                <div className="domain-card-v2-stats">
                  <div className="domain-stat">
                    <span className="domain-stat-val">{s.total}</span>
                    <span className="domain-stat-label">Total</span>
                  </div>
                  <div className="domain-stat">
                    <span className="domain-stat-val" style={{ color }}>{s.proposed}</span>
                    <span className="domain-stat-label">Proposed</span>
                  </div>
                  <div className="domain-stat">
                    <span className="domain-stat-val" style={{ color: s.hotfix > 0 ? "#aa0808" : "#556b82" }}>{s.hotfix}</span>
                    <span className="domain-stat-label">Hotfix</span>
                  </div>
                </div>
              </div>
              <div className="domain-card-v2-bottom">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}>
                  <span style={{ color: "#556b82" }}>Scope coverage</span>
                  <span style={{ fontWeight: 700, color }}>{scopePct}%</span>
                </div>
                <div className="domain-progress-bar-v2">
                  <div className="domain-progress-fill-v2" style={{ width: `${scopePct}%`, background: color }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#556b82" }}>
                    {s.hotfix > 0 && <span style={{ color: "#aa0808", fontWeight: 600 }}>⚠ {hotPct}% hotfix</span>}
                    {s.hotfix === 0 && <span style={{ color: "#256f3a" }}>✓ No hotfix</span>}
                  </span>
                  <span className="domain-card-v2-cta">
                    Details <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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
