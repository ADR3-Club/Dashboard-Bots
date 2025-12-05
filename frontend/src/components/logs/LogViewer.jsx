import { useEffect, useRef, useState, useMemo } from 'react';
import { X, Download, Trash2, Wifi, WifiOff, Search } from 'lucide-react';
import { useLogStream } from '../../hooks/useLogs';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import { formatDateTime } from '../../utils/formatters';

// Highlight matching text in logs
function highlightMatch(text, term) {
  if (!term) return text;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-400 text-black px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function LogViewer({ process, onClose }) {
  const { logs, isConnected, clearLogs, isAutoScroll } = useLogStream(process?.pm_id);
  const logContainerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'escape': onClose,
  });

  // Filter logs by search term
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(log => log.line.toLowerCase().includes(term));
  }, [logs, searchTerm]);

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
        className="card w-full max-w-5xl max-h-[85vh] flex flex-col mx-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700">
          {/* Top row: title + status + close */}
          <div className="flex items-center justify-between mb-2 md:mb-0">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {process.name}
              </h2>
              <div className="flex items-center gap-1 text-xs md:text-sm flex-shrink-0">
                {isConnected ? (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Wifi className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <WifiOff className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Disconnected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <button
                onClick={clearLogs}
                className="p-1.5 md:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={handleExport}
                className="p-1.5 md:p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors"
                title="Export logs"
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* Search input - full width on mobile */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="pl-9 pr-3 py-1.5 w-full md:w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Logs content */}
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-900 font-mono text-sm"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {searchTerm ? 'No matching logs found' : (isConnected ? 'Waiting for logs...' : 'Connecting...')}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className="text-gray-300 hover:bg-gray-800 px-2 py-1 rounded"
                >
                  <span className="text-gray-500 mr-3">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={log.historical ? 'text-gray-400' : ''}>
                    {searchTerm ? highlightMatch(log.line, searchTerm) : log.line}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 md:px-6 py-2 md:py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs md:text-sm text-gray-600 dark:text-gray-400">
          <div>
            {searchTerm ? `${filteredLogs.length}/${logs.length}` : logs.length} lines
          </div>
          <div>
            Auto-scroll: {isAutoScroll ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>
    </div>
  );
}
