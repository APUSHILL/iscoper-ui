import React, { useState } from "react";
import { TestCase } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle } from "lucide-react";

interface Props { total: TestCase[]; proposed: TestCase[] }

const PSI = [
  { feature: "changed_objects_count",   psi: 0.026, status: "Stable"   },
  { feature: "FUN",                      psi: 0.043, status: "Stable"   },
  { feature: "PROG",                     psi: 0.065, status: "Stable"   },
  { feature: "usageCustomerImpactScore", psi: 0.068, status: "Stable"   },
  { feature: "fe_changed_objects",       psi: 0.082, status: "Stable"   },
  { feature: "FUGR",                     psi: 0.096, status: "Stable"   },
  { feature: "FORM",                     psi: 0.142, status: "Moderate" },
  { feature: "Complexity",               psi: 0.156, status: "Moderate" },
  { feature: "SQL",                      psi: 0.188, status: "Moderate" },
  { feature: "FUN_Ratio",                psi: 0.211, status: "Drifted"  },
  { feature: "PROG_Ratio",               psi: 0.444, status: "Drifted"  },
  { feature: "METH_Ratio",               psi: 1.395, status: "Drifted"  },
  { feature: "FUGR_Ratio",               psi: 3.166, status: "Drifted"  },
  { feature: "CLASS_Ratio",              psi: 3.850, status: "Drifted"  },
];

function riskLabel(s: number) { return s >= 0.7 ? "High" : s >= 0.4 ? "Medium" : "Low"; }
function riskClass(s: number) { return s >= 0.7 ? "badge badge-red" : s >= 0.4 ? "badge badge-orange" : "badge badge-green"; }
function psiClass(st: string) { return st === "Stable" ? "badge badge-green" : st === "Moderate" ? "badge badge-orange" : "badge badge-red"; }

const TABS = ["Domain Heatmap", "Feature Drift (PSI)", "Hotfix Density"] as const;
type Tab = typeof TABS[number];

const RiskAnalysis: React.FC<Props> = ({ total, proposed }) => {
  const [activeTab, setActiveTab] = useState<Tab>("Domain Heatmap");

  const totalByArea: Record<string, number> = {};
  total.forEach(t => { totalByArea[t.area] = (totalByArea[t.area] || 0) + 1; });

  const areaStats = Object.entries(
    proposed.reduce<Record<string, { scores: number[]; hotfix: number; total: number }>>((acc, t) => {
      if (!acc[t.area]) acc[t.area] = { scores: [], hotfix: 0, total: 0 };
      acc[t.area].scores.push(t.risk_score);
      if (t.touches_hotfix_objects === 1) acc[t.area].hotfix++;
      acc[t.area].total++;
      return acc;
    }, {})
  ).map(([area, s]) => ({
    area,
    avgRisk: s.scores.reduce((a, b) => a + b, 0) / s.scores.length,
    maxRisk: Math.max(...s.scores),
    highRisk: s.scores.filter(r => r >= 0.7).length,
    hotfix: s.hotfix,
    total: s.total,
    totalInSuite: totalByArea[area] || 0,
  })).sort((a, b) => b.avgRisk - a.avgRisk);

  const domainBarData = areaStats.map(s => ({ name: s.area, risk: parseFloat((s.avgRisk * 100).toFixed(1)) }));

  return (
    <div className="page-content">

      {/* Alert banner */}
      <div className="warn-banner">
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <strong>Anomaly Alert:</strong> CLASS_Ratio PSI=3.85, FUGR_Ratio PSI=3.17. These features excluded from prediction model.
        Domain-adaptive ensemble compensates using 24 stable features.
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t}
            className={`tab-item${activeTab === t ? " active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Domain Heatmap */}
      {activeTab === "Domain Heatmap" && (
        <>
          <div className="analytics-grid-2">
            <div className="ent-card">
              <div className="ent-card-header">
                <div>
                  <div className="ent-card-title">Avg Risk Score by Domain</div>
                  <div className="ent-card-subtitle">Proposed test cases, sorted by average risk</div>
                </div>
              </div>
              <div className="ent-card-body" style={{ paddingTop: 8 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={domainBarData} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EA" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#8996A9" }}
                      axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#8996A9" }}
                      axisLine={false} tickLine={false} width={72} />
                    <Tooltip
                      contentStyle={{ border: "1px solid #E5E7EA", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      formatter={(v: any) => [`${v}%`, "Avg Risk"]}
                    />
                    <Bar dataKey="risk" radius={[0, 6, 6, 0]} fill="#0070f2"
                      label={{ position: "right", fontSize: 10, fill: "#8996A9" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ent-card">
              <div className="ent-card-header">
                <div>
                  <div className="ent-card-title">High Risk & Hotfix Count by Domain</div>
                  <div className="ent-card-subtitle">Test cases with risk ≥ 0.7 vs hotfix-prone</div>
                </div>
              </div>
              <div className="ent-card-body" style={{ paddingTop: 8 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={areaStats.map(s => ({ name: s.area, highRisk: s.highRisk, hotfix: s.hotfix }))}
                    layout="vertical" barCategoryGap="20%" barGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EA" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#8996A9" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#8996A9" }}
                      axisLine={false} tickLine={false} width={72} />
                    <Tooltip
                      contentStyle={{ border: "1px solid #E5E7EA", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="highRisk" name="High Risk (≥0.7)" fill="#e76500" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="hotfix"   name="Hotfix-Prone"     fill="#aa0808" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="ent-card">
            <div className="ent-card-header">
              <div>
                <div className="ent-card-title">Domain Risk Summary</div>
                <div className="ent-card-subtitle">Detailed risk metrics per domain</div>
              </div>
            </div>
            <div className="ent-table-wrap">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Avg Risk</th>
                    <th>Risk Level</th>
                    <th>Max Risk</th>
                    <th>High Risk (≥0.7)</th>
                    <th>Hotfix-Prone</th>
                    <th>Proposed TCs</th>
                    <th>Risk Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {areaStats.map(s => (
                    <tr key={s.area}>
                      <td style={{ fontWeight: 600 }}>{s.area}</td>
                      <td><span className={riskClass(s.avgRisk)}>{s.avgRisk.toFixed(4)}</span></td>
                      <td><span className={riskClass(s.avgRisk)}>{riskLabel(s.avgRisk)}</span></td>
                      <td style={{ color: "#131e29" }}>{s.maxRisk.toFixed(3)}</td>
                      <td>
                        {s.highRisk > 0
                          ? <span className="badge badge-red">{s.highRisk}</span>
                          : <span style={{ color: "#8996A9" }}>0</span>}
                      </td>
                      <td>
                        {s.hotfix > 0
                          ? <span className="badge badge-orange">{s.hotfix}</span>
                          : <span style={{ color: "#8996A9" }}>0</span>}
                      </td>
                      <td>{s.total}</td>
                      <td>
                        <div className="risk-bar-wrap">
                          <div
                            className="risk-bar-fill"
                            style={{
                              width: `${(s.avgRisk * 100).toFixed(1)}%`,
                              background: s.avgRisk >= 0.7 ? "#aa0808" : s.avgRisk >= 0.4 ? "#e76500" : "#256f3a",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Feature Drift */}
      {activeTab === "Feature Drift (PSI)" && (
        <>
          <div className="info-banner" style={{ marginBottom: 16 }}>
            Population Stability Index (PSI): &lt;0.1 = Stable · 0.1–0.25 = Moderate drift · &gt;0.25 = Significant drift (excluded from model)
          </div>
          <div className="ent-card">
            <div className="ent-card-header">
              <div>
                <div className="ent-card-title">PSI — Feature Drift (2502 → 2508)</div>
                <div className="ent-card-subtitle">Stability of input features between training and prediction release</div>
              </div>
            </div>
            <div className="ent-table-wrap">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>PSI Value</th>
                    <th>Status</th>
                    <th>Used in Model</th>
                    <th>Drift Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {[...PSI].sort((a, b) => a.psi - b.psi).map(f => (
                    <tr key={f.feature}>
                      <td>
                        <code style={{ background: "#F5F6F7", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                          {f.feature}
                        </code>
                      </td>
                      <td style={{ fontWeight: 700 }}>{f.psi.toFixed(3)}</td>
                      <td><span className={psiClass(f.status)}>{f.status}</span></td>
                      <td>
                        {f.status !== "Drifted"
                          ? <span className="badge badge-green">✓ Used</span>
                          : <span className="badge badge-red">✕ Excluded</span>}
                      </td>
                      <td>
                        <div className="risk-bar-wrap" style={{ width: 160 }}>
                          <div
                            className="risk-bar-fill"
                            style={{
                              width: `${Math.min(100, (f.psi / 4) * 100).toFixed(1)}%`,
                              background: f.status === "Stable" ? "#256f3a" : f.status === "Moderate" ? "#e76500" : "#aa0808",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Hotfix Density */}
      {activeTab === "Hotfix Density" && (
        <div className="ent-card">
          <div className="ent-card-header">
            <div>
              <div className="ent-card-title">Hotfix-Prone Density by Domain</div>
              <div className="ent-card-subtitle">Proportion of proposed test cases that touch hotfix objects</div>
            </div>
          </div>
          <div className="ent-table-wrap">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Suite Total</th>
                  <th>Proposed</th>
                  <th>Hotfix-Prone</th>
                  <th>Hotfix Density</th>
                  <th>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {areaStats.map(s => {
                  const density = s.hotfix / s.total;
                  const dClass = density >= 0.5 ? "badge badge-red" : density >= 0.2 ? "badge badge-orange" : "badge badge-green";
                  return (
                    <tr key={s.area}>
                      <td style={{ fontWeight: 600 }}>{s.area}</td>
                      <td>{s.totalInSuite}</td>
                      <td>{s.total}</td>
                      <td>
                        {s.hotfix > 0
                          ? <span className="badge badge-red">{s.hotfix}</span>
                          : <span style={{ color: "#8996A9" }}>0</span>}
                      </td>
                      <td><span className={dClass} style={{ fontWeight: 700 }}>{(density * 100).toFixed(1)}%</span></td>
                      <td>
                        <div className="risk-bar-wrap" style={{ width: 120 }}>
                          <div
                            className="risk-bar-fill"
                            style={{
                              width: `${(density * 100).toFixed(1)}%`,
                              background: density >= 0.5 ? "#aa0808" : density >= 0.2 ? "#e76500" : "#256f3a",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAnalysis;
