import { supabase, Proposal, BudgetItem, ProposalFile, ProposalWithDetails } from '../lib/supabase';

export const proposalService = {
  async getAllProposals(): Promise<ProposalWithDetails[]> {
    const { data: proposals, error: proposalsError } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (proposalsError) throw proposalsError;
    if (!proposals) return [];

    const proposalsWithDetails = await Promise.all(
      proposals.map(async (proposal) => {
        const [budgetItems, files] = await Promise.all([
          this.getBudgetItems(proposal.id),
          this.getProposalFiles(proposal.id),
        ]);

        return {
          ...proposal,
          budget_items: budgetItems,
          files: files,
        };
      })
    );

    return proposalsWithDetails;
  },

  async getProposal(id: string): Promise<ProposalWithDetails | null> {
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!proposal) return null;

    const [budgetItems, files] = await Promise.all([
      this.getBudgetItems(id),
      this.getProposalFiles(id),
    ]);

    return {
      ...proposal,
      budget_items: budgetItems,
      files: files,
    };
  },

  async createProposal(
    proposalData: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>,
    budgetItems: Omit<BudgetItem, 'id' | 'proposal_id' | 'created_at'>[],
    files: Omit<ProposalFile, 'id' | 'proposal_id' | 'created_at'>[]
  ): Promise<ProposalWithDetails> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert([{ ...proposalData, user_id: user?.id }])
      .select()
      .single();

    if (proposalError) throw proposalError;

    const budgetItemsToInsert = budgetItems.map((item) => ({
      ...item,
      proposal_id: proposal.id,
    }));

    const filesToInsert = files.map((file) => ({
      ...file,
      proposal_id: proposal.id,
    }));

    const [insertedBudgetItems, insertedFiles] = await Promise.all([
      budgetItemsToInsert.length > 0
        ? this.createBudgetItems(proposal.id, budgetItemsToInsert)
        : Promise.resolve([]),
      filesToInsert.length > 0
        ? this.createProposalFiles(proposal.id, filesToInsert)
        : Promise.resolve([]),
    ]);

    return {
      ...proposal,
      budget_items: insertedBudgetItems,
      files: insertedFiles,
    };
  },

  async updateProposal(
    id: string,
    updates: Partial<Omit<Proposal, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Proposal> {
    const { data, error } = await supabase
      .from('proposals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProposal(id: string): Promise<void> {
    const { error } = await supabase.from('proposals').delete().eq('id', id);

    if (error) throw error;
  },

  async getBudgetItems(proposalId: string): Promise<BudgetItem[]> {
    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createBudgetItems(
    proposalId: string,
    items: Omit<BudgetItem, 'id' | 'created_at'>[]
  ): Promise<BudgetItem[]> {
    const { data, error } = await supabase
      .from('budget_items')
      .insert(items)
      .select();

    if (error) throw error;
    return data || [];
  },

  async updateBudgetItem(
    id: string,
    updates: Partial<Omit<BudgetItem, 'id' | 'proposal_id' | 'created_at'>>
  ): Promise<BudgetItem> {
    const { data, error } = await supabase
      .from('budget_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBudgetItem(id: string): Promise<void> {
    const { error } = await supabase.from('budget_items').delete().eq('id', id);

    if (error) throw error;
  },

  async getProposalFiles(proposalId: string): Promise<ProposalFile[]> {
    const { data, error } = await supabase
      .from('proposal_files')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createProposalFiles(
    proposalId: string,
    files: Omit<ProposalFile, 'id' | 'created_at'>[]
  ): Promise<ProposalFile[]> {
    const { data, error } = await supabase
      .from('proposal_files')
      .insert(files)
      .select();

    if (error) throw error;
    return data || [];
  },

  async deleteProposalFile(id: string): Promise<void> {
    const { error } = await supabase
      .from('proposal_files')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async incrementOpens(id: string): Promise<void> {
    const { data: proposal } = await supabase
      .from('proposals')
      .select('opens')
      .eq('id', id)
      .maybeSingle();

    if (proposal) {
      await supabase
        .from('proposals')
        .update({ opens: proposal.opens + 1 })
        .eq('id', id);
    }
  },

  async updateEngagement(id: string, engagement: number): Promise<void> {
    await supabase
      .from('proposals')
      .update({ engagement })
      .eq('id', id);
  },
};
