import { useState, useCallback, useRef, useEffect } from 'react';
import { useSSE } from './useSSE';
import { logsAPI } from '../services/api';

export function useLogStream(processId) {
  const [logs, setLogs] = useState([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const maxLogs = 500; // Keep last 500 lines

  const handleMessage = useCallback((data) => {
    if (data.type === 'log') {
      setLogs((prev) => {
        const newLogs = [...prev, data];
        // Keep only last maxLogs lines
        if (newLogs.length > maxLogs) {
          return newLogs.slice(-maxLogs);
        }
        return newLogs;
      });
    } else if (data.type === 'error') {
      console.error('Log stream error:', data.message);
    }
  }, []);

  const { error, isConnected, close } = useSSE(
    processId !== null && processId !== undefined ? logsAPI.getStreamUrl(processId) : null,
    {
      enabled: processId !== null && processId !== undefined,
      onMessage: handleMessage,
    }
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleAutoScroll = useCallback(() => {
    setIsAutoScroll((prev) => !prev);
  }, []);

  return {
    logs,
    error,
    isConnected,
    isAutoScroll,
    clearLogs,
    toggleAutoScroll,
    close,
  };
}

export default useLogStream;
