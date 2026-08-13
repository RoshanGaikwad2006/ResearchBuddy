import apiClient from "./apiClient";

export interface IntelligenceMetrics {
  totalIndexed: number;
  totalTopics: number;
  openGapsCount: number;
  potentialCollaborationsCount: number;
}

export interface ResearchTopicItem {
  id: string;
  name: string;
  normalizedName: string;
  category?: string;
  researchCount: number;
}

export interface ResearchGapItem {
  id?: string;
  gapTitle: string;
  description: string;
  institutionalEvidence: string;
  externalEvidence: string;
  aiInference: string;
  relatedTopics: string[] | string;
  confidence: number;
  opportunityScore: number;
  supportingResearchIds?: string[];
  limitations: string;
  generatedAt?: string;
}

export interface FacultySummary {
  id: string;
  name?: string;
  designation: string;
  departmentName: string;
  user?: { name: string };
}

export interface CollaborationRecommendationItem {
  id?: string;
  facultyA: FacultySummary;
  facultyB: FacultySummary;
  compatibilityScore: number;
  sharedTopics: string[] | string;
  complementaryExpertise: string[] | string;
  potentialDirection: string;
  evidence: any;
  reasoning: string;
}

export interface IntelligenceOverviewResponse {
  metrics: IntelligenceMetrics;
  topics: ResearchTopicItem[];
  gaps: ResearchGapItem[];
  collaborations: CollaborationRecommendationItem[];
}

export interface CopilotEvidenceItem {
  researchId?: string;
  title: string;
  doi?: string;
  authors?: string;
  year?: number;
  source: string;
}

export interface RAGCopilotResponse {
  query: string;
  answer: string;
  evidence: CopilotEvidenceItem[];
  latencyMs: number;
  modelUsed: string;
  resultStatus: "SUCCESS" | "REFUSAL" | "FALLBACK";
}

export const fetchIntelligenceOverview = async (): Promise<IntelligenceOverviewResponse> => {
  const response = await apiClient.get<IntelligenceOverviewResponse>("/intelligence/overview");
  return response.data;
};

export const triggerGapAnalysisApi = async (domainQuery?: string, departmentId?: string): Promise<{ gaps: ResearchGapItem[] }> => {
  const response = await apiClient.post<{ gaps: ResearchGapItem[] }>("/intelligence/gaps/analyze", {
    domainQuery,
    departmentId,
  });
  return response.data;
};

export const triggerCollaborationAnalysisApi = async (departmentId?: string): Promise<{ collaborations: CollaborationRecommendationItem[] }> => {
  const response = await apiClient.post<{ collaborations: CollaborationRecommendationItem[] }>("/intelligence/collaborations/analyze", {
    departmentId,
  });
  return response.data;
};

export const queryRAGCopilotApi = async (query: string, departmentId?: string): Promise<RAGCopilotResponse> => {
  const response = await apiClient.post<RAGCopilotResponse>("/intelligence/query", {
    query,
    departmentId,
  });
  return response.data;
};

export const reindexIntelligenceApi = async (): Promise<{ message: string; embeddingStatus: any; topicStatus: any }> => {
  const response = await apiClient.post<{ message: string; embeddingStatus: any; topicStatus: any }>("/intelligence/reindex");
  return response.data;
};
