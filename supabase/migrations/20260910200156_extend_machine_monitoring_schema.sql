/*
# Extend Machine Monitoring Schema for IoT Predictive Maintenance

1. Modified Tables
- `machines` — added humidity, current, power_consumption, performance_rate, load_percentage, is_online, comparable_group, qr_token columns
- `alerts` — added parameter, detected_value, expected_value, recommended_action columns

2. New Tables
- `baseline_readings` — reference dataset from load testing/calibration
- `realtime_readings` — time-series sensor data from ESP32 or demo mode
- `maintenance_recommendations` — service predictions based on sensor trends
- `scoring_thresholds` — configurable scoring thresholds per machine type

3. Security
- Single-tenant (no auth): all policies use TO anon, authenticated
- RLS enabled on all new tables
*/

-- Extend machines table
ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS humidity numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_load numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS power_consumption numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS performance_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS load_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS comparable_group text,
  ADD COLUMN IF NOT EXISTS qr_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS last_reading_at timestamptz;

-- Extend alerts table
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS parameter text,
  ADD COLUMN IF NOT EXISTS detected_value numeric,
  ADD COLUMN IF NOT EXISTS expected_value numeric,
  ADD COLUMN IF NOT EXISTS recommended_action text;

-- Baseline readings table
CREATE TABLE IF NOT EXISTS baseline_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  load_percentage numeric NOT NULL,
  rpm numeric NOT NULL,
  vibration numeric NOT NULL,
  temperature numeric NOT NULL,
  humidity numeric NOT NULL,
  current_load numeric NOT NULL,
  power_consumption numeric NOT NULL,
  performance_rate numeric NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE baseline_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_baseline_readings" ON baseline_readings;
CREATE POLICY "anon_select_baseline_readings" ON baseline_readings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_baseline_readings" ON baseline_readings;
CREATE POLICY "anon_insert_baseline_readings" ON baseline_readings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_baseline_readings" ON baseline_readings;
CREATE POLICY "anon_update_baseline_readings" ON baseline_readings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_baseline_readings" ON baseline_readings;
CREATE POLICY "anon_delete_baseline_readings" ON baseline_readings FOR DELETE
  TO anon, authenticated USING (true);

-- Realtime readings table
CREATE TABLE IF NOT EXISTS realtime_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  load_percentage numeric DEFAULT 0,
  rpm numeric DEFAULT 0,
  vibration numeric DEFAULT 0,
  temperature numeric DEFAULT 0,
  humidity numeric DEFAULT 0,
  current_load numeric DEFAULT 0,
  power_consumption numeric DEFAULT 0,
  performance_rate numeric DEFAULT 0,
  is_demo boolean DEFAULT false,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE realtime_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_realtime_readings" ON realtime_readings;
CREATE POLICY "anon_select_realtime_readings" ON realtime_readings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_realtime_readings" ON realtime_readings;
CREATE POLICY "anon_insert_realtime_readings" ON realtime_readings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_realtime_readings" ON realtime_readings;
CREATE POLICY "anon_update_realtime_readings" ON realtime_readings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_realtime_readings" ON realtime_readings;
CREATE POLICY "anon_delete_realtime_readings" ON realtime_readings FOR DELETE
  TO anon, authenticated USING (true);

-- Maintenance recommendations table
CREATE TABLE IF NOT EXISTS maintenance_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  recommended_days integer NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  reason text NOT NULL,
  trend_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_maintenance" ON maintenance_recommendations;
CREATE POLICY "anon_select_maintenance" ON maintenance_recommendations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_maintenance" ON maintenance_recommendations;
CREATE POLICY "anon_insert_maintenance" ON maintenance_recommendations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_maintenance" ON maintenance_recommendations;
CREATE POLICY "anon_update_maintenance" ON maintenance_recommendations
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_maintenance" ON maintenance_recommendations;
CREATE POLICY "anon_delete_maintenance" ON maintenance_recommendations
  FOR DELETE TO anon, authenticated USING (true);

-- Scoring thresholds table
CREATE TABLE IF NOT EXISTS scoring_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_type text NOT NULL,
  parameter text NOT NULL,
  warning_deviation numeric NOT NULL DEFAULT 15,
  critical_deviation numeric NOT NULL DEFAULT 30,
  severe_deviation numeric NOT NULL DEFAULT 50,
  min_value numeric,
  max_value numeric,
  unit text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(machine_type, parameter)
);

ALTER TABLE scoring_thresholds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_thresholds" ON scoring_thresholds;
CREATE POLICY "anon_select_thresholds" ON scoring_thresholds FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_thresholds" ON scoring_thresholds;
CREATE POLICY "anon_insert_thresholds" ON scoring_thresholds
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_thresholds" ON scoring_thresholds;
CREATE POLICY "anon_update_thresholds" ON scoring_thresholds
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_thresholds" ON scoring_thresholds;
CREATE POLICY "anon_delete_thresholds" ON scoring_thresholds
  FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_baseline_machine_id ON baseline_readings(machine_id);
CREATE INDEX IF NOT EXISTS idx_baseline_load ON baseline_readings(machine_id, load_percentage);
CREATE INDEX IF NOT EXISTS idx_realtime_machine_id ON realtime_readings(machine_id);
CREATE INDEX IF NOT EXISTS idx_realtime_recorded_at ON realtime_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_machine_id ON maintenance_recommendations(machine_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON maintenance_recommendations(created_at DESC);

-- Seed default scoring thresholds
INSERT INTO scoring_thresholds (machine_type, parameter, warning_deviation, critical_deviation, severe_deviation, min_value, max_value, unit) VALUES
('CNC Mill', 'rpm', 10, 20, 35, 0, 12000, 'rpm'),
('CNC Mill', 'vibration', 15, 30, 50, 0, 10, 'mm/s'),
('CNC Mill', 'temperature', 10, 20, 30, 0, 120, 'C'),
('CNC Mill', 'humidity', 15, 30, 50, 0, 100, '%'),
('CNC Mill', 'current_load', 15, 30, 50, 0, 100, 'A'),
('CNC Mill', 'performance_rate', 10, 20, 35, 0, 100, '%'),
('CNC Lathe', 'rpm', 10, 20, 35, 0, 12000, 'rpm'),
('CNC Lathe', 'vibration', 15, 30, 50, 0, 10, 'mm/s'),
('CNC Lathe', 'temperature', 10, 20, 30, 0, 120, 'C'),
('CNC Lathe', 'humidity', 15, 30, 50, 0, 100, '%'),
('CNC Lathe', 'current_load', 15, 30, 50, 0, 100, 'A'),
('CNC Lathe', 'performance_rate', 10, 20, 35, 0, 100, '%'),
('Hydraulic Press', 'rpm', 10, 25, 40, 0, 5000, 'rpm'),
('Hydraulic Press', 'vibration', 20, 35, 55, 0, 12, 'mm/s'),
('Hydraulic Press', 'temperature', 12, 22, 35, 0, 150, 'C'),
('Hydraulic Press', 'humidity', 15, 30, 50, 0, 100, '%'),
('Hydraulic Press', 'current_load', 15, 30, 50, 0, 200, 'A'),
('Hydraulic Press', 'performance_rate', 10, 25, 40, 0, 100, '%'),
('Robotic Arm', 'rpm', 10, 20, 35, 0, 3000, 'rpm'),
('Robotic Arm', 'vibration', 12, 25, 40, 0, 8, 'mm/s'),
('Robotic Arm', 'temperature', 10, 18, 28, 0, 100, 'C'),
('Robotic Arm', 'humidity', 15, 30, 50, 0, 100, '%'),
('Robotic Arm', 'current_load', 12, 25, 40, 0, 50, 'A'),
('Robotic Arm', 'performance_rate', 8, 18, 30, 0, 100, '%'),
('Conveyor System', 'rpm', 10, 20, 35, 0, 2000, 'rpm'),
('Conveyor System', 'vibration', 15, 30, 50, 0, 8, 'mm/s'),
('Conveyor System', 'temperature', 10, 20, 30, 0, 100, 'C'),
('Conveyor System', 'humidity', 15, 30, 50, 0, 100, '%'),
('Conveyor System', 'current_load', 12, 25, 40, 0, 30, 'A'),
('Conveyor System', 'performance_rate', 10, 20, 35, 0, 100, '%')
ON CONFLICT (machine_type, parameter) DO NOTHING;

-- Update existing machines with new column values
UPDATE machines SET
  humidity = 45.0, current_load = 12.0, power_consumption = 3.5,
  performance_rate = 95.0, load_percentage = 50.0, is_online = true
WHERE name = 'CNC-001';

UPDATE machines SET
  humidity = 52.0, current_load = 18.0, power_consumption = 5.2,
  performance_rate = 87.0, load_percentage = 65.0
WHERE name = 'CNC-002';

UPDATE machines SET
  humidity = 48.0, current_load = 25.0, power_consumption = 7.8,
  performance_rate = 71.0, load_percentage = 75.0
WHERE name = 'PRESS-001';

UPDATE machines SET
  humidity = 40.0, current_load = 8.0, power_consumption = 2.1,
  performance_rate = 95.0, load_percentage = 40.0
WHERE name = 'ROBOT-001';

UPDATE machines SET
  humidity = 58.0, current_load = 32.0, power_consumption = 9.5,
  performance_rate = 38.0, load_percentage = 90.0
WHERE name = 'ROBOT-002';

UPDATE machines SET
  humidity = 42.0, current_load = 6.0, power_consumption = 1.8,
  performance_rate = 89.0, load_percentage = 35.0
WHERE name = 'CONV-001';

-- Set comparable groups
UPDATE machines SET comparable_group = 'CNC' WHERE type LIKE 'CNC%';
UPDATE machines SET comparable_group = 'Robotics' WHERE type LIKE 'Robotic%';
UPDATE machines SET comparable_group = 'Heavy Machinery' WHERE type LIKE 'Hydraulic%' OR type LIKE 'Conveyor%';

-- Seed baseline readings
INSERT INTO baseline_readings (machine_id, load_percentage, rpm, vibration, temperature, humidity, current_load, power_consumption, performance_rate, notes)
SELECT m.id, 0, 0, 0.5, 25, 40, 2, 0.5, 0, 'Idle baseline' FROM machines m
ON CONFLICT DO NOTHING;

INSERT INTO baseline_readings (machine_id, load_percentage, rpm, vibration, temperature, humidity, current_load, power_consumption, performance_rate, notes)
SELECT m.id, 25, m.rpm * 0.5, 1.5, 45, 42, m.current_load * 0.4, m.power_consumption * 0.4, 85, '25% load baseline' FROM machines m
ON CONFLICT DO NOTHING;

INSERT INTO baseline_readings (machine_id, load_percentage, rpm, vibration, temperature, humidity, current_load, power_consumption, performance_rate, notes)
SELECT m.id, 50, m.rpm * 0.75, 2.5, 60, 45, m.current_load * 0.6, m.power_consumption * 0.6, 90, '50% load baseline' FROM machines m
ON CONFLICT DO NOTHING;

INSERT INTO baseline_readings (machine_id, load_percentage, rpm, vibration, temperature, humidity, current_load, power_consumption, performance_rate, notes)
SELECT m.id, 75, m.rpm, 3.5, 72, 48, m.current_load * 0.8, m.power_consumption * 0.8, 92, '75% load baseline' FROM machines m
ON CONFLICT DO NOTHING;

INSERT INTO baseline_readings (machine_id, load_percentage, rpm, vibration, temperature, humidity, current_load, power_consumption, performance_rate, notes)
SELECT m.id, 100, m.rpm * 1.2, 4.5, 82, 52, m.current_load, m.power_consumption, 88, '100% load baseline' FROM machines m
ON CONFLICT DO NOTHING;

-- Seed realtime readings
INSERT INTO realtime_readings (machine_id, load_percentage, rpm, vibration, temperature, humidity, current_load, power_consumption, performance_rate, is_demo)
SELECT m.id, m.load_percentage, m.rpm, m.vibration, m.temperature, m.humidity, m.current_load, m.power_consumption, m.performance_rate, true
FROM machines m
ON CONFLICT DO NOTHING;

-- Update existing alerts with parameter details
UPDATE alerts SET
  parameter = 'temperature',
  detected_value = 94.8,
  expected_value = 82.0,
  recommended_action = 'Immediate inspection required. Reduce load and check cooling system.'
WHERE severity = 'critical';

UPDATE alerts SET
  parameter = 'vibration',
  detected_value = 5.2,
  expected_value = 3.5,
  recommended_action = 'Schedule maintenance check. Inspect bearings and alignment.'
WHERE severity = 'warning' AND title = 'Vibration Anomaly';

UPDATE alerts SET
  parameter = 'performance',
  detected_value = 87.0,
  expected_value = 95.0,
  recommended_action = 'Plan routine maintenance during next window.'
WHERE severity = 'info';