import { Circle } from 'lucide-react';
import useLocaleStore from '../../stores/localeStore';

export default function StatusBadge({ status }) {
  const { t } = useLocaleStore();

  const getStatusStyles = () => {
    switch (status) {
      case 'online':
        return {
          className: 'badge badge-online',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: t('status.online'),
          pulse: false
        };
      case 'stopped':
        return {
          className: 'badge badge-stopped',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: t('status.stopped'),
          pulse: true
        };
      case 'stopping':
        return {
          className: 'badge badge-warning',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: t('status.stopping'),
          pulse: false
        };
      case 'launching':
        return {
          className: 'badge badge-warning',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: t('status.launching'),
          pulse: false
        };
      case 'errored':
        return {
          className: 'badge badge-error',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: t('status.errored'),
          pulse: true
        };
      default:
        return {
          className: 'badge bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: status,
          pulse: false
        };
    }
  };

  const { className, icon, label, pulse } = getStatusStyles();

  return (
    <span className={`${className} flex items-center gap-1.5 ${pulse ? 'animate-pulse-badge' : ''}`}>
      {icon}
      {label}
    </span>
  );
}
