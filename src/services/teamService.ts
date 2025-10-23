import { supabase } from '../lib/supabase';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  avatar_url?: string;
  status: 'active' | 'pending' | 'suspended';
  last_active?: string;
  invited_by?: string;
  invited_at: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
}

export const teamService = {
  async getAllMembers(): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }

    return data || [];
  },

  async getMemberById(id: string): Promise<TeamMember | null> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch team member: ${error.message}`);
    }

    return data;
  },

  async inviteMember(memberData: {
    email: string;
    name: string;
    role: string;
  }): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .insert([
        {
          email: memberData.email,
          name: memberData.name,
          role: memberData.role,
          status: 'pending',
          invited_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to invite team member: ${error.message}`);
    }

    return data;
  },

  async updateMember(
    id: string,
    updates: Partial<Pick<TeamMember, 'name' | 'role' | 'status'>>
  ): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update team member: ${error.message}`);
    }

    return data;
  },

  async removeMember(id: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to remove team member: ${error.message}`);
    }
  },

  async resendInvitation(id: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ invited_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to resend invitation: ${error.message}`);
    }
  },

  async acceptInvitation(id: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({
        status: 'active',
        joined_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to accept invitation: ${error.message}`);
    }
  },
};
