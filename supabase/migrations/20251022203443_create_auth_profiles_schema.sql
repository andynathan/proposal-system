/*
  # Create User Profiles and Authentication Schema

  ## Overview
  Sets up user profile management and authentication infrastructure for the proposal system.

  ## New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User's email address
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'admin' or 'client'
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Changes to Existing Tables
  
  ### `proposals`
  - Add `user_id` column - Links proposal to creator
  - Add `client_id` column - Links proposal to client (for sharing)

  ### `integrations`
  - Add `user_id` column - Links integration to user

  ### `training_documents`
  - Add `user_id` column - Links training documents to user

  ## Security
  
  ### RLS Policies
  - Users can view and update their own profile
  - Admins can create proposals and see all proposals
  - Clients can only see proposals assigned to them
  - Users can only manage their own integrations and training documents

  ## Important Notes
  - After signup, a profile is automatically created via trigger
  - Default role is 'admin' (can be changed after creation)
  - All existing RLS policies will be replaced with secure, user-specific policies
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'client')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add user_id columns to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE proposals ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE proposals ADD COLUMN client_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE integrations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_documents' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE training_documents ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view all proposals" ON proposals;
DROP POLICY IF EXISTS "Users can create proposals" ON proposals;
DROP POLICY IF EXISTS "Users can update all proposals" ON proposals;
DROP POLICY IF EXISTS "Users can delete all proposals" ON proposals;
DROP POLICY IF EXISTS "Users can view budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can create budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can view proposal files" ON proposal_files;
DROP POLICY IF EXISTS "Users can create proposal files" ON proposal_files;
DROP POLICY IF EXISTS "Users can update proposal files" ON proposal_files;
DROP POLICY IF EXISTS "Users can delete proposal files" ON proposal_files;
DROP POLICY IF EXISTS "Users can view all training documents" ON training_documents;
DROP POLICY IF EXISTS "Users can create training documents" ON training_documents;
DROP POLICY IF EXISTS "Users can update all training documents" ON training_documents;
DROP POLICY IF EXISTS "Users can delete all training documents" ON training_documents;
DROP POLICY IF EXISTS "Users can view all integrations" ON integrations;
DROP POLICY IF EXISTS "Users can create integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update all integrations" ON integrations;
DROP POLICY IF EXISTS "Users can delete all integrations" ON integrations;
DROP POLICY IF EXISTS "Users can view all automation rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can create automation rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can update all automation rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can delete all automation rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can view all extracted patterns" ON extracted_patterns;
DROP POLICY IF EXISTS "Users can create extracted patterns" ON extracted_patterns;
DROP POLICY IF EXISTS "Users can update all extracted patterns" ON extracted_patterns;
DROP POLICY IF EXISTS "Users can delete all extracted patterns" ON extracted_patterns;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Proposals policies (secure)
CREATE POLICY "Admins can view all proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view assigned proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Admins can create proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Budget items policies
CREATE POLICY "Users can view budget items for accessible proposals"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = budget_items.proposal_id
      AND (
        proposals.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins can create budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Proposal files policies
CREATE POLICY "Users can view files for accessible proposals"
  ON proposal_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_files.proposal_id
      AND (
        proposals.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins can create proposal files"
  ON proposal_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update proposal files"
  ON proposal_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete proposal files"
  ON proposal_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Training documents policies
CREATE POLICY "Users can view own training documents"
  ON training_documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own training documents"
  ON training_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own training documents"
  ON training_documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own training documents"
  ON training_documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Extracted patterns policies
CREATE POLICY "Users can view patterns for own documents"
  ON extracted_patterns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_documents
      WHERE training_documents.id = extracted_patterns.document_id
      AND training_documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create patterns for own documents"
  ON extracted_patterns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_documents
      WHERE training_documents.id = extracted_patterns.document_id
      AND training_documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update patterns for own documents"
  ON extracted_patterns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_documents
      WHERE training_documents.id = extracted_patterns.document_id
      AND training_documents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_documents
      WHERE training_documents.id = extracted_patterns.document_id
      AND training_documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete patterns for own documents"
  ON extracted_patterns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_documents
      WHERE training_documents.id = extracted_patterns.document_id
      AND training_documents.user_id = auth.uid()
    )
  );

-- Integrations policies
CREATE POLICY "Users can view own integrations"
  ON integrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own integrations"
  ON integrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own integrations"
  ON integrations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own integrations"
  ON integrations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Automation rules policies
CREATE POLICY "Users can view automation rules for own integrations"
  ON automation_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = automation_rules.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create automation rules for own integrations"
  ON automation_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = automation_rules.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update automation rules for own integrations"
  ON automation_rules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = automation_rules.integration_id
      AND integrations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = automation_rules.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete automation rules for own integrations"
  ON automation_rules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = automation_rules.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on profiles
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_training_documents_user_id ON training_documents(user_id);