import { AlertTriangle } from 'lucide-react';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // 'warning', 'danger', 'info'
}) {
  // Keyboard shortcuts (only when open)
  useKeyboardShortcuts({
    'escape': onClose,
  }, isOpen);

  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      icon: 'text-yellow-600 dark:text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    danger: {
      icon: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    info: {
      icon: 'text-primary-600 dark:text-primary-400',
      button: 'bg-primary-600 hover:bg-primary-700 text-white'
    }
  };

  const style = typeStyles[type] || typeStyles.warning;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${style.icon}`} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${style.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
