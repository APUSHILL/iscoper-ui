import React, { useState } from "react";
import { TestCase } from "../types";
import {
  Download, FileText, FileSpreadsheet, BarChart2,
  CheckCircle, Clock, AlertTriangle,
} from "lucide-react";

interface Props { total: TestCase[]; proposed: TestCase[] }

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  format: string;
  size: string;
}

const ExportReports: React.FC<Props> = ({ total, proposed }) => {
  const [exported, setExported] = useState<string[]>([]);
  const [loading, setLoading]   = useState<string | null>(null);

  const hotfixTotal = total.filter(t => t.touches_hotfix_objects === 1).length;
  const hotfixProp  = proposed.filter(t => t.touches_hotfix_objects === 1).length;
  const skip        = total.length - proposed.length;
  const reductionPct = ((skip / total.length) * 100).toFixed(1);

  const reports: ReportCard[] = [
    {
      id: "proposed-csv",
      title: "Proposed Scope — CSV",
      description: "Full list of AI-recommended test cases with risk scores, inclusion reasons, and complexity.",
      icon: <FileSpreadsheet size={22} />,
      iconBg: "#E8F5E9", iconColor: "#188918",
      format: "CSV", size: `~${proposed.length} rows`,
    },
    {
      id: "total-csv",
      title: "Total Scope — CSV",
      description: "Complete test suite with all fields including hotfix flags and usage impact scores.",
      icon: <FileSpreadsheet size={22} />,
      iconBg: "#EBF4FF", iconColor: "#0A6ED1",
      format: "CSV", size: `~${total.length} rows`,
    },
    {
      id: "summary-pdf",
      title: "Scope Summary Report — PDF",
      description: "Executive summary with KPIs, scope reduction metrics, hotfix recall, and domain breakdown.",
      icon: <FileText size={22} />,
      iconBg: "#FFF3E8", iconColor: "#E9730C",
      format: "PDF", size: "1–2 pages",
    },
    {
      id: "risk-csv",
      title: "Risk Analysis Export — CSV",
      description: "Domain risk scores, hotfix density, feature drift PSI values for all areas.",
      icon: <BarChart2 size={22} />,
      iconBg: "#FDECEA", iconColor: "#BB0000",
      format: "CSV", size: "Per domain",
    },
  ];

  const toCSV = (rows: TestCase[]) => {
    const headers = [
      "Rank", "TestCase", "TestPlan", "Area", "SubArea",
      "RiskScore", "Complexity", "HotfixProne", "InclusionReason", "Confidence",
    ];
    const lines = rows.map(t => [
      t.rank ?? "",
      `"${t.testcaseAutomateConfigurationName.replace(/"/g, '""')}"`,
      `"${t.testplanName.replace(/"/g, '""')}"`,
      t.area, t.subArea,
      t.risk_score.toFixed(4),
      t.Complexity,
      t.touches_hotfix_objects === 1 ? "Yes" : "No",
      `"${(t.inclusion_reason || "").replace(/"/g, '""')}"`,
      t.confidence ?? "",
    ].join(","));
    return [headers.join(","), ...lines].join("\n");
  };

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (id: string) => {
    setLoading(id);
    setTimeout(() => {
      if (id === "proposed-csv") {
        downloadCSV(`proposed_scope_2508.csv`, toCSV(proposed));
      } else if (id === "total-csv") {
        downloadCSV(`total_scope_2508.csv`, toCSV(total));
      } else if (id === "risk-csv") {
        const areaMap: Record<string, { scores: number[]; hotfix: number }> = {};
        proposed.forEach(t => {
          if (!areaMap[t.area]) areaMap[t.area] = { scores: [], hotfix: 0 };
          areaMap[t.area].scores.push(t.risk_score);
          if (t.touches_hotfix_objects === 1) areaMap[t.area].hotfix++;
        });
        const rows = Object.entries(areaMap).map(([area, s]) => {
          const avg = (s.scores.reduce((a, b) => a + b, 0) / s.scores.length).toFixed(4);
          const max = Math.max(...s.scores).toFixed(4);
          const high = s.scores.filter(r => r >= 0.7).length;
          return `${area},${avg},${max},${high},${s.hotfix},${s.scores.length}`;
        });
        const csv = ["Domain,AvgRisk,MaxRisk,HighRiskCount,HotfixProne,ProposedTCs", ...rows].join("\n");
        downloadCSV("risk_analysis_2508.csv", csv);
      } else if (id === "summary-pdf") {
        // Generate a clean HTML summary and trigger print-to-PDF
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
          <title>Scope Summary Report — Release 2508</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1D2D3E; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            .sub { color: #8996A9; font-size: 13px; margin-bottom: 32px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
            .kpi { border: 1px solid #E5E7EA; border-radius: 10px; padding: 16px; }
            .kpi-val { font-size: 28px; font-weight: 700; }
            .kpi-label { font-size: 12px; color: #8996A9; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #F4F6F8; padding: 8px 12px; text-align: left; font-size: 11px; color: #8996A9; text-transform: uppercase; }
            td { padding: 10px 12px; border-bottom: 1px solid #F0F2F5; }
          </style></head><body>
          <h1>Scope Summary Report — Release 2508</h1>
          <div class="sub">AI-powered test scope optimization · Generated ${new Date().toLocaleDateString()}</div>
          <div class="grid">
            <div class="kpi"><div class="kpi-val">${total.length.toLocaleString()}</div><div class="kpi-label">Total Test Cases</div></div>
            <div class="kpi"><div class="kpi-val">${proposed.length.toLocaleString()}</div><div class="kpi-label">AI Proposed Scope</div></div>
            <div class="kpi"><div class="kpi-val">${reductionPct}%</div><div class="kpi-label">Scope Reduction</div></div>
            <div class="kpi"><div class="kpi-val">${skip.toLocaleString()}</div><div class="kpi-label">Safe to Skip</div></div>
            <div class="kpi"><div class="kpi-val">${hotfixTotal}</div><div class="kpi-label">Hotfix-Prone TCs</div></div>
            <div class="kpi"><div class="kpi-val">${((hotfixProp/hotfixTotal)*100).toFixed(1)}%</div><div class="kpi-label">Hotfix Recall</div></div>
          </div>
          <table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
            <tr><td>Data Source</td><td>total_scope_2508.json</td></tr>
            <tr><td>Model Used</td><td>Domain Ensemble (RF + GBM)</td></tr>
            <tr><td>Hotfix-Positive TCs</td><td>${hotfixTotal} (${((hotfixTotal/total.length)*100).toFixed(1)}%)</td></tr>
            <tr><td>Hotfix TCs Caught</td><td>${hotfixProp} / ${hotfixTotal}</td></tr>
            <tr><td>Defects Missed</td><td>${hotfixTotal - hotfixProp}</td></tr>
          </tbody></table>
          <script>window.onload = () => { window.print(); }<\/script>
          </body></html>`;
        const w = window.open("", "_blank");
        if (w) { w.document.write(html); w.document.close(); }
      }
      setLoading(null);
      setExported(prev => prev.includes(id) ? prev : [...prev, id]);
    }, 800);
  };

  return (
    <div className="page-content">

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">Export &amp; Reports</div>
        <div className="section-sub">Download test scope data and generate summary reports for Release 2508</div>
      </div>

      {/* Stats strip */}
      <div className="info-banner" style={{ marginBottom: 24 }}>
        <CheckCircle size={16} style={{ flexShrink: 0, color: "#188918" }} />
        Data ready to export &nbsp;·&nbsp;
        <strong>{total.length.toLocaleString()}</strong> total TCs &nbsp;·&nbsp;
        <strong>{proposed.length.toLocaleString()}</strong> proposed TCs &nbsp;·&nbsp;
        <strong>{reductionPct}%</strong> scope reduction
      </div>

      {/* Report cards */}
      <div className="reports-grid">
        {reports.map(r => {
          const isDone    = exported.includes(r.id);
          const isLoading = loading === r.id;
          return (
            <div key={r.id} className="report-card">
              <div className="report-card-top">
                <div className="report-icon-wrap" style={{ background: r.iconBg, color: r.iconColor }}>
                  {r.icon}
                </div>
                <div className="report-format-badge">{r.format}</div>
              </div>
              <div className="report-card-title">{r.title}</div>
              <div className="report-card-desc">{r.description}</div>
              <div className="report-card-meta">
                <Clock size={12} /> {r.size}
              </div>
              <button
                className={`report-export-btn${isDone ? " done" : ""}`}
                onClick={() => handleExport(r.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="report-spinner" />
                ) : isDone ? (
                  <><CheckCircle size={14} /> Downloaded</>
                ) : (
                  <><Download size={14} /> Export</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <div style={{ marginTop: 32, padding: "16px 20px", background: "#F5F6F7", borderRadius: 10, fontSize: 13, color: "#8996A9", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1, color: "#E9730C" }} />
        CSV files open directly in Excel or any spreadsheet tool. For the PDF report, use your browser's print dialog to save as PDF.
      </div>
    </div>
  );
};

export default ExportReports;
