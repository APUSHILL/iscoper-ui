import { TestCase } from "../types";

export async function loadTotalScope(): Promise<TestCase[]> {
  const res = await fetch("/total_scope_2508.json");
  return res.json();
}

export async function loadProposedScope(): Promise<TestCase[]> {
  const res = await fetch("/proposed_scope_2508.json");
  return res.json();
}

export function getRiskColor(score: number): string {
  if (score >= 0.7) return "#bb0000";
  if (score >= 0.4) return "#e9730c";
  return "#188918";
}

export function getRiskLabel(score: number): string {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

export function getRiskBadgeClass(score: number): string {
  if (score >= 0.7) return "badge badge-error";
  if (score >= 0.4) return "badge badge-warning";
  return "badge badge-success";
}

export function getInclusionBadgeClass(reason: string): string {
  if (reason === "L1: Changed Objects") return "badge badge-error";
  if (reason === "L1: Business Critical") return "badge badge-warning";
  return "badge badge-info";
}

export function truncate(s: string, n = 36): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
