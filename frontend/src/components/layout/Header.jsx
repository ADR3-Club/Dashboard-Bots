import { useState } from 'react';
import { Moon, Sun, LogOut, Key, Languages, LayoutDashboard, Clock, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useThemeStore from '../../stores/themeStore';
import useAuthStore from '../../stores/authStore';
import useLocaleStore from '../../stores/localeStore';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import ConfirmDialog from '../common/ConfirmDialog';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout, isAdmin } = useAuthStore();
  const { locale, toggleLocale, t } = useLocaleStore();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src="/NewLogo.png" alt="ADR3Club Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('header.title')}
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isActive('/dashboard') || isActive('/')
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden md:inline">{t('dashboard.title')}</span>
            </button>
            {/* Admin-only navigation items */}
            {isAdmin() && (
              <>
                <button
                  onClick={() => navigate('/history')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive('/history')
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="hidden md:inline">{t('history.title')}</span>
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive('/settings')
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span className="hidden md:inline">{t('settings.title')}</span>
                </button>
              </>
            )}
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
                  {user.role === 'admin' ? t('header.administrator') : t('header.user')}
                </p>
              </div>
            )}

            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              aria-label="Toggle language"
              title={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
            >
              <Languages className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">
                {locale}
              </span>
            </button>

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
              aria-label={t('header.changePassword')}
              title={t('header.changePassword')}
            >
              <Key className="w-5 h-5" />
            </button>

            {/* Logout button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
              aria-label={t('header.logout')}
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

      {/* Logout confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title={t('confirm.logout.title')}
        message={t('confirm.logout.message')}
        confirmText={t('confirm.logout.button')}
        cancelText={t('confirm.cancel')}
        type="warning"
      />
    </header>
  );
}
