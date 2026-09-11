import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Machine, Alert, BaselineReading, ScoringThreshold, PageId, DataMode } from '@/types';
import { Sidebar } from '@/components/ui/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { MachinesPage } from '@/pages/MachinesPage';
import { AddMachinePage } from '@/pages/AddMachinePage';
import { LoadTestingPage } from '@/pages/LoadTestingPage';
import { LiveMonitoringPage } from '@/pages/LiveMonitoringPage';
import { ComparisonPage } from '@/pages/ComparisonPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { QRManagementPage } from '@/pages/QRManagementPage';
import { ScanQRPage } from '@/pages/ScanQRPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { MLModulePage } from '@/pages/MLModulePage';
import { generateDemoReading } from '@/lib/demoData';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [baselines, setBaselines] = useState<BaselineReading[]>([]);
  const [thresholds, setThresholds] = useState<ScoringThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataMode, setDataMode] = useState<DataMode>('demo');

  const refresh = useCallback(async () => {
    const [machinesRes, alertsRes, baselinesRes, thresholdsRes] = await Promise.all([
      supabase.from('machines').select('*').order('name'),
      supabase.from('alerts').select('*').order('created_at', { ascending: false }),
      supabase.from('baseline_readings').select('*').order('load_percentage'),
      supabase.from('scoring_thresholds').select('*'),
    ]);

    if (machinesRes.data) setMachines(machinesRes.data as Machine[]);
    if (alertsRes.data) setAlerts(alertsRes.data as Alert[]);
    if (baselinesRes.data) setBaselines(baselinesRes.data as BaselineReading[]);
    if (thresholdsRes.data) setThresholds(thresholdsRes.data as ScoringThreshold[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Demo mode: simulate live sensor updates
  useEffect(() => {
    if (machines.length === 0 || dataMode !== 'demo') return;

    const interval = setInterval(async () => {
      const updated = machines.map((m) => {
        if (!m.is_online) return m;
        const reading = generateDemoReading(m);
        return {
          ...m,
          rpm: reading.rpm,
          vibration: reading.vibration,
          temperature: reading.temperature,
          humidity: reading.humidity,
          current_load: reading.current_load,
          power_consumption: reading.power_consumption,
          performance_rate: reading.performance_rate,
          load_percentage: reading.load_percentage,
          last_reading_at: reading.recorded_at,
        };
      });
      setMachines(updated);

      // Insert demo readings to DB (non-blocking)
      for (const m of updated) {
        if (m.is_online) {
          const reading = generateDemoReading(m);
          supabase.from('realtime_readings').insert(reading).then(() => {});
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [machines, dataMode]);

  const handleAcknowledge = useCallback(async (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    await supabase.from('alerts').update({ acknowledged: true }).eq('id', alertId);
  }, []);

  const handleNavigate = useCallback((page: PageId) => {
    setCurrentPage(page);
  }, []);

  const handleToggleMode = useCallback(() => {
    setDataMode((prev) => (prev === 'demo' ? 'live' : 'demo'));
  }, []);

  const unackAlertCount = alerts.filter((a) => !a.acknowledged).length;

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-text-dim text-sm font-mono">Initializing IoT Factory System...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage machines={machines} alerts={alerts} onAcknowledge={handleAcknowledge} />;
      case 'machines':
        return <MachinesPage machines={machines} onSelectMachine={() => setCurrentPage('live-monitoring')} />;
      case 'add-machine':
        return <AddMachinePage onAdded={refresh} onNavigate={() => setCurrentPage('load-testing')} />;
      case 'load-testing':
        return <LoadTestingPage machines={machines} baselines={baselines} onRefresh={refresh} />;
      case 'live-monitoring':
        return <LiveMonitoringPage machines={machines} baselines={baselines} thresholds={thresholds} dataMode={dataMode} />;
      case 'comparison':
        return <ComparisonPage machines={machines} baselines={baselines} onSelectMachine={() => setCurrentPage('live-monitoring')} />;
      case 'alerts':
        return <AlertsPage alerts={alerts} machines={machines} onAcknowledge={handleAcknowledge} />;
      case 'maintenance':
        return <MaintenancePage machines={machines} alerts={alerts} baselines={baselines} thresholds={thresholds} />;
      case 'qr-management':
        return <QRManagementPage machines={machines} onSelectMachine={() => setCurrentPage('live-monitoring')} />;
      case 'scan-qr':
        return <ScanQRPage machines={machines} alerts={alerts} baselines={baselines} thresholds={thresholds} onSelectMachine={() => setCurrentPage('live-monitoring')} />;
      case 'settings':
        return <SettingsPage thresholds={thresholds} onRefresh={refresh} />;
      case 'ml-module':
        return <MLModulePage />;
      default:
        return <DashboardPage machines={machines} alerts={alerts} onAcknowledge={handleAcknowledge} />;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-bg overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        dataMode={dataMode}
        onToggleMode={handleToggleMode}
        machineCount={machines.length}
        alertCount={unackAlertCount}
      />
      <main className="flex-1 overflow-hidden">
        {renderPage()}
      </main>
    </div>
  );
}
