import apiClient from "./apiClient";

export interface AuditHealthMetrics {
  overallHealth: number;
  completeness: number;
  consistency: number;
  uniqueness: number;
  identityMapping: number;
  metadataQuality: number;
  totalAudited: number;
}

export interface DepartmentHealthItem {
  id: string;
  code: string;
  name: string;
  healthScore: number;
  openIssues: number;
}

export interface AuditHealthResponse {
  health: AuditHealthMetrics;
  departmentHealth: DepartmentHealthItem[];
}

export interface AuditRunItem {
  id: string;
  triggeredById: string;
  scopeType: "INSTITUTIONAL" | "DEPARTMENT" | "FACULTY" | "PUBLICATION";
  targetId?: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  recordsScanned: number;
  issuesDetected: number;
  autoResolvedCount: number;
  humanReviewCount: number;
  healthScore: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  triggeredBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface FieldDiff {
  field: string;
  label: string;
  kriyaValue: any;
  externalValue: any;
  scholarValue?: any;
  openalexValue?: any;
  crossrefValue?: any;
  status: "MATCH" | "MISMATCH" | "MISSING_IN_KRIYA" | "MISSING_IN_EXTERNAL";
}

export interface AuditIssueItem {
  id: string;
  auditRunId: string;
  issueType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "IGNORED" | "AUTO_RESOLVED";
  confidence: number;
  confidenceReasons?: string; // JSON string
  fieldDiffs?: string; // JSON string
  externalSource: string;
  externalData?: string; // JSON string
  researchId?: string;
  facultyId?: string;
  departmentId?: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedById?: string;
  research?: {
    id: string;
    title: string;
    doi?: string;
    publicationYear: number;
  };
  faculty?: {
    id: string;
    employeeId: string;
    user: {
      name: string;
    };
  };
  department?: {
    id: string;
    code: string;
    name: string;
  };
  history?: any[];
}

export const fetchAuditHealth = async (
  scopeType?: string,
  targetId?: string
): Promise<AuditHealthResponse> => {
  const response = await apiClient.get<AuditHealthResponse>("/audits/health", {
    params: { scopeType, targetId },
  });
  return response.data;
};

export const fetchAuditRuns = async (): Promise<{ runs: AuditRunItem[] }> => {
  const response = await apiClient.get<{ runs: AuditRunItem[] }>("/audits/runs");
  return response.data;
};

export const fetchAuditIssues = async (params?: {
  severity?: string;
  issueType?: string;
  status?: string;
  departmentId?: string;
  facultyId?: string;
}): Promise<{ issues: AuditIssueItem[] }> => {
  const response = await apiClient.get<{ issues: AuditIssueItem[] }>("/audits/issues", {
    params,
  });
  return response.data;
};

export const fetchAuditIssueById = async (id: string): Promise<{ issue: AuditIssueItem }> => {
  const response = await apiClient.get<{ issue: AuditIssueItem }>(`/audits/issues/${id}`);
  return response.data;
};

export const runAuditApi = async (payload?: {
  scopeType?: string;
  targetId?: string | null;
}): Promise<{ auditRun: AuditRunItem; health: AuditHealthMetrics }> => {
  const response = await apiClient.post<{ auditRun: AuditRunItem; health: AuditHealthMetrics }>(
    "/audits/run",
    payload || {}
  );
  return response.data;
};

export const resolveAuditIssueApi = async (
  id: string,
  data: { action: "ACCEPT_SCHOLAR" | "ACCEPT_OPENALEX" | "ACCEPT_CROSSREF" | "ACCEPT_EXTERNAL" | "KEEP_KRIYA" | "MERGE" | "IGNORE"; reason?: string }
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(`/audits/issues/${id}/resolve`, data);
  return response.data;
};

export const runAutoFixApi = async (): Promise<{ message: string; autoFixedCount: number }> => {
  const response = await apiClient.post<{ message: string; autoFixedCount: number }>("/audits/issues/autofix");
  return response.data;
};
