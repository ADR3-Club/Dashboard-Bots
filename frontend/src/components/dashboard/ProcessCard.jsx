import { RefreshCw, FileText, Square, Play } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatUptime, formatMemory, formatCPU } from '../../utils/formatters';
import { useRestartProcess, useStopProcess, useStartProcess } from '../../hooks/useProcesses';
import { useState, memo } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import useLocaleStore from '../../stores/localeStore';

function ProcessCard({ process, onViewLogs }) {
  const { t } = useLocaleStore();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null });

  const restartMutation = useRestartProcess();
  const stopMutation = useStopProcess();
  const startMutation = useStartProcess();

  const isOnline = (process.pm2_env?.status || process.status) === 'online';

  const openConfirmDialog = (action) => {
    setConfirmDialog({ isOpen: true, action });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, action: null });
  };

  const handleConfirm = async () => {
    if (confirmDialog.action === 'restart') {
      await handleRestart();
    } else if (confirmDialog.action === 'stop') {
      await handleStop();
    }
    closeConfirmDialog();
  };

  const handleRestart = async () => {
    setIsActionLoading(true);
    try {
      await restartMutation.mutateAsync(process.pm_id);
    } catch (error) {
      console.error('Restart error:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStop = async () => {
    setIsActionLoading(true);
    try {
      await stopMutation.mutateAsync(process.pm_id);
    } catch (error) {
      console.error('Stop error:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStart = async () => {
    setIsActionLoading(true);
    try {
      await startMutation.mutateAsync(process.pm_id);
    } catch (error) {
      console.error('Start error:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      <div className="card p-4 hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                #{process.pm_id}
              </span>
              <StatusBadge status={process.pm2_env?.status || process.status} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {process.name}
            </h3>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('table.uptime')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {isOnline ? formatUptime(process.pm2_env?.pm_uptime || process.uptime) : '-'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('table.cpu')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCPU(process.monit?.cpu || process.cpu)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('table.memory')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatMemory(process.monit?.memory || process.memory)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('table.restarts')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {process.pm2_env?.restart_time || process.restarts || 0}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openConfirmDialog('restart')}
            disabled={isActionLoading}
            className="flex-1 btn btn-sm btn-secondary flex items-center justify-center gap-2"
            title={t('actions.restart')}
          >
            <RefreshCw className={`w-4 h-4 ${isActionLoading ? 'animate-spin' : ''}`} />
            {t('actions.restart')}
          </button>

          {isOnline ? (
            <button
              onClick={() => openConfirmDialog('stop')}
              disabled={isActionLoading}
              className="flex-1 btn btn-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 flex items-center justify-center gap-2"
              title={t('actions.stop')}
            >
              <Square className="w-4 h-4" />
              {t('actions.stop')}
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isActionLoading}
              className="flex-1 btn btn-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 flex items-center justify-center gap-2"
              title={t('actions.start')}
            >
              <Play className="w-4 h-4" />
              {t('actions.start')}
            </button>
          )}

          <button
            onClick={() => onViewLogs(process)}
            className="btn btn-sm bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/40"
            title={t('actions.viewLogs')}
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

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
    </>
  );
}

export default memo(ProcessCard);
