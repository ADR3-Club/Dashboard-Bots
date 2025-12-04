import { useEffect, useState, useRef } from 'react';

export function useSSE(url, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const { enabled = true, onMessage, onError, onConnect } = options;

  useEffect(() => {
    if (!enabled || !url) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token');
      return;
    }

    // Add token to URL as query parameter for SSE
    const urlWithToken = `${url}${url.includes('?') ? '&' : '?'}token=${token}`;

    const eventSource = new EventSource(urlWithToken);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      if (onConnect) onConnect();
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
        if (onMessage) onMessage(parsedData);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
        setError(err.message);
        if (onError) onError(err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setError('Connection error');
      setIsConnected(false);
      if (onError) onError(err);

      // Close and try to reconnect after 3 seconds
      eventSource.close();
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          // Only reconnect if this is still the active connection
          eventSourceRef.current = null;
        }
      }, 3000);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [url, enabled, onMessage, onError, onConnect]);

  const close = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  };

  return {
    data,
    error,
    isConnected,
    close,
  };
}

export default useSSE;
