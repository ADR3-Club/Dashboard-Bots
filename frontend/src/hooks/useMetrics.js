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
 * Returns last 60 data points (2 minutes) collected every 2 seconds
 */
export function useProcessMetrics(pmId, enabled = true) {
  return useQuery({
    queryKey: ['metrics', pmId],
    queryFn: async () => {
      const response = await metricsAPI.getHistory(pmId);
      return response.data.metrics;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
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
