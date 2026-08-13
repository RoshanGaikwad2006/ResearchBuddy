import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchApprovalHistoryApi,
  fetchPendingApprovalQueue,
  submitApprovalDecisionApi,
  type ApprovalStatusDecision,
} from "@/services/approval.service";
import { getStoredToken } from "@/services/apiClient";

export const usePendingApprovalQueue = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["approval-pending-queue", params],
    queryFn: () => fetchPendingApprovalQueue(params),
    enabled: !!getStoredToken(),
    retry: 1,
  });
};

export const useApprovalHistory = (researchId?: string) => {
  return useQuery({
    queryKey: ["approval-history", researchId],
    queryFn: () => fetchApprovalHistoryApi(researchId!),
    enabled: !!researchId && !!getStoredToken(),
    retry: 1,
  });
};

export const useSubmitApprovalDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      researchId,
      status,
      comments,
    }: {
      researchId: string;
      status: ApprovalStatusDecision;
      comments?: string;
    }) => submitApprovalDecisionApi(researchId, { status, comments }),
    onSuccess: (res, variables) => {
      toast.success("Decision Recorded", { description: res.message });
      queryClient.invalidateQueries({ queryKey: ["approval-pending-queue"] });
      queryClient.invalidateQueries({ queryKey: ["approval-history", variables.researchId] });
      queryClient.invalidateQueries({ queryKey: ["research-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
};
