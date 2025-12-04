import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Square,
  FileText,
  Activity,
  Clock,
  Cpu,
  HardDrive,
  Server,
  FolderOpen,
  Terminal,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import MetricsChart from '../components/metrics/MetricsChart';
import LogViewer from '../components/logs/LogViewer';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { processesAPI } from '../services/api';
import useLocaleStore from '../stores/localeStore';
import useToast from '../hooks/useToast';

// Format uptime
function formatUptime(ms) {
  if (!ms || ms <= 0) return '-';
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Format bytes
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString();
}

// Status badge component
function StatusBadge({ status }) {
  const colors = {
    online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    stopped: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    stopping: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    errored: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    launching: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.stopped}`}>
      {status}
    </span>
  );
}

export default function ProcessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocaleStore();
  const toast = useToast();

  const [showLogs, setShowLogs] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Fetch process details
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['processDetails', id],
    queryFn: async () => {
      const response = await processesAPI.getDetails(id);
      return response.data;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Mutations
  const restartMutation = useMutation({
    mutationFn: () => processesAPI.restart(id),
    onSuccess: () => {
      toast.success(t('processDetail.restarted'));
      queryClient.invalidateQueries(['processDetails', id]);
    },
    onError: () => toast.error(t('processDetail.restartError')),
  });

  const stopMutation = useMutation({
    mutationFn: () => processesAPI.stop(id),
    onSuccess: () => {
      toast.success(t('processDetail.stopped'));
      queryClient.invalidateQueries(['processDetails', id]);
    },
    onError: () => toast.error(t('processDetail.stopError')),
  });

  const startMutation = useMutation({
    mutationFn: () => processesAPI.start(id),
    onSuccess: () => {
      toast.success(t('processDetail.started'));
      queryClient.invalidateQueries(['processDetails', id]);
    },
    onError: () => toast.error(t('processDetail.startError')),
  });

  const handleAction = (action) => {
    setConfirmAction(action);
  };

  const executeAction = () => {
    if (confirmAction === 'restart') restartMutation.mutate();
    else if (confirmAction === 'stop') stopMutation.mutate();
    else if (confirmAction === 'start') startMutation.mutate();
    setConfirmAction(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('processDetail.back')}
          </button>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{t('processDetail.notFound')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { details, history } = data;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {details.name}
                </h1>
                <StatusBadge status={details.status} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                PM2 ID: {details.pm_id} • PID: {details.pid || '-'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('dashboard.refresh')}
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            {details.status === 'online' ? (
              <>
                <button
                  onClick={() => handleAction('restart')}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('actions.restart')}
                </button>
                <button
                  onClick={() => handleAction('stop')}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  {t('actions.stop')}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleAction('start')}
                className="btn btn-primary flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {t('actions.start')}
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{t('table.uptime')}</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatUptime(details.uptime)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Cpu className="w-4 h-4" />
              <span className="text-sm">{t('table.cpu')}</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {details.cpu?.toFixed(1) || 0}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <HardDrive className="w-4 h-4" />
              <span className="text-sm">{t('table.memory')}</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatBytes(details.memory)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">{t('table.restarts')}</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {details.restarts}
            </p>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className={`btn flex items-center gap-2 ${showMetrics ? 'btn-primary' : 'btn-secondary'}`}
          >
            {showMetrics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <Activity className="w-4 h-4" />
            {t('actions.viewMetrics')}
          </button>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`btn flex items-center gap-2 ${showLogs ? 'btn-primary' : 'btn-secondary'}`}
          >
            {showLogs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <FileText className="w-4 h-4" />
            {t('actions.viewLogs')}
          </button>
        </div>

        {/* Metrics Chart */}
        {showMetrics && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <MetricsChart processId={parseInt(id)} processName={details.name} />
          </div>
        )}

        {/* Process Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Details Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('processDetail.info')}
                </h2>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <InfoRow label={t('processDetail.script')} value={details.script} mono />
              <InfoRow label={t('processDetail.cwd')} value={details.cwd} mono />
              <InfoRow label={t('processDetail.interpreter')} value={details.interpreter} />
              <InfoRow label={t('processDetail.nodeVersion')} value={details.nodeVersion} />
              <InfoRow label={t('processDetail.execMode')} value={details.execMode} />
              <InfoRow label={t('processDetail.instances')} value={details.instances} />
              <InfoRow label={t('processDetail.autorestart')} value={details.autorestart ? 'Yes' : 'No'} />
              <InfoRow label={t('processDetail.watch')} value={details.watch ? 'Yes' : 'No'} />
            </div>
          </div>

          {/* Recent History Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('processDetail.recentHistory')}
                </h2>
              </div>
            </div>
            <div className="p-4">
              {history && history.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          event.reason?.includes('crash') ? 'bg-red-500' :
                          event.reason?.includes('stop') ? 'bg-gray-500' :
                          'bg-green-500'
                        }`} />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {t(`history.event.${event.reason}`) || event.reason}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(event.restart_time)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('processDetail.noHistory')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Logs Paths Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('processDetail.logPaths')}
              </h2>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <InfoRow label={t('processDetail.outLog')} value={details.outLogPath} mono />
            <InfoRow label={t('processDetail.errLog')} value={details.errLogPath} mono />
            <InfoRow label={t('processDetail.pidFile')} value={details.pidPath} mono />
          </div>
        </div>
      </div>

      {/* Log Viewer Modal */}
      {showLogs && (
        <LogViewer
          process={{ pm_id: parseInt(id), name: details.name }}
          onClose={() => setShowLogs(false)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeAction}
        title={t(`confirm.${confirmAction}.title`)}
        message={`${t(`confirm.${confirmAction}.message`)} ${details.name}?`}
        confirmText={t(`confirm.${confirmAction}.button`)}
        cancelText={t('confirm.cancel')}
        type={confirmAction === 'stop' ? 'danger' : 'warning'}
      />
    </Layout>
  );
}

// Helper component for info rows
function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400 sm:w-32 flex-shrink-0">
        {label}
      </span>
      <span className={`text-sm text-gray-900 dark:text-white break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '-'}
      </span>
    </div>
  );
}
