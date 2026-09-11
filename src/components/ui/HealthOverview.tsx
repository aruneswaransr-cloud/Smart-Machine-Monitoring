import { useEffect, useState } from 'react';
import { X, BarChart3 } from 'lucide-react';
import type { Machine } from '@/types';

export interface HealthOverviewProps {
  machines: Machine[];
  onClose: () => void;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-8">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function HealthOverview({ machines, onClose }: HealthOverviewProps) {
  const [history, setHistory] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory((prev) => {
        const next: Record<string, number[]> = {};
        machines.forEach((m) => {
          const current = prev[m.id] || Array(20).fill(m.health_score);
          const fluctuation = (Math.random() - 0.5) * 2;
          const newVal = Math.max(0, Math.min(100, m.health_score + fluctuation));
          next[m.id] = [...current.slice(1), newVal];
        });
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [machines]);

  const sorted = [...machines].sort((a, b) => a.health_score - b.health_score);

  const colorForScore = (score: number) => {
    if (score >= 80) return '#00e676';
    if (score >= 60) return '#ffab00';
    return '#ff3d57';
  };

  return (
    <div className="glass-panel rounded-2xl h-full overflow-hidden flex flex-col animate-slide-in-left">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold text-text-main uppercase tracking-wider">
            Health Trends
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-border flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-text-dim" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sorted.map((machine) => {
          const color = colorForScore(machine.health_score);
          const data = history[machine.id] || Array(20).fill(machine.health_score);
          return (
            <div key={machine.id} className="glass-panel-light rounded-xl p-3 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text-main">{machine.name}</span>
                <span className="text-sm font-mono font-bold" style={{ color }}>
                  {machine.health_score}%
                </span>
              </div>
              <Sparkline data={data} color={color} />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-text-dim font-mono">{machine.type}</span>
                <span className="text-[10px] text-text-dim font-mono">{machine.location}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
