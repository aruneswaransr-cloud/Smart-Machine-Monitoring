import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, Camera, X, ArrowRight } from 'lucide-react';
import type { Machine, Alert, BaselineReading, ScoringThreshold } from '@/types';
import { calculateHealthScore } from '@/lib/scoring';
import { supabase } from '@/lib/supabase';

export interface ScanQRPageProps {
  machines: Machine[];
  alerts: Alert[];
  baselines: BaselineReading[];
  thresholds: ScoringThreshold[];
  onSelectMachine: (id: string) => void;
}

export function ScanQRPage({ machines, alerts, baselines, thresholds, onSelectMachine }: ScanQRPageProps) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [foundMachine, setFoundMachine] = useState<Machine | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-scanner-container';

  const startScan = async () => {
    setError(null);
    setScanResult(null);
    setFoundMachine(null);
    setScanning(true);

    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop();
          setScanning(false);
          setScanResult(decodedText);
          lookupMachine(decodedText);
        },
        () => {},
      );
    } catch (err) {
      setScanning(false);
      setError('Camera access denied or not available. Try entering the QR token manually.');
    }
  };

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const lookupMachine = async (token: string) => {
    // Extract token from URL if needed
    const cleanToken = token.includes('/m/') ? token.split('/m/')[1] : token;

    const { data, error: queryError } = await supabase
      .from('machines')
      .select('*')
      .eq('qr_token', cleanToken)
      .maybeSingle();

    if (queryError || !data) {
      setError('No machine found for this QR code. Please verify the QR code is valid.');
      return;
    }

    setFoundMachine(data as Machine);
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.currentTarget as HTMLFormElement).elements.namedItem('token') as HTMLInputElement;
    if (input.value) {
      lookupMachine(input.value);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      }
    };
  }, []);

  const machineBaselines = foundMachine ? baselines.filter((b) => b.machine_id === foundMachine.id) : [];
  const healthResult = foundMachine
    ? calculateHealthScore(
        {
          rpm: foundMachine.rpm,
          vibration: foundMachine.vibration,
          temperature: foundMachine.temperature,
          humidity: foundMachine.humidity,
          current_load: foundMachine.current_load,
          performance_rate: foundMachine.performance_rate,
          load_percentage: foundMachine.load_percentage,
        },
        machineBaselines,
        thresholds,
        foundMachine.type,
      )
    : null;

  const machineAlerts = foundMachine ? alerts.filter((a) => a.machine_id === foundMachine.id) : [];

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-text-main mb-1">Scan Machine QR</h1>
        <p className="text-sm text-text-dim mb-6">
          Scan a machine's QR code to view its live status, health score, and sensor data on a mobile-friendly page.
        </p>

        {/* Scanner */}
        <div className="glass-panel rounded-2xl p-6 mb-4">
          <div id={containerId} className="w-full max-w-sm mx-auto rounded-xl overflow-hidden" />

          {!scanning && !foundMachine && (
            <div className="text-center">
              <button
                onClick={startScan}
                className="px-6 py-3 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-sm font-semibold flex items-center gap-2 mx-auto transition-all"
              >
                <Camera className="w-5 h-5" /> Start Scanning
              </button>
            </div>
          )}

          {scanning && (
            <div className="text-center mt-4">
              <div className="flex items-center justify-center gap-2 text-primary text-sm mb-3">
                <ScanLine className="w-5 h-5 animate-pulse" /> Scanning...
              </div>
              <button
                onClick={stopScan}
                className="px-4 py-2 rounded-lg bg-error/10 text-error border border-error/30 hover:bg-error/20 text-sm font-medium flex items-center gap-2 mx-auto transition-all"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 text-center">
              <div className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-4 py-3 mb-3">{error}</div>
              <form onSubmit={handleManualLookup} className="flex gap-2 max-w-sm mx-auto">
                <input
                  name="token"
                  type="text"
                  placeholder="Enter QR token manually..."
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary/50 font-mono"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm font-medium">Look Up</button>
              </form>
            </div>
          )}
        </div>

        {/* Machine status page (mobile-friendly) */}
        {foundMachine && healthResult && (
          <div className="glass-panel rounded-2xl p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-main">{foundMachine.name}</h2>
                <p className="text-xs text-text-dim">{foundMachine.type} · {foundMachine.location}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${foundMachine.is_online ? 'bg-success animate-blink' : 'bg-text-dim'}`} />
            </div>

            {/* Health score */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#1e2a3a" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={healthResult.overall >= 75 ? '#00e676' : healthResult.overall >= 50 ? '#ffab00' : '#ff3d57'}
                    strokeWidth="6"
                    strokeDasharray={`${(healthResult.overall / 100) * 214} 214`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-mono font-bold text-text-main">{healthResult.overall}</span>
                </div>
              </div>
              <div>
                <div className={`text-sm font-bold ${
                  healthResult.overall >= 90 ? 'text-success' :
                  healthResult.overall >= 75 ? 'text-success' :
                  healthResult.overall >= 50 ? 'text-warning' : 'text-error'
                }`}>{healthResult.statusLabel}</div>
                <div className="text-xs text-text-dim mt-0.5">
                  {foundMachine.is_online ? 'Online' : 'Offline'} · Last update: {foundMachine.last_reading_at ? new Date(foundMachine.last_reading_at).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
            </div>

            {/* Live sensor grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {[
                { label: 'RPM', value: foundMachine.rpm, unit: 'rpm' },
                { label: 'Vibration', value: foundMachine.vibration, unit: 'mm/s' },
                { label: 'Temperature', value: foundMachine.temperature, unit: '°C' },
                { label: 'Humidity', value: foundMachine.humidity, unit: '%' },
                { label: 'Current', value: foundMachine.current_load, unit: 'A' },
                { label: 'Power', value: foundMachine.power_consumption, unit: 'kW' },
                { label: 'Performance', value: foundMachine.performance_rate, unit: '%' },
                { label: 'Load', value: foundMachine.load_percentage, unit: '%' },
              ].map((s) => (
                <div key={s.label} className="glass-panel-light rounded-xl p-3 border border-border">
                  <div className="text-[10px] text-text-dim uppercase tracking-wider">{s.label}</div>
                  <div className="text-lg font-mono font-bold text-text-main">
                    {typeof s.value === 'number' ? s.value.toFixed(1) : s.value}
                    <span className="text-xs text-text-dim ml-1">{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Fault summary */}
            {healthResult.faultSummary && (
              <div className="text-sm text-error bg-error/5 border border-error/20 rounded-lg px-3 py-2 mb-3">
                {healthResult.faultSummary}
              </div>
            )}

            {/* Load recommendation */}
            <div className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mb-3">
              {healthResult.loadRecommendation}
            </div>

            {/* Alerts */}
            {machineAlerts.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-text-dim uppercase tracking-wider mb-2">Active Alerts ({machineAlerts.length})</div>
                <div className="space-y-1.5">
                  {machineAlerts.slice(0, 3).map((a) => (
                    <div key={a.id} className={`text-xs rounded-lg px-3 py-2 border ${
                      a.severity === 'critical' ? 'bg-error/5 border-error/20 text-error' :
                      a.severity === 'warning' ? 'bg-warning/5 border-warning/20 text-warning' :
                      'bg-primary/5 border-primary/20 text-primary'
                    }`}>
                      {a.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => onSelectMachine(foundMachine.id)}
              className="w-full py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              View Full Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
