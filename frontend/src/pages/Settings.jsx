import { useState, useEffect } from 'react';
import { Save, TestTube2, Bell, Trash2, Users, Plus, Pencil, Trash, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useWebhookSettings, useUpdateWebhookSettings, useTestWebhook, useCleanupSettings, useUpdateCleanupSettings } from '../hooks/useSettings';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import useLocaleStore from '../stores/localeStore';
import useAuthStore from '../stores/authStore';
import useToast from '../hooks/useToast';

export default function Settings() {
  const { t } = useLocaleStore();
  const toast = useToast();
  const { isAdmin, user: currentUser } = useAuthStore();
  const { data: settings, isLoading } = useWebhookSettings();
  const { data: cleanupSettings, isLoading: cleanupLoading } = useCleanupSettings();
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const updateMutation = useUpdateWebhookSettings();
  const updateCleanupMutation = useUpdateCleanupSettings();
  const testMutation = useTestWebhook();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [formData, setFormData] = useState({
    discordEnabled: false,
    discordWebhookUrl: '',
    slackEnabled: false,
    slackWebhookUrl: '',
    notifyOnCrash: true,
    notifyOnAlert: true,
  });

  const [cleanupData, setCleanupData] = useState({
    retentionDays: 30,
  });

  // User management state
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    role: 'user',
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (cleanupSettings) {
      setCleanupData({ retentionDays: cleanupSettings.retentionDays });
    }
  }, [cleanupSettings]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCleanupChange = (field, value) => {
    setCleanupData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveWebhooks = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error(t('settings.saveError'));
    }
  };

  const handleSaveCleanup = async () => {
    try {
      await updateCleanupMutation.mutateAsync(cleanupData);
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error(t('settings.saveError'));
    }
  };

  const handleTest = async (type) => {
    try {
      // Save settings first so the webhook URL is in the database
      await updateMutation.mutateAsync(formData);
      await testMutation.mutateAsync(type);
      toast.success(t('settings.webhooks.testSent'));
    } catch (error) {
      toast.error(t('settings.webhooks.testError'));
    }
  };

  // User management handlers
  const handleUserFormChange = (field, value) => {
    setUserFormData(prev => ({ ...prev, [field]: value }));
  };

  const openAddUserForm = () => {
    setEditingUser(null);
    setUserFormData({ username: '', password: '', role: 'user' });
    setShowUserForm(true);
  };

  const openEditUserForm = (user) => {
    setEditingUser(user);
    setUserFormData({ username: user.username, password: '', role: user.role });
    setShowUserForm(true);
  };

  const closeUserForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
    setUserFormData({ username: '', password: '', role: 'user' });
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          data: {
            username: userFormData.username,
            password: userFormData.password || undefined,
            role: userFormData.role,
          },
        });
        toast.success(t('users.updated'));
      } else {
        await createUserMutation.mutateAsync(userFormData);
        toast.success(t('users.created'));
      }
      closeUserForm();
    } catch (error) {
      toast.error(editingUser ? t('users.updateError') : t('users.createError'));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('users.confirmDelete'))) return;
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success(t('users.deleted'));
    } catch (error) {
      toast.error(t('users.deleteError'));
    }
  };

  if (isLoading || cleanupLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Webhook Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.webhooks.title')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('settings.webhooks.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Discord Webhook */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Discord
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('settings.webhooks.discordDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.discordEnabled}
                    onChange={(e) => handleChange('discordEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {formData.discordEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.webhooks.webhookUrl')}
                    </label>
                    <input
                      type="url"
                      value={formData.discordWebhookUrl}
                      onChange={(e) => handleChange('discordWebhookUrl', e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.webhooks.discordUrlHelp')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTest('discord')}
                    disabled={testMutation.isPending || !formData.discordWebhookUrl}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <TestTube2 className="w-4 h-4" />
                    {t('settings.webhooks.test')}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Slack Webhook */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Slack
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('settings.webhooks.slackDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.slackEnabled}
                    onChange={(e) => handleChange('slackEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {formData.slackEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.webhooks.webhookUrl')}
                    </label>
                    <input
                      type="url"
                      value={formData.slackWebhookUrl}
                      onChange={(e) => handleChange('slackWebhookUrl', e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.webhooks.slackUrlHelp')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTest('slack')}
                    disabled={testMutation.isPending || !formData.slackWebhookUrl}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <TestTube2 className="w-4 h-4" />
                    {t('settings.webhooks.test')}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Notification Preferences */}
            <div className="space-y-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                {t('settings.webhooks.preferences')}
              </h3>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifyOnCrash}
                  onChange={(e) => handleChange('notifyOnCrash', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('settings.webhooks.notifyOnCrash')}
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('settings.webhooks.notifyOnCrashDesc')}
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifyOnAlert}
                  onChange={(e) => handleChange('notifyOnAlert', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('settings.webhooks.notifyOnAlert')}
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('settings.webhooks.notifyOnAlertDesc')}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer with Save button */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={handleSaveWebhooks}
              disabled={updateMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </div>

        {/* Cleanup Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Trash2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.cleanup.title')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('settings.cleanup.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.cleanup.retentionDays')}
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={cleanupData.retentionDays}
                onChange={(e) => handleCleanupChange('retentionDays', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('settings.cleanup.retentionHelp')}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-medium">{t('settings.cleanup.autoCleanup')}</span>
                <br />
                {t('settings.cleanup.autoCleanupDesc')}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={handleSaveCleanup}
              disabled={updateCleanupMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateCleanupMutation.isPending ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </div>

        {/* User Management Card - Admin only */}
        {isAdmin() && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('users.title')}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('users.subtitle')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={openAddUserForm}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('users.addUser')}
                </button>
              </div>
            </div>

            <div className="p-6">
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : usersData?.users?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('users.username')}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('users.role')}
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('users.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData.users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {user.username}
                            {user.id === currentUser?.id && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                {t('users.you')}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {user.role === 'admin' ? t('users.roleAdmin') : t('users.roleUser')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditUserForm(user)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                                title={t('users.edit')}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                                  title={t('users.delete')}
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t('users.noUsers')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* User Form Modal */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingUser ? t('users.edit') : t('users.addUser')}
                </h3>
                <button
                  onClick={closeUserForm}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('users.username')}
                  </label>
                  <input
                    type="text"
                    value={userFormData.username}
                    onChange={(e) => handleUserFormChange('username', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      userFormData.username.length > 0 && userFormData.username.length < 3
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${
                    userFormData.username.length > 0 && userFormData.username.length < 3
                      ? 'text-red-500'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {t('users.usernameRequirement')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {editingUser ? t('users.newPassword') : t('users.password')}
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => handleUserFormChange('password', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      userFormData.password.length > 0 && userFormData.password.length < 12
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${
                    userFormData.password.length > 0 && userFormData.password.length < 12
                      ? 'text-red-500'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {t('users.passwordRequirement')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('users.role')}
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => handleUserFormChange('role', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">{t('users.roleUser')}</option>
                    <option value="admin">{t('users.roleAdmin')}</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={closeUserForm}
                  className="btn btn-secondary"
                >
                  {t('users.cancel')}
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={
                    createUserMutation.isPending ||
                    updateUserMutation.isPending ||
                    userFormData.username.length < 3 ||
                    (!editingUser && userFormData.password.length < 12) ||
                    (editingUser && userFormData.password.length > 0 && userFormData.password.length < 12)
                  }
                  className="btn btn-primary"
                >
                  {(createUserMutation.isPending || updateUserMutation.isPending) ? '...' : t('users.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
