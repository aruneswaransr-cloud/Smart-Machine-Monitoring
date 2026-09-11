import type { PageId, DataMode } from '@/types';
import {
  LayoutDashboard, Cpu, PlusCircle, Gauge,
  Activity, GitCompare, Bell, Wrench,
  QrCode, ScanLine, Settings, Radio, Brain,
} from 'lucide-react';

export interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  dataMode: DataMode;
  onToggleMode: () => void;
  machineCount: number;
  alertCount: number;
}

const navItems: { id: PageId; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'machines', label: 'Machines', icon: Cpu },
  { id: 'add-machine', label: 'Add Machine', icon: PlusCircle },
  { id: 'load-testing', label: 'Load Testing', icon: Gauge },
  { id: 'live-monitoring', label: 'Live Monitoring', icon: Activity },
  { id: 'comparison', label: 'Comparison', icon: GitCompare },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'qr-management', label: 'QR Management', icon: QrCode },
  { id: 'scan-qr', label: 'Scan QR', icon: ScanLine },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'ml-module', label: 'ML Module', icon: Brain },
];

export function Sidebar({ currentPage, onNavigate, dataMode, onToggleMode, machineCount, alertCount }: SidebarProps) {
  return (
    <aside className="w-16 lg:w-56 h-full glass-panel border-r border-border flex flex-col flex-shrink-0 no-select z-30">
      {/* Logo */}
      <div className="p-3 lg:p-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Cpu className="w-5 h-5 text-primary" />
        </div>
        <div className="hidden lg:block">
          <h1 className="text-sm font-bold text-text-main leading-tight">Machine Health</h1>
          <p className="text-[10px] text-text-dim font-mono">Predictive Maintenance</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 lg:px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-2.5 lg:px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-dim hover:text-text-main hover:bg-surface-2 border border-transparent'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
              {item.id === 'alerts' && alertCount > 0 && (
                <span className="hidden lg:flex ml-auto text-[10px] font-mono font-bold text-error bg-error/10 px-1.5 py-0.5 rounded-full">
                  {alertCount}
                </span>
              )}
              {item.id === 'machines' && machineCount > 0 && (
                <span className="hidden lg:flex ml-auto text-[10px] font-mono font-bold text-text-dim bg-surface-2 px-1.5 py-0.5 rounded-full">
                  {machineCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Data mode toggle */}
      <div className="p-2 lg:p-3 border-t border-border">
        <button
          onClick={onToggleMode}
          className={`w-full flex items-center gap-2.5 px-2.5 lg:px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
            dataMode === 'demo'
              ? 'bg-warning/10 text-warning border-warning/20'
              : 'bg-success/10 text-success border-success/20'
          }`}
          title={dataMode === 'demo' ? 'Demo Mode (simulated data)' : 'Live Mode (ESP32 data)'}
        >
          <Radio className={`w-4 h-4 flex-shrink-0 ${dataMode === 'demo' ? 'animate-blink' : ''}`} />
          <div className="hidden lg:flex flex-col items-start">
            <span className="text-xs font-bold">{dataMode === 'demo' ? 'DEMO DATA' : 'LIVE DATA'}</span>
            <span className="text-[10px] text-text-dim">{dataMode === 'demo' ? 'Simulated' : 'ESP32 Connected'}</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
