import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import ProcessDetail from './pages/ProcessDetail';
import ErrorBoundary from './components/common/ErrorBoundary';
import useAuthStore from './stores/authStore';
import useThemeStore from './stores/themeStore';
import useSessionTimeout from './hooks/useSessionTimeout';
import useServerRestart from './hooks/useServerRestart';
import ToastContainer from './components/common/Toast';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected route component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Admin-only route component
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const { initTheme } = useThemeStore();

  // Session management hooks
  useSessionTimeout();
  useServerRestart();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ErrorBoundary title="Dashboard Error" message="An error occurred while loading the dashboard.">
                    <Dashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <AdminRoute>
                  <ErrorBoundary title="History Error" message="An error occurred while loading the history.">
                    <History />
                  </ErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <AdminRoute>
                  <ErrorBoundary title="Settings Error" message="An error occurred while loading settings.">
                    <Settings />
                  </ErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/process/:name"
              element={
                <ProtectedRoute>
                  <ErrorBoundary title="Process Details Error" message="An error occurred while loading process details.">
                    <ProcessDetail />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
