import { AlertCircle, X, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useAlerts, useDismissAlert } from '../../hooks/useAlerts';
import useLocaleStore from '../../stores/localeStore';
import useToast from '../../hooks/useToast';

export default function AlertBanner() {
  const { t } = useLocaleStore();
  const toast = useToast();
  const { data: alerts, isLoading } = useAlerts();
  const dismissMutation = useDismissAlert();

  // Don't render anything if no alerts or still loading
  if (isLoading || !alerts || alerts.length === 0) {
    return null;
  }

  // Get severity info (icon, colors)
  const getSeverityInfo = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertOctagon,
          bgClass: 'bg-red-50 dark:bg-red-900/20',
          borderClass: 'border-red-300 dark:border-red-800',
          iconClass: 'text-red-600 dark:text-red-400',
          textClass: 'text-red-900 dark:text-red-200',
        };
      case 'high':
        return {
          icon: AlertTriangle,
          bgClass: 'bg-orange-50 dark:bg-orange-900/20',
          borderClass: 'border-orange-300 dark:border-orange-800',
          iconClass: 'text-orange-600 dark:text-orange-400',
          textClass: 'text-orange-900 dark:text-orange-200',
        };
      case 'medium':
      default:
        return {
          icon: AlertCircle,
          bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderClass: 'border-yellow-300 dark:border-yellow-800',
          iconClass: 'text-yellow-600 dark:text-yellow-400',
          textClass: 'text-yellow-900 dark:text-yellow-200',
        };
    }
  };

  const handleDismiss = async (alert) => {
    try {
      await dismissMutation.mutateAsync({
        pmId: alert.pmId,
        processName: alert.processName,
      });
      toast.success(t('alerts.dismissed'));
    } catch (error) {
      toast.error(t('alerts.dismissError'));
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((alert) => {
        const severityInfo = getSeverityInfo(alert.severity);
        const Icon = severityInfo.icon;

        return (
          <div
            key={`${alert.pmId}-${alert.processName}`}
            className={`${severityInfo.bgClass} ${severityInfo.borderClass} border rounded-lg p-4 flex items-start gap-3 animate-fade-in`}
          >
            {/* Alert Icon */}
            <div className="flex-shrink-0">
              <Icon className={`w-6 h-6 ${severityInfo.iconClass}`} />
            </div>

            {/* Alert Content */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold ${severityInfo.textClass}`}>
                {t('alerts.unstableProcess')}: {alert.processName}
              </h3>
              <p className={`text-sm mt-1 ${severityInfo.textClass} opacity-90`}>
                {alert.crashCount} {t('alerts.crashes')} {t('alerts.in')} {alert.timeWindow} {t('alerts.minutes')} ({t('alerts.threshold')}: {alert.threshold})
              </p>
              {alert.isNew && (
                <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${severityInfo.iconClass} ${severityInfo.bgClass} border ${severityInfo.borderClass}`}>
                  {t('alerts.new')}
                </span>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => handleDismiss(alert)}
              disabled={dismissMutation.isPending}
              className={`flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50 ${severityInfo.iconClass}`}
              aria-label={t('alerts.dismiss')}
              title={t('alerts.dismiss')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
