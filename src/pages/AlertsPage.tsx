import { useState, useMemo } from 'react';
import { AlertTriangle, Info, CheckCircle, Bell, Filter } from 'lucide-react';
import type { Alert, Machine } from '@/types';

export interface AlertsPageProps {
  alerts: Alert[];
  machines: Machine[];
  onAcknowledge: (id: string) => void;
}

const severityConfig: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  critical: { icon: AlertTriangle, color: 'text-error', bg: 'bg-error/10', border: 'border-error/30', label: 'Critical' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: 'Warning' },
  attention: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', label: 'Attention' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', label: 'Info' },
};

export function AlertsPage({ alerts, machines, onAcknowledge }: AlertsPageProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [showAck, setShowAck] = useState(false);

  const getMachineName = (id: string) => machines.find((m) => m.id === id)?.name || 'Unknown';

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
      if (filterMachine !== 'all' && a.machine_id !== filterMachine) return false;
      if (!showAck && a.acknowledged) return false;
      return true;
    });
  }, [alerts, filterSeverity, filterMachine, showAck]);

  const unackCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-main">Alert History</h1>
            <p className="text-sm text-text-dim mt-1">{unackCount} unacknowledged alert(s)</p>
          </div>
          <div className="flex items-center gap-2 text-warning">
            <Bell className="w-5 h-5" />
            <span className="text-2xl font-mono font-bold">{unackCount}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-dim" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary/50"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="attention">Attention</option>
              <option value="info">Info</option>
            </select>
          </div>
          <select
            value={filterMachine}
            onChange={(e) => setFilterMachine(e.target.value)}
            className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Machines</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-text-dim cursor-pointer">
            <input
              type="checkbox"
              checked={showAck}
              onChange={(e) => setShowAck(e.target.checked)}
              className="accent-primary"
            />
            Show acknowledged
          </label>
        </div>

        {/* Alert list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
              <p className="text-text-main font-semibold">All systems nominal</p>
              <p className="text-sm text-text-dim mt-1">No alerts match your filters</p>
            </div>
          ) : (
            filtered.map((alert) => {
              const config = severityConfig[alert.severity] || severityConfig.info;
              const Icon = config.icon;
              return (
                <div
                  key={alert.id}
                  className={`glass-panel rounded-xl p-4 border ${config.border} ${alert.acknowledged ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-bold uppercase tracking-wide ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-sm font-semibold text-text-main">{getMachineName(alert.machine_id)}</span>
                        {alert.parameter && (
                          <span className="text-xs text-text-dim bg-surface-2 px-2 py-0.5 rounded">{alert.parameter}</span>
                        )}
                        <span className="text-xs text-text-dim font-mono ml-auto">
                          {new Date(alert.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-sm text-text-main mb-1">{alert.title}</div>
                      <div className="text-xs text-text-dim leading-relaxed">{alert.message}</div>

                      {/* Detected vs expected */}
                      {alert.detected_value !== null && alert.expected_value !== null && (
                        <div className="flex gap-4 mt-2 text-xs font-mono">
                          <span className="text-error">Detected: {alert.detected_value.toFixed(1)}</span>
                          <span className="text-success">Expected: {alert.expected_value.toFixed(1)}</span>
                        </div>
                      )}

                      {/* Recommended action */}
                      {alert.recommended_action && (
                        <div className="mt-2 text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
                          {alert.recommended_action}
                        </div>
                      )}

                      {!alert.acknowledged ? (
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="text-xs text-primary hover:text-primary-dim font-medium mt-2 transition-colors"
                        >
                          Acknowledge →
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-success mt-2">
                          <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
