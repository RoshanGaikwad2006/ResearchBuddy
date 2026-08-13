import apiClient from "./apiClient";
import type { ResearchItem } from "./research.service";

export type ApprovalStatusDecision = "APPROVED" | "REJECTED" | "NEEDS_REVISION";

export interface ApprovalHistoryItem {
  id: string;
  researchId: string;
  reviewerId: string;
  status: string;
  comments?: string;
  createdAt: string;
  reviewer: {
    name: string;
    email: string;
    role: string;
  };
}

export interface PendingQueueResponse {
  items: ResearchItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const fetchPendingApprovalQueue = async (params?: { page?: number; limit?: number }): Promise<PendingQueueResponse> => {
  const response = await apiClient.get<PendingQueueResponse>("/approvals/pending", { params });
  return response.data;
};

export const submitApprovalDecisionApi = async (
  researchId: string,
  payload: { status: ApprovalStatusDecision; comments?: string }
): Promise<{ message: string; data: any }> => {
  const response = await apiClient.post<{ message: string; data: any }>(`/approvals/${researchId}`, payload);
  return response.data;
};

export const fetchApprovalHistoryApi = async (researchId: string): Promise<{ history: ApprovalHistoryItem[] }> => {
  const response = await apiClient.get<{ history: ApprovalHistoryItem[] }>(`/approvals/${researchId}/history`);
  return response.data;
};
