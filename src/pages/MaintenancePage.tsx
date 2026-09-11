import { Wrench, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import type { Machine, Alert, BaselineReading, ScoringThreshold } from '@/types';
import { calculateHealthScore } from '@/lib/scoring';

export interface MaintenancePageProps {
  machines: Machine[];
  alerts: Alert[];
  baselines: BaselineReading[];
  thresholds: ScoringThreshold[];
}

export function MaintenancePage({ machines, alerts, baselines, thresholds }: MaintenancePageProps) {
  const machineMaintenance = machines.map((machine) => {
    const machineBaselines = baselines.filter((b) => b.machine_id === machine.id);
    const machineAlerts = alerts.filter((a) => a.machine_id === machine.id && !a.acknowledged);
    const health = calculateHealthScore(
      {
        rpm: machine.rpm,
        vibration: machine.vibration,
        temperature: machine.temperature,
        humidity: machine.humidity,
        current_load: machine.current_load,
        performance_rate: machine.performance_rate,
        load_percentage: machine.load_percentage,
      },
      machineBaselines,
      thresholds,
      machine.type,
    );

    const hasBaseline = machineBaselines.length > 0;
    const warningCount = health.parameterScores.filter((p) => p.status === 'warning' || p.status === 'critical').length;

    return {
      machine,
      health,
      machineAlerts,
      hasBaseline,
      warningCount,
    };
  });

  const sorted = [...machineMaintenance].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
    return priorityOrder[a.health.servicePriority] - priorityOrder[b.health.servicePriority];
  });

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-text-main mb-1">Maintenance Recommendations</h1>
        <p className="text-sm text-text-dim mb-6">
          Estimated maintenance windows based on sensor trends, deviations from baseline, and alert frequency.
          These are recommendations, not guaranteed predictions.
        </p>

        <div className="space-y-3">
          {sorted.map(({ machine, health, machineAlerts, hasBaseline, warningCount }) => {
            const priorityConfig: Record<string, { color: string; bg: string; border: string }> = {
              high: { color: 'text-error', bg: 'bg-error/10', border: 'border-error/30' },
              medium: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
              low: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
              none: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
            };
            const config = priorityConfig[health.servicePriority];

            return (
              <div key={machine.id} className="glass-panel rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center`}>
                      <Wrench className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-text-main">{machine.name}</h2>
                      <p className="text-xs text-text-dim">{machine.type} · {machine.location}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${config.bg} ${config.color} border ${config.border}`}>
                    {health.servicePriority} priority
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="glass-panel-light rounded-xl p-3 border border-border">
                    <div className="flex items-center gap-1.5 text-xs text-text-dim mb-1">
                      <Calendar className="w-3.5 h-3.5" /> Service Window
                    </div>
                    <div className="text-sm font-semibold text-text-main">{health.serviceRecommendation}</div>
                  </div>
                  <div className="glass-panel-light rounded-xl p-3 border border-border">
                    <div className="flex items-center gap-1.5 text-xs text-text-dim mb-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Health Score
                    </div>
                    <div className={`text-sm font-mono font-bold ${
                      health.overall >= 75 ? 'text-success' : health.overall >= 50 ? 'text-warning' : 'text-error'
                    }`}>
                      {health.overall}/100 — {health.statusLabel}
                    </div>
                  </div>
                  <div className="glass-panel-light rounded-xl p-3 border border-border">
                    <div className="flex items-center gap-1.5 text-xs text-text-dim mb-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Active Alerts
                    </div>
                    <div className="text-sm font-mono font-bold text-text-main">{machineAlerts.length} unacknowledged</div>
                  </div>
                </div>

                {/* Parameter breakdown */}
                {hasBaseline ? (
                  <div>
                    <div className="text-xs text-text-dim uppercase tracking-wider mb-2">Parameter Analysis</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {health.parameterScores.map((ps) => (
                        <div key={ps.parameter} className="flex items-center gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${
                            ps.status === 'healthy' ? 'bg-success' :
                            ps.status === 'monitor' ? 'bg-success' :
                            ps.status === 'warning' ? 'bg-warning' :
                            ps.status === 'critical' ? 'bg-error' : 'bg-error'
                          }`} />
                          <span className="text-text-dim capitalize">{ps.parameter.replace('_', ' ')}</span>
                          <span className={`font-mono font-bold ml-auto ${
                            ps.score >= 75 ? 'text-success' : ps.score >= 50 ? 'text-warning' : 'text-error'
                          }`}>
                            {ps.score}
                          </span>
                        </div>
                      ))}
                    </div>
                    {health.faultSummary && (
                      <div className="mt-3 text-xs text-error bg-error/5 border border-error/20 rounded-lg px-3 py-2">
                        {health.faultSummary}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-warning bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
                    Insufficient historical data for service prediction. Run load testing/calibration first.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
