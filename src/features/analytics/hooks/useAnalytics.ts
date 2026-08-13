import { useQuery } from "@tanstack/react-query";
import { fetchOverviewAnalytics } from "@/services/analytics.service";
import { getStoredToken } from "@/services/apiClient";

export const useOverviewAnalytics = () => {
  return useQuery({
    queryKey: ["analytics-overview"],
    queryFn: fetchOverviewAnalytics,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!getStoredToken(),
    retry: 1,
  });
};
