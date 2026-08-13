import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "@/services/dashboard.service";
import { getStoredToken } from "@/services/apiClient";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const useDashboardMetrics = () => {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["dashboard-metrics", user?.id, role],
    queryFn: fetchDashboardMetrics,
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!getStoredToken() && !!user?.id,
    retry: 1,
  });
};
