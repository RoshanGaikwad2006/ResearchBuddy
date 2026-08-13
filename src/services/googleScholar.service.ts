import apiClient from "./apiClient";

export interface ScholarPreviewResponse {
  message: string;
  preview: {
    authorId: string;
    name: string;
    affiliation?: string;
    emailDomain?: string;
    thumbnailUrl?: string;
    scholarUrl: string;
    interests: string[];
    totalCitations: number;
    hIndex: number;
    i10Index: number;
    publicationCount: number;
    isLiveScholarData?: boolean;
    publications: {
      scholarId?: string;
      title: string;
      authors: string;
      year?: number;
      journal?: string;
      citationCount: number;
      snippet?: string;
      doi?: string;
    }[];
  };
}

export interface ScholarSyncRunItem {
  id: string;
  syncRunId: string;
  facultyId: string;
  status: "RUNNING" | "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED" | "RATE_LIMITED";
  publicationsDiscovered: number;
  publicationsAdded: number;
  publicationsUpdated: number;
  citationsUpdated: number;
  error?: string;
  processedAt: string;
  faculty?: {
    id: string;
    employeeId: string;
    designation: string;
    scholarAuthorId?: string;
    user?: { id: string; name: string; email: string };
    department?: { id: string; name: string; code: string };
  };
}

export interface ScholarSyncRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: "RUNNING" | "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED" | "RATE_LIMITED";
  triggerType: "MANUAL_FACULTY" | "ADMIN_FACULTY" | "INSTITUTIONAL_MANUAL" | "INSTITUTIONAL_CRON";
  triggeredById?: string;
  facultiesProcessed: number;
  publicationsDiscovered: number;
  publicationsAdded: number;
  publicationsUpdated: number;
  citationsUpdated: number;
  errorsCount: number;
  triggeredBy?: { id: string; name: string; email: string };
  items?: ScholarSyncRunItem[];
}

export interface ScholarSyncResponse {
  message: string;
  faculty: any;
  profile: any;
  retryAfterSeconds?: number;
}

export const previewScholarProfileApi = async (input: string): Promise<ScholarPreviewResponse> => {
  const response = await apiClient.get<ScholarPreviewResponse>("/integrations/scholar/preview", {
    params: { scholarUrl: input },
  });
  return response.data;
};

export const syncMyScholarApi = async (scholarUrl?: string): Promise<ScholarSyncResponse> => {
  const response = await apiClient.post<ScholarSyncResponse>("/integrations/scholar/sync/me", {
    scholarUrl,
  });
  return response.data;
};

export const syncScholarProfileApi = async (
  facultyId: string,
  scholarUrl: string
): Promise<ScholarSyncResponse> => {
  const response = await apiClient.post<ScholarSyncResponse>(`/integrations/scholar/sync/${facultyId}`, {
    scholarUrl,
  });
  return response.data;
};

export const syncInstitutionScholarApi = async (options?: { force?: boolean; concurrency?: number }): Promise<{ message: string; run: ScholarSyncRun }> => {
  const response = await apiClient.post<{ message: string; run: ScholarSyncRun }>("/integrations/scholar/sync/institution", options || {});
  return response.data;
};

export const getScholarSyncRunsApi = async (): Promise<{ runs: ScholarSyncRun[] }> => {
  const response = await apiClient.get<{ runs: ScholarSyncRun[] }>("/integrations/scholar/runs");
  return response.data;
};

export const getScholarSyncRunByIdApi = async (runId: string): Promise<{ run: ScholarSyncRun }> => {
  const response = await apiClient.get<{ run: ScholarSyncRun }>(`/integrations/scholar/runs/${runId}`);
  return response.data;
};
