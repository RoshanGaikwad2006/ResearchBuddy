import apiClient from "./apiClient";

export interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  headId?: string;
  createdAt: string;
  head?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  _count?: {
    faculties: number;
    students: number;
    researches: number;
  };
}

export interface CreateDepartmentPayload {
  code: string;
  name: string;
  headId?: string | null;
}

export const fetchDepartmentList = async (): Promise<{ departments: DepartmentItem[] }> => {
  const response = await apiClient.get<{ departments: DepartmentItem[] }>("/departments");
  return response.data;
};

export const fetchDepartmentById = async (id: string): Promise<{ department: DepartmentItem }> => {
  const response = await apiClient.get<{ department: DepartmentItem }>(`/departments/${id}`);
  return response.data;
};

export const createDepartmentApi = async (data: CreateDepartmentPayload): Promise<{ department: DepartmentItem }> => {
  const response = await apiClient.post<{ department: DepartmentItem }>("/departments", data);
  return response.data;
};

export const updateDepartmentApi = async (
  id: string,
  data: Partial<CreateDepartmentPayload>
): Promise<{ department: DepartmentItem }> => {
  const response = await apiClient.put<{ department: DepartmentItem }>(`/departments/${id}`, data);
  return response.data;
};

export const deleteDepartmentApi = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/departments/${id}`);
  return response.data;
};
