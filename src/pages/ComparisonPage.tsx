import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { GitCompare, ArrowRight } from 'lucide-react';
import type { Machine, BaselineReading } from '@/types';
import { compareMachines } from '@/lib/scoring';

export interface ComparisonPageProps {
  machines: Machine[];
  baselines: BaselineReading[];
  onSelectMachine: (id: string) => void;
}

export function ComparisonPage({ machines, baselines, onSelectMachine }: ComparisonPageProps) {
  const [selectedId, setSelectedId] = useState<string>('');

  const groups = useMemo(() => {
    const map = new Map<string, Machine[]>();
    machines.forEach((m) => {
      const group = m.comparable_group || 'Ungrouped';
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(m);
    });
    return Array.from(map.entries()).filter(([, ms]) => ms.length >= 2);
  }, [machines]);

  const selectedMachine = machines.find((m) => m.id === selectedId);
  const peers = selectedMachine
    ? machines.filter((m) => m.id !== selectedId && (m.comparable_group || '') === (selectedMachine.comparable_group || ''))
    : [];

  const comparisonResults = selectedMachine
    ? compareMachines(selectedId, machines, baselines, selectedMachine.load_percentage)
    : [];

  const radarData = selectedMachine
    ? [
        { parameter: 'RPM', machine: selectedMachine.rpm, peerAvg: peers.length > 0 ? peers.reduce((s, p) => s + p.rpm, 0) / peers.length : 0 },
        { parameter: 'Vibration', machine: selectedMachine.vibration, peerAvg: peers.length > 0 ? peers.reduce((s, p) => s + p.vibration, 0) / peers.length : 0 },
        { parameter: 'Temperature', machine: selectedMachine.temperature, peerAvg: peers.length > 0 ? peers.reduce((s, p) => s + p.temperature, 0) / peers.length : 0 },
        { parameter: 'Humidity', machine: selectedMachine.humidity, peerAvg: peers.length > 0 ? peers.reduce((s, p) => s + p.humidity, 0) / peers.length : 0 },
        { parameter: 'Current', machine: selectedMachine.current_load, peerAvg: peers.length > 0 ? peers.reduce((s, p) => s + p.current_load, 0) / peers.length : 0 },
        { parameter: 'Performance', machine: selectedMachine.performance_rate, peerAvg: peers.length > 0 ? peers.reduce((s, p) => s + p.performance_rate, 0) / peers.length : 0 },
      ]
    : [];

  const barData = selectedMachine
    ? machines.filter((m) => (m.comparable_group || '') === (selectedMachine.comparable_group || '')).map((m) => ({
        name: m.name,
        vibration: m.vibration,
        temperature: m.temperature,
        performance: m.performance_rate,
        health: m.health_score,
      }))
    : [];

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-text-main mb-1">Machine Comparison</h1>
        <p className="text-sm text-text-dim mb-4">
          Compare machines within the same comparable group to identify abnormal behavior.
        </p>

        {/* Machine selector */}
        <div className="glass-panel rounded-2xl p-4 mb-4">
          <label className="text-xs text-text-dim uppercase tracking-wider font-semibold mb-2 block">Select Machine to Compare</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary/50"
          >
            <option value="">Choose a machine...</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.name} — {m.type} ({m.comparable_group || 'Ungrouped'})</option>
            ))}
          </select>
        </div>

        {groups.length === 0 && (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <GitCompare className="w-12 h-12 text-text-dim mx-auto mb-3 opacity-50" />
            <p className="text-text-main font-semibold">No comparable groups with 2+ machines</p>
            <p className="text-sm text-text-dim mt-1">Add more machines of the same type to enable comparison</p>
          </div>
        )}

        {selectedMachine && peers.length === 0 && groups.length > 0 && (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <p className="text-warning text-sm">No peer machines in the same comparable group. Comparison requires at least 2 machines of the same type.</p>
          </div>
        )}

        {selectedMachine && peers.length > 0 && (
          <>
            {/* Comparison results */}
            <div className="glass-panel rounded-2xl p-4 mb-3">
              <h2 className="text-sm font-semibold text-text-main mb-3">Parameter Comparison vs Peer Machines</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wider">
                      <th className="text-left px-3 py-2 font-medium">Parameter</th>
                      <th className="text-center px-3 py-2 font-medium">{selectedMachine.name}</th>
                      <th className="text-center px-3 py-2 font-medium">Peer Average</th>
                      <th className="text-center px-3 py-2 font-medium">Baseline</th>
                      <th className="text-center px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResults.map((row) => (
                      <tr key={row.parameter} className="border-b border-border/50">
                        <td className="px-3 py-2.5 font-medium text-text-main">{row.parameter}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-text-main">{row.targetValue}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-text-dim">{row.peerAverage}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-text-dim">{row.baselineValue}</td>
                        <td className="px-3 py-2.5 text-center">
                          {row.isAbnormal ? (
                            <span className="text-xs font-bold text-error bg-error/10 px-2 py-1 rounded">ABNORMAL</span>
                          ) : (
                            <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">NORMAL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {comparisonResults.some((r) => r.isAbnormal) && (
                <div className="mt-3 space-y-1">
                  {comparisonResults.filter((r) => r.isAbnormal).map((r) => (
                    <div key={r.parameter} className="text-xs text-error bg-error/5 border border-error/20 rounded-lg px-3 py-2">
                      {r.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Radar chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="glass-panel rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-text-main mb-3">Radar Comparison</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e2a3a" />
                    <PolarAngleAxis dataKey="parameter" tick={{ fill: '#7d8590', fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fill: '#7d8590', fontSize: 9 }} />
                    <Radar name={selectedMachine.name} dataKey="machine" stroke="#00d9ff" fill="#00d9ff" fillOpacity={0.2} />
                    <Radar name="Peer Average" dataKey="peerAvg" stroke="#ffab00" fill="#ffab00" fillOpacity={0.1} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-panel rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-text-main mb-3">Group Comparison (Health & Vibration)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                    <XAxis dataKey="name" tick={{ fill: '#7d8590', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#7d8590', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="health" fill="#00e676" name="Health Score" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="vibration" fill="#ffab00" name="Vibration" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peer machines list */}
            <div className="glass-panel rounded-2xl p-4 mt-3">
              <h3 className="text-sm font-semibold text-text-main mb-3">Peer Machines in "{selectedMachine.comparable_group}" Group</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {[selectedMachine, ...peers].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedId(m.id); onSelectMachine(m.id); }}
                    className={`glass-panel-light rounded-xl p-3 border text-left transition-all ${
                      m.id === selectedId ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-text-main">{m.name}</span>
                      {m.id === selectedId && <span className="text-[10px] text-primary font-bold">SELECTED</span>}
                    </div>
                    <div className="text-xs text-text-dim">{m.type}</div>
                    <div className="flex gap-3 mt-2 text-xs font-mono">
                      <span className="text-text-dim">Vib: <span className={m.vibration > 5 ? 'text-error' : 'text-text-main'}>{m.vibration.toFixed(1)}</span></span>
                      <span className="text-text-dim">Temp: <span className={m.temperature > 80 ? 'text-error' : 'text-text-main'}>{m.temperature.toFixed(1)}</span></span>
                      <span className="text-text-dim">HP: <span className={m.health_score < 50 ? 'text-error' : m.health_score < 75 ? 'text-warning' : 'text-success'}>{m.health_score}%</span></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
