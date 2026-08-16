import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAuditHealth,
  fetchAuditIssueById,
  fetchAuditIssues,
  fetchAuditRuns,
  resolveAuditIssueApi,
  runAuditApi,
  runAutoFixApi,
} from "@/services/audit.service";
import { getStoredToken } from "@/services/apiClient";

export const useAuditHealth = (scopeType?: string, targetId?: string) => {
  return useQuery({
    queryKey: ["audit-health", scopeType, targetId],
    queryFn: () => fetchAuditHealth(scopeType, targetId),
    enabled: !!getStoredToken(),
    retry: 1,
  });
};

export const useAuditRuns = () => {
  return useQuery({
    queryKey: ["audit-runs"],
    queryFn: fetchAuditRuns,
    enabled: !!getStoredToken(),
    retry: 1,
  });
};

export const useAuditIssues = (params?: {
  severity?: string;
  issueType?: string;
  status?: string;
  departmentId?: string;
  facultyId?: string;
}) => {
  return useQuery({
    queryKey: ["audit-issues", params],
    queryFn: () => fetchAuditIssues(params),
    enabled: !!getStoredToken(),
    retry: 1,
  });
};

export const useAuditIssueDetail = (id?: string) => {
  return useQuery({
    queryKey: ["audit-issue-detail", id],
    queryFn: () => fetchAuditIssueById(id!),
    enabled: !!id && id !== "undefined" && !!getStoredToken(),
    retry: false,
  });
};

export const useRunAudit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: { scopeType?: string; targetId?: string | null }) => runAuditApi(payload),
    onSuccess: (data) => {
      toast.success("Audit Run Completed!", {
        description: `Scanned ${data.auditRun.recordsScanned} records. Health score: ${data.auditRun.healthScore}%.`,
      });
      queryClient.invalidateQueries({ queryKey: ["audit-health"] });
      queryClient.invalidateQueries({ queryKey: ["audit-runs"] });
      queryClient.invalidateQueries({ queryKey: ["audit-issues"] });
    },
    onError: (error: any) => {
      toast.error("Audit Run Failed", {
        description: error.response?.data?.message || "Failed to execute audit run.",
      });
    },
  });
};

export const useResolveAuditIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: any; reason?: string | undefined }) =>
      resolveAuditIssueApi(id, { action, reason }),
    onSuccess: () => {
      toast.success("Audit Issue Resolved", { description: "Issue action successfully recorded." });
      queryClient.invalidateQueries({ queryKey: ["audit-health"] });
      queryClient.invalidateQueries({ queryKey: ["audit-issues"] });
      queryClient.invalidateQueries({ queryKey: ["audit-issue-detail"] });
    },
    onError: (error: any) => {
      toast.error("Resolution Failed", {
        description: error.response?.data?.message || "Could not resolve audit issue.",
      });
    },
  });
};

export const useRunAutoFix = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => runAutoFixApi(),
    onSuccess: (data) => {
      toast.success("Safe Auto-Fix Executed", {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["audit-health"] });
      queryClient.invalidateQueries({ queryKey: ["audit-issues"] });
    },
    onError: (error: any) => {
      toast.error("Auto-Fix Failed", {
        description: error.response?.data?.message || "Failed to run auto-fix whitelist.",
      });
    },
  });
};
