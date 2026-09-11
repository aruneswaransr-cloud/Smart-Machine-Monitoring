import { useState, useMemo } from 'react';
import { Search, Cpu, ChevronRight, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import type { Machine } from '@/types';
import { Machine3DCard } from '@/components/ui/Machine3DCard';

export interface MachinesPageProps {
  machines: Machine[];
  onSelectMachine: (id: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  operational: { label: 'Healthy', color: 'text-success', dot: 'bg-success' },
  warning: { label: 'Warning', color: 'text-warning', dot: 'bg-warning' },
  critical: { label: 'Critical', color: 'text-error', dot: 'bg-error' },
  maintenance: { label: 'Maintenance', color: 'text-primary', dot: 'bg-primary' },
  offline: { label: 'Offline', color: 'text-text-dim', dot: 'bg-text-dim' },
};

type SortKey = 'health_score' | 'name' | 'status' | 'vibration' | 'temperature' | 'performance_rate';

export function MachinesPage({ machines, onSelectMachine }: MachinesPageProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('health_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filtered = useMemo(() => {
    let result = machines.filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.type.toLowerCase().includes(search.toLowerCase()) ||
        m.location.toLowerCase().includes(search.toLowerCase()),
    );

    if (filterStatus !== 'all') {
      result = result.filter((m) => m.status === filterStatus);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else cmp = (a[sortBy] as number) - (b[sortBy] as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [machines, search, sortBy, sortDir, filterStatus]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-text-main">Machine Registry</h1>
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-text-dim hover:text-text-main'}`}
              title="3D Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-text-dim hover:text-text-main'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              type="text"
              placeholder="Search machines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary/50"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Statuses</option>
            <option value="operational">Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        {viewMode === 'grid' ? (
          /* 3D Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((machine) => {
              const config = statusConfig[machine.status];
              return (
                <div
                  key={machine.id}
                  onClick={() => onSelectMachine(machine.id)}
                  className="glass-panel rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all group"
                >
                  {/* 3D Model */}
                  <Machine3DCard machine={machine} />

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-text-dim" />
                        <span className="font-semibold text-text-main text-sm">{machine.name}</span>
                        {!machine.is_online && (
                          <span className="text-[10px] text-text-dim bg-surface-2 px-1.5 py-0.5 rounded">OFFLINE</span>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color}`}>
                        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-dim">
                      <span className="font-medium text-text-main">{machine.type}</span>
                      <span>·</span>
                      <span>{machine.location}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="bg-surface-2 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-[10px] text-text-dim uppercase">Health</p>
                        <p className={`text-sm font-mono font-bold ${config.color}`}>{machine.health_score}%</p>
                      </div>
                      <div className="bg-surface-2 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-[10px] text-text-dim uppercase">Vib</p>
                        <p className="text-sm font-mono font-bold text-text-main">{machine.vibration.toFixed(1)}</p>
                      </div>
                      <div className="bg-surface-2 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-[10px] text-text-dim uppercase">Temp</p>
                        <p className="text-sm font-mono font-bold text-text-main">{machine.temperature.toFixed(0)}°</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-primary flex items-center gap-1">
                        View Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="glass-panel rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-text-main">
                      Machine <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Location</th>
                  <th className="text-center px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('health_score')} className="flex items-center gap-1 hover:text-text-main mx-auto">
                      Health <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 font-medium hidden md:table-cell">
                    <button onClick={() => toggleSort('vibration')} className="flex items-center gap-1 hover:text-text-main mx-auto">
                      Vibration <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 font-medium hidden lg:table-cell">
                    <button onClick={() => toggleSort('temperature')} className="flex items-center gap-1 hover:text-text-main mx-auto">
                      Temp <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 font-medium hidden lg:table-cell">
                    <button onClick={() => toggleSort('performance_rate')} className="flex items-center gap-1 hover:text-text-main mx-auto">
                      Perf <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-text-main mx-auto">
                      Status <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((machine) => {
                  const config = statusConfig[machine.status];
                  return (
                    <tr
                      key={machine.id}
                      onClick={() => onSelectMachine(machine.id)}
                      className="border-b border-border/50 hover:bg-surface-2/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-text-dim" />
                          <span className="font-semibold text-text-main">{machine.name}</span>
                          {!machine.is_online && (
                            <span className="text-[10px] text-text-dim bg-surface-2 px-1.5 py-0.5 rounded">OFFLINE</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-dim hidden md:table-cell">{machine.type}</td>
                      <td className="px-4 py-3 text-text-dim hidden lg:table-cell">{machine.location}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono font-bold ${config.color}`}>{machine.health_score}%</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-text-main hidden md:table-cell">{machine.vibration.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center font-mono text-text-main hidden lg:table-cell">{machine.temperature.toFixed(1)}°</td>
                      <td className="px-4 py-3 text-center font-mono text-text-main hidden lg:table-cell">{machine.performance_rate.toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color}`}>
                          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <ChevronRight className="w-4 h-4 text-text-dim" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-dim text-sm">No machines found</div>
        )}
      </div>
    </div>
  );
}
