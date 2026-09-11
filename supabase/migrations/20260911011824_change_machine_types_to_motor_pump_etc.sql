/*
# Change Machine Types to Motor, Pump, Compressor, Conveyor, Generator

1. Modified Tables
- `machines` — update existing machine names and types to new industrial types
- `scoring_thresholds` — replace old machine type thresholds with new ones
- `baseline_readings` — updated via machine changes (no direct changes needed)

2. Notes
- Removes old machine types (CNC Mill, CNC Lathe, Hydraulic Press, Robotic Arm, Conveyor System)
- Adds new types: Motor, Pump, Compressor, Conveyor, Generator
- Updates comparable groups accordingly
- All existing data structures, tables, and RLS policies remain unchanged
*/

-- Update existing machines to new types
UPDATE machines SET name = 'MOTOR-001', type = 'Motor', location = 'Floor 1 - Bay A',
  comparable_group = 'Rotating Equipment' WHERE name = 'CNC-001';

UPDATE machines SET name = 'MOTOR-002', type = 'Motor', location = 'Floor 1 - Bay B',
  comparable_group = 'Rotating Equipment' WHERE name = 'CNC-002';

UPDATE machines SET name = 'PUMP-001', type = 'Pump', location = 'Floor 1 - Bay C',
  comparable_group = 'Fluid Handling' WHERE name = 'PRESS-001';

UPDATE machines SET name = 'COMP-001', type = 'Compressor', location = 'Floor 2 - Bay A',
  comparable_group = 'Gas Systems' WHERE name = 'ROBOT-001';

UPDATE machines SET name = 'COMP-002', type = 'Compressor', location = 'Floor 2 - Bay B',
  comparable_group = 'Gas Systems' WHERE name = 'ROBOT-002';

UPDATE machines SET name = 'CONV-001', type = 'Conveyor', location = 'Floor 2 - Bay C',
  comparable_group = 'Material Handling' WHERE name = 'CONV-001';

-- Update comparable groups for any remaining machines
UPDATE machines SET comparable_group = 'Rotating Equipment' WHERE type = 'Motor' AND comparable_group IS NULL;
UPDATE machines SET comparable_group = 'Fluid Handling' WHERE type = 'Pump' AND comparable_group IS NULL;
UPDATE machines SET comparable_group = 'Gas Systems' WHERE type = 'Compressor' AND comparable_group IS NULL;
UPDATE machines SET comparable_group = 'Material Handling' WHERE type = 'Conveyor' AND comparable_group IS NULL;
UPDATE machines SET comparable_group = 'Power Generation' WHERE type = 'Generator' AND comparable_group IS NULL;

-- Remove old scoring thresholds
DELETE FROM scoring_thresholds WHERE machine_type IN ('CNC Mill', 'CNC Lathe', 'Hydraulic Press', 'Robotic Arm', 'Conveyor System');

-- Insert new scoring thresholds for new machine types
INSERT INTO scoring_thresholds (machine_type, parameter, warning_deviation, critical_deviation, severe_deviation, min_value, max_value, unit) VALUES
('Motor', 'rpm', 10, 20, 35, 0, 3600, 'rpm'),
('Motor', 'vibration', 15, 30, 50, 0, 12, 'mm/s'),
('Motor', 'temperature', 10, 20, 30, 0, 120, 'C'),
('Motor', 'humidity', 15, 30, 50, 0, 100, '%'),
('Motor', 'current_load', 15, 30, 50, 0, 50, 'A'),
('Motor', 'performance_rate', 10, 20, 35, 0, 100, '%'),
('Pump', 'rpm', 10, 25, 40, 0, 5000, 'rpm'),
('Pump', 'vibration', 18, 32, 50, 0, 10, 'mm/s'),
('Pump', 'temperature', 12, 22, 35, 0, 130, 'C'),
('Pump', 'humidity', 15, 30, 50, 0, 100, '%'),
('Pump', 'current_load', 15, 30, 50, 0, 80, 'A'),
('Pump', 'performance_rate', 10, 25, 40, 0, 100, '%'),
('Compressor', 'rpm', 10, 20, 35, 0, 4000, 'rpm'),
('Compressor', 'vibration', 15, 28, 45, 0, 10, 'mm/s'),
('Compressor', 'temperature', 12, 25, 38, 0, 140, 'C'),
('Compressor', 'humidity', 15, 30, 50, 0, 100, '%'),
('Compressor', 'current_load', 15, 30, 50, 0, 60, 'A'),
('Compressor', 'performance_rate', 10, 22, 35, 0, 100, '%'),
('Conveyor', 'rpm', 10, 20, 35, 0, 2000, 'rpm'),
('Conveyor', 'vibration', 15, 30, 50, 0, 8, 'mm/s'),
('Conveyor', 'temperature', 10, 20, 30, 0, 100, 'C'),
('Conveyor', 'humidity', 15, 30, 50, 0, 100, '%'),
('Conveyor', 'current_load', 12, 25, 40, 0, 30, 'A'),
('Conveyor', 'performance_rate', 10, 20, 35, 0, 100, '%'),
('Generator', 'rpm', 8, 18, 30, 0, 1800, 'rpm'),
('Generator', 'vibration', 12, 25, 40, 0, 10, 'mm/s'),
('Generator', 'temperature', 10, 20, 32, 0, 110, 'C'),
('Generator', 'humidity', 15, 30, 50, 0, 100, '%'),
('Generator', 'current_load', 12, 25, 40, 0, 100, 'A'),
('Generator', 'performance_rate', 8, 18, 30, 0, 100, '%')
ON CONFLICT (machine_type, parameter) DO NOTHING;

-- Update alerts to reference new machine names (they reference machine_id, not names, so no change needed)
-- But update alert messages if they reference old names
UPDATE alerts SET message = REPLACE(message, 'CNC-001', 'MOTOR-001') WHERE message LIKE '%CNC-001%';
UPDATE alerts SET message = REPLACE(message, 'CNC-002', 'MOTOR-002') WHERE message LIKE '%CNC-002%';
UPDATE alerts SET message = REPLACE(message, 'PRESS-001', 'PUMP-001') WHERE message LIKE '%PRESS-001%';
UPDATE alerts SET message = REPLACE(message, 'ROBOT-001', 'COMP-001') WHERE message LIKE '%ROBOT-001%';
UPDATE alerts SET message = REPLACE(message, 'ROBOT-002', 'COMP-002') WHERE message LIKE '%ROBOT-002%';