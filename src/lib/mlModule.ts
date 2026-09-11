import { RandomForestClassifier } from 'ml-random-forest';
import type { MLTrainingResult, AIDatasetRow } from '@/types';
import { supabase } from '@/lib/supabase';

// ─── AI4I 2020 Dataset Info ─────────────────────────────────────────
export const DATASET_INFO = {
  name: 'AI4I 2020 Predictive Maintenance Dataset',
  source: 'https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset',
  description:
    'Synthetic dataset reflecting predictive maintenance data from a milling machine. ' +
    'Contains 10,000 data points stored as rows with 14 features (6 numeric, 4 categorical). ' +
    'Target: Machine failure (0 = normal, 1 = failure).',
  features: [
    'Air Temperature [K]',
    'Process Temperature [K]',
    'Rotational Speed [rpm]',
    'Torque [Nm]',
    'Tool Wear [min]',
    'Product Type (L/M/H)',
  ],
  target: 'Machine Failure (0 = Normal, 1 = Failure)',
  size: '10,000 rows',
};

// ─── CSV Parsing ────────────────────────────────────────────────────
export function parseCSV(csvText: string): AIDatasetRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const header = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const rows: AIDatasetRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
    if (values.length < 6) continue;

    const row: AIDatasetRow = {
      airTemperature: parseFloat(values[0]) || 0,
      processTemperature: parseFloat(values[1]) || 0,
      rotationalSpeed: parseFloat(values[2]) || 0,
      torque: parseFloat(values[3]) || 0,
      toolWear: parseFloat(values[4]) || 0,
      productType: values[5] || 'L',
      machineFailure: parseInt(values[6] ?? '0', 10) === 1 ? 1 : 0,
    };

    if (!isNaN(row.airTemperature) && !isNaN(row.rotationalSpeed)) {
      rows.push(row);
    }
  }

  if (rows.length === 0) throw new Error('No valid data rows found in CSV');
  return rows;
}

// ─── Generate synthetic AI4I sample data ────────────────────────────
export function generateSampleDataset(count = 500): AIDatasetRow[] {
  const rows: AIDatasetRow[] = [];
  const productTypes = ['L', 'M', 'H'];

  for (let i = 0; i < count; i++) {
    const airTemp = 295 + Math.random() * 10;
    const processTemp = 305 + Math.random() * 10;
    const rotSpeed = 1200 + Math.random() * 2000;
    const torque = 20 + Math.random() * 60;
    const toolWear = Math.random() * 200;
    const productType = productTypes[Math.floor(Math.random() * 3)];

    let failure = 0;
    if (toolWear > 180 && torque > 60) failure = 1;
    else if (airTemp > 303 && processTemp > 313) failure = Math.random() > 0.5 ? 1 : 0;
    else if (rotSpeed < 1300 && torque > 65) failure = Math.random() > 0.6 ? 1 : 0;
    else if (Math.random() < 0.03) failure = 1;

    rows.push({
      airTemperature: parseFloat(airTemp.toFixed(1)),
      processTemperature: parseFloat(processTemp.toFixed(1)),
      rotationalSpeed: Math.round(rotSpeed),
      torque: parseFloat(torque.toFixed(1)),
      toolWear: Math.round(toolWear),
      productType,
      machineFailure: failure,
    });
  }

  return rows;
}

// ─── Feature Encoding ───────────────────────────────────────────────
function encodeData(rows: AIDatasetRow[]): { X: number[][]; y: number[] } {
  const productTypeMap: Record<string, number> = { L: 0, M: 1, H: 2 };

  const X: number[][] = rows.map((r) => [
    r.airTemperature,
    r.processTemperature,
    r.rotationalSpeed,
    r.torque,
    r.toolWear,
    productTypeMap[r.productType] ?? 0,
  ]);

  const y: number[] = rows.map((r) => r.machineFailure);
  return { X, y };
}

// ─── Train / Test Split ─────────────────────────────────────────────
function trainTestSplit(X: number[][], y: number[], testRatio = 0.2) {
  const indices = Array.from({ length: X.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const testSize = Math.floor(X.length * testRatio);
  const testIdx = indices.slice(0, testSize);
  const trainIdx = indices.slice(testSize);

  return {
    XTrain: trainIdx.map((i) => X[i]),
    yTrain: trainIdx.map((i) => y[i]),
    XTest: testIdx.map((i) => X[i]),
    yTest: testIdx.map((i) => y[i]),
  };
}

// ─── Train Random Forest ────────────────────────────────────────────
export async function trainModel(
  rows: AIDatasetRow[],
  options?: { numTrees?: number; maxDepth?: number },
): Promise<MLTrainingResult> {
  const { X, y } = encodeData(rows);
  const { XTrain, yTrain, XTest, yTest } = trainTestSplit(X, y, 0.2);

  const numTrees = options?.numTrees ?? 50;

  const rf = new RandomForestClassifier({
    nEstimators: numTrees,
    seed: 42,
    replacement: true,
    maxFeatures: 4,
    useSampleBagging: true,
    treeOptions: {},
  } as any);

  rf.train(XTrain, yTrain);

  const predictions = rf.predict(XTest);

  // Confusion matrix
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < yTest.length; i++) {
    if (predictions[i] === 1 && yTest[i] === 1) tp++;
    else if (predictions[i] === 1 && yTest[i] === 0) fp++;
    else if (predictions[i] === 0 && yTest[i] === 0) tn++;
    else fn++;
  }

  const accuracy = (tp + tn) / (tp + tn + fp + fn);
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Feature importance (simplified — based on correlation with target)
  const featureNames = ['Air Temp', 'Process Temp', 'Rot. Speed', 'Torque', 'Tool Wear', 'Product Type'];
  const featureImportance: Record<string, number> = {};
  for (let f = 0; f < 6; f++) {
    const colValues = X.map((row) => row[f]);
    const mean = colValues.reduce((a, b) => a + b, 0) / colValues.length;
    const variance = colValues.reduce((a, v) => a + (v - mean) ** 2, 0) / colValues.length;
    let cov = 0;
    for (let i = 0; i < colValues.length; i++) {
      cov += (colValues[i] - mean) * (y[i] - y.reduce((a, b) => a + b, 0) / y.length);
    }
    cov /= colValues.length;
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    const yVariance = y.reduce((a, v) => a + (v - yMean) ** 2, 0) / y.length;
    const correlation = variance > 0 && yVariance > 0 ? Math.abs(cov / Math.sqrt(variance * yVariance)) : 0;
    featureImportance[featureNames[f]] = parseFloat(correlation.toFixed(4));
  }

  const total = Object.values(featureImportance).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const k of Object.keys(featureImportance)) {
      featureImportance[k] = parseFloat(((featureImportance[k] / total) * 100).toFixed(2));
    }
  }

  const modelVersion = `1.${Date.now().toString().slice(-4)}.${numTrees}`;

  const result: MLTrainingResult = {
    accuracy: parseFloat(accuracy.toFixed(4)),
    precision: parseFloat(precision.toFixed(4)),
    recall: parseFloat(recall.toFixed(4)),
    f1: parseFloat(f1.toFixed(4)),
    confusionMatrix: { tn, fp, fn, tp },
    featureImportance,
    trainingRecords: XTrain.length,
    testingRecords: XTest.length,
    modelVersion,
  };

  // Save to database
  try {
    await supabase.from('ml_models').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('ml_models').insert({
      model_name: 'Random Forest Classifier',
      dataset_name: DATASET_INFO.name,
      accuracy: result.accuracy,
      precision_score: result.precision,
      recall_score: result.recall,
      f1_score: result.f1,
      training_records: result.trainingRecords,
      testing_records: result.testingRecords,
      model_version: modelVersion,
      feature_importance: featureImportance,
      confusion_matrix: result.confusionMatrix,
      is_active: true,
    });
  } catch {
    // Non-fatal — model still trained in memory
  }

  return result;
}

// ─── Get Active Model ──────────────────────────────────────────────
export async function getActiveModel() {
  const { data } = await supabase
    .from('ml_models')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .maybeSingle();
  return data;
}

// ─── Get All Models ─────────────────────────────────────────────────
export async function getAllModels() {
  const { data } = await supabase
    .from('ml_models')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

// ─── Save Prediction ────────────────────────────────────────────────
export async function savePrediction(
  machineId: string,
  machineName: string,
  prediction: string,
  failureProbability: number,
  confidence: number,
  modelVersion: string,
  features?: Record<string, number>,
) {
  try {
    await supabase.from('ml_predictions').insert({
      machine_id: machineId,
      machine_name: machineName,
      prediction,
      failure_probability: failureProbability,
      confidence,
      model_version: modelVersion,
      features: features || null,
    });
  } catch {
    // Non-fatal
  }
}

// ─── Get Latest Predictions ─────────────────────────────────────────
export async function getLatestPredictions(limit = 10) {
  const { data } = await supabase
    .from('ml_predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}
