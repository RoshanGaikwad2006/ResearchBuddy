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
  publicationDate?: string;
  conferenceDate?: string;
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
  abstractSource?: string;
  provenance?: any;
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
  search?: string | undefined;
  status?: ResearchStatusType | undefined;
  publicationYear?: number | undefined;
  month?: number | string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}): Promise<ResearchListResponse> => {
  const response = await apiClient.get<ResearchListResponse>("/researches/my", { params });
  return response.data;
};

export const fetchResearchList = async (params?: {
  search?: string | undefined;
  status?: ResearchStatusType | undefined;
  departmentId?: string | undefined;
  publicationYear?: number | undefined;
  month?: number | string | undefined;
  createdById?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
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

export const enrichAllPublicationDatesApi = async (): Promise<{
  message: string;
  totalCandidates: number;
  enrichedCount: number;
}> => {
  const response = await apiClient.post("/researches/enrich-all-dates");
  return response.data;
};

export const enrichPublicationDateApi = async (
  id: string
): Promise<{ message: string; research: ResearchItem }> => {
  const response = await apiClient.post(`/researches/${id}/enrich-date`);
  return response.data;
};

export const updateResearchDatesApi = async (
  id: string,
  dates: {
    publicationDate?: string;
    conferenceDate?: string;
    publicationYear?: number;
  }
): Promise<{ message: string; research: ResearchItem }> => {
  const response = await apiClient.patch(`/researches/${id}/dates`, dates);
  return response.data;
};

export interface ParsedManuscriptResult {
  title: string;
  authors: { authorName: string; authorOrder: number }[];
  abstract: string;
  keywords: string[];
  submissionDate?: string;
  conferenceDate?: string;
  venueType?: "JOURNAL" | "CONFERENCE" | "BOOK_CHAPTER";
  targetVenue?: string;
  wordCount: number;
  extractedTextPreview?: string;
}

export const uploadManuscriptApi = async (data: {
  filename: string;
  fileBase64: string;
  createPaper?: boolean;
}): Promise<{
  message: string;
  parsed: ParsedManuscriptResult;
  research?: ResearchItem;
}> => {
  const response = await apiClient.post("/researches/upload-manuscript", data);
  return response.data;
};

