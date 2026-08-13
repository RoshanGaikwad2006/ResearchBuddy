import { useQuery } from "@tanstack/react-query";
import {
  fetchDepartmentSubgraph,
  fetchFacultySubgraph,
  fetchGraphAnalytics,
  fetchKnowledgeGraph,
} from "../../../services/knowledgeGraph.service";

export const useKnowledgeGraph = (params?: {
  departmentId?: string;
  facultyId?: string;
  topicName?: string;
  yearStart?: number;
  yearEnd?: number;
  depth?: number;
  limitNodes?: number;
}) => {
  return useQuery({
    queryKey: ["knowledgeGraph", params],
    queryFn: () => fetchKnowledgeGraph(params),
  });
};

export const useFacultySubgraph = (facultyId: string) => {
  return useQuery({
    queryKey: ["facultySubgraph", facultyId],
    queryFn: () => fetchFacultySubgraph(facultyId),
    enabled: !!facultyId,
  });
};

export const useDepartmentSubgraph = (departmentId: string) => {
  return useQuery({
    queryKey: ["departmentSubgraph", departmentId],
    queryFn: () => fetchDepartmentSubgraph(departmentId),
    enabled: !!departmentId,
  });
};

export const useGraphAnalytics = () => {
  return useQuery({
    queryKey: ["graphAnalytics"],
    queryFn: fetchGraphAnalytics,
  });
};
