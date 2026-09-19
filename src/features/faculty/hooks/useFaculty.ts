import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  createFacultyApi,
  deleteFacultyApi,
  fetchFacultyById,
  fetchFacultyList,
  fetchMyFacultyProfile,
  updateFacultyApi,
  updateFacultyRoleApi,
  type CreateFacultyPayload,
} from "@/services/faculty.service";
import { getStoredToken } from "@/services/apiClient";

export const useMyFacultyProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-faculty-profile", user?.id],
    queryFn: fetchMyFacultyProfile,
    enabled: !!getStoredToken() && !!user?.id,
    retry: 1,
  });
};

export const useFacultyList = (params?: {
  search?: string | undefined;
  departmentId?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}) => {
  return useQuery({
    queryKey: ["faculty-list", params],
    queryFn: () => fetchFacultyList(params),
    enabled: !!getStoredToken(),
    retry: 1,
  });
};

export const useFacultyDetail = (id?: string) => {
  return useQuery({
    queryKey: ["faculty-detail", id],
    queryFn: () => fetchFacultyById(id!),
    enabled: !!id,
    retry: 1,
  });
};

export const useCreateFaculty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFacultyPayload) => createFacultyApi(data),
    onSuccess: () => {
      toast.success("Faculty Profile Created", { description: "New faculty member successfully added." });
      queryClient.invalidateQueries({ queryKey: ["faculty-list"] });
    },
  });
};

export const useUpdateFaculty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateFacultyPayload> }) => updateFacultyApi(id, data),
    onSuccess: (_, variables) => {
      toast.success("Faculty Profile Updated", { description: "Changes saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["faculty-list"] });
      queryClient.invalidateQueries({ queryKey: ["faculty-detail", variables.id] });
    },
  });
};

export const useDeleteFaculty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFacultyApi(id),
    onSuccess: () => {
      toast.success("Faculty Profile Deleted", { description: "Faculty member removed." });
      queryClient.invalidateQueries({ queryKey: ["faculty-list"] });
    },
  });
};

export const useUpdateFacultyRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ facultyId, role }: { facultyId: string; role: string }) =>
      updateFacultyRoleApi(facultyId, role),
    onSuccess: (data) => {
      toast.success("Role Updated", { description: data.message || "Faculty role changed successfully." });
      queryClient.invalidateQueries({ queryKey: ["faculty-list"] });
      queryClient.invalidateQueries({ queryKey: ["faculty-detail"] });
    },
    onError: (err: any) => {
      toast.error("Role Update Failed", { description: err?.response?.data?.message || "Could not update role." });
    },
  });
};
