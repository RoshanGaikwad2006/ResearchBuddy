import apiClient from "./apiClient";

export interface StudentItem {
  id: string;
  userId: string;
  rollNumber: string;
  departmentId: string;
  guideFacultyId?: string;
  academicYear: string;
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
  guideFaculty?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
}

export interface StudentListResponse {
  items: StudentItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateStudentPayload {
  userId: string;
  rollNumber: string;
  departmentId: string;
  guideFacultyId?: string | null;
  academicYear: string;
}

export const fetchStudentList = async (params?: {
  search?: string | undefined;
  departmentId?: string | undefined;
  guideFacultyId?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}): Promise<StudentListResponse> => {
  const response = await apiClient.get<StudentListResponse>("/students", { params });
  return response.data;
};

export const fetchMyStudentProfile = async (): Promise<{ student: StudentItem }> => {
  const response = await apiClient.get<{ student: StudentItem }>("/students/me");
  return response.data;
};

export const fetchStudentById = async (id: string): Promise<{ student: StudentItem }> => {
  const response = await apiClient.get<{ student: StudentItem }>(`/students/${id}`);
  return response.data;
};

export const createStudentApi = async (data: CreateStudentPayload): Promise<{ student: StudentItem }> => {
  const response = await apiClient.post<{ student: StudentItem }>("/students", data);
  return response.data;
};

export const updateStudentApi = async (
  id: string,
  data: Partial<CreateStudentPayload>
): Promise<{ student: StudentItem }> => {
  const response = await apiClient.put<{ student: StudentItem }>(`/students/${id}`, data);
  return response.data;
};

export const deleteStudentApi = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/students/${id}`);
  return response.data;
};
