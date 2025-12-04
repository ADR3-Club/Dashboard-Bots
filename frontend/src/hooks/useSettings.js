import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../services/api';

/**
 * Hook to fetch webhook settings
 */
export function useWebhookSettings() {
  return useQuery({
    queryKey: ['settings', 'webhooks'],
    queryFn: async () => {
      const response = await settingsAPI.getWebhooks();
      return response.data.settings;
    },
  });
}

/**
 * Hook to update webhook settings
 */
export function useUpdateWebhookSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings) => settingsAPI.updateWebhooks(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'webhooks'] });
    },
  });
}

/**
 * Hook to test webhook
 */
export function useTestWebhook() {
  return useMutation({
    mutationFn: (type) => settingsAPI.testWebhook(type),
  });
}

/**
 * Hook to get cleanup settings
 */
export function useCleanupSettings() {
  return useQuery({
    queryKey: ['settings', 'cleanup'],
    queryFn: async () => {
      const response = await settingsAPI.getCleanup();
      return response.data.settings;
    },
  });
}

/**
 * Hook to update cleanup settings
 */
export function useUpdateCleanupSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings) => settingsAPI.updateCleanup(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'cleanup'] });
    },
  });
}
