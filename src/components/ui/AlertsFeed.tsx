import { AlertTriangle, Bell, CheckCircle, Info, X } from 'lucide-react';
import type { Alert, Machine } from '@/types';

export interface AlertsFeedProps {
  alerts: Alert[];
  machines: Machine[];
  onAcknowledge: (alertId: string) => void;
  onSelectMachine: (machineId: string) => void;
}

const severityConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  critical: { icon: AlertTriangle, color: 'text-error', bg: 'bg-error/10', border: 'border-error/30' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
};

export function AlertsFeed({ alerts, machines, onAcknowledge, onSelectMachine }: AlertsFeedProps) {
  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  const acknowledged = alerts.filter((a) => a.acknowledged);

  const getMachineName = (id: string) => machines.find((m) => m.id === id)?.name || 'Unknown';

  return (
    <div className="flex flex-col h-full no-select">
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <Bell className="w-4 h-4 text-warning" />
        <h2 className="text-sm font-semibold text-text-main uppercase tracking-wider">
          Alerts Feed
        </h2>
        {unacknowledged.length > 0 && (
          <span className="ml-auto text-xs font-mono font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">
            {unacknowledged.length} new
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {unacknowledged.length === 0 && acknowledged.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-2 opacity-50" />
            <p className="text-sm text-text-dim">All systems nominal</p>
            <p className="text-xs text-text-dim mt-1">No alerts to display</p>
          </div>
        )}

        {unacknowledged.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              className={`rounded-lg p-3 border ${config.bg} ${config.border} animate-fade-in-up`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${config.color}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-text-dim font-mono">
                      {new Date(alert.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectMachine(alert.machine_id)}
                    className="text-sm font-semibold text-text-main hover:text-primary transition-colors block"
                  >
                    {getMachineName(alert.machine_id)}
                  </button>
                  <div className="text-xs text-text-dim leading-relaxed mt-0.5">{alert.title}</div>
                  <div className="text-xs text-text-dim leading-relaxed">{alert.message}</div>
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="text-xs text-primary hover:text-primary-dim font-medium mt-1.5 transition-colors"
                  >
                    Acknowledge →
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {acknowledged.length > 0 && (
          <>
            <div className="text-[10px] text-text-dim uppercase tracking-wider font-semibold pt-2 pb-1">
              Acknowledged
            </div>
            {acknowledged.map((alert) => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;
              return (
                <div
                  key={alert.id}
                  className="rounded-lg p-3 border border-border bg-surface-2/50 opacity-60"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${config.color}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-text-dim font-mono">
                          {new Date(alert.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-text-dim">
                        {getMachineName(alert.machine_id)} — {alert.title}
                      </div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
