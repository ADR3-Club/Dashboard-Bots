import { useState, useEffect } from 'react';
import { Save, TestTube2, Bell, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useWebhookSettings, useUpdateWebhookSettings, useTestWebhook, useCleanupSettings, useUpdateCleanupSettings } from '../hooks/useSettings';
import useLocaleStore from '../stores/localeStore';
import useToast from '../hooks/useToast';

export default function Settings() {
  const { t } = useLocaleStore();
  const toast = useToast();
  const { data: settings, isLoading } = useWebhookSettings();
  const { data: cleanupSettings, isLoading: cleanupLoading } = useCleanupSettings();
  const updateMutation = useUpdateWebhookSettings();
  const updateCleanupMutation = useUpdateCleanupSettings();
  const testMutation = useTestWebhook();

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

  const handleSave = async () => {
    try {
      await Promise.all([
        updateMutation.mutateAsync(formData),
        updateCleanupMutation.mutateAsync(cleanupData),
      ]);
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error(t('settings.saveError'));
    }
  };

  const handleTest = async (type) => {
    try {
      await testMutation.mutateAsync(type);
      toast.success(t('settings.testSent'));
    } catch (error) {
      toast.error(t('settings.testError'));
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
              onClick={handleSave}
              disabled={updateMutation.isPending || updateCleanupMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {(updateMutation.isPending || updateCleanupMutation.isPending) ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
