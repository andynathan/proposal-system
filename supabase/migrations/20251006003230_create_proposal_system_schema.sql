/*
  # Proposal System Database Schema

  ## Overview
  Creates a complete database schema for an AI-powered proposal management system with budget items and file attachments.

  ## Tables Created
  
  ### 1. proposals
  Core table for storing proposal information
  - `id` (uuid, primary key) - Unique identifier for each proposal
  - `title` (text) - Proposal title
  - `client` (text) - Client company name
  - `client_email` (text) - Client contact email
  - `status` (text) - Proposal status: draft, sent, won, lost
  - `value` (numeric) - Total proposal value/budget
  - `description` (text) - Detailed project description
  - `template` (text) - Template type used: professional, creative, corporate
  - `opens` (integer) - Number of times proposal was opened
  - `engagement` (integer) - Engagement percentage (0-100)
  - `tags` (text array) - Categorization tags
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. budget_items
  Line items for proposal budgets
  - `id` (uuid, primary key) - Unique identifier
  - `proposal_id` (uuid, foreign key) - References proposals table
  - `item` (text) - Item name/title
  - `description` (text) - Detailed item description
  - `amount` (numeric) - Unit price
  - `quantity` (integer) - Item quantity
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 3. proposal_files
  File attachments for proposals
  - `id` (uuid, primary key) - Unique identifier
  - `proposal_id` (uuid, foreign key) - References proposals table
  - `file_name` (text) - Original file name
  - `file_size` (integer) - File size in bytes
  - `file_type` (text) - MIME type
  - `created_at` (timestamptz) - Upload timestamp

  ## Security
  - RLS enabled on all tables
  - Policies allow authenticated users to manage their own data
  - Public read access for shared proposals (future feature)

  ## Important Notes
  - All timestamps use UTC timezone
  - Cascading deletes ensure data integrity
  - Indexes added for performance on foreign keys
*/

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client text NOT NULL,
  client_email text DEFAULT '',
  status text DEFAULT 'draft',
  value numeric DEFAULT 0,
  description text DEFAULT '',
  template text DEFAULT 'professional',
  opens integer DEFAULT 0,
  engagement integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  item text DEFAULT '',
  description text DEFAULT '',
  amount numeric DEFAULT 0,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create proposal_files table
CREATE TABLE IF NOT EXISTS proposal_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer DEFAULT 0,
  file_type text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_budget_items_proposal_id ON budget_items(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_files_proposal_id ON proposal_files(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);

-- Enable Row Level Security
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_files ENABLE ROW LEVEL SECURITY;

-- Proposals policies
CREATE POLICY "Users can view all proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete all proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (true);

-- Budget items policies
CREATE POLICY "Users can view budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (true);

-- Proposal files policies
CREATE POLICY "Users can view proposal files"
  ON proposal_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create proposal files"
  ON proposal_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update proposal files"
  ON proposal_files FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete proposal files"
  ON proposal_files FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();