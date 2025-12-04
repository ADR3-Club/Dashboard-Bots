import { RefreshCw, FileText, Square, Play } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatUptime, formatMemory, formatCPU } from '../../utils/formatters';
import { useRestartProcess, useStopProcess, useStartProcess } from '../../hooks/useProcesses';
import { useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';

export default function ProcessRow({ process, onViewLogs }) {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null });

  const restartMutation = useRestartProcess();
  const stopMutation = useStopProcess();
  const startMutation = useStartProcess();

  const handleRestart = async () => {
    setIsActionLoading(true);
    try {
      await restartMutation.mutateAsync(process.pm_id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStop = async () => {
    setIsActionLoading(true);
    try {
      await stopMutation.mutateAsync(process.pm_id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStart = async () => {
    setIsActionLoading(true);
    try {
      await startMutation.mutateAsync(process.pm_id);
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

  const isOnline = process.status === 'online';

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
        <StatusBadge status={process.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {formatUptime(process.uptime)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {formatCPU(process.cpu)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {formatMemory(process.memory)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {process.restarts}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => openConfirmDialog('restart')}
            disabled={isActionLoading}
            className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors disabled:opacity-50 border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
            title="Restart"
          >
            <RefreshCw className={`w-4 h-4 ${isActionLoading ? 'animate-spin' : ''}`} />
          </button>

          {isOnline ? (
            <button
              onClick={() => openConfirmDialog('stop')}
              disabled={isActionLoading}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 border border-transparent hover:border-red-200 dark:hover:border-red-800"
              title="Stop"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isActionLoading}
              className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors disabled:opacity-50 border border-transparent hover:border-green-200 dark:hover:border-green-800"
              title="Start"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onViewLogs(process)}
            className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
            title="View logs"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </td>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirm}
        title={confirmDialog.action === 'restart' ? 'Restart Process' : 'Stop Process'}
        message={
          confirmDialog.action === 'restart'
            ? `Are you sure you want to restart ${process.name}?`
            : `Are you sure you want to stop ${process.name}?`
        }
        confirmText={confirmDialog.action === 'restart' ? 'Restart' : 'Stop'}
        cancelText="Cancel"
        type={confirmDialog.action === 'restart' ? 'warning' : 'danger'}
      />
    </tr>
  );
}
