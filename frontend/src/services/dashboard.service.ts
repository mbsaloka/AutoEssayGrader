import { apiClient } from "@/lib/api-client";
import { DashboardStats, RecentActivity } from "@/types";

export const dashboardService = {
  // Get dashboard statistics for current user
  getStats: async (): Promise<DashboardStats> => {
    return apiClient.get<DashboardStats>("/api/dashboard/stats");
  },

  // Get recent activities for current user
  getRecentActivity: async (): Promise<RecentActivity[]> => {
    return apiClient.get<RecentActivity[]>("/api/dashboard/recent-activity");
  },
};

