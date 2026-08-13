import apiClient from "./apiClient";

export interface AnalyticsOverviewResponse {
  publicationTrend: {
    year: number;
    publications: number;
    citations: number;
  }[];
  departmentStats: {
    id: string;
    code: string;
    name: string;
    publicationsCount: number;
    facultyCount: number;
    studentCount: number;
  }[];
  typeDistribution: {
    venue_type: "Journal" | "Conference" | "Other";
    count: number;
  }[];
  topResearchAreas: {
    area: string;
    count: number;
    totalCitations: number;
  }[];
  facultyLeaderboard: {
    id: string;
    name: string;
    email: string;
    departmentCode: string;
    designation: string;
    totalPublications: number;
  }[];
}

export const fetchOverviewAnalytics = async (): Promise<AnalyticsOverviewResponse> => {
  const response = await apiClient.get<AnalyticsOverviewResponse>("/analytics/overview");
  return response.data;
};
