import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ScoringThreshold } from '@/types';
import { Settings as SettingsIcon, Save, Sliders } from 'lucide-react';

export interface SettingsPageProps {
  thresholds: ScoringThreshold[];
  onRefresh: () => void;
}

export function SettingsPage({ thresholds, onRefresh }: SettingsPageProps) {
  const [editedThresholds, setEditedThresholds] = useState<Record<string, ScoringThreshold>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const map: Record<string, ScoringThreshold> = {};
    thresholds.forEach((t) => {
      map[`${t.machine_type}-${t.parameter}`] = { ...t };
    });
    setEditedThresholds(map);
  }, [thresholds]);

  const updateThreshold = (key: string, field: keyof ScoringThreshold, value: string) => {
    setEditedThresholds((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: Number(value) },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const key of Object.keys(editedThresholds)) {
      const t = editedThresholds[key];
      await supabase.from('scoring_thresholds').update({
        warning_deviation: t.warning_deviation,
        critical_deviation: t.critical_deviation,
        severe_deviation: t.severe_deviation,
        min_value: t.min_value,
        max_value: t.max_value,
      }).eq('id', t.id);
    }
    setSaving(false);
    setSavedMsg(true);
    onRefresh();
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const machineTypes = Array.from(new Set(thresholds.map((t) => t.machine_type)));

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-text-main">Settings</h1>
        </div>
        <p className="text-sm text-text-dim mb-6">
          Configure scoring thresholds for each machine type. These values control how sensor deviations are scored and classified.
        </p>

        {/* Scoring thresholds */}
        <div className="glass-panel rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-text-main">Scoring Thresholds (Deviation %)</h2>
          </div>

          <div className="text-xs text-text-dim mb-4">
            Warning: deviation triggers a warning alert. Critical: triggers critical alert. Severe: triggers severe fault.
            Lower values make the system more sensitive to deviations.
          </div>

          {machineTypes.map((type) => {
            const typeThresholds = thresholds.filter((t) => t.machine_type === type);
            return (
              <div key={type} className="mb-4">
                <h3 className="text-sm font-bold text-primary mb-2">{type}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wider">
                        <th className="text-left px-2 py-2 font-medium">Parameter</th>
                        <th className="text-center px-2 py-2 font-medium">Unit</th>
                        <th className="text-center px-2 py-2 font-medium">Warning %</th>
                        <th className="text-center px-2 py-2 font-medium">Critical %</th>
                        <th className="text-center px-2 py-2 font-medium">Severe %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeThresholds.map((t) => {
                        const key = `${t.machine_type}-${t.parameter}`;
                        const edited = editedThresholds[key];
                        return (
                          <tr key={t.id} className="border-b border-border/50">
                            <td className="px-2 py-2 text-text-main capitalize">{t.parameter.replace('_', ' ')}</td>
                            <td className="px-2 py-2 text-center text-text-dim font-mono">{t.unit}</td>
                            {edited && (
                              <>
                                <td className="px-2 py-2 text-center">
                                  <input
                                    type="number"
                                    value={edited.warning_deviation}
                                    onChange={(e) => updateThreshold(key, 'warning_deviation', e.target.value)}
                                    className="w-16 bg-surface-2 border border-border rounded px-2 py-1 text-center text-text-main font-mono text-xs focus:outline-none focus:border-primary/50"
                                  />
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <input
                                    type="number"
                                    value={edited.critical_deviation}
                                    onChange={(e) => updateThreshold(key, 'critical_deviation', e.target.value)}
                                    className="w-16 bg-surface-2 border border-border rounded px-2 py-1 text-center text-text-main font-mono text-xs focus:outline-none focus:border-primary/50"
                                  />
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <input
                                    type="number"
                                    value={edited.severe_deviation}
                                    onChange={(e) => updateThreshold(key, 'severe_deviation', e.target.value)}
                                    className="w-16 bg-surface-2 border border-border rounded px-2 py-1 text-center text-text-main font-mono text-xs focus:outline-none focus:border-primary/50"
                                  />
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-sm font-semibold flex items-center gap-2 transition-all"
          >
            {savedMsg ? 'Saved!' : saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Thresholds</>}
          </button>
        </div>

        {/* ESP32 API info */}
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-text-main mb-3">ESP32 API Endpoint</h2>
          <p className="text-xs text-text-dim mb-3">
            Configure your ESP32 to POST sensor data to this endpoint. The backend identifies the machine by Machine ID and stores readings automatically.
          </p>
          <div className="bg-surface-2 border border-border rounded-lg p-3 font-mono text-xs text-text-main overflow-x-auto">
            <div className="text-text-dim mb-1">POST endpoint:</div>
            <div className="text-primary break-all">{import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-sensor-data</div>
            <div className="text-text-dim mt-3 mb-1">Request body (JSON):</div>
            <pre className="text-success">{`{
  "machine_id": "uuid-of-machine",
  "load_percentage": 75,
  "rpm": 8500,
  "vibration": 3.5,
  "temperature": 68.5,
  "humidity": 45.0,
  "current_load": 12.0,
  "power_consumption": 3.5,
  "performance_rate": 92.0
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
