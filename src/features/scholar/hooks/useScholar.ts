import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  previewScholarProfileApi,
  syncMyScholarApi,
  syncScholarProfileApi,
  syncInstitutionScholarApi,
  getScholarSyncRunsApi,
  getScholarSyncRunByIdApi,
} from "@/services/googleScholar.service";

export const useSyncMyScholar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scholarUrl?: string) => syncMyScholarApi(scholarUrl),
    onSuccess: (res) => {
      toast.success("My Scholar Profile Synchronized!", {
        description: res.message,
      });
      queryClient.invalidateQueries({ queryKey: ["my-faculty-profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-research-list"] });
      queryClient.invalidateQueries({ queryKey: ["faculty-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (err: any) => {
      if (err.response?.status === 429) {
        toast.warning("Scholar Sync Cooldown Active", {
          description: err.response?.data?.message || "Scholar profile was recently synchronized. Please wait a few minutes.",
        });
      } else {
        toast.error("Scholar Synchronization Failed", {
          description: err.response?.data?.message || err.message || "Synchronization encountered an error.",
        });
      }
    },
  });
};

export const useScholarPreview = () => {
  return useMutation({
    mutationFn: (scholarUrl: string) => previewScholarProfileApi(scholarUrl),
    onSuccess: (res) => {
      toast.success("Google Scholar Profile Preview Fetched", {
        description: `Found profile for ${res.preview.name} (${res.preview.totalCitations} Citations, h-index: ${res.preview.hIndex})`,
      });
    },
    onError: (err: any) => {
      toast.error("Google Scholar Preview Failed", {
        description: err.response?.data?.message || err.message || "Failed to fetch profile preview.",
      });
    },
  });
};

export const useSyncScholar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ facultyId, scholarUrl }: { facultyId: string; scholarUrl: string }) =>
      syncScholarProfileApi(facultyId, scholarUrl),
    onSuccess: (res) => {
      toast.success("Scholar Profile Synchronized!", {
        description: res.message,
      });
      queryClient.invalidateQueries({ queryKey: ["faculty-list"] });
      queryClient.invalidateQueries({ queryKey: ["research-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
    },
    onError: (err: any) => {
      if (err.response?.status === 429) {
        toast.warning("Scholar Sync Cooldown Active", {
          description: err.response?.data?.message || "Scholar profile was recently synchronized. Please wait a few minutes.",
        });
      } else {
        toast.error("Scholar Synchronization Failed", {
          description: err.response?.data?.message || err.message || "Synchronization encountered an error.",
        });
      }
    },
  });
};

export const useSyncInstitutionalScholar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options?: { force?: boolean; concurrency?: number }) =>
      syncInstitutionScholarApi(options),
    onSuccess: (res) => {
      toast.success("Institutional Sync Completed!", {
        description: `Status: ${res.run.status} | Discovered: ${res.run.publicationsDiscovered} | Added: ${res.run.publicationsAdded}`,
      });
      queryClient.invalidateQueries({ queryKey: ["scholar-sync-runs"] });
      queryClient.invalidateQueries({ queryKey: ["faculty-list"] });
      queryClient.invalidateQueries({ queryKey: ["research-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
    },
    onError: (err: any) => {
      toast.error("Institutional Sync Failed", {
        description: err.response?.data?.message || err.message || "Institutional sync encountered an error.",
      });
    },
  });
};

export const useScholarSyncRuns = () => {
  return useQuery({
    queryKey: ["scholar-sync-runs"],
    queryFn: () => getScholarSyncRunsApi(),
  });
};

export const useScholarSyncRunDetail = (runId?: string) => {
  return useQuery({
    queryKey: ["scholar-sync-run-detail", runId],
    queryFn: () => (runId ? getScholarSyncRunByIdApi(runId) : null),
    enabled: !!runId,
  });
};
