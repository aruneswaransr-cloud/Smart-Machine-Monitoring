export type MachineStatus = 'operational' | 'warning' | 'critical' | 'maintenance' | 'offline';
export type AlertSeverity = 'critical' | 'warning' | 'info' | 'attention';
export type DataMode = 'live' | 'demo';

export interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  status: MachineStatus;
  health_score: number;
  temperature: number;
  vibration: number;
  pressure: number;
  rpm: number;
  humidity: number;
  current_load: number;
  power_consumption: number;
  performance_rate: number;
  load_percentage: number;
  uptime_hours: number;
  is_online: boolean;
  comparable_group: string | null;
  qr_token: string;
  last_maintenance: string | null;
  last_reading_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BaselineReading {
  id: string;
  machine_id: string;
  load_percentage: number;
  rpm: number;
  vibration: number;
  temperature: number;
  humidity: number;
  current_load: number;
  power_consumption: number;
  performance_rate: number;
  notes: string | null;
  created_at: string;
}

export interface RealtimeReading {
  id: string;
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

export interface Alert {
  id: string;
  machine_id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  acknowledged: boolean;
  parameter: string | null;
  detected_value: number | null;
  expected_value: number | null;
  recommended_action: string | null;
  created_at: string;
}

export interface MaintenanceRecommendation {
  id: string;
  machine_id: string;
  recommended_days: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  trend_data: Record<string, unknown> | null;
  created_at: string;
}

export interface ScoringThreshold {
  id: string;
  machine_type: string;
  parameter: string;
  warning_deviation: number;
  critical_deviation: number;
  severe_deviation: number;
  min_value: number | null;
  max_value: number | null;
  unit: string;
}

export interface ParameterScore {
  parameter: string;
  score: number;
  deviation: number;
  status: 'healthy' | 'monitor' | 'warning' | 'critical' | 'severe';
  message: string;
  detected: number;
  expected: number;
}

export interface HealthScoreResult {
  overall: number;
  status: MachineStatus;
  statusLabel: string;
  parameterScores: ParameterScore[];
  faultSummary: string | null;
  loadRecommendation: string;
  serviceRecommendation: string;
  servicePriority: 'high' | 'medium' | 'low' | 'none';
}

export type PageId =
  | 'dashboard'
  | 'machines'
  | 'add-machine'
  | 'load-testing'
  | 'live-monitoring'
  | 'comparison'
  | 'alerts'
  | 'maintenance'
  | 'qr-management'
  | 'scan-qr'
  | 'settings'
  | 'ml-module';

export interface MLModelRecord {
  id: string;
  model_name: string;
  dataset_name: string;
  training_date: string;
  accuracy: number;
  precision_score: number;
  recall_score: number;
  f1_score: number;
  training_records: number;
  testing_records: number;
  model_version: string;
  feature_importance: Record<string, number> | null;
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number } | null;
  is_active: boolean;
  created_at: string;
}

export interface MLPredictionRecord {
  id: string;
  machine_id: string | null;
  machine_name: string | null;
  prediction: string;
  failure_probability: number;
  confidence: number;
  model_version: string | null;
  features: Record<string, number> | null;
  created_at: string;
}

export interface MLTrainingResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: { tn: number; fp: number; fn: number; tp: number };
  featureImportance: Record<string, number>;
  trainingRecords: number;
  testingRecords: number;
  modelVersion: string;
}

export interface AIDatasetRow {
  airTemperature: number;
  processTemperature: number;
  rotationalSpeed: number;
  torque: number;
  toolWear: number;
  productType: string;
  machineFailure: number;
}
