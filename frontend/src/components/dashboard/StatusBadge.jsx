import { Circle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'online':
        return {
          className: 'badge badge-online',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: 'Online'
        };
      case 'stopped':
        return {
          className: 'badge badge-stopped',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: 'Stopped'
        };
      case 'stopping':
        return {
          className: 'badge badge-warning',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: 'Stopping'
        };
      case 'launching':
        return {
          className: 'badge badge-warning',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: 'Launching'
        };
      case 'errored':
        return {
          className: 'badge badge-error',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: 'Error'
        };
      default:
        return {
          className: 'badge bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
          icon: <Circle className="w-2 h-2 fill-current" />,
          label: status
        };
    }
  };

  const { className, icon, label } = getStatusStyles();

  return (
    <span className={`${className} flex items-center gap-1.5`}>
      {icon}
      {label}
    </span>
  );
}
