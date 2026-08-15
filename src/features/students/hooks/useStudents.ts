import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  createStudentApi,
  deleteStudentApi,
  fetchMyStudentProfile,
  fetchStudentById,
  fetchStudentList,
  updateStudentApi,
  type CreateStudentPayload,
} from "@/services/student.service";
import { getStoredToken } from "@/services/apiClient";

export const useMyStudentProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-student-profile", user?.id],
    queryFn: fetchMyStudentProfile,
    enabled: !!getStoredToken() && !!user?.id,
    retry: 1,
  });
};

export const useStudentList = (params?: {
  search?: string | undefined;
  departmentId?: string | undefined;
  guideFacultyId?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}) => {
  return useQuery({
    queryKey: ["student-list", params],
    queryFn: () => fetchStudentList(params),
    enabled: !!getStoredToken(),
    retry: 1,
  });
};

export const useStudentDetail = (id?: string) => {
  return useQuery({
    queryKey: ["student-detail", id],
    queryFn: () => fetchStudentById(id!),
    enabled: !!id && !!getStoredToken(),
    retry: 1,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentPayload) => createStudentApi(data),
    onSuccess: () => {
      toast.success("Student Profile Created", { description: "New student record added successfully." });
      queryClient.invalidateQueries({ queryKey: ["student-list"] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStudentPayload> }) => updateStudentApi(id, data),
    onSuccess: (_, variables) => {
      toast.success("Student Profile Updated", { description: "Changes saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["student-list"] });
      queryClient.invalidateQueries({ queryKey: ["student-detail", variables.id] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStudentApi(id),
    onSuccess: () => {
      toast.success("Student Profile Deleted", { description: "Student record removed." });
      queryClient.invalidateQueries({ queryKey: ["student-list"] });
    },
  });
};
