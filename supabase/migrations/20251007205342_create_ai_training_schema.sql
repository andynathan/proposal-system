/*
  # AI Training Schema

  ## Overview
  Creates database tables for storing AI training documents and extracted patterns
  to improve proposal generation capabilities.

  ## Tables Created
  
  ### 1. training_documents
  Stores uploaded training documents
  - `id` (uuid, primary key) - Unique identifier
  - `file_name` (text) - Original file name
  - `file_size` (integer) - File size in bytes
  - `file_type` (text) - MIME type
  - `content` (text) - Extracted text content
  - `status` (text) - Processing status: pending, processing, completed, failed
  - `uploaded_at` (timestamptz) - Upload timestamp
  
  ### 2. extracted_patterns
  Stores AI-extracted patterns from training documents
  - `id` (uuid, primary key) - Unique identifier
  - `document_id` (uuid, foreign key) - References training_documents
  - `pattern_type` (text) - Type: pricing, structure, language, formatting
  - `pattern_data` (jsonb) - Extracted pattern data
  - `confidence_score` (numeric) - AI confidence (0-1)
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Authenticated users can manage training data

  ## Important Notes
  - JSONB used for flexible pattern storage
  - Indexes added for performance
  - Cascading deletes maintain data integrity
*/

-- Create training_documents table
CREATE TABLE IF NOT EXISTS training_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_size integer DEFAULT 0,
  file_type text DEFAULT '',
  content text DEFAULT '',
  status text DEFAULT 'pending',
  uploaded_at timestamptz DEFAULT now()
);

-- Create extracted_patterns table
CREATE TABLE IF NOT EXISTS extracted_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES training_documents(id) ON DELETE CASCADE,
  pattern_type text NOT NULL,
  pattern_data jsonb DEFAULT '{}',
  confidence_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_documents_status ON training_documents(status);
CREATE INDEX IF NOT EXISTS idx_training_documents_uploaded_at ON training_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_patterns_document_id ON extracted_patterns(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_patterns_pattern_type ON extracted_patterns(pattern_type);

-- Enable Row Level Security
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_patterns ENABLE ROW LEVEL SECURITY;

-- Training documents policies
CREATE POLICY "Users can view training documents"
  ON training_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create training documents"
  ON training_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update training documents"
  ON training_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete training documents"
  ON training_documents FOR DELETE
  TO authenticated
  USING (true);

-- Extracted patterns policies
CREATE POLICY "Users can view extracted patterns"
  ON extracted_patterns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create extracted patterns"
  ON extracted_patterns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update extracted patterns"
  ON extracted_patterns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete extracted patterns"
  ON extracted_patterns FOR DELETE
  TO authenticated
  USING (true);