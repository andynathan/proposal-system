import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Proposal = {
  id: string;
  title: string;
  client: string;
  client_email: string;
  status: 'draft' | 'sent' | 'won' | 'lost';
  value: number;
  description: string;
  template: 'professional' | 'creative' | 'corporate';
  opens: number;
  engagement: number;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type BudgetItem = {
  id: string;
  proposal_id: string;
  item: string;
  description: string;
  amount: number;
  quantity: number;
  created_at: string;
};

export type ProposalFile = {
  id: string;
  proposal_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
};

export type ProposalWithDetails = Proposal & {
  budget_items: BudgetItem[];
  files: ProposalFile[];
};
