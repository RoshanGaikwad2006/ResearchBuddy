import apiClient from "./apiClient";

export interface DashboardMetricsResponse {
  role: string;
  summary: {
    totalPublications: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    departmentCount: number;
    totalCitations: number;
  };
  recentSubmissions: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    createdBy?: { name: string; role: string };
    department?: { code: string; name: string };
  }[];
}

export const fetchDashboardMetrics = async (): Promise<DashboardMetricsResponse> => {
  const response = await apiClient.get<DashboardMetricsResponse>("/dashboard/metrics");
  return response.data;
};
