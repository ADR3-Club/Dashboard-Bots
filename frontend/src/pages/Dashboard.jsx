import { useState, useMemo, useCallback, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import ProcessTable from '../components/dashboard/ProcessTable';
import StatsCards from '../components/dashboard/StatsCards';
import SearchAndFilter from '../components/dashboard/SearchAndFilter';
import BulkActionBar from '../components/dashboard/BulkActionBar';
import LogViewer from '../components/logs/LogViewer';
import AlertBanner from '../components/alerts/AlertBanner';
import { SkeletonStatsCard } from '../components/common/Skeleton';
import { useProcesses, useRestartProcess, useStopProcess } from '../hooks/useProcesses';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import useLocaleStore from '../stores/localeStore';
import useToast from '../hooks/useToast';

export default function Dashboard() {
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState([]);
  const { data: processes, isLoading, error, refetch } = useProcesses();
  const { t } = useLocaleStore();
  const toast = useToast();
  const restartMutation = useRestartProcess();
  const stopMutation = useStopProcess();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'r': () => refetch(),
    'escape': () => {
      if (selectedProcess) setSelectedProcess(null);
    },
  });

  // Filter, search, and sort processes
  const filteredProcesses = useMemo(() => {
    if (!processes) return [];

    let result = processes.filter((process) => {
      // Search by name or ID
      const processId = String(process.pm_id || process.id);
      const matchesSearch =
        process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        processId.includes(searchTerm);

      // Filter by status - handle both structures
      const status = process.pm2_env?.status || process.status;
      const matchesFilter =
        statusFilter === 'all' ||
        status === statusFilter;

      return matchesSearch && matchesFilter;
    });

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal, bVal;

        switch (sortConfig.key) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'cpu':
            aVal = a.monit?.cpu || a.cpu || 0;
            bVal = b.monit?.cpu || b.cpu || 0;
            break;
          case 'memory':
            aVal = a.monit?.memory || a.memory || 0;
            bVal = b.monit?.memory || b.memory || 0;
            break;
          case 'uptime':
            aVal = a.pm2_env?.pm_uptime || a.uptime || 0;
            bVal = b.pm2_env?.pm_uptime || b.uptime || 0;
            break;
          case 'restarts':
            aVal = a.pm2_env?.restart_time || a.restarts || 0;
            bVal = b.pm2_env?.restart_time || b.restarts || 0;
            break;
          case 'id':
            aVal = Number(a.pm_id || a.id);
            bVal = Number(b.pm_id || b.id);
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [processes, searchTerm, statusFilter, sortConfig]);

  const handleViewLogs = useCallback((process) => {
    setSelectedProcess(process);
  }, []);

  const handleCloseLogs = useCallback(() => {
    setSelectedProcess(null);
  }, []);

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleFilterChange = useCallback((filter) => {
    setStatusFilter(filter);
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectedIds.length === filteredProcesses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProcesses.map((p) => p.pm_id));
    }
  }, [selectedIds.length, filteredProcesses]);

  const handleBulkRestart = async () => {
    try {
      await Promise.all(selectedIds.map((id) => restartMutation.mutateAsync(id)));
      toast.success(`${selectedIds.length} ${t('bulk.processes')} ${t('bulk.restarted')}`);
      setSelectedIds([]);
    } catch (error) {
      toast.error(t('dashboard.error'));
    }
  };

  const handleBulkStop = async () => {
    try {
      await Promise.all(selectedIds.map((id) => stopMutation.mutateAsync(id)));
      toast.success(`${selectedIds.length} ${t('bulk.processes')} ${t('bulk.stopped')}`);
      setSelectedIds([]);
    } catch (error) {
      toast.error(t('dashboard.error'));
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Alert Banner */}
        <AlertBanner />

        {/* Statistics Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatsCard key={i} />
            ))}
          </div>
        ) : (
          processes && <StatsCards processes={processes} />
        )}

        {/* Search and Filter */}
        {isLoading ? (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        ) : (
          processes && <SearchAndFilter
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            statusFilter={statusFilter}
          />
        )}

        {/* Process table */}
        <ProcessTable
          processes={filteredProcesses}
          isLoading={isLoading}
          error={error}
          onRefetch={refetch}
          onViewLogs={handleViewLogs}
          sortConfig={sortConfig}
          onSort={handleSort}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleAll={handleToggleAll}
        />
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onBulkRestart={handleBulkRestart}
        onBulkStop={handleBulkStop}
      />

      {/* Log viewer modal */}
      {selectedProcess && (
        <LogViewer
          process={selectedProcess}
          onClose={handleCloseLogs}
        />
      )}
    </Layout>
  );
}
