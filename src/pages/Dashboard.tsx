import React, { useState } from "react";
import { TestCase } from "../types";
import {
  FileText, Zap, Settings, Shield, Briefcase,
  TrendingUp, TrendingDown, MoreVertical, CheckCircle, ChevronRight, X,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
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

interface DomainModalProps {
  area: string;
  cases: TestCase[];
  stats: { total: number; proposed: number; hotfix: number };
  color: string;
  onClose: () => void;
}

const DomainModal: React.FC<DomainModalProps> = ({ area, cases, stats, color, onClose }) => {
  const sorted = [...cases].sort((a, b) => b.risk_score - a.risk_score);
  const avgRisk = cases.length > 0 ? cases.reduce((s, t) => s + t.risk_score, 0) / cases.length : 0;
  const highRisk = cases.filter(t => t.risk_score >= 0.7).length;

  return (
    <div className="domain-modal-overlay" onClick={onClose}>
      <div className="domain-modal" onClick={e => e.stopPropagation()}>
        <div className="domain-modal-header">
          <div>
            <div className="domain-modal-title" style={{ color }}>
              {area} — Domain Deep-Dive
            </div>
            <div className="domain-modal-sub">
              Proposed test cases sorted by risk score
            </div>
          </div>
          <button className="domain-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="domain-modal-kpis">
          <div className="domain-modal-kpi">
            <div className="domain-modal-kpi-val">{stats.total}</div>
            <div className="domain-modal-kpi-label">Suite Total</div>
          </div>
          <div className="domain-modal-kpi">
            <div className="domain-modal-kpi-val" style={{ color }}>{cases.length}</div>
            <div className="domain-modal-kpi-label">Proposed</div>
          </div>
          <div className="domain-modal-kpi">
            <div className="domain-modal-kpi-val" style={{ color: "#aa0808" }}>{stats.hotfix}</div>
            <div className="domain-modal-kpi-label">Hotfix-Prone</div>
          </div>
          <div className="domain-modal-kpi">
            <div className="domain-modal-kpi-val" style={{ color: highRisk > 0 ? "#aa0808" : "#256f3a" }}>{highRisk}</div>
            <div className="domain-modal-kpi-label">High Risk (≥0.7)</div>
          </div>
          <div className="domain-modal-kpi">
            <div className="domain-modal-kpi-val">{(avgRisk * 100).toFixed(1)}%</div>
            <div className="domain-modal-kpi-label">Avg Risk Score</div>
          </div>
        </div>

        <div className="domain-modal-body">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Test Case</th>
                <th>Sub Area</th>
                <th>Risk Score</th>
                <th>Risk</th>
                <th>Inclusion</th>
                <th>Hotfix</th>
                <th>Complexity</th>
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
                        <div className="risk-bar-fill" style={{
                          width: `${(tc.risk_score * 100).toFixed(1)}%`,
                          background: tc.risk_score >= 0.7 ? "#aa0808" : tc.risk_score >= 0.4 ? "#e76500" : "#256f3a",
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#556b82", minWidth: 40 }}>{tc.risk_score.toFixed(3)}</span>
                    </div>
                  </td>
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

const KpiCard: React.FC<{
  label: string; value: string; trend: string; trendUp: boolean;
  vs?: string; icon: React.ReactNode; iconBg: string;
}> = ({ label, value, trend, trendUp, vs = "vs 2407", icon, iconBg }) => (
  <div className="kpi-card">
    <div className="kpi-card-left">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-trend ${trendUp ? "up" : "down"}`}>
        <span className="kpi-vs">{vs}</span>
        {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {trend}
      </div>
    </div>
    <div className="kpi-icon-wrap" style={{ background: iconBg }}>
      {icon}
    </div>
  </div>
);

const CardHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="ent-card-header">
    <div>
      <div className="ent-card-title">{title}</div>
      <div className="ent-card-subtitle">{subtitle}</div>
    </div>
    <button className="ent-card-menu"><MoreVertical size={16} /></button>
  </div>
);

const Dashboard: React.FC<Props> = ({ total, proposed }) => {
  const [domainModal, setDomainModal] = useState<string | null>(null);

  const skip         = total.length - proposed.length;
  const hotfixTotal  = total.filter(t => t.touches_hotfix_objects === 1).length;
  const hotfixProp   = proposed.filter(t => t.touches_hotfix_objects === 1).length;
  const recall       = hotfixTotal > 0 ? hotfixProp / hotfixTotal : 0;
  const biz          = proposed.filter(t => t.inclusion_reason === "L1: Business Critical").length;
  const reductionPct = ((skip / total.length) * 100).toFixed(1);
  const proposedPct  = ((proposed.length / total.length) * 100).toFixed(1);

  // Area breakdown
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
      { name: "Low",    value: low  },
      { name: "Medium", value: med  },
      { name: "High",   value: high },
    ];
  })();

  const sortedAreas = Object.entries(areaMap).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="page-content">

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Total TCs" value={total.length.toLocaleString()}
          trend="12.4%" trendUp={true}
          icon={<FileText size={22} color="#0070f2" />}
          iconBg="#e8f0fc"
        />
        <KpiCard
          label="AI Proposed TCs" value={proposed.length.toLocaleString()}
          trend="8.1%" trendUp={true}
          icon={<Zap size={22} color="#e76500" />}
          iconBg="#fff8d6"
        />
        <KpiCard
          label="Scope Reduction" value={`${reductionPct}%`}
          trend="5.6%" trendUp={true}
          icon={<Settings size={22} color="#256f3a" />}
          iconBg="#f5fae5"
        />
        <KpiCard
          label="Safe to Skip" value={skip.toLocaleString()}
          trend="18.3%" trendUp={true}
          icon={<Shield size={22} color="#6c32a0" />}
          iconBg="#f3eefa"
        />
        <KpiCard
          label="Business Critical" value={biz.toLocaleString()}
          trend="2.1%" trendUp={false}
          icon={<Briefcase size={22} color="#aa0808" />}
          iconBg="#ffeaf4"
        />
      </div>

      {/* Row: Scope Optimization + Data Overview */}
      <div className="analytics-grid-2">

        {/* Scope Optimization */}
        <div className="ent-card">
          <CardHeader title="Scope Optimization" subtitle="Full Suite Analysis" />
          <div className="ent-card-body">
            <div className="scope-row">
              <span className="scope-row-label">Original scope</span>
              <span className="scope-row-val">{total.length.toLocaleString()} TCs</span>
            </div>
            <div className="scope-row">
              <span className="scope-row-label">Hotfix-touching</span>
              <span className="scope-row-val orange">{hotfixTotal.toLocaleString()} TCs</span>
            </div>
            <div className="scope-row">
              <span className="scope-row-label">Scope reduction</span>
              <span className="scope-row-val green">{reductionPct}%</span>
            </div>
            <div className="scope-row">
              <span className="scope-row-label">Hotfix TCs caught</span>
              <span className="scope-row-val green">
                {hotfixProp} / {hotfixTotal} ({(recall * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="scope-row">
              <span className="scope-row-label">Defects missed</span>
              <span className="scope-row-val red">{hotfixTotal - hotfixProp}</span>
            </div>

            <div className="scope-progress-wrap">
              <div className="scope-progress-meta">
                <span>{proposed.length.toLocaleString()} / {total.length.toLocaleString()}</span>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span className="scope-progress-pct">{proposedPct}%</span>
                  <CheckCircle size={16} className="scope-check" />
                </span>
              </div>
              <div className="scope-progress-bar">
                <div className="scope-progress-fill" style={{ width: `${proposedPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Data Overview */}
        <div className="ent-card">
          <CardHeader title="Data Overview" subtitle="Release 2508 dataset" />
          <div className="ent-card-body">
            {([
              ["Data Source",       "total_scope_2508.json"],
              ["Total TCs",         total.length.toLocaleString()],
              ["Hotfix-Positive",   `${hotfixTotal} (${((hotfixTotal/total.length)*100).toFixed(1)}%)`],
              ["Non-Hotfix TCs",    (total.length - hotfixTotal).toLocaleString()],
              ["Proposed Scope",    proposed.length.toLocaleString()],
              ["Safe to Skip",      skip.toLocaleString()],
              ["Business Critical", biz.toLocaleString()],
              ["Model Used",        "Domain Ensemble"],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="data-row">
                <span className="data-row-label">{k}</span>
                <span className="data-row-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Donut + Bar */}
      <div className="analytics-grid-2">

        {/* Test Case Distribution */}
        <div className="ent-card">
          <CardHeader title="Test Case Distribution" subtitle="Hotfix vs non-hotfix breakdown" />
          <div className="ent-card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={distData} cx="40%" cy="50%"
                  innerRadius={70} outerRadius={100}
                  dataKey="value" startAngle={90} endAngle={-270}
                  strokeWidth={2} stroke="#fff"
                >
                  {distData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ border:"1px solid #d9d9d9", borderRadius:10, fontSize:12, boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(v: any) => [typeof v === "number" ? v.toLocaleString() : v]}
                />
                <Legend
                  layout="vertical" align="right" verticalAlign="middle"
                  wrapperStyle={{ fontSize: 13 }}
                  formatter={(value, entry: any) => (
                    <span style={{ color: "#131e29" }}>
                      <span style={{ fontWeight: 600, display:"block" }}>{value}</span>
                      <span style={{ color: "#556b82" }}>
                        {entry.payload.value.toLocaleString()} ({((entry.payload.value / total.length) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complexity Distribution */}
        <div className="ent-card">
          <CardHeader title="Complexity Distribution" subtitle="Proposed test cases by complexity tier" />
          <div className="ent-card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={complexityData} barCategoryGap="45%">
                <CartesianGrid strokeDasharray="3 3" stroke="#eaecee" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#556b82" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#556b82" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border:"1px solid #d9d9d9", borderRadius:10, fontSize:12, boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(v: any) => [String(v), "Test Cases"]}
                />
                <Bar dataKey="value" fill="#0070f2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Domain Breakdown */}
      <div className="section-header">
        <div className="section-title">Domain Breakdown</div>
        <div className="section-sub">Per-area scope and hotfix distribution</div>
      </div>
      <div className="domain-grid">
        {sortedAreas.map(([area, s]) => {
          const redPct    = ((s.total - s.proposed) / s.total * 100).toFixed(0);
          const scopePct  = ((s.proposed / s.total) * 100).toFixed(1);
          const color     = AREA_COLORS[area] || "#32363A";
          return (
            <div key={area} className="domain-card">
              <div className="domain-card-header">
                <span className="domain-name" style={{ color }}>{area}</span>
                <span className="domain-badge">
                  <TrendingDown size={11} /> {redPct}% reduced
                </span>
              </div>
              <div className="domain-metrics">
                <span>Total: <strong>{s.total}</strong></span>
                <span>Proposed: <strong style={{ color }}>{s.proposed}</strong></span>
                <span>Hotfix: <strong className="ht">{s.hotfix}</strong></span>
              </div>
              <div className="domain-progress-row">
                <span className="domain-pct">{scopePct}%</span>
                <CheckCircle size={14} style={{ color: "#256f3a" }} />
              </div>
              <div className="domain-progress-bar">
                <div className="domain-progress-fill" style={{ width: `${scopePct}%` }} />
              </div>
              <button className="domain-view-btn" onClick={() => setDomainModal(area)}>
                <span>View Details</span>
                <ChevronRight size={15} />
              </button>
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
