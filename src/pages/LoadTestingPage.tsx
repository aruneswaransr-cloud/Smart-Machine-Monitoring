import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Machine, BaselineReading } from '@/types';
import { Gauge, Save, Plus, Trash2, Activity } from 'lucide-react';

export interface LoadTestingPageProps {
  machines: Machine[];
  baselines: BaselineReading[];
  onRefresh: () => void;
}

const loadLevels = [0, 25, 50, 75, 100];

export function LoadTestingPage({ machines, baselines, onRefresh }: LoadTestingPageProps) {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [currentLoad, setCurrentLoad] = useState<number>(25);
  const [formData, setFormData] = useState({
    rpm: '',
    vibration: '',
    temperature: '',
    humidity: '',
    current_load: '',
    power_consumption: '',
    performance_rate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  const selectedMachine = machines.find((m) => m.id === selectedMachineId);
  const machineBaselines = baselines.filter((b) => b.machine_id === selectedMachineId);
  const existingForLoad = machineBaselines.find((b) => b.load_percentage === currentLoad);

  useEffect(() => {
    if (existingForLoad) {
      setFormData({
        rpm: String(existingForLoad.rpm),
        vibration: String(existingForLoad.vibration),
        temperature: String(existingForLoad.temperature),
        humidity: String(existingForLoad.humidity),
        current_load: String(existingForLoad.current_load),
        power_consumption: String(existingForLoad.power_consumption),
        performance_rate: String(existingForLoad.performance_rate),
        notes: existingForLoad.notes || '',
      });
    } else {
      setFormData({
        rpm: '', vibration: '', temperature: '', humidity: '',
        current_load: '', power_consumption: '', performance_rate: '', notes: '',
      });
    }
  }, [existingForLoad, currentLoad, selectedMachineId]);

  const handleSave = async () => {
    if (!selectedMachineId) return;
    setSaving(true);

    if (existingForLoad) {
      await supabase.from('baseline_readings').update({
        rpm: Number(formData.rpm) || 0,
        vibration: Number(formData.vibration) || 0,
        temperature: Number(formData.temperature) || 0,
        humidity: Number(formData.humidity) || 0,
        current_load: Number(formData.current_load) || 0,
        power_consumption: Number(formData.power_consumption) || 0,
        performance_rate: Number(formData.performance_rate) || 0,
        notes: formData.notes,
      }).eq('id', existingForLoad.id);
    } else {
      await supabase.from('baseline_readings').insert({
        machine_id: selectedMachineId,
        load_percentage: currentLoad,
        rpm: Number(formData.rpm) || 0,
        vibration: Number(formData.vibration) || 0,
        temperature: Number(formData.temperature) || 0,
        humidity: Number(formData.humidity) || 0,
        current_load: Number(formData.current_load) || 0,
        power_consumption: Number(formData.power_consumption) || 0,
        performance_rate: Number(formData.performance_rate) || 0,
        notes: formData.notes,
      });
    }

    setSaving(false);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('baseline_readings').delete().eq('id', id);
    onRefresh();
  };

  const fields = [
    { key: 'rpm', label: 'RPM', unit: 'rpm' },
    { key: 'vibration', label: 'Vibration', unit: 'mm/s' },
    { key: 'temperature', label: 'Temperature', unit: '°C' },
    { key: 'humidity', label: 'Humidity', unit: '%' },
    { key: 'current_load', label: 'Current/Load', unit: 'A' },
    { key: 'power_consumption', label: 'Power Consumption', unit: 'kW' },
    { key: 'performance_rate', label: 'Performance Rate', unit: '%' },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-text-main mb-1">Machine Calibration / Load Testing</h1>
        <p className="text-sm text-text-dim mb-6">
          Test the machine at different load levels and record the normal sensor readings as baseline reference data.
        </p>

        {/* Machine selector */}
        <div className="glass-panel rounded-2xl p-5 mb-4">
          <label className="text-xs text-text-dim uppercase tracking-wider font-semibold mb-2 block">Select Machine</label>
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary/50"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.name} — {m.type}</option>
            ))}
          </select>
        </div>

        {/* Load level selector */}
        <div className="glass-panel rounded-2xl p-5 mb-4">
          <label className="text-xs text-text-dim uppercase tracking-wider font-semibold mb-3 block">Load Condition</label>
          <div className="flex gap-2 flex-wrap">
            {loadLevels.map((level) => (
              <button
                key={level}
                onClick={() => setCurrentLoad(level)}
                className={`px-4 py-2 rounded-lg text-sm font-mono font-bold transition-all ${
                  currentLoad === level
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-surface-2 text-text-dim border border-border hover:text-text-main'
                }`}
              >
                {level}%
              </button>
            ))}
          </div>
        </div>

        {/* Sensor input form */}
        <div className="glass-panel rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-text-main">
              Record Baseline at {currentLoad}% Load
              {existingForLoad && <span className="text-text-dim ml-2 text-xs">(Editing existing)</span>}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="text-xs text-text-dim mb-1 block">{field.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 pr-12 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary/50 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-dim">{field.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="text-xs text-text-dim mb-1 block">Notes</label>
            <input
              type="text"
              placeholder="e.g. Stable operation at 50% load"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary/50"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-sm font-semibold flex items-center gap-2 transition-all"
          >
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> {existingForLoad ? 'Update' : 'Save'} Baseline</>}
          </button>
        </div>

        {/* Existing baselines table */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-text-main">
              Recorded Baselines for {selectedMachine?.name || ''}
            </h2>
          </div>
          {machineBaselines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wider">
                    <th className="text-left px-3 py-2 font-medium">Load</th>
                    <th className="text-center px-3 py-2 font-medium">RPM</th>
                    <th className="text-center px-3 py-2 font-medium">Vibration</th>
                    <th className="text-center px-3 py-2 font-medium">Temp</th>
                    <th className="text-center px-3 py-2 font-medium">Humidity</th>
                    <th className="text-center px-3 py-2 font-medium">Current</th>
                    <th className="text-center px-3 py-2 font-medium">Power</th>
                    <th className="text-center px-3 py-2 font-medium">Perf</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {machineBaselines.sort((a, b) => a.load_percentage - b.load_percentage).map((b) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-surface-2/30">
                      <td className="px-3 py-2.5 font-mono font-bold text-primary">{b.load_percentage}%</td>
                      <td className="px-3 py-2.5 text-center font-mono text-text-main">{b.rpm}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-text-main">{b.vibration.toFixed(1)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-text-main">{b.temperature.toFixed(1)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-text-main">{b.humidity.toFixed(1)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-text-main">{b.current_load.toFixed(1)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-text-main">{b.power_consumption.toFixed(1)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-text-main">{b.performance_rate.toFixed(0)}%</td>
                      <td className="px-2 py-2.5">
                        <button onClick={() => handleDelete(b.id)} className="text-text-dim hover:text-error transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-dim text-sm">
              No baseline data recorded yet. Start by selecting a load level and entering sensor values.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
