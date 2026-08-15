import apiClient from "./apiClient";

export type GraphNodeType =
  | "FACULTY"
  | "STUDENT"
  | "DEPARTMENT"
  | "RESEARCH"
  | "TOPIC"
  | "RESEARCH_GAP"
  | "COLLABORATION";

export type GraphEdgeType =
  | "AUTHORED"
  | "MEMBER_OF"
  | "HAS_TOPIC"
  | "CO_AUTHORED_WITH"
  | "POTENTIAL_COLLABORATOR"
  | "RELEVANT_TO"
  | "RELATED_TOPIC";

export interface GraphNodeItem {
  id: string;
  type: GraphNodeType;
  label: string;
  subtitle?: string;
  category?: string;
  val: number;
  color?: string;
  metadata: Record<string, any>;
}

export interface GraphEdgeItem {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label?: string;
  weight: number;
  metadata?: Record<string, any>;
}

export interface KnowledgeGraphResponse {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    facultyCount: number;
    researchCount: number;
    topicCount: number;
    gapCount: number;
    collaborationCount: number;
  };
}

export interface GraphAnalyticsResponse {
  topConnectedFaculty: any[];
  topResearchTopics: any[];
  crossDepartmentCollaborationsCount: number;
  emergingTopicCount: number;
}

export const fetchKnowledgeGraph = async (params?: {
  departmentId?: string | undefined;
  facultyId?: string | undefined;
  topicName?: string | undefined;
  yearStart?: number | undefined;
  yearEnd?: number | undefined;
  depth?: number | undefined;
  limitNodes?: number | undefined;
}): Promise<KnowledgeGraphResponse> => {
  const response = await apiClient.get<KnowledgeGraphResponse>("/knowledge-graph", { params });
  return response.data;
};

export const fetchFacultySubgraph = async (facultyId: string): Promise<KnowledgeGraphResponse> => {
  const response = await apiClient.get<KnowledgeGraphResponse>(`/knowledge-graph/faculty/${facultyId}`);
  return response.data;
};

export const fetchDepartmentSubgraph = async (departmentId: string): Promise<KnowledgeGraphResponse> => {
  const response = await apiClient.get<KnowledgeGraphResponse>(`/knowledge-graph/department/${departmentId}`);
  return response.data;
};

export const fetchGraphAnalytics = async (): Promise<GraphAnalyticsResponse> => {
  const response = await apiClient.get<GraphAnalyticsResponse>("/knowledge-graph/analytics");
  return response.data;
};
