import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createDepartmentApi,
  deleteDepartmentApi,
  fetchDepartmentById,
  fetchDepartmentList,
  updateDepartmentApi,
  type CreateDepartmentPayload,
} from "@/services/department.service";
import { getStoredToken } from "@/services/apiClient";

export const useDepartmentList = () => {
  return useQuery({
    queryKey: ["department-list"],
    queryFn: fetchDepartmentList,
    enabled: !!getStoredToken(),
    retry: 1,
  });
};

export const useDepartmentDetail = (id?: string) => {
  return useQuery({
    queryKey: ["department-detail", id],
    queryFn: () => fetchDepartmentById(id!),
    enabled: !!id && !!getStoredToken(),
    retry: 1,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDepartmentPayload) => createDepartmentApi(data),
    onSuccess: () => {
      toast.success("Department Created", { description: "New department added." });
      queryClient.invalidateQueries({ queryKey: ["department-list"] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDepartmentPayload> }) => updateDepartmentApi(id, data),
    onSuccess: (_, variables) => {
      toast.success("Department Updated", { description: "Department changes saved." });
      queryClient.invalidateQueries({ queryKey: ["department-list"] });
      queryClient.invalidateQueries({ queryKey: ["department-detail", variables.id] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartmentApi(id),
    onSuccess: () => {
      toast.success("Department Deleted", { description: "Department removed." });
      queryClient.invalidateQueries({ queryKey: ["department-list"] });
    },
  });
};
