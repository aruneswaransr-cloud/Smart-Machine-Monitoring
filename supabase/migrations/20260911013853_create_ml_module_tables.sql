/*
# Create ML Module Tables

1. New Tables
- `ml_models` — stores trained Random Forest model metadata (accuracy, precision, recall, F1, training date, version)
- `ml_predictions` — stores individual ML failure predictions per machine

2. Security
- Both tables have RLS enabled
- Policies allow anon + authenticated CRUD (single-tenant app, no sign-in screen)
- These tables are completely independent from existing sensor/machine tables
- No foreign keys to existing tables to ensure ML module isolation

3. Important Notes
- These tables do NOT modify any existing tables
- The ML module operates independently from the existing predictive maintenance system
- ml_predictions references machine_id as a plain text column (not FK) to maintain isolation
*/

-- ml_models table
CREATE TABLE IF NOT EXISTS ml_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL DEFAULT 'Random Forest Classifier',
  dataset_name text NOT NULL DEFAULT 'AI4I 2020 Predictive Maintenance Dataset',
  training_date timestamptz DEFAULT now(),
  accuracy numeric(6,4),
  precision_score numeric(6,4),
  recall_score numeric(6,4),
  f1_score numeric(6,4),
  training_records integer,
  testing_records integer,
  model_version text NOT NULL DEFAULT '1.0.0',
  feature_importance jsonb,
  confusion_matrix jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ml_models" ON ml_models;
CREATE POLICY "anon_select_ml_models" ON ml_models FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ml_models" ON ml_models;
CREATE POLICY "anon_insert_ml_models" ON ml_models FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ml_models" ON ml_models;
CREATE POLICY "anon_update_ml_models" ON ml_models FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ml_models" ON ml_models;
CREATE POLICY "anon_delete_ml_models" ON ml_models FOR DELETE
  TO anon, authenticated USING (true);

-- ml_predictions table
CREATE TABLE IF NOT EXISTS ml_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id text,
  machine_name text,
  prediction text,
  failure_probability numeric(6,4),
  confidence numeric(6,4),
  model_version text,
  features jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ml_predictions" ON ml_predictions;
CREATE POLICY "anon_select_ml_predictions" ON ml_predictions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ml_predictions" ON ml_predictions;
CREATE POLICY "anon_insert_ml_predictions" ON ml_predictions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ml_predictions" ON ml_predictions;
CREATE POLICY "anon_update_ml_predictions" ON ml_predictions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ml_predictions" ON ml_predictions;
CREATE POLICY "anon_delete_ml_predictions" ON ml_predictions FOR DELETE
  TO anon, authenticated USING (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_ml_models_active ON ml_models(is_active);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created ON ml_predictions(created_at DESC);