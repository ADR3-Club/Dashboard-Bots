import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsAPI } from '../services/api';

/**
 * Hook to fetch active alerts
 */
export function useAlerts(options = {}) {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await alertsAPI.getAlerts();
      return response.data.alerts;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    placeholderData: (previousData) => previousData,
    ...options
  });
}

/**
 * Hook to fetch alert statistics
 */
export function useAlertStatistics() {
  return useQuery({
    queryKey: ['alerts', 'statistics'],
    queryFn: async () => {
      const response = await alertsAPI.getStatistics();
      return response.data.statistics;
    },
    refetchInterval: 30000,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch alert settings
 */
export function useAlertSettings() {
  return useQuery({
    queryKey: ['alerts', 'settings'],
    queryFn: async () => {
      const response = await alertsAPI.getSettings();
      return response.data.settings;
    },
  });
}

/**
 * Hook to update alert settings
 */
export function useUpdateAlertSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings) => alertsAPI.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/**
 * Hook to dismiss an alert
 */
export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pmId, processName }) => alertsAPI.dismissAlert(pmId, processName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'statistics'] });
    },
  });
}

/**
 * Hook to check if a specific process has an alert
 */
export function useCheckProcessAlert(pmId, processName, enabled = true) {
  return useQuery({
    queryKey: ['alerts', 'check', pmId, processName],
    queryFn: async () => {
      const response = await alertsAPI.checkProcess(pmId, processName);
      return response.data.alert;
    },
    enabled: enabled && !!pmId && !!processName,
  });
}
