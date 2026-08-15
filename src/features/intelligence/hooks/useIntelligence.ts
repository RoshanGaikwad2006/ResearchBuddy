import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchIntelligenceOverview,
  queryRAGCopilotApi,
  reindexIntelligenceApi,
  triggerCollaborationAnalysisApi,
  triggerGapAnalysisApi,
} from "../../../services/intelligence.service";

export const useIntelligenceOverview = () => {
  return useQuery({
    queryKey: ["intelligenceOverview"],
    queryFn: fetchIntelligenceOverview,
  });
};

export const useAnalyzeGaps = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { domainQuery?: string | undefined; departmentId?: string | undefined }) =>
      triggerGapAnalysisApi(params.domainQuery, params.departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligenceOverview"] });
    },
  });
};

export const useAnalyzeCollaborations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId?: string | void) => triggerCollaborationAnalysisApi(departmentId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligenceOverview"] });
    },
  });
};

export const useRAGCopilot = () => {
  return useMutation({
    mutationFn: (params: { query: string; departmentId?: string | undefined }) =>
      queryRAGCopilotApi(params.query, params.departmentId),
  });
};

export const useReindexIntelligence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reindexIntelligenceApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligenceOverview"] });
    },
  });
};
