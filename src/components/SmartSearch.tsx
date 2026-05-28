import React, { useState, useMemo, useEffect, useRef } from "react";
import { TestCase, Page } from "../types";
import { Search, X, ArrowRight } from "lucide-react";

interface Props {
  total: TestCase[];
  proposed: TestCase[];
  onClose: () => void;
  onNavigate: (page: Page) => void;
}

const MAX_RESULTS = 20;

function riskClass(s: number) { return s >= 0.7 ? "badge badge-red" : s >= 0.4 ? "badge badge-orange" : "badge badge-green"; }
function riskLabel(s: number) { return s >= 0.7 ? "High" : s >= 0.4 ? "Med" : "Low"; }

const proposedSet = (proposed: TestCase[]) => new Set(proposed.map(t => t.testcaseIdentifier));

const SmartSearch: React.FC<Props> = ({ total, proposed, onClose, onNavigate }) => {
  const [query,   setQuery]   = useState("");
  const [active,  setActive]  = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  const pSet = useMemo(() => proposedSet(proposed), [proposed]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const hits: (TestCase & { inProposed: boolean })[] = [];
    const seen = new Set<string>();
    for (const t of total) {
      if (hits.length >= MAX_RESULTS) break;
      if (seen.has(t.testcaseIdentifier)) continue;
      if (
        t.testcaseAutomateConfigurationName.toLowerCase().includes(q) ||
        t.testplanName.toLowerCase().includes(q) ||
        t.area.toLowerCase().includes(q) ||
        (t.subArea || "").toLowerCase().includes(q) ||
        (t.applicationComponent || "").toLowerCase().includes(q)
      ) {
        seen.add(t.testcaseIdentifier);
        hits.push({ ...t, inProposed: pSet.has(t.testcaseIdentifier) });
      }
    }
    return hits;
  }, [query, total, pSet]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[active] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) { selectResult(results[active]); }
    if (e.key === "Escape") { onClose(); }
  };

  const selectResult = (tc: TestCase & { inProposed: boolean }) => {
    onNavigate(tc.inProposed ? "scope" : "comparison");
    onClose();
  };

  function highlight(text: string, q: string) {
    if (!q) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "#fff8d6", color: "#e76500", borderRadius: 2, padding: "0 1px" }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div className="smart-search-overlay" onClick={onClose}>
      <div className="smart-search-box" onClick={e => e.stopPropagation()}>

        {/* Input row */}
        <div className="smart-search-input-wrap">
          <Search size={18} style={{ color: "#556b82", flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="smart-search-input"
            placeholder="Search test cases, plans, areas…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button className="smart-search-clear" onClick={() => setQuery("")}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Results */}
        {query.trim() === "" && (
          <div className="smart-search-empty">
            Start typing to search across all {total.length.toLocaleString()} test cases…
          </div>
        )}

        {query.trim() !== "" && results.length === 0 && (
          <div className="smart-search-empty">
            No results for <strong>"{query}"</strong>
          </div>
        )}

        {results.length > 0 && (
          <div className="smart-search-results" ref={listRef}>
            {results.map((tc, i) => (
              <div
                key={tc.testcaseIdentifier}
                className={`smart-search-item${i === active ? " active" : ""}`}
                onClick={() => selectResult(tc)}
                onMouseEnter={() => setActive(i)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="smart-search-item-name" style={{ fontFamily: "monospace", fontSize: 12 }}>
                    {highlight(tc.testcaseAutomateConfigurationName, query)}
                  </div>
                  <div className="smart-search-item-sub">
                    {highlight(tc.testplanName, query)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>{tc.area}</span>
                  <span className={riskClass(tc.risk_score)} style={{ fontSize: 10 }}>{riskLabel(tc.risk_score)}</span>
                  <span className={tc.inProposed ? "badge badge-green" : "badge badge-gray"} style={{ fontSize: 10 }}>
                    {tc.inProposed ? "Proposed" : "Suite"}
                  </span>
                </div>
                <ArrowRight size={13} style={{ color: "#d9d9d9", flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="smart-search-footer">
          <span>↑↓ navigate</span>
          <span>·</span>
          <span>↵ open</span>
          <span>·</span>
          <span>Esc close</span>
          {results.length > 0 && (
            <span style={{ marginLeft: "auto", color: "#556b82" }}>
              {results.length}{results.length === MAX_RESULTS ? "+" : ""} results
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartSearch;
