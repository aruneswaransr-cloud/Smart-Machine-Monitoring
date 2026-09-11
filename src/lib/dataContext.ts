import type { Machine, Alert, BaselineReading, ScoringThreshold } from '@/types';
import { supabase } from '@/lib/supabase';

export interface DataContext {
  machines: Machine[];
  alerts: Alert[];
  baselines: BaselineReading[];
  thresholds: ScoringThreshold[];
  loading: boolean;
  refresh: () => Promise<void>;
  addMachine: (data: Partial<Machine>) => Promise<Machine | null>;
  addBaseline: (data: Partial<BaselineReading>) => Promise<void>;
  updateMachine: (id: string, data: Partial<Machine>) => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  insertRealtimeReading: (reading: Record<string, unknown>) => Promise<void>;
}

export async function fetchAllData(): Promise<{
  machines: Machine[];
  alerts: Alert[];
  baselines: BaselineReading[];
  thresholds: ScoringThreshold[];
}> {
  const [machinesRes, alertsRes, baselinesRes, thresholdsRes] = await Promise.all([
    supabase.from('machines').select('*').order('name'),
    supabase.from('alerts').select('*').order('created_at', { ascending: false }),
    supabase.from('baseline_readings').select('*').order('load_percentage'),
    supabase.from('scoring_thresholds').select('*'),
  ]);

  return {
    machines: (machinesRes.data as Machine[]) || [],
    alerts: (alertsRes.data as Alert[]) || [],
    baselines: (baselinesRes.data as BaselineReading[]) || [],
    thresholds: (thresholdsRes.data as ScoringThreshold[]) || [],
  };
}
