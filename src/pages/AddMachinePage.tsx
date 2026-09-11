import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Machine } from '@/types';
import { Cpu, Plus, Check } from 'lucide-react';

export interface AddMachinePageProps {
  onAdded: () => void;
  onNavigate: (page: 'load-testing') => void;
}

const machineTypes = [
  'Motor', 'Pump', 'Compressor', 'Conveyor', 'Generator',
];

export function AddMachinePage({ onAdded, onNavigate }: AddMachinePageProps) {
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [count, setCount] = useState(2);
  const [machines, setMachines] = useState<{ name: string; type: string; location: string }[]>(
    [{ name: '', type: 'Motor', location: 'Floor 1' }],
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateMachine = (idx: number, field: string, value: string) => {
    setMachines((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const handleModeChange = (m: 'single' | 'multiple') => {
    setMode(m);
    if (m === 'single') {
      setMachines([{ name: '', type: 'Motor', location: 'Floor 1' }]);
    } else {
      setMachines(
        Array.from({ length: count }, (_, i) => ({
          name: '',
          type: 'Motor',
          location: 'Floor 1',
        })),
      );
    }
  };

  const handleCountChange = (c: number) => {
    setCount(c);
    setMachines(
      Array.from({ length: c }, (_, i) => ({
        name: machines[i]?.name || '',
        type: machines[i]?.type || 'Motor',
        location: machines[i]?.location || 'Floor 1',
      })),
    );
  };

  const handleSubmit = async () => {
    const valid = machines.filter((m) => m.name.trim());
    if (valid.length === 0) return;

    setSubmitting(true);
    for (const m of valid) {
      await supabase.from('machines').insert({
        name: m.name,
        type: m.type,
        location: m.location,
        status: 'maintenance',
        health_score: 0,
        temperature: 0,
        vibration: 0,
        pressure: 0,
        rpm: 0,
        humidity: 0,
        current_load: 0,
        power_consumption: 0,
        performance_rate: 0,
        load_percentage: 0,
        uptime_hours: 0,
        is_online: false,
      });
    }
    setSubmitting(false);
    setSuccess(true);
    onAdded();
    setTimeout(() => {
      setSuccess(false);
      onNavigate('load-testing');
    }, 1500);
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-text-main mb-6">Register New Machine(s)</h1>

        {/* Mode selection */}
        <div className="glass-panel rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-3">
            Do you want to monitor a single machine or multiple machines?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleModeChange('single')}
              className={`p-4 rounded-xl border transition-all text-left ${
                mode === 'single'
                  ? 'border-primary/40 bg-primary/5 glow-cyan'
                  : 'border-border bg-surface-2 hover:border-primary/20'
              }`}
            >
              <Cpu className={`w-6 h-6 mb-2 ${mode === 'single' ? 'text-primary' : 'text-text-dim'}`} />
              <div className="font-semibold text-text-main">Single Machine</div>
              <div className="text-xs text-text-dim mt-0.5">Register one machine</div>
            </button>
            <button
              onClick={() => handleModeChange('multiple')}
              className={`p-4 rounded-xl border transition-all text-left ${
                mode === 'multiple'
                  ? 'border-primary/40 bg-primary/5 glow-cyan'
                  : 'border-border bg-surface-2 hover:border-primary/20'
              }`}
            >
              <div className="flex gap-1 mb-2">
                <Cpu className={`w-6 h-6 ${mode === 'multiple' ? 'text-primary' : 'text-text-dim'}`} />
                <Cpu className={`w-6 h-6 -ml-3 ${mode === 'multiple' ? 'text-primary' : 'text-text-dim'}`} />
              </div>
              <div className="font-semibold text-text-main">Multiple Machines</div>
              <div className="text-xs text-text-dim mt-0.5">Register several machines</div>
            </button>
          </div>
        </div>

        {/* Multiple count */}
        {mode === 'multiple' && (
          <div className="glass-panel rounded-2xl p-5 mb-4">
            <label className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-3 block">
              Number of Machines
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="10"
                value={count}
                onChange={(e) => handleCountChange(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-2xl font-mono font-bold text-primary w-12 text-center">{count}</span>
            </div>
          </div>
        )}

        {/* Machine forms */}
        <div className="space-y-3 mb-4">
          {machines.map((machine, idx) => (
            <div key={idx} className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-sm">
                  {idx + 1}
                </span>
                <h3 className="text-sm font-semibold text-text-main">Machine {idx + 1}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-text-dim mb-1 block">Machine Name / ID</label>
                  <input
                    type="text"
                    placeholder="e.g. MOTOR-003"
                    value={machine.name}
                    onChange={(e) => updateMachine(idx, 'name', e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-dim mb-1 block">Machine Type</label>
                  <select
                    value={machine.type}
                    onChange={(e) => updateMachine(idx, 'type', e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary/50"
                  >
                    {machineTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-dim mb-1 block">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Floor 2 - Bay A"
                    value={machine.location}
                    onChange={(e) => updateMachine(idx, 'location', e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || success}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            success
              ? 'bg-success/20 text-success border border-success/30'
              : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
          }`}
        >
          {success ? (
            <><Check className="w-5 h-5" /> Machines Registered! Redirecting to calibration...</>
          ) : submitting ? (
            <>Registering...</>
          ) : (
            <><Plus className="w-5 h-5" /> Register {machines.filter((m) => m.name.trim()).length} Machine(s)</>
          )}
        </button>
      </div>
    </div>
  );
}
