import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  createResearchApi,
  deleteResearchApi,
  fetchMyResearches,
  fetchResearchById,
  fetchResearchList,
  updateResearchApi,
  type CreateResearchPayload,
  type ResearchStatusType,
} from "@/services/research.service";
import { getStoredToken } from "@/services/apiClient";

export const useMyResearchList = (params?: {
  search?: string;
  status?: ResearchStatusType;
  publicationYear?: number;
  page?: number;
  limit?: number;
}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-research-list", user?.id, params],
    queryFn: () => fetchMyResearches(params),
    enabled: !!getStoredToken() && !!user?.id,
    retry: 1,
  });
};

export const useResearchList = (params?: {
  search?: string;
  status?: ResearchStatusType;
  departmentId?: string;
  publicationYear?: number;
  createdById?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["research-list", params],
    queryFn: () => fetchResearchList(params),
    enabled: !!getStoredToken(),
    retry: 1,
  });
};

export const useResearchDetail = (id?: string) => {
  return useQuery({
    queryKey: ["research-detail", id],
    queryFn: () => fetchResearchById(id!),
    enabled: !!id && !!getStoredToken(),
    retry: 1,
  });
};

export const useCreateResearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateResearchPayload) => createResearchApi(data),
    onSuccess: () => {
      toast.success("Research Submitted", { description: "Publication submitted for Research Cell review." });
      queryClient.invalidateQueries({ queryKey: ["research-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
};

export const useUpdateResearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateResearchPayload> }) => updateResearchApi(id, data),
    onSuccess: (_, variables) => {
      toast.success("Research Publication Updated", { description: "Changes saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["research-list"] });
      queryClient.invalidateQueries({ queryKey: ["research-detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
};

export const useDeleteResearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteResearchApi(id),
    onSuccess: () => {
      toast.success("Research Publication Deleted", { description: "Publication record removed." });
      queryClient.invalidateQueries({ queryKey: ["research-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
};
