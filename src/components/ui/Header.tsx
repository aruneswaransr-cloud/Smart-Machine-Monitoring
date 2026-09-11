import { Cpu, Radio, Settings } from 'lucide-react';

export interface HeaderProps {
  onToggleView?: () => void;
}

export function Header({ onToggleView }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border glass-panel z-20 no-select">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-bg animate-blink" />
        </div>
        <div>
          <h1 className="text-base font-bold text-text-main tracking-tight">
            Smart Machine Health Monitor
          </h1>
          <p className="text-[11px] text-text-dim font-mono">3D Factory Dashboard · Live</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-success animate-blink" />
          <span className="text-text-dim font-mono">SYSTEM ONLINE</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-dim font-mono">
          <Radio className="w-3.5 h-3.5 text-primary" />
          <span>Real-time</span>
        </div>
        <button className="w-9 h-9 rounded-lg bg-surface-2 hover:bg-border flex items-center justify-center transition-colors">
          <Settings className="w-4 h-4 text-text-dim" />
        </button>
      </div>
    </header>
  );
}
