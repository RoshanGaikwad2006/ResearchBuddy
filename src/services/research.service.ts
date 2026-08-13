import apiClient from "./apiClient";

export type ResearchStatusType =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "PUBLISHED"
  | "NEEDS_REVISION"
  | "REJECTED";

export interface ResearchAuthorItem {
  id?: string;
  facultyId?: string | null;
  studentId?: string | null;
  authorName: string;
  authorOrder: number;
  isCorresponding?: boolean;
  affiliation?: string | null;
  affiliationSource?: string | null;
  affiliationStatus?: string | null;
  faculty?: { user: { name: string; email: string } };
  student?: { user: { name: string; email: string } };
}

export interface ResearchItem {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  researchArea: string;
  doi?: string;
  journal?: string;
  conference?: string;
  venueType?: string;
  patentNumber?: string;
  isbn?: string;
  publicationYear: number;
  pdfUrl?: string;
  citationCount: number;
  status: ResearchStatusType;
  departmentId?: string;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string; email: string; role: string };
  department?: { id: string; code: string; name: string };
  authors: ResearchAuthorItem[];
  approvals?: any[];
}

export interface ResearchListResponse {
  items: ResearchItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateResearchPayload {
  title: string;
  abstract: string;
  keywords: string[];
  researchArea: string;
  doi?: string | null;
  journal?: string | null;
  conference?: string | null;
  venueType?: string | null;
  patentNumber?: string | null;
  isbn?: string | null;
  publicationYear: number;
  pdfUrl?: string | null;
  departmentId?: string | null;
  authors: {
    facultyId?: string | null;
    studentId?: string | null;
    authorName: string;
    authorOrder: number;
    isCorresponding?: boolean;
  }[];
}

export const fetchMyResearches = async (params?: {
  search?: string;
  status?: ResearchStatusType;
  publicationYear?: number;
  page?: number;
  limit?: number;
}): Promise<ResearchListResponse> => {
  const response = await apiClient.get<ResearchListResponse>("/researches/my", { params });
  return response.data;
};

export const fetchResearchList = async (params?: {
  search?: string;
  status?: ResearchStatusType;
  departmentId?: string;
  publicationYear?: number;
  createdById?: string;
  page?: number;
  limit?: number;
}): Promise<ResearchListResponse> => {
  const response = await apiClient.get<ResearchListResponse>("/researches", { params });
  return response.data;
};

export const fetchResearchById = async (id: string): Promise<{ research: ResearchItem }> => {
  const response = await apiClient.get<{ research: ResearchItem }>(`/researches/${id}`);
  return response.data;
};

export const createResearchApi = async (data: CreateResearchPayload): Promise<{ research: ResearchItem }> => {
  const response = await apiClient.post<{ research: ResearchItem }>("/researches", data);
  return response.data;
};

export const updateResearchApi = async (
  id: string,
  data: Partial<CreateResearchPayload>
): Promise<{ research: ResearchItem }> => {
  const response = await apiClient.put<{ research: ResearchItem }>(`/researches/${id}`, data);
  return response.data;
};

export const deleteResearchApi = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/researches/${id}`);
  return response.data;
};
