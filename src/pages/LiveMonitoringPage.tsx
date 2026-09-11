import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Area, AreaChart,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import type { Machine, BaselineReading, ScoringThreshold } from '@/types';
import { calculateHealthScore, findNearestBaseline } from '@/lib/scoring';
import { generateDemoReading, generateHistoricalReadings } from '@/lib/demoData';
import { Activity, Thermometer, Zap, Gauge, RotateCw, Droplets, TrendingUp } from 'lucide-react';

export interface LiveMonitoringPageProps {
  machines: Machine[];
  baselines: BaselineReading[];
  thresholds: ScoringThreshold[];
  dataMode: 'live' | 'demo';
}

interface ChartDataPoint {
  time: string;
  rpm: number;
  vibration: number;
  temperature: number;
  humidity: number;
  current_load: number;
  performance_rate: number;
  load_percentage: number;
}

export function LiveMonitoringPage({ machines, baselines, thresholds, dataMode }: LiveMonitoringPageProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [latestReading, setLatestReading] = useState<ChartDataPoint | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (machines.length > 0 && !selectedId) {
      setSelectedId(machines[0].id);
    }
  }, [machines, selectedId]);

  const selectedMachine = machines.find((m) => m.id === selectedId);
  const machineBaselines = baselines.filter((b) => b.machine_id === selectedId);

  useEffect(() => {
    if (!selectedMachine) return;

    // Initialize with historical data
    const historical = generateHistoricalReadings(selectedMachine, 30).map((r) => ({
      time: new Date(r.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rpm: r.rpm,
      vibration: r.vibration,
      temperature: r.temperature,
      humidity: r.humidity,
      current_load: r.current_load,
      performance_rate: r.performance_rate,
      load_percentage: r.load_percentage,
    }));
    setChartData(historical);
    setLatestReading(historical[historical.length - 1]);

    // Live update interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      if (dataMode === 'demo') {
        const reading = generateDemoReading(selectedMachine);
        const point: ChartDataPoint = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rpm: reading.rpm,
          vibration: reading.vibration,
          temperature: reading.temperature,
          humidity: reading.humidity,
          current_load: reading.current_load,
          performance_rate: reading.performance_rate,
          load_percentage: reading.load_percentage,
        };
        setChartData((prev) => [...prev.slice(-29), point]);
        setLatestReading(point);

        // Also insert to DB
        await supabase.from('realtime_readings').insert(reading);
      } else {
        // Live mode: fetch latest from DB
        const { data } = await supabase
          .from('realtime_readings')
          .select('*')
          .eq('machine_id', selectedId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          const point: ChartDataPoint = {
            time: new Date(data.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            rpm: data.rpm,
            vibration: data.vibration,
            temperature: data.temperature,
            humidity: data.humidity,
            current_load: data.current_load,
            performance_rate: data.performance_rate,
            load_percentage: data.load_percentage,
          };
          setChartData((prev) => [...prev.slice(-29), point]);
          setLatestReading(point);
        }
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedMachine, selectedId, dataMode]);

  // Calculate health score
  const healthResult = selectedMachine && latestReading
    ? calculateHealthScore(
        {
          rpm: latestReading.rpm,
          vibration: latestReading.vibration,
          temperature: latestReading.temperature,
          humidity: latestReading.humidity,
          current_load: latestReading.current_load,
          performance_rate: latestReading.performance_rate,
          load_percentage: latestReading.load_percentage,
        },
        machineBaselines,
        thresholds,
        selectedMachine.type,
      )
    : null;

  const baseline = latestReading ? findNearestBaseline(machineBaselines, latestReading.load_percentage) : null;

  const sensorCards = latestReading ? [
    { icon: RotateCw, label: 'RPM', value: latestReading.rpm, unit: 'rpm', baseline: baseline?.rpm, color: 'text-primary' },
    { icon: Activity, label: 'Vibration', value: latestReading.vibration, unit: 'mm/s', baseline: baseline?.vibration, color: 'text-warning' },
    { icon: Thermometer, label: 'Temperature', value: latestReading.temperature, unit: '°C', baseline: baseline?.temperature, color: 'text-error' },
    { icon: Droplets, label: 'Humidity', value: latestReading.humidity, unit: '%', baseline: baseline?.humidity, color: 'text-primary' },
    { icon: Zap, label: 'Current', value: latestReading.current_load, unit: 'A', baseline: baseline?.current_load, color: 'text-warning' },
    { icon: TrendingUp, label: 'Performance', value: latestReading.performance_rate, unit: '%', baseline: baseline?.performance_rate, color: 'text-success' },
    { icon: Gauge, label: 'Load', value: latestReading.load_percentage, unit: '%', baseline: baseline?.load_percentage, color: 'text-primary' },
  ] : [];

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-text-main">Live Monitoring</h1>
          <div className="flex items-center gap-2">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary/50"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {dataMode === 'demo' && (
              <span className="text-xs font-mono font-bold text-warning bg-warning/10 px-2 py-1 rounded">DEMO DATA</span>
            )}
          </div>
        </div>

        {/* Health score + fault summary */}
        {healthResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
            <div className="glass-panel rounded-2xl p-4">
              <div className="text-xs text-text-dim uppercase tracking-wider mb-2">Overall Health Score</div>
              <div className="flex items-center gap-3">
                <div className={`text-4xl font-mono font-bold ${
                  healthResult.overall >= 75 ? 'text-success' : healthResult.overall >= 50 ? 'text-warning' : 'text-error'
                }`}>
                  {healthResult.overall}
                </div>
                <div>
                  <div className={`text-sm font-semibold ${
                    healthResult.overall >= 90 ? 'text-success' : healthResult.overall >= 75 ? 'text-success' : healthResult.overall >= 50 ? 'text-warning' : 'text-error'
                  }`}>{healthResult.statusLabel}</div>
                  <div className="text-xs text-text-dim">out of 100</div>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <div className="text-xs text-text-dim uppercase tracking-wider mb-2">Fault Detection</div>
              <div className="text-sm text-text-main">
                {healthResult.faultSummary || 'All parameters within normal range.'}
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <div className="text-xs text-text-dim uppercase tracking-wider mb-2">Load Recommendation</div>
              <div className="text-sm text-text-main">{healthResult.loadRecommendation}</div>
            </div>
          </div>
        )}

        {/* Sensor cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
          {sensorCards.map((card) => {
            const Icon = card.icon;
            const deviation = card.baseline && card.baseline > 0
              ? Math.abs(((card.value - card.baseline) / card.baseline) * 100)
              : 0;
            const isAbnormal = deviation > 15;
            return (
              <div key={card.label} className="glass-panel-light rounded-xl p-3 border border-border">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                  <span className="text-[10px] text-text-dim uppercase tracking-wider">{card.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-mono font-bold ${isAbnormal ? 'text-error' : 'text-text-main'}`}>
                    {card.value.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-text-dim">{card.unit}</span>
                </div>
                {card.baseline !== undefined && card.baseline > 0 && (
                  <div className="text-[10px] text-text-dim font-mono mt-0.5">
                    base: {card.baseline.toFixed(1)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-text-main mb-3">Load vs RPM</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rpmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d9ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00d9ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="time" tick={{ fill: '#7d8590', fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: '#7d8590', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 8 }} />
                <Area type="monotone" dataKey="rpm" stroke="#00d9ff" fill="url(#rpmGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-text-main mb-3">Load vs Vibration</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="vibGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffab00" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ffab00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="time" tick={{ fill: '#7d8590', fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: '#7d8590', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 8 }} />
                <Area type="monotone" dataKey="vibration" stroke="#ffab00" fill="url(#vibGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-text-main mb-3">Load vs Temperature</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3d57" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ff3d57" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="time" tick={{ fill: '#7d8590', fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: '#7d8590', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 8 }} />
                <Area type="monotone" dataKey="temperature" stroke="#ff3d57" fill="url(#tempGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-text-main mb-3">All Parameters (Historical Trend)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="time" tick={{ fill: '#7d8590', fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: '#7d8590', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="rpm" stroke="#00d9ff" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="vibration" stroke="#ffab00" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="temperature" stroke="#ff3d57" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="performance_rate" stroke="#00e676" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service prediction */}
        {healthResult && (
          <div className="glass-panel rounded-2xl p-4 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-text-dim uppercase tracking-wider mb-1">Service Prediction (Estimated)</div>
                <div className="text-sm text-text-main">{healthResult.serviceRecommendation}</div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                healthResult.servicePriority === 'high' ? 'bg-error/10 text-error' :
                healthResult.servicePriority === 'medium' ? 'bg-warning/10 text-warning' :
                healthResult.servicePriority === 'low' ? 'bg-primary/10 text-primary' :
                'bg-success/10 text-success'
              }`}>
                Priority: {healthResult.servicePriority}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
