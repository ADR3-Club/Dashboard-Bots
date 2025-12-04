import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSSE } from './useSSE';
import { metricsAPI } from '../services/api';

export function useMetricsStream() {
  const [processes, setProcesses] = useState([]);

  const handleMessage = useCallback((data) => {
    if (data.type === 'metrics' && data.processes) {
      setProcesses(data.processes);
    }
  }, []);

  const { error, isConnected, close } = useSSE(
    metricsAPI.getStreamUrl(),
    {
      enabled: true,
      onMessage: handleMessage,
    }
  );

  return {
    processes,
    error,
    isConnected,
    close,
  };
}

/**
 * Hook to fetch historical metrics for a specific process
 * @param {number} pmId - Process ID
 * @param {number} range - Time range in minutes (default: 120 = 2 hours)
 * @param {boolean} enabled - Whether to fetch
 */
export function useProcessMetrics(pmId, range = 120, enabled = true) {
  return useQuery({
    queryKey: ['metrics', pmId, range],
    queryFn: async () => {
      const response = await metricsAPI.getHistory(pmId, range);
      return response.data.metrics;
    },
    refetchInterval: range <= 60 ? 5000 : 30000, // Refresh faster for shorter ranges
    placeholderData: (previousData) => previousData,
    enabled,
  });
}

/**
 * Hook to fetch latest metrics for all processes
 */
export function useLatestMetrics() {
  return useQuery({
    queryKey: ['metrics', 'latest'],
    queryFn: async () => {
      const response = await metricsAPI.getLatest();
      return response.data.metrics;
    },
    refetchInterval: 2000, // Refresh every 2 seconds
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch metrics service statistics
 */
export function useMetricsStats() {
  return useQuery({
    queryKey: ['metrics', 'stats'],
    queryFn: async () => {
      const response = await metricsAPI.getStats();
      return response.data.stats;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export default useMetricsStream;
