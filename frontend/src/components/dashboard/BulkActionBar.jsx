import { RefreshCw, Square, X, CheckCircle } from 'lucide-react';
import useLocaleStore from '../../stores/localeStore';
import useAuthStore from '../../stores/authStore';
import { useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';

export default function BulkActionBar({ selectedIds, onClearSelection, onBulkRestart, onBulkStop }) {
  const { t } = useLocaleStore();
  const { isAdmin } = useAuthStore();
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null });

  // Hide bulk actions for non-admin users
  if (selectedIds.length === 0 || !isAdmin()) return null;

  const openConfirmDialog = (action) => {
    setConfirmDialog({ isOpen: true, action });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, action: null });
  };

  const handleConfirm = async () => {
    if (confirmDialog.action === 'restart') {
      await onBulkRestart();
    } else if (confirmDialog.action === 'stop') {
      await onBulkStop();
    }
    closeConfirmDialog();
  };

  return (
    <>
      <div className="fixed bottom-4 left-2 right-2 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40 animate-slide-up">
        <div className="card px-3 md:px-6 py-3 md:py-4 shadow-2xl border-2 border-primary-500 dark:border-primary-600">
          <div className="flex items-center justify-between md:justify-start gap-2 md:gap-4">
            {/* Selection count */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary-600 dark:text-primary-400" />
              <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {selectedIds.length}
              </span>
            </div>

            {/* Divider - hidden on mobile */}
            <div className="hidden md:block h-8 w-px bg-gray-300 dark:bg-gray-600" />

            {/* Actions */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={() => openConfirmDialog('restart')}
                className="btn btn-sm bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1 md:gap-2 px-2 md:px-3"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">{t('bulk.restart')}</span>
              </button>

              <button
                onClick={() => openConfirmDialog('stop')}
                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 md:gap-2 px-2 md:px-3"
              >
                <Square className="w-4 h-4" />
                <span className="hidden sm:inline">{t('bulk.stop')}</span>
              </button>

              <button
                onClick={onClearSelection}
                className="btn btn-sm btn-secondary flex items-center gap-1 md:gap-2 px-2 md:px-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirm}
        title={
          confirmDialog.action === 'restart'
            ? t('bulk.confirm.restart.title')
            : t('bulk.confirm.stop.title')
        }
        message={
          confirmDialog.action === 'restart'
            ? `${t('bulk.confirm.restart.message')} ${selectedIds.length} ${t('bulk.processes')}?`
            : `${t('bulk.confirm.stop.message')} ${selectedIds.length} ${t('bulk.processes')}?`
        }
        confirmText={
          confirmDialog.action === 'restart'
            ? t('bulk.confirm.restart.button')
            : t('bulk.confirm.stop.button')
        }
        cancelText={t('confirm.cancel')}
        type={confirmDialog.action === 'restart' ? 'warning' : 'danger'}
      />
    </>
  );
}
