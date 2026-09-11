import type { Machine } from '@/types';

export interface DemoSensorReading {
  machine_id: string;
  load_percentage: number;
  rpm: number;
  vibration: number;
  temperature: number;
  humidity: number;
  current_load: number;
  power_consumption: number;
  performance_rate: number;
  is_demo: boolean;
  recorded_at: string;
}

const loadProfiles: Record<string, { rpm: number; vib: number; temp: number; hum: number; curr: number; pow: number; perf: number }[]> = {
  Motor: [
    { rpm: 0, vib: 0.3, temp: 25, hum: 40, curr: 1.5, pow: 0.3, perf: 0 },
    { rpm: 900, vib: 1.0, temp: 38, hum: 42, curr: 4, pow: 0.8, perf: 85 },
    { rpm: 1800, vib: 1.8, temp: 52, hum: 45, curr: 7, pow: 1.5, perf: 90 },
    { rpm: 2700, vib: 2.8, temp: 68, hum: 48, curr: 11, pow: 2.5, perf: 92 },
    { rpm: 3600, vib: 4.0, temp: 82, hum: 52, curr: 15, pow: 3.8, perf: 85 },
  ],
  Pump: [
    { rpm: 0, vib: 0.5, temp: 28, hum: 45, curr: 3, pow: 0.5, perf: 0 },
    { rpm: 800, vib: 1.5, temp: 45, hum: 46, curr: 8, pow: 1.5, perf: 82 },
    { rpm: 1600, vib: 2.5, temp: 60, hum: 48, curr: 14, pow: 3.0, perf: 88 },
    { rpm: 2400, vib: 3.8, temp: 75, hum: 50, curr: 22, pow: 5.5, perf: 80 },
    { rpm: 3200, vib: 5.5, temp: 92, hum: 55, curr: 32, pow: 8.0, perf: 68 },
  ],
  Compressor: [
    { rpm: 0, vib: 0.4, temp: 26, hum: 42, curr: 2, pow: 0.4, perf: 0 },
    { rpm: 600, vib: 1.2, temp: 40, hum: 43, curr: 6, pow: 1.2, perf: 86 },
    { rpm: 1200, vib: 2.0, temp: 55, hum: 45, curr: 10, pow: 2.5, perf: 90 },
    { rpm: 1800, vib: 3.2, temp: 72, hum: 48, curr: 16, pow: 4.0, perf: 87 },
    { rpm: 2400, vib: 4.8, temp: 88, hum: 52, curr: 24, pow: 6.5, perf: 78 },
  ],
  Conveyor: [
    { rpm: 0, vib: 0.4, temp: 24, hum: 40, curr: 1, pow: 0.3, perf: 0 },
    { rpm: 300, vib: 1.2, temp: 40, hum: 42, curr: 2, pow: 0.6, perf: 85 },
    { rpm: 600, vib: 2.0, temp: 52, hum: 44, curr: 4, pow: 1.0, perf: 90 },
    { rpm: 900, vib: 2.8, temp: 62, hum: 46, curr: 5, pow: 1.5, perf: 88 },
    { rpm: 1200, vib: 3.5, temp: 72, hum: 50, curr: 7, pow: 2.0, perf: 82 },
  ],
  Generator: [
    { rpm: 0, vib: 0.3, temp: 25, hum: 38, curr: 2, pow: 0.5, perf: 0 },
    { rpm: 450, vib: 1.0, temp: 42, hum: 40, curr: 6, pow: 1.5, perf: 87 },
    { rpm: 900, vib: 1.8, temp: 58, hum: 43, curr: 12, pow: 3.0, perf: 92 },
    { rpm: 1350, vib: 2.8, temp: 72, hum: 46, curr: 20, pow: 5.5, perf: 90 },
    { rpm: 1800, vib: 4.2, temp: 85, hum: 50, curr: 30, pow: 9.0, perf: 83 },
  ],
};

function getProfile(machineType: string) {
  if (loadProfiles[machineType]) return loadProfiles[machineType];
  for (const key of Object.keys(loadProfiles)) {
    if (machineType.includes(key) || key.includes(machineType)) {
      return loadProfiles[key];
    }
  }
  return loadProfiles['Motor'];
}

export function generateDemoReading(machine: Machine): DemoSensorReading {
  const profiles = getProfile(machine.type);
  const loadIdx = Math.min(4, Math.floor(machine.load_percentage / 25));
  const profile = profiles[loadIdx];

  const fluctuation = machine.status === 'critical' ? 1.4 : machine.status === 'warning' ? 1.2 : 1.0;

  return {
    machine_id: machine.id,
    load_percentage: Math.round(machine.load_percentage + (Math.random() - 0.5) * 5),
    rpm: Math.max(0, Math.round(profile.rpm * (1 + (Math.random() - 0.5) * 0.05))),
    vibration: Math.max(0, Math.round(profile.vib * fluctuation * (1 + (Math.random() - 0.5) * 0.1) * 100) / 100),
    temperature: Math.round(profile.temp * fluctuation * (1 + (Math.random() - 0.5) * 0.05) * 10) / 10,
    humidity: Math.round(profile.hum * (1 + (Math.random() - 0.5) * 0.08) * 10) / 10,
    current_load: Math.max(0, Math.round(profile.curr * fluctuation * (1 + (Math.random() - 0.5) * 0.08) * 100) / 100),
    power_consumption: Math.max(0, Math.round(profile.pow * fluctuation * (1 + (Math.random() - 0.5) * 0.08) * 100) / 100),
    performance_rate: Math.max(0, Math.min(100, Math.round(profile.perf / fluctuation * (1 + (Math.random() - 0.5) * 0.05) * 10) / 10)),
    is_demo: true,
    recorded_at: new Date().toISOString(),
  };
}

export function generateHistoricalReadings(machine: Machine, count: number): DemoSensorReading[] {
  const readings: DemoSensorReading[] = [];
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now - i * 5000);
    const profiles = getProfile(machine.type);
    const loadIdx = Math.min(4, Math.floor(machine.load_percentage / 25));
    const profile = profiles[loadIdx];
    const fluctuation = machine.status === 'critical' ? 1.3 + Math.sin(i / 5) * 0.1 : machine.status === 'warning' ? 1.15 + Math.sin(i / 5) * 0.05 : 1.0 + Math.sin(i / 10) * 0.03;

    readings.push({
      machine_id: machine.id,
      load_percentage: Math.round(machine.load_percentage + (Math.random() - 0.5) * 5),
      rpm: Math.max(0, Math.round(profile.rpm * (1 + (Math.random() - 0.5) * 0.05))),
      vibration: Math.max(0, Math.round(profile.vib * fluctuation * (1 + (Math.random() - 0.5) * 0.1) * 100) / 100),
      temperature: Math.round(profile.temp * fluctuation * (1 + (Math.random() - 0.5) * 0.05) * 10) / 10,
      humidity: Math.round(profile.hum * (1 + (Math.random() - 0.5) * 0.08) * 10) / 10,
      current_load: Math.max(0, Math.round(profile.curr * fluctuation * (1 + (Math.random() - 0.5) * 0.08) * 100) / 100),
      power_consumption: Math.max(0, Math.round(profile.pow * fluctuation * (1 + (Math.random() - 0.5) * 0.08) * 100) / 100),
      performance_rate: Math.max(0, Math.min(100, Math.round(profile.perf / fluctuation * (1 + (Math.random() - 0.5) * 0.05) * 10) / 10)),
      is_demo: true,
      recorded_at: time.toISOString(),
    });
  }
  return readings;
}
