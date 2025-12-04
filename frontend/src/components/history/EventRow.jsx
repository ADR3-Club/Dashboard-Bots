import { RotateCw, AlertCircle, Square, Play, Trash2, User, RefreshCw } from 'lucide-react';
import { memo } from 'react';
import useLocaleStore from '../../stores/localeStore';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

// Map event types/reasons to display information
const getEventInfo = (event, t) => {
  const type = event.type;
  const reason = event.reason;

  // Determine the event label and icon
  let label, icon, colorClass, bgClass;

  if (type === 'crash') {
    label = t('history.event.crash');
    icon = AlertCircle;
    colorClass = 'text-red-600 dark:text-red-400';
    bgClass = 'bg-red-100 dark:bg-red-900/30';
  } else if (type === 'restart') {
    if (reason === 'auto') {
      label = t('history.event.auto_restart');
      icon = RefreshCw;
      colorClass = 'text-green-600 dark:text-green-400';
      bgClass = 'bg-green-100 dark:bg-green-900/30';
    } else if (reason === 'manual_stop') {
      label = t('history.event.stop');
      icon = Square;
      colorClass = 'text-orange-600 dark:text-orange-400';
      bgClass = 'bg-orange-100 dark:bg-orange-900/30';
    } else if (reason === 'manual_start') {
      label = t('history.event.start');
      icon = Play;
      colorClass = 'text-green-600 dark:text-green-400';
      bgClass = 'bg-green-100 dark:bg-green-900/30';
    } else if (reason === 'manual_delete') {
      label = t('history.event.delete');
      icon = Trash2;
      colorClass = 'text-gray-600 dark:text-gray-400';
      bgClass = 'bg-gray-100 dark:bg-gray-700/30';
    } else {
      // manual or other restart
      label = t('history.event.restart');
      icon = RotateCw;
      colorClass = 'text-blue-600 dark:text-blue-400';
      bgClass = 'bg-blue-100 dark:bg-blue-900/30';
    }
  } else {
    label = type;
    icon = AlertCircle;
    colorClass = 'text-gray-600 dark:text-gray-400';
    bgClass = 'bg-gray-100 dark:bg-gray-700/30';
  }

  return { label, icon, colorClass, bgClass };
};

function EventRow({ event }) {
  const { t, locale } = useLocaleStore();
  const eventInfo = getEventInfo(event, t);
  const Icon = eventInfo.icon;

  const time = event.time;
  const timeAgo = formatDistanceToNow(new Date(time), {
    addSuffix: true,
    locale: locale === 'fr' ? fr : enUS,
  });

  const formattedTime = new Date(time).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US');

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Time */}
      <td className="px-4 py-3">
        <div className="text-sm text-gray-900 dark:text-white">{formattedTime}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</div>
      </td>

      {/* Process */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {event.process_name}
        </span>
      </td>

      {/* Action */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`${eventInfo.bgClass} p-2 rounded-lg`}>
            <Icon className={`w-4 h-4 ${eventInfo.colorClass}`} />
          </div>
          <span className={`text-sm font-medium ${eventInfo.colorClass}`}>
            {eventInfo.label}
          </span>
        </div>
      </td>

      {/* Triggered by */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          {event.triggered_by && (
            <>
              <User className="w-3.5 h-3.5" />
              <span>{event.triggered_by}</span>
            </>
          )}
          {!event.triggered_by && <span className="text-gray-400 dark:text-gray-500">-</span>}
        </div>
      </td>

      {/* Reason/Details */}
      <td className="px-4 py-3">
        {event.type === 'crash' && event.reason && (
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs block">
            {event.reason}
          </span>
        )}
        {event.type !== 'crash' && (
          <span className="text-sm text-gray-500 dark:text-gray-500">-</span>
        )}
      </td>
    </tr>
  );
}

export default memo(EventRow);
