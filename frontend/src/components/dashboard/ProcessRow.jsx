import { RefreshCw, FileText, Square, Play, TrendingUp, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { formatUptime, formatMemory, formatCPU } from '../../utils/formatters';
import { useRestartProcess, useStopProcess, useStartProcess } from '../../hooks/useProcesses';
import { useState, memo } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import MetricsModal from '../metrics/MetricsModal';
import useLocaleStore from '../../stores/localeStore';
import useAuthStore from '../../stores/authStore';
import useToast from '../../hooks/useToast';

function ProcessRow({ process, onViewLogs, selectedIds = [], onToggleSelect }) {
  const navigate = useNavigate();
  const { t } = useLocaleStore();
  const { isAdmin } = useAuthStore();
  const toast = useToast();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null });
  const [showMetrics, setShowMetrics] = useState(false);

  const restartMutation = useRestartProcess();
  const stopMutation = useStopProcess();
  const startMutation = useStartProcess();

  const isSelected = selectedIds.includes(process.pm_id);
  const showCheckbox = onToggleSelect !== undefined;

  const handleRestart = async () => {
    setIsActionLoading(true);
    try {
      await restartMutation.mutateAsync(process.pm_id);
      toast.success(`${process.name} redémarré`);
    } catch (error) {
      toast.error(`Erreur lors du redémarrage de ${process.name}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStop = async () => {
    setIsActionLoading(true);
    try {
      await stopMutation.mutateAsync(process.pm_id);
      toast.success(`${process.name} arrêté`);
    } catch (error) {
      toast.error(`Erreur lors de l'arrêt de ${process.name}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStart = async () => {
    setIsActionLoading(true);
    try {
      await startMutation.mutateAsync(process.pm_id);
      toast.success(`${process.name} démarré`);
    } catch (error) {
      toast.error(`Erreur lors du démarrage de ${process.name}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const openConfirmDialog = (action) => {
    setConfirmDialog({ isOpen: true, action });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, action: null });
  };

  const handleConfirm = () => {
    if (confirmDialog.action === 'restart') {
      handleRestart();
    } else if (confirmDialog.action === 'stop') {
      handleStop();
    }
  };

  const isOnline = (process.pm2_env?.status || process.status) === 'online';

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {showCheckbox && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(process.pm_id)}
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
          />
        </td>
      )}
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
        {process.pm_id}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {process.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={process.pm2_env?.status || process.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {isOnline ? formatUptime(process.pm2_env?.pm_uptime || process.uptime) : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {formatCPU(process.monit?.cpu || process.cpu)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {formatMemory(process.monit?.memory || process.memory)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {process.pm2_env?.restart_time || process.restarts || 0}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Admin-only action buttons */}
          {isAdmin() && (
            <>
              <button
                onClick={() => openConfirmDialog('restart')}
                disabled={isActionLoading}
                className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors disabled:opacity-50 border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                title={t('actions.restart')}
              >
                <RefreshCw className={`w-4 h-4 ${isActionLoading ? 'animate-spin' : ''}`} />
              </button>

              {isOnline ? (
                <button
                  onClick={() => openConfirmDialog('stop')}
                  disabled={isActionLoading}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                  title={t('actions.stop')}
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={isActionLoading}
                  className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors disabled:opacity-50 border border-transparent hover:border-green-200 dark:hover:border-green-800"
                  title={t('actions.start')}
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          <button
            onClick={() => onViewLogs(process)}
            className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
            title={t('actions.viewLogs')}
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowMetrics(true)}
            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
            title={t('actions.viewMetrics')}
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate(`/process/${encodeURIComponent(process.name)}`)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            title={t('processDetail.viewDetails')}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </td>

      {/* Metrics Modal */}
      {showMetrics && (
        <MetricsModal
          process={process}
          onClose={() => setShowMetrics(false)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirm}
        title={confirmDialog.action === 'restart' ? t('confirm.restart.title') : t('confirm.stop.title')}
        message={
          confirmDialog.action === 'restart'
            ? `${t('confirm.restart.message')} ${process.name}?`
            : `${t('confirm.stop.message')} ${process.name}?`
        }
        confirmText={confirmDialog.action === 'restart' ? t('confirm.restart.button') : t('confirm.stop.button')}
        cancelText={t('confirm.cancel')}
        type={confirmDialog.action === 'restart' ? 'warning' : 'danger'}
      />
    </tr>
  );
}

export default memo(ProcessRow);
