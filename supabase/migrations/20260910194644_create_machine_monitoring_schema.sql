/*
# Smart Machine Health Monitoring Schema

1. New Tables
- `machines` — factory machines with name, type, location, status, and health metrics
- `sensor_readings` — time-series sensor data (temperature, vibration, pressure, RPM) per machine
- `alerts` — health alerts/warnings for each machine with severity and acknowledgement

2. Security
- Single-tenant (no auth) app: all policies use TO anon, authenticated
- RLS enabled on all tables
- All data is intentionally shared/public for the monitoring dashboard

3. Notes
- `machines.health_score` is a 0-100 integer representing overall machine health
- `sensor_readings` stores individual sensor values with timestamps for trend analysis
- `alerts` tracks active and historical alerts with severity levels (critical, warning, info)
*/

-- Machines table
CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'CNC',
  location text NOT NULL DEFAULT 'Floor 1',
  status text NOT NULL DEFAULT 'operational',
  health_score integer NOT NULL DEFAULT 100,
  temperature numeric NOT NULL DEFAULT 0,
  vibration numeric NOT NULL DEFAULT 0,
  pressure numeric NOT NULL DEFAULT 0,
  rpm integer NOT NULL DEFAULT 0,
  uptime_hours numeric NOT NULL DEFAULT 0,
  last_maintenance timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_machines" ON machines;
CREATE POLICY "anon_select_machines" ON machines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_machines" ON machines;
CREATE POLICY "anon_insert_machines" ON machines FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_machines" ON machines;
CREATE POLICY "anon_update_machines" ON machines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_machines" ON machines;
CREATE POLICY "anon_delete_machines" ON machines FOR DELETE
  TO anon, authenticated USING (true);

-- Sensor readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  sensor_type text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sensor_readings" ON sensor_readings;
CREATE POLICY "anon_select_sensor_readings" ON sensor_readings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sensor_readings" ON sensor_readings;
CREATE POLICY "anon_insert_sensor_readings" ON sensor_readings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sensor_readings" ON sensor_readings;
CREATE POLICY "anon_update_sensor_readings" ON sensor_readings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sensor_readings" ON sensor_readings;
CREATE POLICY "anon_delete_sensor_readings" ON sensor_readings FOR DELETE
  TO anon, authenticated USING (true);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'warning',
  title text NOT NULL,
  message text NOT NULL,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_alerts" ON alerts;
CREATE POLICY "anon_select_alerts" ON alerts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_alerts" ON alerts;
CREATE POLICY "anon_insert_alerts" ON alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_alerts" ON alerts;
CREATE POLICY "anon_update_alerts" ON alerts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_alerts" ON alerts;
CREATE POLICY "anon_delete_alerts" ON alerts FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_machine_id ON sensor_readings(machine_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at ON sensor_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_alerts_machine_id ON alerts(machine_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Seed initial machine data
INSERT INTO machines (name, type, location, status, health_score, temperature, vibration, pressure, rpm, uptime_hours, last_maintenance) VALUES
('CNC-001', 'CNC Mill', 'Floor 1 - Bay A', 'operational', 92, 68.5, 2.1, 4.2, 8500, 1240, '2026-08-15'),
('CNC-002', 'CNC Lathe', 'Floor 1 - Bay B', 'operational', 87, 72.3, 3.4, 4.8, 9200, 2180, '2026-07-20'),
('PRESS-001', 'Hydraulic Press', 'Floor 1 - Bay C', 'warning', 71, 85.7, 5.2, 6.1, 3200, 3650, '2026-06-10'),
('ROBOT-001', 'Robotic Arm', 'Floor 2 - Bay A', 'operational', 95, 61.2, 1.8, 3.5, 1800, 890, '2026-09-01'),
('ROBOT-002', 'Robotic Arm', 'Floor 2 - Bay B', 'critical', 38, 94.8, 8.7, 7.9, 2400, 4200, '2026-05-15'),
('CONV-001', 'Conveyor System', 'Floor 2 - Bay C', 'operational', 89, 66.4, 2.8, 3.9, 1200, 1980, '2026-08-01')
ON CONFLICT DO NOTHING;

-- Seed initial sensor readings
INSERT INTO sensor_readings (machine_id, sensor_type, value, unit) 
SELECT m.id, 'temperature', m.temperature, 'C' FROM machines m
ON CONFLICT DO NOTHING;

INSERT INTO sensor_readings (machine_id, sensor_type, value, unit) 
SELECT m.id, 'vibration', m.vibration, 'mm/s' FROM machines m
ON CONFLICT DO NOTHING;

INSERT INTO sensor_readings (machine_id, sensor_type, value, unit) 
SELECT m.id, 'pressure', m.pressure, 'bar' FROM machines m
ON CONFLICT DO NOTHING;

INSERT INTO sensor_readings (machine_id, sensor_type, value, unit) 
SELECT m.id, 'rpm', m.rpm, 'rpm' FROM machines m
ON CONFLICT DO NOTHING;

-- Seed initial alerts
INSERT INTO alerts (machine_id, severity, title, message) 
SELECT m.id, 'critical', 'Overheating Detected', 'Machine temperature exceeds 90C threshold. Immediate inspection required.' FROM machines m WHERE m.status = 'critical'
ON CONFLICT DO NOTHING;

INSERT INTO alerts (machine_id, severity, title, message) 
SELECT m.id, 'warning', 'Vibration Anomaly', 'Vibration levels above normal range. Schedule maintenance check.' FROM machines m WHERE m.status = 'warning'
ON CONFLICT DO NOTHING;

INSERT INTO alerts (machine_id, severity, title, message) 
SELECT m.id, 'info', 'Maintenance Due', 'Routine maintenance window approaching.' FROM machines m WHERE m.health_score < 90 AND m.status = 'operational'
ON CONFLICT DO NOTHING;