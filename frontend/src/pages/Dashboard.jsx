import { useState } from 'react';
import Layout from '../components/layout/Layout';
import ProcessTable from '../components/dashboard/ProcessTable';
import LogViewer from '../components/logs/LogViewer';

export default function Dashboard() {
  const [selectedProcess, setSelectedProcess] = useState(null);

  const handleViewLogs = (process) => {
    setSelectedProcess(process);
  };

  const handleCloseLogs = () => {
    setSelectedProcess(null);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your PM2 processes
          </p>
        </div>

        {/* Process table */}
        <ProcessTable onViewLogs={handleViewLogs} />
      </div>

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
