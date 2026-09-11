import { useState } from 'react';
import { Search, Cpu, ChevronRight } from 'lucide-react';
import type { Machine } from '@/types';

export interface MachineListProps {
  machines: Machine[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  operational: { label: 'Operational', color: 'text-success', dot: 'bg-success' },
  warning: { label: 'Warning', color: 'text-warning', dot: 'bg-warning' },
  critical: { label: 'Critical', color: 'text-error', dot: 'bg-error' },
  maintenance: { label: 'Maintenance', color: 'text-primary', dot: 'bg-primary' },
};

export function MachineList({ machines, selectedId, onSelect }: MachineListProps) {
  const [search, setSearch] = useState('');

  const filtered = machines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase()) ||
      m.location.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full no-select">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-sm font-semibold text-text-main uppercase tracking-wider mb-3">
          Machine Registry
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input
            type="text"
            placeholder="Search machines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {filtered.map((machine) => {
          const config = statusConfig[machine.status];
          const isSelected = selectedId === machine.id;
          return (
            <button
              key={machine.id}
              onClick={() => onSelect(machine.id)}
              className={`w-full text-left rounded-lg p-3 transition-all duration-200 border ${
                isSelected
                  ? 'glass-panel border-primary/40 glow-cyan'
                  : 'glass-panel-light border-border hover:border-primary/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-primary/15' : 'bg-surface-2'
                }`}>
                  <Cpu className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-text-dim'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-text-main truncate">{machine.name}</span>
                    <span className={`w-2 h-2 rounded-full ${config.dot} flex-shrink-0`} />
                  </div>
                  <div className="text-xs text-text-dim truncate">{machine.type} · {machine.location}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-sm font-mono font-bold ${config.color}`}>
                    {machine.health_score}%
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-primary rotate-90' : 'text-text-dim'}`} />
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-text-dim text-sm">No machines found</div>
        )}
      </div>
    </div>
  );
}
