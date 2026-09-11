import { useEffect, useRef } from 'react';
import {
  X, Thermometer, Activity, Gauge, RotateCw, Droplets, Zap, TrendingUp,
  Clock, Wrench, MapPin, Cpu,
} from 'lucide-react';
import type { Machine, Alert } from '@/types';

export interface MachineDetailProps {
  machine: Machine | null;
  alerts: Alert[];
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  operational: { label: 'Operational', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  warning: { label: 'Warning', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  critical: { label: 'Critical', color: 'text-error', bg: 'bg-error/10', border: 'border-error/30' },
  maintenance: { label: 'Maintenance', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
};

function SensorCard({
  icon: Icon,
  label,
  value,
  unit,
  threshold,
  status,
}: {
  icon: any;
  label: string;
  value: number;
  unit: string;
  threshold: { max: number; critical: number };
  status: string;
}) {
  const isCritical = value >= threshold.critical;
  const isWarning = value >= threshold.max && !isCritical;
  const color = isCritical ? 'text-error' : isWarning ? 'text-warning' : 'text-text-main';
  const barColor = isCritical ? 'bg-error' : isWarning ? 'bg-warning' : 'bg-success';
  const barWidth = Math.min((value / threshold.critical) * 100, 100);

  return (
    <div className="glass-panel-light rounded-xl p-3.5 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-xs text-text-dim font-medium">{label}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-2xl font-bold font-mono ${color}`}>{value.toFixed(1)}</span>
        <span className="text-xs text-text-dim">{unit}</span>
      </div>
      <div className="h-1.5 bg-bg rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-text-dim font-mono">0</span>
        <span className="text-[10px] text-text-dim font-mono">{threshold.critical}</span>
      </div>
    </div>
  );
}

function AlertItem({ alert, onAcknowledge }: { alert: Alert; onAcknowledge: (id: string) => void }) {
  const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
    critical: { color: 'text-error', bg: 'bg-error/10', border: 'border-error/30' },
    warning: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    info: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  };
  const config = severityConfig[alert.severity];

  return (
    <div className={`rounded-lg p-3 border ${config.bg} ${config.border} animate-fade-in-up`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className={`text-xs font-bold uppercase tracking-wide ${config.color}`}>
          {alert.severity}
        </span>
        <span className="text-[10px] text-text-dim font-mono">
          {new Date(alert.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="text-sm font-semibold text-text-main mb-1">{alert.title}</div>
      <div className="text-xs text-text-dim leading-relaxed mb-2">{alert.message}</div>
      {!alert.acknowledged ? (
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="text-xs text-primary hover:text-primary-dim font-medium transition-colors"
        >
          Acknowledge →
        </button>
      ) : (
        <span className="text-xs text-text-dim font-medium">✓ Acknowledged</span>
      )}
    </div>
  );
}

export function MachineDetail({ machine, alerts, onClose, onAcknowledge }: MachineDetailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [machine?.id]);

  if (!machine) return null;

  const config = statusConfig[machine.status];
  const machineAlerts = alerts.filter((a) => a.machine_id === machine.id);

  return (
    <div className="glass-panel rounded-2xl w-full h-full overflow-hidden flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg} border ${config.border}`}>
            <Cpu className={`w-6 h-6 ${config.color}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main">{machine.name}</h2>
            <span className="text-xs text-text-dim">{machine.type}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-border flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-text-dim" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status badge */}
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${config.bg} border ${config.border}`}>
          <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} ${machine.status === 'critical' ? 'animate-blink' : ''}`} />
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
          <span className="text-xs text-text-dim ml-auto">Health: {machine.health_score}%</span>
        </div>

        {/* Health bar */}
        <div>
          <div className="flex justify-between text-xs text-text-dim mb-1.5">
            <span>Overall Health Score</span>
            <span className="font-mono font-bold text-text-main">{machine.health_score}/100</span>
          </div>
          <div className="h-2.5 bg-bg rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                machine.health_score >= 80 ? 'bg-success' : machine.health_score >= 60 ? 'bg-warning' : 'bg-error'
              }`}
              style={{ width: `${machine.health_score}%` }}
            />
          </div>
        </div>

        {/* Sensor cards */}
        <div>
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2.5">Live Sensors</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <SensorCard icon={RotateCw} label="RPM" value={machine.rpm} unit="rpm" threshold={{ max: 8000, critical: 12000 }} status={machine.status} />
            <SensorCard icon={Activity} label="Vibration" value={machine.vibration} unit="mm/s" threshold={{ max: 4, critical: 8 }} status={machine.status} />
            <SensorCard icon={Thermometer} label="Temperature" value={machine.temperature} unit="°C" threshold={{ max: 75, critical: 95 }} status={machine.status} />
            <SensorCard icon={Droplets} label="Humidity" value={machine.humidity} unit="%" threshold={{ max: 60, critical: 80 }} status={machine.status} />
            <SensorCard icon={Zap} label="Current" value={machine.current_load} unit="A" threshold={{ max: 25, critical: 40 }} status={machine.status} />
            <SensorCard icon={Gauge} label="Load" value={machine.load_percentage} unit="%" threshold={{ max: 80, critical: 100 }} status={machine.status} />
            <SensorCard icon={TrendingUp} label="Performance" value={machine.performance_rate} unit="%" threshold={{ max: 100, critical: 100 }} status={machine.status} />
            <SensorCard icon={Zap} label="Power" value={machine.power_consumption} unit="kW" threshold={{ max: 7, critical: 12 }} status={machine.status} />
          </div>
        </div>

        {/* Info grid */}
        <div>
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2.5">Machine Info</h3>
          <div className="glass-panel-light rounded-xl border border-border divide-y divide-border">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <MapPin className="w-4 h-4 text-text-dim" />
              <span className="text-xs text-text-dim">Location</span>
              <span className="text-sm text-text-main ml-auto font-mono">{machine.location}</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Clock className="w-4 h-4 text-text-dim" />
              <span className="text-xs text-text-dim">Uptime</span>
              <span className="text-sm text-text-main ml-auto font-mono">{machine.uptime_hours.toLocaleString()}h</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Wrench className="w-4 h-4 text-text-dim" />
              <span className="text-xs text-text-dim">Last Maintenance</span>
              <span className="text-sm text-text-main ml-auto font-mono">
                {machine.last_maintenance ? new Date(machine.last_maintenance).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Activity className="w-4 h-4 text-text-dim" />
              <span className="text-xs text-text-dim">Status</span>
              <span className={`text-sm ml-auto font-mono font-bold ${machine.is_online ? 'text-success' : 'text-text-dim'}`}>
                {machine.is_online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Clock className="w-4 h-4 text-text-dim" />
              <span className="text-xs text-text-dim">Last Reading</span>
              <span className="text-sm text-text-main ml-auto font-mono">
                {machine.last_reading_at ? new Date(machine.last_reading_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div>
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2.5">
            Alerts ({machineAlerts.length})
          </h3>
          {machineAlerts.length > 0 ? (
            <div className="space-y-2">
              {machineAlerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} onAcknowledge={onAcknowledge} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-text-dim text-sm glass-panel-light rounded-xl border border-border">
              No active alerts for this machine
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
