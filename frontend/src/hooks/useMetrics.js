import { useState, useCallback } from 'react';
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

export default useMetricsStream;
