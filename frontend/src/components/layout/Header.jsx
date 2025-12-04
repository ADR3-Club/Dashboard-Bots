import { useState } from 'react';
import { Moon, Sun, LogOut, Activity, Key } from 'lucide-react';
import useThemeStore from '../../stores/themeStore';
import useAuthStore from '../../stores/authStore';
import ChangePasswordModal from '../auth/ChangePasswordModal';

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                ADR3Club Bot Dashboard
              </h1>
            </div>
          </div>

          {/* Right side - User info, theme toggle, logout */}
          <div className="flex items-center space-x-4">
            {/* User info */}
            {user && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Administrator
                </p>
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* Change password button */}
            <button
              onClick={() => setShowChangePassword(true)}
              className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors"
              aria-label="Change password"
              title="Change password"
            >
              <Key className="w-5 h-5" />
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Change password modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </header>
  );
}
