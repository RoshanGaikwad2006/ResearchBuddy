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

export interface ResearchIdentityResponse {
  facultyId: string;
  userId: string;
  name: string;
  email: string;
  designation: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  scholarProfileUrl?: string;
  scholarAuthorId?: string;
  scholarAvatarUrl?: string;
  orcid?: string;
  researcherId?: string;
  otherResearcherId?: string;
  institutionalAffiliation: string;
  researchInterests: string[];
  profileCompleteness: number;
  missingProfileFields: string[];
  status: {
    scholar: string;
    orcid: string;
    researcherId: string;
    wos: string;
  };
  metrics: {
    publicationCount: number;
    journalCount: number;
    conferenceCount: number;
    totalCitations: number;
    hIndex: number;
    i10Index: number;
    citationSources: {
      googleScholar: number;
      openAlex: number;
      crossref: number;
      webOfScience: string;
    };
  };
  lastSyncTime?: string;
}

export const fetchMyResearchIdentity = async (): Promise<ResearchIdentityResponse> => {
  const response = await apiClient.get<ResearchIdentityResponse>("/faculty/me/research-identity");
  return response.data;
};

export const updateMyResearchIdentity = async (data: {
  departmentId?: string;
  scholarInput?: string;
  orcidInput?: string;
  researcherId?: string;
  otherResearcherId?: string;
  institutionalAffiliation?: string;
  researchInterests?: string[];
}): Promise<ResearchIdentityResponse> => {
  const response = await apiClient.put<ResearchIdentityResponse>("/faculty/me/research-identity", data);
  return response.data;
};

export const syncMyResearchProfile = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>("/faculty/me/sync-research");
  return response.data;
};

export const updateAuthorAffiliationApi = async (
  researchId: string,
  authorId: string,
  affiliation: string
): Promise<any> => {
  const response = await apiClient.patch(`/researches/${researchId}/authors/${authorId}/affiliation`, { affiliation });
  return response.data;
};

export const deleteFacultyApi = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/faculty/${id}`);
  return response.data;
};
