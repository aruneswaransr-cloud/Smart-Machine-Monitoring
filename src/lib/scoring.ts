import type {
  BaselineReading,
  ParameterScore,
  HealthScoreResult,
  MachineStatus,
  ScoringThreshold,
} from '@/types';

const PARAM_LABELS: Record<string, string> = {
  rpm: 'RPM',
  vibration: 'Vibration',
  temperature: 'Temperature',
  humidity: 'Humidity',
  current_load: 'Current/Load',
  performance_rate: 'Performance',
};

const PARAM_UNITS: Record<string, string> = {
  rpm: 'rpm',
  vibration: 'mm/s',
  temperature: '°C',
  humidity: '%',
  current_load: 'A',
  performance_rate: '%',
};

export function findNearestBaseline(
  baselines: BaselineReading[],
  loadPercentage: number,
): BaselineReading | null {
  if (baselines.length === 0) return null;
  let nearest = baselines[0];
  let minDiff = Math.abs(baselines[0].load_percentage - loadPercentage);
  for (const b of baselines) {
    const diff = Math.abs(b.load_percentage - loadPercentage);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = b;
    }
  }
  return nearest;
}

export function calculateParameterScore(
  parameter: string,
  detected: number,
  expected: number,
  thresholds: ScoringThreshold | null,
): ParameterScore {
  const threshold = thresholds ?? {
    warning_deviation: 15,
    critical_deviation: 30,
    severe_deviation: 50,
  };

  const deviation = expected !== 0
    ? Math.abs(((detected - expected) / expected) * 100)
    : Math.abs(detected - expected) * 10;

  let status: ParameterScore['status'] = 'healthy';
  let score = 100;

  if (deviation >= threshold.severe_deviation) {
    status = 'severe';
    score = Math.max(0, 25 - (deviation - threshold.severe_deviation) * 0.3);
  } else if (deviation >= threshold.critical_deviation) {
    status = 'critical';
    score = Math.max(25, 50 - (deviation - threshold.critical_deviation) * 0.5);
  } else if (deviation >= threshold.warning_deviation) {
    status = 'warning';
    score = Math.max(50, 75 - (deviation - threshold.warning_deviation) * 0.5);
  } else if (deviation >= threshold.warning_deviation * 0.5) {
    status = 'monitor';
    score = Math.max(75, 90 - (deviation - threshold.warning_deviation * 0.5) * 0.3);
  }

  const unit = PARAM_UNITS[parameter] ?? '';
  const label = PARAM_LABELS[parameter] ?? parameter;
  const direction = detected > expected ? 'higher' : 'lower';
  const message =
    deviation < 1
      ? `${label} is normal`
      : `${label} is ${deviation.toFixed(1)}% ${direction} than baseline (${detected.toFixed(1)} vs ${expected.toFixed(1)} ${unit})`;

  return {
    parameter,
    score: Math.round(Math.max(0, Math.min(100, score))),
    deviation: Math.round(deviation * 10) / 10,
    status,
    message,
    detected,
    expected,
  };
}

export function calculateHealthScore(
  currentReadings: {
    rpm: number;
    vibration: number;
    temperature: number;
    humidity: number;
    current_load: number;
    performance_rate: number;
    load_percentage: number;
  },
  baselines: BaselineReading[],
  thresholds: ScoringThreshold[],
  machineType: string,
): HealthScoreResult {
  const baseline = findNearestBaseline(baselines, currentReadings.load_percentage);

  if (!baseline) {
    return {
      overall: 50,
      status: 'maintenance',
      statusLabel: 'No Baseline',
      parameterScores: [],
      faultSummary: 'No baseline data available. Run load testing/calibration first.',
      loadRecommendation: 'Calibrate the machine before monitoring.',
      serviceRecommendation: 'Insufficient historical data for service prediction.',
      servicePriority: 'none',
    };
  }

  const paramKeys = ['rpm', 'vibration', 'temperature', 'humidity', 'current_load', 'performance_rate'] as const;

  const parameterScores: ParameterScore[] = paramKeys.map((param) => {
    const detected = currentReadings[param];
    const expected = baseline[param];
    const threshold = thresholds.find(
      (t) => t.machine_type === machineType && t.parameter === param,
    ) ?? null;
    return calculateParameterScore(param, detected, expected, threshold);
  });

  const overall = Math.round(
    parameterScores.reduce((sum, ps) => sum + ps.score, 0) / parameterScores.length,
  );

  let status: MachineStatus = 'operational';
  let statusLabel = 'Healthy';
  if (overall >= 90) { status = 'operational'; statusLabel = 'Healthy'; }
  else if (overall >= 75) { status = 'operational'; statusLabel = 'Normal / Monitor'; }
  else if (overall >= 50) { status = 'warning'; statusLabel = 'Warning'; }
  else if (overall >= 25) { status = 'critical'; statusLabel = 'Critical'; }
  else { status = 'critical'; statusLabel = 'Severe Fault'; }

  const worstParams = parameterScores
    .filter((ps) => ps.status === 'warning' || ps.status === 'critical' || ps.status === 'severe')
    .sort((a, b) => a.score - b.score);

  const faultSummary = worstParams.length > 0
    ? worstParams.map((ps) => ps.message).join('. ')
    : null;

  const loadRecommendation = generateLoadRecommendation(currentReadings, baseline);
  const { serviceRecommendation, servicePriority } = generateServiceRecommendation(parameterScores, worstParams.length);

  return {
    overall,
    status,
    statusLabel,
    parameterScores,
    faultSummary,
    loadRecommendation,
    serviceRecommendation,
    servicePriority,
  };
}

function generateLoadRecommendation(
  current: { load_percentage: number; rpm: number; vibration: number; temperature: number },
  baseline: BaselineReading,
): string {
  if (current.load_percentage > 90) {
    return 'Current load is too high compared with the calibrated operating range. Reduce machine load.';
  }
  if (current.vibration > baseline.vibration * 1.5) {
    return 'Vibration is increasing as load increases. Inspect mechanical components.';
  }
  if (current.rpm > baseline.rpm * 1.3) {
    return 'RPM is increasing abnormally at the current load. Check speed controller.';
  }
  if (current.temperature > baseline.temperature * 1.2) {
    return 'Temperature is elevated for the current load. Verify cooling system.';
  }
  return 'Machine is operating within the expected load range.';
}

function generateServiceRecommendation(
  scores: ParameterScore[],
  warningCount: number,
): { serviceRecommendation: string; servicePriority: 'high' | 'medium' | 'low' | 'none' } {
  const avgScore = scores.reduce((s, ps) => s + ps.score, 0) / scores.length;

  if (avgScore < 50) {
    return {
      serviceRecommendation: 'Recommended service: within 7 days',
      servicePriority: 'high',
    };
  }
  if (avgScore < 70 || warningCount >= 2) {
    return {
      serviceRecommendation: 'Recommended service: within 14 days',
      servicePriority: 'medium',
    };
  }
  if (avgScore < 85 || warningCount >= 1) {
    return {
      serviceRecommendation: 'Recommended service: within 30 days',
      servicePriority: 'low',
    };
  }
  return {
    serviceRecommendation: 'No immediate service required',
    servicePriority: 'none',
  };
}

export function compareMachines(
  targetId: string,
  machines: { id: string; name: string; type: string; vibration: number; temperature: number; rpm: number; performance_rate: number }[],
  baselines: BaselineReading[],
  currentLoad: number,
): {
  parameter: string;
  targetValue: number;
  peerAverage: number;
  baselineValue: number;
  isAbnormal: boolean;
  message: string;
}[] {
  const target = machines.find((m) => m.id === targetId);
  if (!target) return [];

  const peers = machines.filter((m) => m.id !== targetId && m.type === target.type);
  if (peers.length === 0) return [];

  const baseline = findNearestBaseline(
    baselines.filter((b) => b.machine_id === targetId),
    currentLoad,
  );

  const compareParams = ['vibration', 'temperature', 'rpm', 'performance_rate'] as const;

  return compareParams.map((param) => {
    const targetValue = target[param] as number;
    const peerAverage = peers.reduce((sum, p) => sum + (p[param] as number), 0) / peers.length;
    const baselineValue = baseline ? (baseline[param] as number) : targetValue;

    const isAbnormal =
      Math.abs(targetValue - peerAverage) > peerAverage * 0.3 ||
      (baselineValue > 0 && Math.abs(targetValue - baselineValue) > baselineValue * 0.2);

    const label = PARAM_LABELS[param] ?? (param as string);
    const message = isAbnormal
      ? `${label} is significantly higher than both the machine baseline and peer machines.`
      : `${label} is within normal range compared to peers and baseline.`;

    return {
      parameter: label,
      targetValue: Math.round(targetValue * 100) / 100,
      peerAverage: Math.round(peerAverage * 100) / 100,
      baselineValue: Math.round(baselineValue * 100) / 100,
      isAbnormal,
      message,
    };
  });
}
