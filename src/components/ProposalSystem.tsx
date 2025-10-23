import React, { useState, useRef, useEffect } from 'react';
import { FileText, Mic, MicOff, Zap, Brain, BarChart3, Plus, Search, Eye, DollarSign, Bell, X, CreditCard as Edit3, Sparkles, Bot, Building, Calendar, Copy, Share2, ArrowRight, Headphones, Settings, Users, Upload, CheckCircle2, AlertCircle, Loader2, Key, Shield, User, Mail, Lock, LogOut } from 'lucide-react';
import { proposalService } from '../services/proposalService';
import { ProposalWithDetails } from '../lib/supabase';
import { aiTrainingService, TrainingDocument } from '../services/aiTrainingService';
import { integrationService, Integration, AutomationRule } from '../services/integrationService';
import { teamService, TeamMember } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';

const ProposalSystem = () => {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentProposal, setCurrentProposal] = useState<ProposalWithDetails | null>(null);
  const [proposals, setProposals] = useState<ProposalWithDetails[]>([]);
  const [newProposal, setNewProposal] = useState({
    title: '',
    client: '',
    clientEmail: '',
    description: '',
    template: 'professional' as 'professional' | 'creative' | 'corporate',
    budgetItems: [
      { id: 1, item: '', description: '', amount: '', quantity: 1 }
    ],
    uploadedFiles: [] as any[]
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [trainingDocuments, setTrainingDocuments] = useState<TrainingDocument[]>([]);
  const [uploadingTraining, setUploadingTraining] = useState(false);
  const trainingFileInputRef = useRef<HTMLInputElement>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', triggerEvent: '', action: '' });
  const [showNewIntegrationModal, setShowNewIntegrationModal] = useState(false);
  const [newIntegration, setNewIntegration] = useState({ name: '', icon: '🔗', color: 'bg-blue-100 text-blue-700' });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configIntegration, setConfigIntegration] = useState<Integration | null>(null);
  const [configData, setConfigData] = useState<Record<string, string>>({});
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ name: '', environment: 'production' });
  const [settings, setSettings] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    defaultCurrency: 'USD',
    timezone: 'UTC',
    emailNotifications: true,
    autoSaveInterval: 5,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', name: '', role: 'viewer' });

  const loadIntegrations = async () => {
    try {
      const data = await integrationService.getAllIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const data = await teamService.getAllMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const handleInviteMember = async () => {
    if (!newMember.email || !newMember.name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await teamService.inviteMember(newMember);
      await loadTeamMembers();
      setShowInviteModal(false);
      setNewMember({ email: '', name: '', role: 'viewer' });
      alert('Team member invited successfully!');
    } catch (error) {
      console.error('Error inviting team member:', error);
      alert('Failed to invite team member');
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await teamService.removeMember(id);
      await loadTeamMembers();
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('Failed to remove team member');
    }
  };

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      await teamService.updateMember(id, { role: role as TeamMember['role'] });
      await loadTeamMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      await teamService.resendInvitation(id);
      alert('Invitation resent successfully!');
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation');
    }
  };

  const handleOpenConfig = (integration: Integration) => {
    setConfigIntegration(integration);
    setConfigData(integration.config || {});
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    if (!configIntegration) return;

    try {
      await integrationService.connectIntegration(configIntegration.id, configData);
      await loadIntegrations();
      setShowConfigModal(false);
      setConfigIntegration(null);
      setConfigData({});
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Failed to save configuration');
    }
  };

  const getConfigFields = (integrationName: string): Array<{key: string, label: string, placeholder: string, type?: string}> => {
    const name = integrationName.toLowerCase();

    if (name.includes('salesforce')) {
      return [
        { key: 'instanceUrl', label: 'Instance URL', placeholder: 'https://yourinstance.salesforce.com' },
        { key: 'clientId', label: 'Client ID', placeholder: 'Your Salesforce Client ID' },
        { key: 'clientSecret', label: 'Client Secret', placeholder: 'Your Salesforce Client Secret', type: 'password' },
      ];
    } else if (name.includes('hubspot')) {
      return [
        { key: 'apiKey', label: 'API Key', placeholder: 'Your HubSpot API Key', type: 'password' },
      ];
    } else if (name.includes('zapier')) {
      return [
        { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/...' },
      ];
    } else if (name.includes('slack')) {
      return [
        { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/...' },
      ];
    } else if (name.includes('google')) {
      return [
        { key: 'clientId', label: 'Client ID', placeholder: 'Your Google Client ID' },
        { key: 'clientSecret', label: 'Client Secret', placeholder: 'Your Google Client Secret', type: 'password' },
      ];
    } else if (name.includes('stripe')) {
      return [
        { key: 'apiKey', label: 'API Key', placeholder: 'Your Stripe API Key', type: 'password' },
      ];
    } else if (name.includes('analytics')) {
      return [
        { key: 'trackingId', label: 'Tracking ID', placeholder: 'G-XXXXXXXXXX or UA-XXXXXXXXXX' },
      ];
    } else {
      return [
        { key: 'apiKey', label: 'API Key', placeholder: 'Enter your API key', type: 'password' },
        { key: 'apiUrl', label: 'API URL (optional)', placeholder: 'https://api.example.com' },
      ];
    }
  };

  const handleDisconnectIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    try {
      await integrationService.disconnectIntegration(id);
      await loadIntegrations();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      alert('Failed to disconnect integration');
    }
  };

  const handleViewIntegration = async (integration: Integration) => {
    try {
      setSelectedIntegration(integration);
      const rules = await integrationService.getAutomationRules(integration.id);
      setAutomationRules(rules);
    } catch (error) {
      console.error('Error loading automation rules:', error);
    }
  };

  const handleCreateAutomationRule = async () => {
    if (!selectedIntegration || !newRule.name || !newRule.triggerEvent || !newRule.action) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await integrationService.createAutomationRule(
        selectedIntegration.id,
        newRule.name,
        newRule.triggerEvent,
        newRule.action
      );
      const rules = await integrationService.getAutomationRules(selectedIntegration.id);
      setAutomationRules(rules);
      await loadIntegrations();
      setNewRule({ name: '', triggerEvent: '', action: '' });
      setShowNewRuleModal(false);
    } catch (error) {
      console.error('Error creating automation rule:', error);
      alert('Failed to create automation rule');
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await integrationService.toggleAutomationRule(ruleId, isActive);
      if (selectedIntegration) {
        const rules = await integrationService.getAutomationRules(selectedIntegration.id);
        setAutomationRules(rules);
        await loadIntegrations();
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Failed to toggle rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await integrationService.deleteAutomationRule(ruleId);
      if (selectedIntegration) {
        const rules = await integrationService.getAutomationRules(selectedIntegration.id);
        setAutomationRules(rules);
        await loadIntegrations();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Failed to delete rule');
    }
  };

  const handleCreateIntegration = async () => {
    if (!newIntegration.name) {
      alert('Please enter an integration name');
      return;
    }

    try {
      await integrationService.createIntegration(
        newIntegration.name,
        newIntegration.icon,
        newIntegration.color
      );
      await loadIntegrations();
      setNewIntegration({ name: '', icon: '🔗', color: 'bg-blue-100 text-blue-700' });
      setShowNewIntegrationModal(false);
    } catch (error) {
      console.error('Error creating integration:', error);
      alert('Failed to create integration');
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration? All associated automations will also be deleted.')) return;
    try {
      await integrationService.deleteIntegration(id);
      await loadIntegrations();
    } catch (error) {
      console.error('Error deleting integration:', error);
      alert('Failed to delete integration');
    }
  };

  useEffect(() => {
    loadProposals();
    loadTrainingDocuments();
    loadIntegrations();
    loadTeamMembers();
  }, []);

  const loadProposals = async () => {
    try {
      setIsLoading(true);
      const data = await proposalService.getAllProposals();
      setProposals(data);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrainingDocuments = async () => {
    try {
      const docs = await aiTrainingService.getTrainingDocuments();
      setTrainingDocuments(docs);
    } catch (error) {
      console.error('Error loading training documents:', error);
    }
  };

  const handleTrainingFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingTraining(true);

    try {
      const uploadedDocs: TrainingDocument[] = [];

      for (const file of Array.from(files)) {
        const content = await aiTrainingService.extractTextFromFile(file);
        const doc = await aiTrainingService.uploadTrainingDocument(
          file.name,
          file.size,
          file.type,
          content
        );
        uploadedDocs.push(doc);
      }

      const docsToAnalyze = uploadedDocs.map(doc => ({
        id: doc.id,
        fileName: doc.file_name,
        content: doc.content,
      }));

      for (const doc of uploadedDocs) {
        await aiTrainingService.updateDocumentStatus(doc.id, 'processing');
      }

      const result = await aiTrainingService.analyzeDocuments(docsToAnalyze);

      for (let i = 0; i < uploadedDocs.length; i++) {
        const doc = uploadedDocs[i];
        const docPatterns = result.patterns.filter(
          (_: any, index: number) => index % uploadedDocs.length === i
        );

        if (docPatterns.length > 0) {
          await aiTrainingService.saveExtractedPatterns(doc.id, docPatterns);
        }

        await aiTrainingService.updateDocumentStatus(doc.id, 'completed');
      }

      await loadTrainingDocuments();

      setAiSuggestions(result.summary || [
        `Successfully processed ${files.length} document(s)`,
        'New content patterns detected',
        'AI learning enhanced',
        'Updated proposal templates available',
      ]);
      setShowAIAssistant(true);
    } catch (error) {
      console.error('Error processing training files:', error);
      alert('Failed to process training files. Please try again.');
    } finally {
      setUploadingTraining(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteTrainingDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this training document?')) return;

    try {
      await aiTrainingService.deleteTrainingDocument(docId);
      await loadTrainingDocuments();
    } catch (error) {
      console.error('Error deleting training document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      const voiceResponses = [
        "Create a new proposal for Microsoft focusing on cloud infrastructure with 150k budget",
        "Add pricing section with three tier options",
        "Generate executive summary for healthcare client"
      ];
      const randomResponse = voiceResponses[Math.floor(Math.random() * voiceResponses.length)];
      setVoiceText(randomResponse);
      setIsRecording(false);
      setAiSuggestions([
        "Generate proposal template from voice input",
        "Auto-populate client data from CRM",
        "Add interactive pricing calculator",
        "Use successful template patterns"
      ]);
      setShowAIAssistant(true);
    }, 2000);
  };

  const addBudgetItem = () => {
    const newId = Math.max(...newProposal.budgetItems.map(item => item.id)) + 1;
    setNewProposal({
      ...newProposal,
      budgetItems: [...newProposal.budgetItems, { id: newId, item: '', description: '', amount: '', quantity: 1 }]
    });
  };

  const removeBudgetItem = (id: number) => {
    if (newProposal.budgetItems.length > 1) {
      setNewProposal({
        ...newProposal,
        budgetItems: newProposal.budgetItems.filter(item => item.id !== id)
      });
    }
  };

  const updateBudgetItem = (id: number, field: string, value: any) => {
    setNewProposal({
      ...newProposal,
      budgetItems: newProposal.budgetItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const calculateTotalBudget = () => {
    return newProposal.budgetItems.reduce((total, item) => {
      const amount = parseFloat(item.amount) || 0;
      const quantity = parseInt(String(item.quantity)) || 1;
      return total + (amount * quantity);
    }, 0);
  };

  const handleFileUpload = (files: FileList) => {
    const fileList = Array.from(files);
    const newFiles = fileList.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));

    setNewProposal({
      ...newProposal,
      uploadedFiles: [...newProposal.uploadedFiles, ...newFiles]
    });
  };

  const removeFile = (fileId: number) => {
    setNewProposal({
      ...newProposal,
      uploadedFiles: newProposal.uploadedFiles.filter(file => file.id !== fileId)
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!newProposal.title || !newProposal.client) {
      alert('Please fill in the proposal title and client name');
      return;
    }

    try {
      setIsLoading(true);
      const totalBudget = calculateTotalBudget();

      const proposalData = {
        title: newProposal.title,
        client: newProposal.client,
        client_email: newProposal.clientEmail,
        status: 'draft' as const,
        value: totalBudget,
        description: newProposal.description,
        template: newProposal.template,
        opens: 0,
        engagement: 0,
        tags: ['new-proposal']
      };

      const budgetItems = newProposal.budgetItems.map(item => ({
        item: item.item,
        description: item.description,
        amount: parseFloat(item.amount) || 0,
        quantity: item.quantity
      }));

      const files = newProposal.uploadedFiles.map(file => ({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      }));

      const createdProposal = await proposalService.createProposal(proposalData, budgetItems, files);

      setProposals([createdProposal, ...proposals]);
      setCurrentProposal(createdProposal);

      setNewProposal({
        title: '',
        client: '',
        clientEmail: '',
        description: '',
        template: 'professional',
        budgetItems: [
          { id: 1, item: '', description: '', amount: '', quantity: 1 }
        ],
        uploadedFiles: []
      });

      setAiSuggestions([
        `Created proposal: "${createdProposal.title}" with ${createdProposal.budget_items.length} budget items`,
        "AI analyzed uploaded documents for relevant content",
        "Generated pricing recommendations based on similar proposals",
        "Ready to add executive summary and project timeline"
      ]);
      setShowAIAssistant(true);

      setActiveTab('proposal-view');
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Failed to create proposal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;

    try {
      setIsLoading(true);
      await proposalService.deleteProposal(id);
      setProposals(proposals.filter(p => p.id !== id));
      if (currentProposal?.id === id) {
        setCurrentProposal(null);
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('Failed to delete proposal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProposals = proposals.filter(proposal =>
    proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proposal.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = proposals.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">ProposalAI Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : profile?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium">{profile?.full_name || profile?.email || 'User'}</span>
              <button
                onClick={signOut}
                className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen">
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('proposal-view')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'proposal-view' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <FileText className="w-5 h-5" />
              Proposal View
            </button>
            <button
              onClick={() => setActiveTab('proposal-editor')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'proposal-editor' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <Edit3 className="w-5 h-5" />
              Proposal Editor
            </button>
            <button
              onClick={() => setActiveTab('ai-training')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'ai-training' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <Brain className="w-5 h-5" />
              AI Training
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'integrations' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <Zap className="w-5 h-5" />
              Integrations
            </button>
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'api-keys' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <Key className="w-5 h-5" />
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'analytics' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'team' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5" />
              Team
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </nav>

          <div className="p-4 m-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-medium">AI Assistant</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-xs text-cyan-600">{proposals.length} proposals analyzed</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white p-8 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">AI-Powered Proposal System</h1>
                    <p className="text-blue-100 text-lg">Create winning proposals in minutes with AI assistance</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setActiveTab('proposal-editor')}
                      className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      New Proposal
                    </button>
                    <button
                      onClick={startVoiceRecording}
                      className={`p-4 rounded-full transition-all duration-300 ${
                        isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                {voiceText && (
                  <div className="mt-4 p-4 bg-white/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Headphones className="w-4 h-4" />
                      <span className="text-sm font-medium">Voice Input Processed:</span>
                    </div>
                    <p className="text-sm italic">"{voiceText}"</p>
                  </div>
                )}

                <div className="grid md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold">{proposals.length}</div>
                    <div className="text-blue-100 text-sm">Total Proposals</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold">87%</div>
                    <div className="text-blue-100 text-sm">Win Rate</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold">${(totalValue / 1000).toFixed(0)}K</div>
                    <div className="text-blue-100 text-sm">Pipeline Value</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold">4.2min</div>
                    <div className="text-blue-100 text-sm">Creation Time</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-3 gap-6">
                <div
                  onClick={() => setActiveTab('proposal-editor')}
                  className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Create New Proposal</h3>
                      <p className="text-gray-600 text-sm">Start with AI assistance</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">Use voice commands or templates to create proposals in minutes</p>
                </div>

                <div
                  onClick={() => setActiveTab('ai-training')}
                  className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-cyan-100 rounded-xl">
                      <Brain className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Train AI Assistant</h3>
                      <p className="text-gray-600 text-sm">Upload past proposals</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">Improve AI suggestions by training on your successful proposals</p>
                </div>

                <div
                  onClick={() => setActiveTab('integrations')}
                  className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Setup Integrations</h3>
                      <p className="text-gray-600 text-sm">Connect your tools</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">Automate workflows with Make.com, Zapier, and CRM systems</p>
                </div>
              </div>

              {/* Recent Proposals */}
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Recent Proposals</h2>
                    <button
                      onClick={() => setActiveTab('proposal-editor')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New Proposal
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="p-12 text-center text-gray-500">Loading proposals...</div>
                ) : filteredProposals.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Proposals Yet</h3>
                    <p className="text-gray-500 mb-6">Create your first proposal to get started</p>
                    <button
                      onClick={() => setActiveTab('proposal-editor')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Proposal
                    </button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredProposals.map((proposal) => (
                      <div key={proposal.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{proposal.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                proposal.status === 'won' ? 'bg-green-100 text-green-700' :
                                proposal.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                {proposal.client}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${proposal.value.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(proposal.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">{proposal.opens} opens</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${proposal.engagement}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500">{proposal.engagement}% engagement</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {proposal.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const shareUrl = `${window.location.origin}/share/${proposal.share_token}`;
                                navigator.clipboard.writeText(shareUrl);
                                alert('Share link copied to clipboard!');
                              }}
                              className="p-2 hover:bg-green-100 text-green-600 rounded-lg"
                              title="Copy share link"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentProposal(proposal);
                                setActiveTab('proposal-view');
                              }}
                              className="p-2 hover:bg-gray-200 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProposal(proposal.id)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'proposal-view' && (
            <div className="space-y-6">
              {!currentProposal ? (
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Proposal Selected</h3>
                    <p className="text-gray-500 mb-6">Create a new proposal or select an existing one to view</p>
                    <button
                      onClick={() => setActiveTab('proposal-editor')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create New Proposal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Proposal Header */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setActiveTab('dashboard')}
                          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" />
                          Back to Dashboard
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">{currentProposal.title}</h1>
                          <p className="text-gray-600">For {currentProposal.client}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          currentProposal.status === 'won' ? 'bg-green-100 text-green-700' :
                          currentProposal.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {currentProposal.status.charAt(0).toUpperCase() + currentProposal.status.slice(1)}
                        </span>

                        <button
                          onClick={() => alert('Sending proposal to client')}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          Send to Client
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-4 gap-6">
                    {/* Proposal Document */}
                    <div className="lg:col-span-3">
                      <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-8 max-w-4xl mx-auto">
                          {/* Header */}
                          <div className="text-center mb-12 pb-8 border-b">
                            <div className="mb-6">
                              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-white" />
                              </div>
                              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                {currentProposal.title}
                              </h1>
                              <p className="text-xl text-gray-600">
                                Professional Services Proposal
                              </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 text-left">
                              <div className="space-y-3">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">Prepared For:</h3>
                                <div className="text-gray-700">
                                  <p className="font-medium text-lg">{currentProposal.client}</p>
                                  {currentProposal.client_email && (
                                    <p className="text-gray-600">{currentProposal.client_email}</p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">Prepared By:</h3>
                                <div className="text-gray-700">
                                  <p className="font-medium text-lg">ProposalAI Pro</p>
                                  <p className="text-gray-600">Generated on {new Date(currentProposal.created_at).toLocaleDateString()}</p>
                                  <p className="text-gray-600">Proposal ID: #{currentProposal.id.slice(0, 8)}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Executive Summary */}
                          <div className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b">
                              Executive Summary
                            </h2>
                            <div className="prose max-w-none text-gray-700 leading-relaxed">
                              <p className="mb-4 text-lg">
                                We are pleased to present this comprehensive proposal for <strong>{currentProposal.client}</strong>.
                                Our team has carefully analyzed your requirements and developed a tailored solution that addresses
                                your specific needs and objectives.
                              </p>

                              {currentProposal.description && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-6">
                                  <h4 className="font-semibold text-blue-900 mb-2">Project Overview:</h4>
                                  <p className="text-blue-800">{currentProposal.description}</p>
                                </div>
                              )}

                              <div className="grid md:grid-cols-3 gap-6 my-8">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                  <div className="text-2xl font-bold text-green-600">${currentProposal.value.toLocaleString()}</div>
                                  <div className="text-green-700 font-medium">Total Investment</div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                  <div className="text-2xl font-bold text-blue-600">{currentProposal.budget_items.length}</div>
                                  <div className="text-blue-700 font-medium">Service Components</div>
                                </div>
                                <div className="text-center p-4 bg-cyan-50 rounded-lg">
                                  <div className="text-2xl font-bold text-cyan-600">30 Days</div>
                                  <div className="text-cyan-700 font-medium">Estimated Timeline</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Scope of Work */}
                          <div className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b">
                              Scope of Work & Deliverables
                            </h2>

                            <div className="space-y-6">
                              {currentProposal.budget_items.map((item, index) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {index + 1}. {item.item || `Service Item ${index + 1}`}
                                      </h3>
                                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                        <span>Quantity: {item.quantity}</span>
                                        <span>•</span>
                                        <span>Unit Price: ${parseFloat(String(item.amount)).toLocaleString()}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-blue-600">
                                        ${((parseFloat(String(item.amount)) || 0) * (parseInt(String(item.quantity)) || 1)).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>

                                  {item.description ? (
                                    <div className="text-gray-700 leading-relaxed">
                                      <p>{item.description}</p>
                                    </div>
                                  ) : (
                                    <div className="text-gray-600 italic">
                                      <p>Comprehensive {item.item?.toLowerCase() || 'service'} tailored to your specific requirements.
                                      Our expert team will deliver high-quality results using industry best practices.</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Investment Summary */}
                          <div className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b">
                              Investment Summary
                            </h2>

                            <div className="bg-gray-50 rounded-lg p-6">
                              <div className="space-y-4">
                                {currentProposal.budget_items.map((item, index) => (
                                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                    <div className="flex-1">
                                      <span className="font-medium">{item.item || `Service Item ${index + 1}`}</span>
                                      <span className="text-gray-600 ml-2">x {item.quantity}</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold">
                                        ${((parseFloat(String(item.amount)) || 0) * (parseInt(String(item.quantity)) || 1)).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                <div className="pt-4 border-t-2 border-gray-300">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold text-gray-900">Total Investment:</span>
                                    <span className="text-3xl font-bold text-blue-600">
                                      ${currentProposal.value.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Generated by ProposalAI Pro • {new Date().toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => window.print()}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Print/PDF
                            </button>
                            <button
                              onClick={() => alert('Sending proposal to client')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                              <Share2 className="w-4 h-4" />
                              Send to Client
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Sidebar */}
                    <div className="lg:col-span-1">
                      <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>

                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">{currentProposal.opens}</div>
                              <div className="text-sm text-blue-700">Opens</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{currentProposal.engagement}%</div>
                              <div className="text-sm text-green-700">Engagement</div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Created</span>
                              <span className="font-medium">{new Date(currentProposal.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Template</span>
                              <span className="font-medium capitalize">{currentProposal.template}</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <h4 className="font-medium text-gray-900 mb-3">AI Insights</h4>
                            <div className="space-y-2">
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-green-800">Strong pricing</span>
                                </div>
                              </div>

                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-blue-800">Clear scope</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'proposal-editor' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Create New Proposal</h2>
                      <p className="text-gray-600 mt-1">Build a comprehensive proposal with itemized budget</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateProposal}
                        disabled={isLoading}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 flex items-center gap-2 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isLoading ? 'Creating...' : 'Create Proposal'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Proposal Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newProposal.title}
                          onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                          placeholder="e.g., Digital Marketing Strategy for Q1 2025"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Client Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newProposal.client}
                          onChange={(e) => setNewProposal({...newProposal, client: e.target.value})}
                          placeholder="e.g., TechCorp Solutions"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Client Email
                        </label>
                        <input
                          type="email"
                          value={newProposal.clientEmail}
                          onChange={(e) => setNewProposal({...newProposal, clientEmail: e.target.value})}
                          placeholder="e.g., contact@techcorp.com"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template Style
                        </label>
                        <select
                          value={newProposal.template}
                          onChange={(e) => setNewProposal({...newProposal, template: e.target.value as any})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="professional">Professional</option>
                          <option value="creative">Creative</option>
                          <option value="corporate">Corporate</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Description
                      </label>
                      <textarea
                        value={newProposal.description}
                        onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                        placeholder="Describe the project scope and objectives..."
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Budget Items */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Budget Items</h3>
                      <button
                        onClick={addBudgetItem}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Item
                      </button>
                    </div>

                    <div className="space-y-4">
                      {newProposal.budgetItems.map((budgetItem, index) => (
                        <div key={budgetItem.id} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">Item #{index + 1}</h4>
                            {newProposal.budgetItems.length > 1 && (
                              <button
                                onClick={() => removeBudgetItem(budgetItem.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                              <input
                                type="text"
                                value={budgetItem.item}
                                onChange={(e) => updateBudgetItem(budgetItem.id, 'item', e.target.value)}
                                placeholder="e.g., Website Design"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                              <input
                                type="number"
                                min="1"
                                value={budgetItem.quantity}
                                onChange={(e) => updateBudgetItem(budgetItem.id, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={budgetItem.amount}
                                onChange={(e) => updateBudgetItem(budgetItem.id, 'amount', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={budgetItem.description}
                              onChange={(e) => updateBudgetItem(budgetItem.id, 'description', e.target.value)}
                              placeholder="Describe this budget item..."
                              rows={2}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-blue-900">Total Budget</div>
                        <div className="text-2xl font-bold text-blue-600">
                          ${calculateTotalBudget().toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-training' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">AI Training</h2>
                      <p className="text-gray-600 mt-1">Upload past proposals to enhance AI learning</p>
                    </div>
                    <button
                      onClick={() => trainingFileInputRef.current?.click()}
                      disabled={uploadingTraining}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Documents
                    </button>
                    <input
                      ref={trainingFileInputRef}
                      type="file"
                      multiple
                      accept=".txt,.md,.pdf,.doc,.docx"
                      onChange={handleTrainingFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <Brain className="w-8 h-8 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold text-blue-900">{trainingDocuments.length}</div>
                          <div className="text-sm text-blue-700">Documents</div>
                        </div>
                      </div>
                      <p className="text-sm text-blue-600">Training materials uploaded</p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold text-green-900">{trainingDocuments.filter(d => d.status === 'completed').length}</div>
                          <div className="text-sm text-green-700">Processed</div>
                        </div>
                      </div>
                      <p className="text-sm text-green-600">Successfully analyzed</p>
                    </div>

                    <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="w-8 h-8 text-cyan-600" />
                        <div>
                          <div className="text-2xl font-bold text-cyan-900">AI Enhanced</div>
                          <div className="text-sm text-cyan-700">Learning</div>
                        </div>
                      </div>
                      <p className="text-sm text-cyan-600">Improved proposal generation</p>
                    </div>
                  </div>

                  {uploadingTraining && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="text-blue-800">Processing documents...</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Training Documents</h3>

                    {trainingDocuments.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Training Documents</h3>
                        <p className="text-gray-500 mb-6">Upload past proposals to train the AI assistant</p>
                        <button
                          onClick={() => trainingFileInputRef.current?.click()}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Upload Your First Document
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {trainingDocuments.map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{doc.file_name}</div>
                                  <div className="text-sm text-gray-500">
                                    {(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.uploaded_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {doc.status === 'completed' && (
                                  <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Processed
                                  </span>
                                )}
                                {doc.status === 'processing' && (
                                  <span className="flex items-center gap-1 text-sm text-blue-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing
                                  </span>
                                )}
                                {doc.status === 'failed' && (
                                  <span className="flex items-center gap-1 text-sm text-red-600">
                                    <AlertCircle className="w-4 h-4" />
                                    Failed
                                  </span>
                                )}
                                <button
                                  onClick={() => handleDeleteTrainingDoc(doc.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {!selectedIntegration ? (
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
                        <p className="text-gray-600 mt-1">Connect your favorite tools and automate workflows</p>
                      </div>
                      <button
                        onClick={() => setShowNewIntegrationModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Integration
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {integrations.map((integration) => (
                        <div key={integration.id} className="border rounded-xl p-6 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${integration.color}`}>
                                {integration.icon}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  integration.status === 'connected' ? 'bg-green-100 text-green-700' :
                                  integration.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {integration.status}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteIntegration(integration.id)}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete integration"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <p className="text-sm text-gray-600 mb-4">
                            {integration.automations_count} automation{integration.automations_count !== 1 ? 's' : ''}
                          </p>

                          <div className="flex gap-2">
                            {integration.status === 'connected' ? (
                              <>
                                <button
                                  onClick={() => handleViewIntegration(integration)}
                                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Manage
                                </button>
                                <button
                                  onClick={() => handleOpenConfig(integration)}
                                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                  Settings
                                </button>
                                <button
                                  onClick={() => handleDisconnectIntegration(integration.id)}
                                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                  Disconnect
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleOpenConfig(integration)}
                                className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                              >
                                Connect
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedIntegration(null)}
                          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" />
                          Back to Integrations
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${selectedIntegration.color}`}>
                            {selectedIntegration.icon}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedIntegration.name}</h2>
                            <p className="text-gray-600">Manage automations</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowNewRuleModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        New Automation
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {automationRules.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Automations Yet</h3>
                        <p className="text-gray-500 mb-6">Create your first automation to streamline your workflow</p>
                        <button
                          onClick={() => setShowNewRuleModal(true)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create Automation
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {automationRules.map((rule) => (
                          <div key={rule.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-2">{rule.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    When: {rule.trigger_event}
                                  </span>
                                  <ArrowRight className="w-4 h-4" />
                                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                                    Then: {rule.action}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={rule.is_active}
                                    onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
                      <p className="text-gray-600 mt-1">Manage API keys for programmatic access</p>
                    </div>
                    <button
                      onClick={() => setShowNewKeyModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Generate New Key
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-12">
                      <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No API Keys Yet</h3>
                      <p className="text-gray-600 mb-6">Generate an API key to start using our API</p>
                      <button
                        onClick={() => setShowNewKeyModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Generate First Key
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="border rounded-xl p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">{key.name}</h3>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  key.environment === 'production'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {key.environment}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Created {new Date(key.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this API key?')) {
                                  setApiKeys(apiKeys.filter(k => k.id !== key.id));
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
                            {key.key}
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(key.key);
                                alert('API key copied to clipboard!');
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                            <span className="text-gray-300">|</span>
                            <span className="text-sm text-gray-600">Last used: {key.last_used || 'Never'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex gap-3">
                  <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Security Best Practices</h3>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• Never share your API keys publicly or commit them to version control</li>
                      <li>• Use environment-specific keys for production and testing</li>
                      <li>• Rotate keys regularly and revoke unused keys</li>
                      <li>• Monitor API usage for unusual activity</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                  <p className="text-gray-600 mt-1">Configure your application preferences</p>
                </div>

                <div className="p-6 space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Company Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={settings.companyName}
                          onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                          placeholder="Acme Corporation"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Email
                        </label>
                        <input
                          type="email"
                          value={settings.companyEmail}
                          onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                          placeholder="contact@company.com"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Phone
                        </label>
                        <input
                          type="tel"
                          value={settings.companyPhone}
                          onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Address
                        </label>
                        <input
                          type="text"
                          value={settings.companyAddress}
                          onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                          placeholder="123 Main St, City, State"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Preferences
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Currency
                        </label>
                        <select
                          value={settings.defaultCurrency}
                          onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="JPY">JPY - Japanese Yen</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                          <option value="AUD">AUD - Australian Dollar</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="UTC">UTC - Coordinated Universal Time</option>
                          <option value="America/New_York">Eastern Time (US)</option>
                          <option value="America/Chicago">Central Time (US)</option>
                          <option value="America/Denver">Mountain Time (US)</option>
                          <option value="America/Los_Angeles">Pacific Time (US)</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auto-save Interval (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={settings.autoSaveInterval}
                          onChange={(e) => setSettings({ ...settings, autoSaveInterval: parseInt(e.target.value) })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Email Notifications</h4>
                          <p className="text-sm text-gray-600">Receive email updates about proposals and activities</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t">
                    <button
                      onClick={() => {
                        alert('Settings saved successfully!');
                      }}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
                      <p className="text-gray-600 mt-1">Manage your team and their access levels</p>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Invite Member
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Members Yet</h3>
                      <p className="text-gray-600 mb-6">Invite your team to collaborate on proposals</p>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Invite First Member
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="border rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                <p className="text-sm text-gray-600">{member.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    member.status === 'active'
                                      ? 'bg-green-100 text-green-700'
                                      : member.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {member.status}
                                  </span>
                                  {member.last_active && (
                                    <span className="text-xs text-gray-500">
                                      Last active: {new Date(member.last_active).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                              </select>

                              {member.status === 'pending' && (
                                <button
                                  onClick={() => handleResendInvite(member.id)}
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  Resend Invite
                                </button>
                              )}

                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex gap-3">
                  <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Role Permissions</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div><strong>Owner:</strong> Full access to all features and settings</div>
                      <div><strong>Admin:</strong> Can manage team members and proposals</div>
                      <div><strong>Editor:</strong> Can create and edit proposals</div>
                      <div><strong>Viewer:</strong> Can only view proposals</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <div className="text-gray-500">This section is coming soon!</div>
            </div>
          )}
        </main>
      </div>

      {/* AI Assistant Popup */}
      <div className={`fixed right-4 bottom-4 w-80 bg-white rounded-xl shadow-2xl border transition-all duration-300 z-50 ${
        showAIAssistant ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">AI Assistant</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <button onClick={() => setShowAIAssistant(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {aiSuggestions.length > 0 ? (
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setAiSuggestions([]);
                  setShowAIAssistant(false);
                  alert('AI suggestions applied!');
                }}
                className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Apply Suggestions
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">AI Assistant ready to help!</p>
            </div>
          )}
        </div>
      </div>

      {/* New Automation Rule Modal */}
      {showNewRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Create Automation</h3>
              <button onClick={() => setShowNewRuleModal(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Automation Name
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Send proposal to CRM"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Event
                </label>
                <select
                  value={newRule.triggerEvent}
                  onChange={(e) => setNewRule({ ...newRule, triggerEvent: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select trigger...</option>
                  <option value="proposal_created">Proposal Created</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="proposal_opened">Proposal Opened</option>
                  <option value="proposal_won">Proposal Won</option>
                  <option value="proposal_lost">Proposal Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={newRule.action}
                  onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select action...</option>
                  <option value="send_notification">Send Notification</option>
                  <option value="update_crm">Update CRM</option>
                  <option value="send_email">Send Email</option>
                  <option value="create_task">Create Task</option>
                  <option value="log_activity">Log Activity</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewRuleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAutomationRule}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Integration Modal */}
      {showNewIntegrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Integration</h3>
              <button onClick={() => setShowNewIntegrationModal(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Integration Name
                </label>
                <input
                  type="text"
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                  placeholder="e.g., Google Analytics, Zapier, Stripe"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={newIntegration.icon}
                  onChange={(e) => setNewIntegration({ ...newIntegration, icon: e.target.value })}
                  placeholder="🔗"
                  maxLength={2}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Enter an emoji to represent this integration</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Theme
                </label>
                <select
                  value={newIntegration.color}
                  onChange={(e) => setNewIntegration({ ...newIntegration, color: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bg-blue-100 text-blue-700">Blue</option>
                  <option value="bg-green-100 text-green-700">Green</option>
                  <option value="bg-orange-100 text-orange-700">Orange</option>
                  <option value="bg-red-100 text-red-700">Red</option>
                  <option value="bg-yellow-100 text-yellow-700">Yellow</option>
                  <option value="bg-pink-100 text-pink-700">Pink</option>
                  <option value="bg-cyan-100 text-cyan-700">Cyan</option>
                  <option value="bg-teal-100 text-teal-700">Teal</option>
                  <option value="bg-gray-100 text-gray-700">Gray</option>
                </select>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${newIntegration.color}`}>
                    {newIntegration.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{newIntegration.name || 'Integration Name'}</div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">pending</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewIntegrationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateIntegration}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Integration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="john@company.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Invitation Email</p>
                    <p>An invitation email will be sent to the member with instructions to join your team.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Generate New API Key</h3>
              <button onClick={() => setShowNewKeyModal(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                  placeholder="e.g., Production API, Development Key"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environment
                </label>
                <select
                  value={newApiKey.environment}
                  onChange={(e) => setNewApiKey({ ...newApiKey, environment: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="production">Production</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important</p>
                    <p>Make sure to copy your API key now. You won't be able to see it again!</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewKeyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newApiKey.name) {
                      alert('Please enter a key name');
                      return;
                    }
                    const key = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: newApiKey.name,
                      environment: newApiKey.environment,
                      key: 'pk_' + Math.random().toString(36).substr(2, 32) + Math.random().toString(36).substr(2, 32),
                      created_at: new Date().toISOString(),
                      last_used: null,
                    };
                    setApiKeys([...apiKeys, key]);
                    setNewApiKey({ name: '', environment: 'production' });
                    setShowNewKeyModal(false);
                    alert('API key generated successfully!');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && configIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${configIntegration.color}`}>
                  {configIntegration.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900">Configure {configIntegration.name}</h3>
              </div>
              <button onClick={() => setShowConfigModal(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="space-y-4">
              {getConfigFields(configIntegration.name).map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'text'}
                    value={configData[field.key] || ''}
                    onChange={(e) => setConfigData({ ...configData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Configuration Note</p>
                    <p>These credentials are securely stored in your database. You'll need to obtain them from the {configIntegration.name} developer portal or settings.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {configIntegration.status === 'connected' ? 'Update' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalSystem;
