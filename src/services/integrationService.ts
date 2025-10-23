import { supabase } from '../lib/supabase';

export interface Integration {
  id: string;
  name: string;
  icon: string;
  color: string;
  status: 'connected' | 'pending' | 'disconnected';
  automations_count: number;
  config: Record<string, any>;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationRule {
  id: string;
  integration_id: string;
  name: string;
  trigger_event: string;
  action: string;
  is_active: boolean;
  config: Record<string, any>;
  created_at: string;
}

export const integrationService = {
  async createIntegration(
    name: string,
    icon: string,
    color: string
  ): Promise<Integration> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('integrations')
      .insert([
        {
          name,
          icon,
          color,
          status: 'pending',
          automations_count: 0,
          user_id: user?.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllIntegrations(): Promise<Integration[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getIntegration(id: string): Promise<Integration | null> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async connectIntegration(id: string, config?: Record<string, any>): Promise<Integration> {
    const updateData: any = {
      status: 'connected',
      connected_at: new Date().toISOString(),
    };

    if (config) {
      updateData.config = config;
    }

    const { data, error } = await supabase
      .from('integrations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async disconnectIntegration(id: string): Promise<Integration> {
    const { data, error } = await supabase
      .from('integrations')
      .update({
        status: 'disconnected',
        connected_at: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAutomationRules(integrationId?: string): Promise<AutomationRule[]> {
    let query = supabase.from('automation_rules').select('*');

    if (integrationId) {
      query = query.eq('integration_id', integrationId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createAutomationRule(
    integrationId: string,
    name: string,
    triggerEvent: string,
    action: string,
    config?: Record<string, any>
  ): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('automation_rules')
      .insert([
        {
          integration_id: integrationId,
          name,
          trigger_event: triggerEvent,
          action,
          config: config || {},
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await this.updateAutomationCount(integrationId);

    return data;
  },

  async toggleAutomationRule(ruleId: string, isActive: boolean): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('automation_rules')
      .update({ is_active: isActive })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAutomationRule(ruleId: string): Promise<void> {
    const { data: rule } = await supabase
      .from('automation_rules')
      .select('integration_id')
      .eq('id', ruleId)
      .maybeSingle();

    const { error } = await supabase.from('automation_rules').delete().eq('id', ruleId);

    if (error) throw error;

    if (rule) {
      await this.updateAutomationCount(rule.integration_id);
    }
  },

  async updateAutomationCount(integrationId: string): Promise<void> {
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('id')
      .eq('integration_id', integrationId)
      .eq('is_active', true);

    const count = rules?.length || 0;

    await supabase
      .from('integrations')
      .update({ automations_count: count })
      .eq('id', integrationId);
  },

  async deleteIntegration(integrationId: string): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', integrationId);

    if (error) throw error;
  },
};
