import { useState, useEffect, useCallback } from 'react';
import {
  Brain, Upload, Play, Database, BarChart3,
  CheckCircle2, AlertCircle, Loader2, FileText, TrendingUp,
  Target, Zap, Clock, Activity,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  DATASET_INFO, parseCSV, generateSampleDataset,
  trainModel, getActiveModel, getAllModels,
} from '@/lib/mlModule';
import type { MLTrainingResult, MLModelRecord, AIDatasetRow } from '@/types';

export function MLModulePage() {
  const [dataset, setDataset] = useState<AIDatasetRow[]>([]);
  const [training, setTraining] = useState(false);
  const [result, setResult] = useState<MLTrainingResult | null>(null);
  const [activeModel, setActiveModel] = useState<MLModelRecord | null>(null);
  const [allModels, setAllModels] = useState<MLModelRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<AIDatasetRow[]>([]);

  const loadModelData = useCallback(async () => {
    const model = await getActiveModel();
    if (model) setActiveModel(model as MLModelRecord);
    const models = await getAllModels();
    setAllModels(models as MLModelRecord[]);
  }, []);

  useEffect(() => {
    loadModelData();
  }, [loadModelData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        setDataset(rows);
        setPreviewRows(rows.slice(0, 5));
      } catch (err: any) {
        setError(`Failed to parse CSV: ${err.message}`);
      }
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  };

  const handleGenerateSample = () => {
    setError(null);
    const samples = generateSampleDataset(1000);
    setDataset(samples);
    setPreviewRows(samples.slice(0, 5));
    setFileName('ai4i_2020_sample.csv (generated)');
  };

  const handleTrain = async () => {
    if (dataset.length === 0) {
      setError('Please upload or generate a dataset first');
      return;
    }

    setTraining(true);
    setError(null);

    try {
      const res = await trainModel(dataset);
      setResult(res);
      await loadModelData();
    } catch (err: any) {
      setError(`Training failed: ${err.message}`);
    } finally {
      setTraining(false);
    }
  };

  const fmt = (v: number | null | undefined) => {
    if (v == null) return '—';
    return (v * 100).toFixed(1) + '%';
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 no-select">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-main">ML Module — Random Forest</h1>
            <p className="text-xs text-text-dim">Independent AI failure prediction system</p>
          </div>
        </div>

        {/* Dataset Info Card */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-text-main">Dataset Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Name</p>
              <p className="text-text-main">{DATASET_INFO.name}</p>
            </div>
            <div>
              <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Source</p>
              <a href={DATASET_INFO.source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs break-all">
                {DATASET_INFO.source}
              </a>
            </div>
            <div>
              <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Size</p>
              <p className="text-text-main">{DATASET_INFO.size}</p>
            </div>
            <div>
              <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Target</p>
              <p className="text-text-main">{DATASET_INFO.target}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Features</p>
            <div className="flex flex-wrap gap-2">
              {DATASET_INFO.features.map((f, i) => (
                <span key={i} className="text-xs bg-surface-2 border border-border rounded-lg px-2 py-1 text-text-main">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-text-dim mt-3">{DATASET_INFO.description}</p>
        </div>

        {/* Upload & Train Card */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-text-main">Upload Dataset & Train Model</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload area */}
            <div>
              <label className="block">
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-text-dim mx-auto mb-2" />
                  <p className="text-sm text-text-main font-medium">Upload AI4I CSV</p>
                  <p className="text-xs text-text-dim mt-1">Click to select a CSV file</p>
                </div>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                onClick={handleGenerateSample}
                className="w-full mt-3 py-2.5 rounded-lg text-sm font-medium bg-surface-2 border border-border text-text-main hover:border-primary/30 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate Sample Dataset (1,000 rows)
              </button>
            </div>

            {/* Train button + status */}
            <div className="flex flex-col justify-between">
              <div className="space-y-2">
                {fileName && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{fileName}</span>
                  </div>
                )}
                {dataset.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-text-main">
                    <Database className="w-4 h-4 text-text-dim" />
                    <span>{dataset.length} rows loaded</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-sm text-error">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleTrain}
                disabled={training || dataset.length === 0}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  training || dataset.length === 0
                    ? 'bg-surface-2 border border-border text-text-dim cursor-not-allowed'
                    : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                }`}
              >
                {training ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Training Random Forest...</>
                ) : (
                  <><Play className="w-5 h-5" /> Train Random Forest Model</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dataset Preview */}
        {previewRows.length > 0 && (
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-text-main">Dataset Preview (first 5 rows)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-dim border-b border-border">
                    <th className="text-left py-2 px-3">Air Temp [K]</th>
                    <th className="text-left py-2 px-3">Process Temp [K]</th>
                    <th className="text-left py-2 px-3">Rot. Speed [rpm]</th>
                    <th className="text-left py-2 px-3">Torque [Nm]</th>
                    <th className="text-left py-2 px-3">Tool Wear [min]</th>
                    <th className="text-left py-2 px-3">Product Type</th>
                    <th className="text-center py-2 px-3">Machine Failure</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-2 px-3 font-mono text-text-main">{row.airTemperature}</td>
                      <td className="py-2 px-3 font-mono text-text-main">{row.processTemperature}</td>
                      <td className="py-2 px-3 font-mono text-text-main">{row.rotationalSpeed}</td>
                      <td className="py-2 px-3 font-mono text-text-main">{row.torque}</td>
                      <td className="py-2 px-3 font-mono text-text-main">{row.toolWear}</td>
                      <td className="py-2 px-3 text-text-main">{row.productType}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`font-mono font-bold ${row.machineFailure === 1 ? 'text-error' : 'text-success'}`}>
                          {row.machineFailure}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Training Results */}
        {result && (
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-text-main">Model Evaluation Results</h2>
              <span className="ml-auto text-xs font-mono text-text-dim">v{result.modelVersion}</span>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-surface-2 border border-border rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5 text-success" />
                  <span className="text-xs text-text-dim">Accuracy</span>
                </div>
                <p className="text-xl font-bold font-mono text-success">{fmt(result.accuracy)}</p>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-text-dim">Precision</span>
                </div>
                <p className="text-xl font-bold font-mono text-primary">{fmt(result.precision)}</p>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs text-text-dim">Recall</span>
                </div>
                <p className="text-xl font-bold font-mono text-warning">{fmt(result.recall)}</p>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-text-dim">F1 Score</span>
                </div>
                <p className="text-xl font-bold font-mono text-primary">{fmt(result.f1)}</p>
              </div>
            </div>

            {/* Confusion Matrix */}
            <div className="mb-4">
              <h3 className="text-xs text-text-dim uppercase tracking-wider mb-2">Confusion Matrix</h3>
              <div className="grid grid-cols-2 gap-2 max-w-xs">
                <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-text-dim mb-1">True Negative</p>
                  <p className="text-xl font-bold font-mono text-success">{result.confusionMatrix.tn}</p>
                </div>
                <div className="bg-error/10 border border-error/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-text-dim mb-1">False Positive</p>
                  <p className="text-xl font-bold font-mono text-error">{result.confusionMatrix.fp}</p>
                </div>
                <div className="bg-error/10 border border-error/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-text-dim mb-1">False Negative</p>
                  <p className="text-xl font-bold font-mono text-error">{result.confusionMatrix.fn}</p>
                </div>
                <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-text-dim mb-1">True Positive</p>
                  <p className="text-xl font-bold font-mono text-success">{result.confusionMatrix.tp}</p>
                </div>
              </div>
            </div>

            {/* Feature Importance */}
            <div>
              <h3 className="text-xs text-text-dim uppercase tracking-wider mb-2">Feature Importance</h3>
              <div className="space-y-2">
                {Object.entries(result.featureImportance)
                  .sort((a, b) => b[1] - a[1])
                  .map(([feature, importance]) => (
                    <div key={feature} className="flex items-center gap-3">
                      <span className="text-xs text-text-main w-28 flex-shrink-0">{feature}</span>
                      <div className="flex-1 bg-surface-2 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${importance}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-text-dim w-10 text-right">{importance.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Train/Test split */}
            <div className="flex items-center gap-4 mt-4 text-xs text-text-dim">
              <span>Training records: <span className="font-mono text-text-main">{result.trainingRecords}</span></span>
              <span>Testing records: <span className="font-mono text-text-main">{result.testingRecords}</span></span>
            </div>
          </div>
        )}

        {/* Active Model */}
        {activeModel && !result && (
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <h2 className="text-sm font-semibold text-text-main">Active Trained Model</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-surface-2 border border-border rounded-xl p-3">
                <span className="text-xs text-text-dim">Model Version</span>
                <p className="text-sm font-mono font-bold text-text-main mt-1">{activeModel.model_version}</p>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-3">
                <span className="text-xs text-text-dim">Accuracy</span>
                <p className="text-sm font-mono font-bold text-success mt-1">{fmt(activeModel.accuracy)}</p>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-3">
                <span className="text-xs text-text-dim">F1 Score</span>
                <p className="text-sm font-mono font-bold text-primary mt-1">{fmt(activeModel.f1_score)}</p>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-3">
                <span className="text-xs text-text-dim">Training Date</span>
                <p className="text-sm font-mono text-text-main mt-1">
                  {new Date(activeModel.training_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            {activeModel.feature_importance && (
              <div className="mt-4">
                <h3 className="text-xs text-text-dim uppercase tracking-wider mb-2">Feature Importance</h3>
                <div className="space-y-2">
                  {Object.entries(activeModel.feature_importance as Record<string, number>)
                    .sort((a, b) => b[1] - a[1])
                    .map(([feature, importance]) => (
                      <div key={feature} className="flex items-center gap-3">
                        <span className="text-xs text-text-main w-28 flex-shrink-0">{feature}</span>
                        <div className="flex-1 bg-surface-2 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${importance}%` }} />
                        </div>
                        <span className="text-xs font-mono text-text-dim w-10 text-right">{importance.toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Model History */}
        {allModels.length > 1 && (
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-text-dim" />
              <h2 className="text-sm font-semibold text-text-main">Model History</h2>
            </div>
            <div className="space-y-2">
              {allModels.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-3 text-xs bg-surface-2 border border-border rounded-lg px-3 py-2">
                  <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-success' : 'bg-text-dim'}`} />
                  <span className="font-mono text-text-main">v{m.model_version}</span>
                  <span className="text-text-dim">Acc: {fmt(m.accuracy)}</span>
                  <span className="text-text-dim">F1: {fmt(m.f1_score)}</span>
                  <span className="text-text-dim ml-auto">{new Date(m.training_date).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ML is Independent notice */}
        <div className="glass-panel rounded-2xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-text-dim">
              <p className="font-semibold text-text-main mb-1">Independent ML System</p>
              <p>This ML module runs separately from the existing predictive maintenance system. The existing health scores, alerts, baseline comparisons, and ESP32 sensor data flow remain unchanged. The Random Forest model uses the AI4I 2020 dataset for training and evaluation only.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
