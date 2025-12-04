import { useEffect, useRef, useState, useMemo } from 'react';
import { Download, Trash2, Wifi, WifiOff, Search } from 'lucide-react';
import { useLogStream } from '../../hooks/useLogs';
import { formatDateTime } from '../../utils/formatters';
import useLocaleStore from '../../stores/localeStore';

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

export default function LogViewerInline({ process }) {
  const { t } = useLocaleStore();
  const { logs, isConnected, clearLogs, isAutoScroll } = useLogStream(process?.pm_id);
  const logContainerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('logs.title')}: {process.name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <Wifi className="w-4 h-4" />
                <span>{t('logs.connected')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <WifiOff className="w-4 h-4" />
                <span>{t('logs.disconnected')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('logs.search')}
              className="pl-9 pr-3 py-1.5 w-48 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={clearLogs}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
            title={t('logs.clear')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
            title={t('logs.export')}
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Logs content */}
      <div
        ref={logContainerRef}
        className="h-80 overflow-y-auto p-4 bg-gray-900 font-mono text-sm"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {searchTerm ? t('logs.noMatch') : (isConnected ? t('logs.waiting') : t('logs.connecting'))}
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
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          {searchTerm ? `${filteredLogs.length}/${logs.length}` : logs.length} {t('logs.lines')}
        </div>
        <div>
          Auto-scroll: {isAutoScroll ? 'ON' : 'OFF'}
        </div>
      </div>
    </div>
  );
}
