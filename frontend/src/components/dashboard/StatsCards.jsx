import { Activity, Server, AlertCircle, Cpu, HardDrive } from 'lucide-react';
import { formatMemory, formatCPU } from '../../utils/formatters';
import useLocaleStore from '../../stores/localeStore';
import { memo } from 'react';

function StatsCards({ processes }) {
  const { t } = useLocaleStore();

  // Calculate statistics
  const stats = {
    total: processes.length,
    online: processes.filter(p => {
      const status = p.pm2_env?.status || p.status;
      return status === 'online';
    }).length,
    offline: processes.filter(p => {
      const status = p.pm2_env?.status || p.status;
      return status !== 'online';
    }).length,
    totalCPU: processes.reduce((sum, p) => sum + (p.monit?.cpu || p.cpu || 0), 0),
    totalRAM: processes.reduce((sum, p) => sum + (p.monit?.memory || p.memory || 0), 0),
    avgCPU: processes.length > 0
      ? processes.reduce((sum, p) => sum + (p.monit?.cpu || p.cpu || 0), 0) / processes.length
      : 0,
  };

  const cards = [
    {
      icon: Server,
      label: t('stats.totalProcesses'),
      value: stats.total,
      color: 'primary',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      iconColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-200 dark:border-primary-800',
    },
    {
      icon: Activity,
      label: t('stats.online'),
      value: stats.online,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      icon: AlertCircle,
      label: t('stats.offline'),
      value: stats.offline,
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      icon: Cpu,
      label: t('stats.avgCPU'),
      value: formatCPU(stats.avgCPU),
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      icon: HardDrive,
      label: t('stats.totalRAM'),
      value: formatMemory(stats.totalRAM),
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} ${card.borderColor} border rounded-lg p-4 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {card.label}
                </p>
                <p className={`text-2xl font-bold ${card.iconColor}`}>
                  {card.value}
                </p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(StatsCards);
