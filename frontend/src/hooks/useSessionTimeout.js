import { useEffect, useRef, useCallback } from 'react';
import useAuthStore from '../stores/authStore';
import useLocaleStore from '../stores/localeStore';
import useToastStore from '../stores/toastStore';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useSessionTimeout() {
  const { logout, isAuthenticated } = useAuthStore();
  const { t } = useLocaleStore();
  const { addToast } = useToastStore();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isAuthenticated) {
      timeoutRef.current = setTimeout(() => {
        logout();
        addToast({
          type: 'warning',
          title: t('session.expired'),
          message: t('login.signIn'),
          duration: 7000
        });
      }, SESSION_TIMEOUT);
    }
  }, [isAuthenticated, logout, t, addToast]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Activity events to monitor
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimeout();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated, resetTimeout]);

  return null;
}

export default useSessionTimeout;
