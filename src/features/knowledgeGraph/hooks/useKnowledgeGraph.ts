import { useQuery } from "@tanstack/react-query";
import {
  fetchDepartmentSubgraph,
  fetchFacultySubgraph,
  fetchGraphAnalytics,
  fetchKnowledgeGraph,
} from "../../../services/knowledgeGraph.service";

export const useKnowledgeGraph = (params?: {
  departmentId?: string | undefined;
  facultyId?: string | undefined;
  topicName?: string | undefined;
  yearStart?: number | undefined;
  yearEnd?: number | undefined;
  depth?: number | undefined;
  limitNodes?: number | undefined;
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
