import { useQuery } from '@tanstack/react-query';
import { historyAPI } from '../services/api';

/**
 * Hook to fetch combined timeline of all events (restarts, crashes, stops, starts, deletes)
 */
export function useHistory(filters = {}) {
  return useQuery({
    queryKey: ['history', 'timeline', filters],
    queryFn: async () => {
      const response = await historyAPI.getTimeline(filters);
      return response.data.timeline;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch history statistics
 */
export function useHistoryStats(range = '24h') {
  return useQuery({
    queryKey: ['history', 'stats', range],
    queryFn: async () => {
      const response = await historyAPI.getStatistics(range);
      return response.data.statistics;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook to fetch restart history only
 */
export function useRestartHistory(filters = {}) {
  return useQuery({
    queryKey: ['history', 'restarts', filters],
    queryFn: async () => {
      const response = await historyAPI.getRestarts(filters);
      return response.data.restarts;
    },
    refetchInterval: 30000,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch crash history only
 */
export function useCrashHistory(filters = {}) {
  return useQuery({
    queryKey: ['history', 'crashes', filters],
    queryFn: async () => {
      const response = await historyAPI.getCrashes(filters);
      return response.data.crashes;
    },
    refetchInterval: 30000,
    placeholderData: (previousData) => previousData,
  });
}
