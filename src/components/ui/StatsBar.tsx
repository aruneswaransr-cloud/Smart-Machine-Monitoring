import { Activity, AlertTriangle, CheckCircle, Cpu, Zap } from 'lucide-react';
import type { Machine, Alert } from '@/types';

export interface StatsBarProps {
  machines: Machine[];
  alerts: Alert[];
}

export function StatsBar({ machines, alerts }: StatsBarProps) {
  const operational = machines.filter((m) => m.status === 'operational').length;
  const warnings = machines.filter((m) => m.status === 'warning').length;
  const critical = machines.filter((m) => m.status === 'critical').length;
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;
  const avgHealth = machines.length > 0
    ? Math.round(machines.reduce((sum, m) => sum + m.health_score, 0) / machines.length)
    : 0;

  const stats = [
    {
      label: 'Total Machines',
      value: machines.length,
      icon: Cpu,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Operational',
      value: operational,
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Warnings',
      value: warnings,
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Critical',
      value: critical,
      icon: AlertTriangle,
      color: 'text-error',
      bg: 'bg-error/10',
    },
    {
      label: 'Active Alerts',
      value: activeAlerts,
      icon: Zap,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Avg Health',
      value: `${avgHealth}%`,
      icon: Activity,
      color: avgHealth >= 80 ? 'text-success' : avgHealth >= 60 ? 'text-warning' : 'text-error',
      bg: 'bg-surface-2',
    },
  ];

  return (
    <div className="flex gap-3 px-4 py-3 overflow-x-auto no-select">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="glass-panel-light rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[140px] flex-shrink-0"
          >
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <div className="text-xs text-text-dim font-medium">{stat.label}</div>
              <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
