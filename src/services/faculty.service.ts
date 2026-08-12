import apiClient from "./apiClient";

export interface FacultyItem {
  id: string;
  userId: string;
  employeeId: string;
  designation: string;
  departmentId: string;
  orcid?: string;
  scholarUrl?: string;
  researchInterests: string[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  department: {
    id: string;
    code: string;
    name: string;
  };
}

export interface FacultyListResponse {
  items: FacultyItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateFacultyPayload {
  userId: string;
  employeeId: string;
  designation: string;
  departmentId: string;
  orcid?: string;
  scholarUrl?: string;
  researchInterests?: string[];
}

export const fetchFacultyList = async (params?: {
  search?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}): Promise<FacultyListResponse> => {
  const response = await apiClient.get<FacultyListResponse>("/faculty", { params });
  return response.data;
};

export const fetchMyFacultyProfile = async (): Promise<{ faculty: FacultyItem }> => {
  const response = await apiClient.get<{ faculty: FacultyItem }>("/faculty/me");
  return response.data;
};

export const fetchFacultyById = async (id: string): Promise<{ faculty: FacultyItem }> => {
  const response = await apiClient.get<{ faculty: FacultyItem }>(`/faculty/${id}`);
  return response.data;
};

export const createFacultyApi = async (data: CreateFacultyPayload): Promise<{ faculty: FacultyItem }> => {
  const response = await apiClient.post<{ faculty: FacultyItem }>("/faculty", data);
  return response.data;
};

export const updateFacultyApi = async (
  id: string,
  data: Partial<CreateFacultyPayload>
): Promise<{ faculty: FacultyItem }> => {
  const response = await apiClient.put<{ faculty: FacultyItem }>(`/faculty/${id}`, data);
  return response.data;
};

export const deleteFacultyApi = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/faculty/${id}`);
  return response.data;
};
