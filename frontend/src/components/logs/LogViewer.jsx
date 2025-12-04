import { useEffect, useRef } from 'react';
import { X, Download, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useLogStream } from '../../hooks/useLogs';
import { formatDateTime } from '../../utils/formatters';

export default function LogViewer({ process, onClose }) {
  console.log('[LogViewer] Process:', process);
  console.log('[LogViewer] Process ID:', process?.pm_id);
  const { logs, isConnected, clearLogs, isAutoScroll } = useLogStream(process?.pm_id);
  const logContainerRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  if (!process) return null;

  const handleExport = () => {
    const logText = logs.map(log => `[${formatDateTime(log.timestamp)}] ${log.line}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${process.name}-logs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-5xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Logs: {process.name}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <Wifi className="w-4 h-4" />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <WifiOff className="w-4 h-4" />
                  <span>Disconnected</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearLogs}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title="Export logs"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Logs content */}
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-900 font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {isConnected ? 'Waiting for logs...' : 'Connecting...'}
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="text-gray-300 hover:bg-gray-800 px-2 py-1 rounded"
                >
                  <span className="text-gray-500 mr-3">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={log.historical ? 'text-gray-400' : ''}>
                    {log.line}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            {logs.length} lines
          </div>
          <div>
            Auto-scroll: {isAutoScroll ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>
    </div>
  );
}
