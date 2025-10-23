/*
  # Integrations Schema

  ## Overview
  Creates database tables for managing third-party integrations and automations
  in the proposal system.

  ## Tables Created
  
  ### 1. integrations
  Stores available integrations and their connection status
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Integration name (e.g., Salesforce, HubSpot)
  - `icon` (text) - Icon/emoji representation
  - `color` (text) - CSS color classes for UI
  - `status` (text) - Connection status: connected, pending, disconnected
  - `automations_count` (integer) - Number of active automations
  - `config` (jsonb) - Integration-specific configuration
  - `connected_at` (timestamptz) - When integration was connected
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. automation_rules
  Stores automation rules for integrations
  - `id` (uuid, primary key) - Unique identifier
  - `integration_id` (uuid, foreign key) - References integrations table
  - `name` (text) - Rule name
  - `trigger_event` (text) - Event that triggers automation
  - `action` (text) - Action to perform
  - `is_active` (boolean) - Whether rule is active
  - `config` (jsonb) - Rule-specific configuration
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Authenticated users can manage integrations

  ## Important Notes
  - JSONB for flexible configuration storage
  - Cascading deletes for data integrity
*/

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT '',
  color text DEFAULT 'bg-gray-100 text-gray-700',
  status text DEFAULT 'pending',
  automations_count integer DEFAULT 0,
  config jsonb DEFAULT '{}',
  connected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create automation_rules table
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_event text NOT NULL,
  action text NOT NULL,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_automation_rules_integration_id ON automation_rules(integration_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_is_active ON automation_rules(is_active);

-- Enable Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Integrations policies
CREATE POLICY "Users can view integrations"
  ON integrations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create integrations"
  ON integrations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update integrations"
  ON integrations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete integrations"
  ON integrations FOR DELETE
  TO authenticated
  USING (true);

-- Automation rules policies
CREATE POLICY "Users can view automation rules"
  ON automation_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create automation rules"
  ON automation_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update automation rules"
  ON automation_rules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete automation rules"
  ON automation_rules FOR DELETE
  TO authenticated
  USING (true);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default integrations
INSERT INTO integrations (name, icon, color, status, automations_count) VALUES
  ('Salesforce CRM', '🔗', 'bg-blue-100 text-blue-700', 'pending', 0),
  ('HubSpot', '🎯', 'bg-orange-100 text-orange-700', 'pending', 0),
  ('Zapier', '⚡', 'bg-yellow-100 text-yellow-700', 'pending', 0),
  ('Make.com', '🔄', 'bg-purple-100 text-purple-700', 'pending', 0),
  ('Slack', '💬', 'bg-gray-100 text-gray-700', 'pending', 0),
  ('Google Drive', '📁', 'bg-green-100 text-green-700', 'pending', 0)
ON CONFLICT DO NOTHING;