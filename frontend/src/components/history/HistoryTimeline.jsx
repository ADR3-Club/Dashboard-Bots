import { RefreshCw, AlertCircle } from 'lucide-react';
import { memo, useState } from 'react';
import EventRow from './EventRow';
import useLocaleStore from '../../stores/localeStore';
import { useHistory } from '../../hooks/useHistory';

function HistoryTimeline({ filters }) {
  const { t } = useLocaleStore();
  const { data: timeline, isLoading, error } = useHistory(filters);
  const [limit, setLimit] = useState(100);

  if (isLoading) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            {t('history.loading')}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-center text-red-600 dark:text-red-400">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{t('history.error')}</span>
        </div>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="card p-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          {t('history.noEvents')}
        </div>
      </div>
    );
  }

  const displayedEvents = timeline.slice(0, limit);
  const hasMore = timeline.length > limit;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('history.timeline')} ({timeline.length})
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('history.time')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('history.process')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('history.action')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('history.triggeredBy')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedEvents.map((event, index) => (
              <EventRow key={`${event.time}-${index}`} event={event} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
          <button
            onClick={() => setLimit((prev) => prev + 100)}
            className="btn btn-secondary"
          >
            {t('history.loadMore')} ({timeline.length - limit} {t('history.noEvents').split(' ')[0]})
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(HistoryTimeline);
