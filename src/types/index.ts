export interface TestCase {
  testcaseIdentifier: string;
  testcaseAutomateConfigurationName: string;
  testplanName: string;
  area: string;
  subArea: string;
  applicationComponent: string;
  Complexity: number;
  changed_objects_count: number;
  usageCustomerImpactScore: number | string;
  touches_hotfix_objects: 0 | 1;
  risk_score: number;
  in_proposed_scope?: boolean;
  rank?: number;
  inclusion_reason?: string;
  confidence?: number;
}

export type Page = "dashboard" | "scope" | "comparison" | "risk" | "history" | "tools" | "tracker";

export type ExecStatus = "not-started" | "in-progress" | "passed" | "failed" | "blocked";
