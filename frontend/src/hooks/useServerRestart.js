import { useEffect, useRef } from 'react';
import axios from 'axios';
import useAuthStore from '../stores/authStore';
import useLocaleStore from '../stores/localeStore';
import useToastStore from '../stores/toastStore';

const CHECK_INTERVAL = 30000; // Check every 30 seconds

export function useServerRestart() {
  const { logout, isAuthenticated } = useAuthStore();
  const { t } = useLocaleStore();
  const { addToast } = useToastStore();
  const serverIdRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkServerId = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('/api/auth/server-id', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const currentServerId = response.data.serverId;

        if (serverIdRef.current === null) {
          // First check - store the ID
          serverIdRef.current = currentServerId;
        } else if (serverIdRef.current !== currentServerId) {
          // Server ID changed - server was restarted
          clearInterval(intervalRef.current);
          logout();
          addToast({
            type: 'warning',
            title: t('session.expired'),
            message: t('login.signIn'),
            duration: 7000
          });
        }
      } catch (error) {
        // If we get an error (like 401), the session is already invalid
        console.error('Error checking server ID:', error);
      }
    };

    // Initial check
    checkServerId();

    // Set up interval
    intervalRef.current = setInterval(checkServerId, CHECK_INTERVAL);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, logout, t]);

  return null;
}

export default useServerRestart;
