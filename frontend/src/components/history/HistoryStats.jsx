import { RotateCw, AlertCircle, User, RefreshCw } from 'lucide-react';
import { memo } from 'react';
import useLocaleStore from '../../stores/localeStore';
import { useHistoryStats } from '../../hooks/useHistory';

function HistoryStats({ range = '24h' }) {
  const { t } = useLocaleStore();
  const { data: stats, isLoading } = useHistoryStats(range);

  const cards = [
    {
      title: t('history.stats.totalRestarts'),
      value: stats?.totalRestarts || 0,
      icon: RotateCw,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: t('history.stats.totalCrashes'),
      value: stats?.totalCrashes || 0,
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      title: t('history.stats.manualActions'),
      value: stats?.manualRestarts || 0,
      icon: User,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: t('history.stats.autoRestarts'),
      value: stats?.autoRestarts || 0,
      icon: RefreshCw,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
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

export default memo(HistoryStats);
