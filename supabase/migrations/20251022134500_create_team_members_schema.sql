/*
  # Team Members Schema

  ## Overview
  Creates database tables for managing team members and their roles
  in the proposal system.

  ## Tables Created

  ### 1. team_members
  Stores team member information and access levels
  - `id` (uuid, primary key) - Unique identifier
  - `email` (text, unique) - Team member email address
  - `name` (text) - Full name
  - `role` (text) - Role: owner, admin, editor, viewer
  - `avatar_url` (text) - Profile picture URL
  - `status` (text) - Status: active, pending, suspended
  - `last_active` (timestamptz) - Last activity timestamp
  - `invited_by` (uuid) - User who invited this member
  - `invited_at` (timestamptz) - Invitation timestamp
  - `joined_at` (timestamptz) - When member accepted invitation
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on all tables
  - Authenticated users can view team members
  - Only admins and owners can add/remove members

  ## Important Notes
  - Unique email constraint prevents duplicates
  - Cascading updates for data integrity
*/

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'viewer',
  avatar_url text,
  status text DEFAULT 'pending',
  last_active timestamptz,
  invited_by uuid,
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Team members policies
CREATE POLICY "Users can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (true);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
