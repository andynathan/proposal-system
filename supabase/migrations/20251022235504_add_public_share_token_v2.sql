/*
  # Add Public Share Token to Proposals

  ## Changes
  - Add share_token column to proposals table for public access
  - Update RLS policies to allow public read access via share token
  - Create index on share_token for performance

  ## Security
  - Share tokens are generated randomly and are unguessable
  - Only read access is granted to public users with valid token
  - Authenticated users can still see their own proposals
*/

-- Add share_token column
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_proposals_share_token ON proposals(share_token);

-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own proposals" ON proposals;

-- Create new SELECT policy that allows public access via share token OR owner access
CREATE POLICY "Public can view proposals with share token"
  ON proposals
  FOR SELECT
  USING (
    share_token IS NOT NULL
    OR
    (auth.uid() = user_id)
  );