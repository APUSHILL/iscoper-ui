import React from "react";
import { TestCase } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props { total: TestCase[]; proposed: TestCase[] }

const ScopeComparison: React.FC<Props> = ({ total, proposed }) => {
  const full    = total.length;
  const rule    = Math.round(full * 0.60);
  const l1      = proposed.filter(t => t.inclusion_reason === "L1: Changed Objects").length;
  const l1bc    = l1 + proposed.filter(t => t.inclusion_reason === "L1: Business Critical").length;
  const aiScope = proposed.length;

  const hotfixT  = total.filter(t => t.touches_hotfix_objects === 1).length;
  const hotfixP  = proposed.filter(t => t.touches_hotfix_objects === 1).length;
  const hotfixL1 = proposed.filter(t => t.inclusion_reason === "L1: Changed Objects" && t.touches_hotfix_objects === 1).length;

  const barData = [
    { name: "Full Suite",          count: full,    pct: 100 },
    { name: "Rule-Based",          count: rule,    pct: parseFloat(((rule / full) * 100).toFixed(1)) },
    { name: "L1: Changed Obj.",    count: l1,      pct: parseFloat(((l1 / full) * 100).toFixed(1)) },
    { name: "L1 + Biz Critical",   count: l1bc,    pct: parseFloat(((l1bc / full) * 100).toFixed(1)) },
    { name: "AI Final Scope",      count: aiScope, pct: parseFloat(((aiScope / full) * 100).toFixed(1)) },
  ];

  const inclusionData = [
    { name: "L1: Changed Objects",   count: 115, color: "#BB0000" },
    { name: "TopK AI (K=50%)",        count: 501, color: "#0A6ED1" },
    { name: "L1: Business Critical", count: 84,  color: "#E9730C" },
  ];

  const kpis = [
    { label: "Full Suite",       val: full.toLocaleString(),                              sub: "No scoping applied"              },
    { label: "Rule-Based Scope", val: rule.toLocaleString(),                              sub: "~40% reduction (estimated)"      },
    { label: "AI Final Scope",   val: aiScope.toLocaleString(),                           sub: `${((1 - aiScope / full) * 100).toFixed(1)}% reduction` },
    { label: "Hotfix Recall",    val: `${((hotfixP / hotfixT) * 100).toFixed(1)}%`,       sub: `${hotfixP} / ${hotfixT} caught`  },
  ];

  const scopeRows = [
    { label: "Full Suite (No Scoping)",  count: full,    desc: "All test cases, unfiltered" },
    { label: "Rule-Based i-ScOper",       count: rule,    desc: "Code changes + customer usage (est. 60%)" },
    { label: "L1: Changed Objects",       count: l1,      desc: "Test cases covering changed ABAP objects" },
    { label: "L1 + Business Critical",    count: l1bc,    desc: "Changed objects + business-critical tests" },
    { label: "AI Final Proposed Scope",   count: aiScope, desc: "L1 + TopK AI risk + Business Critical" },
  ];

  const hotfixRows = [
    { label: "Full Suite",               caught: hotfixT,  total: hotfixT },
    { label: "L1: Changed Objects only", caught: hotfixL1, total: hotfixT },
    { label: "AI Final Proposed Scope",  caught: hotfixP,  total: hotfixT },
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

      {/* Charts row */}
      <div className="analytics-grid-2">
        <div className="ent-card">
          <div className="ent-card-header">
            <div>
              <div className="ent-card-title">Scope Size by Layer</div>
              <div className="ent-card-subtitle">Test case count per scoping strategy</div>
            </div>
          </div>
          <div className="ent-card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EA" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8996A9" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8996A9" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: "1px solid #E5E7EA", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(v: any) => [typeof v === "number" ? v.toLocaleString() : v, "Test Cases"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#0A6ED1"
                  label={{ position: "top", fontSize: 10, fill: "#8996A9" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ent-card">
          <div className="ent-card-header">
            <div>
              <div className="ent-card-title">AI Inclusion Reason Breakdown</div>
              <div className="ent-card-subtitle">How test cases were selected</div>
            </div>
          </div>
          <div className="ent-card-body">
            {inclusionData.map(d => (
              <div key={d.name} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 500, color: "#32363A" }}>{d.name}</span>
                  <span style={{ color: "#8996A9" }}>{d.count} · {((d.count / aiScope) * 100).toFixed(1)}%</span>
                </div>
                <div className="scope-progress-bar">
                  <div
                    className="scope-progress-fill"
                    style={{ width: `${((d.count / aiScope) * 100).toFixed(1)}%`, background: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scope reduction table */}
      <div className="ent-card" style={{ marginBottom: 16 }}>
        <div className="ent-card-header">
          <div>
            <div className="ent-card-title">Scope Reduction Summary</div>
            <div className="ent-card-subtitle">Z &lt; Y &lt; X principle: AI Scope &lt; Rule-Based &lt; Full Suite</div>
          </div>
        </div>
        <div className="ent-table-wrap">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Scope Type</th>
                <th>Test Cases</th>
                <th>Reduction vs Full</th>
                <th>Tests Saved</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {scopeRows.map(r => {
                const saved  = full - r.count;
                const redPct = ((saved / full) * 100).toFixed(1);
                return (
                  <tr key={r.label}>
                    <td style={{ fontWeight: 500 }}>{r.label}</td>
                    <td style={{ fontWeight: 700 }}>{r.count.toLocaleString()}</td>
                    <td>
                      {r.count === full
                        ? <span style={{ color: "#8996A9" }}>—</span>
                        : <span className="badge badge-green">{redPct}%</span>}
                    </td>
                    <td style={{ color: "#8996A9" }}>
                      {r.count === full ? "—" : saved.toLocaleString()}
                    </td>
                    <td style={{ color: "#8996A9", fontSize: 12 }}>{r.desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hotfix coverage */}
      <div className="ent-card">
        <div className="ent-card-header">
          <div>
            <div className="ent-card-title">Hotfix Coverage by Scope Layer</div>
            <div className="ent-card-subtitle">How many hotfix-prone test cases each layer catches</div>
          </div>
        </div>
        <div className="ent-table-wrap">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Hotfix-Prone Included</th>
                <th>Total Hotfix-Prone</th>
                <th>Recall</th>
              </tr>
            </thead>
            <tbody>
              {hotfixRows.map(r => {
                const recall = (r.caught / r.total * 100).toFixed(1);
                const isAI = r.label.startsWith("AI");
                return (
                  <tr key={r.label}>
                    <td style={{ fontWeight: isAI ? 700 : 400 }}>{r.label}</td>
                    <td style={{ fontWeight: 700 }}>{r.caught}</td>
                    <td>{r.total}</td>
                    <td>
                      <span className={r.caught === r.total ? "badge badge-green" : "badge badge-orange"}>
                        {recall}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScopeComparison;
