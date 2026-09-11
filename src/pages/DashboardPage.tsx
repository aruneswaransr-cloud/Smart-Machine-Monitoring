import { Scene } from '@/components/three/Scene';
import { StatsBar } from '@/components/ui/StatsBar';
import { MachineDetail } from '@/components/ui/MachineDetail';
import { AlertsFeed } from '@/components/ui/AlertsFeed';
import type { Machine, Alert } from '@/types';
import { useState } from 'react';

export interface DashboardPageProps {
  machines: Machine[];
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
}

export function DashboardPage({ machines, alerts, onAcknowledge }: DashboardPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedMachine = machines.find((m) => m.id === selectedId) || null;

  return (
    <div className="flex flex-col h-full">
      <div className="relative z-10 border-b border-border">
        <StatsBar machines={machines} alerts={alerts} />
      </div>

      <div className="flex-1 relative grid-bg overflow-hidden">
        <Scene
          machines={machines}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={setSelectedId}
          onHover={setHoveredId}
        />

        {/* Right panel */}
        <div className="absolute top-4 right-4 bottom-4 w-80 z-10 pointer-events-auto">
          {selectedMachine ? (
            <MachineDetail
              machine={selectedMachine}
              alerts={alerts}
              onClose={() => setSelectedId(null)}
              onAcknowledge={onAcknowledge}
            />
          ) : (
            <div className="glass-panel rounded-2xl h-full overflow-hidden">
              <AlertsFeed
                alerts={alerts}
                machines={machines}
                onAcknowledge={onAcknowledge}
                onSelectMachine={setSelectedId}
              />
            </div>
          )}
        </div>

        {/* Bottom hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="glass-panel-light rounded-full px-4 py-2 flex items-center gap-4 text-xs text-text-dim font-mono">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Healthy</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-warning" /> Warning</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-error" /> Critical</span>
            <span className="text-border">|</span>
            <span>Drag to rotate · Scroll to zoom · Click to inspect</span>
          </div>
        </div>
      </div>
    </div>
  );
}
