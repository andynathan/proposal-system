import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Mic, 
  MicOff, 
  Upload, 
  Zap, 
  Brain, 
  BarChart3, 
  Plus, 
  Search, 
  Eye,
  DollarSign,
  Bell,
  X,
  Edit3,
  Sparkles,
  Bot,
  Building,
  Calendar,
  Copy,
  Share2,
  ArrowRight,
  Headphones,
  Settings,
  Users,
  FileImage
} from 'lucide-react';

const ProposalSystem = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentProposal, setCurrentProposal] = useState(null);
  const [newProposal, setNewProposal] = useState({
    title: '',
    client: '',
    clientEmail: '',
    budget: '',
    description: '',
    template: 'professional',
    budgetItems: [
      { id: 1, item: '', description: '', amount: '', quantity: 1 }
    ],
    uploadedFiles: []
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [proposals, setProposals] = useState([
    {
      id: 1,
      title: "Digital Marketing Strategy - TechCorp",
      client: "TechCorp Solutions",
      clientEmail: "contact@techcorp.com",
      status: "sent",
      value: 45000,
      created: "2025-08-20",
      opens: 12,
      engagement: 85,
      tags: ['digital-marketing', 'enterprise'],
      description: "Comprehensive digital marketing strategy including SEO, PPC, and social media management to increase online presence and drive qualified leads.",
      template: 'professional',
      budgetItems: [
        { id: 1, item: 'SEO Optimization', description: 'Complete website audit and optimization', amount: '15000', quantity: 1 },
        { id: 2, item: 'PPC Campaign Management', description: '6-month Google Ads and social media advertising', amount: '20000', quantity: 1 },
        { id: 3, item: 'Content Marketing', description: 'Blog posts, social content, and email campaigns', amount: '10000', quantity: 1 }
      ],
      files: []
    },
    {
      id: 2,
      title: "Website Redesign - StartupXYZ",
      client: "StartupXYZ",
      clientEmail: "hello@startupxyz.com",
      status: "draft",
      value: 28500,
      created: "2025-08-22",
      opens: 0,
      engagement: 0,
      tags: ['web-design', 'startup'],
      description: "Modern, responsive website redesign with improved user experience and conversion optimization.",
      template: 'creative',
      budgetItems: [
        { id: 1, item: 'UI/UX Design', description: 'Complete design system and wireframes', amount: '12000', quantity: 1 },
        { id: 2, item: 'Frontend Development', description: 'React-based responsive website', amount: '16500', quantity: 1 }
      ],
      files: []
    },
    {
      id: 3,
      title: "Consulting Services - Enterprise Co",
      client: "Enterprise Co",
      clientEmail: "projects@enterprise.com",
      status: "won",
      value: 120000,
      created: "2025-08-15",
      opens: 24,
      engagement: 98,
      tags: ['consulting', 'enterprise'],
      description: "Strategic business consulting to optimize operations, improve efficiency, and implement digital transformation initiatives.",
      template: 'corporate',
      budgetItems: [
        { id: 1, item: 'Business Analysis', description: 'Comprehensive business process analysis', amount: '40000', quantity: 1 },
        { id: 2, item: 'Digital Transformation', description: 'Technology implementation and training', amount: '60000', quantity: 1 },
        { id: 3, item: 'Ongoing Support', description: '6 months of consultation and support', amount: '20000', quantity: 1 }
      ],
      files: []
    }
  ]);

  const integrations = [
    { name: "Salesforce CRM", status: "connected", icon: "🔗", color: "bg-blue-100 text-blue-700", automations: 3 },
    { name: "HubSpot", status: "connected", icon: "🎯", color: "bg-orange-100 text-orange-700", automations: 2 },
    { name: "Zapier", status: "connected", icon: "⚡", color: "bg-yellow-100 text-yellow-700", automations: 8 },
    { name: "Make.com", status: "connected", icon: "🔄", color: "bg-purple-100 text-purple-700", automations: 5 },
    { name: "Slack", status: "pending", icon: "💬", color: "bg-gray-100 text-gray-700", automations: 0 },
    { name: "Google Drive", status: "connected", icon: "📁", color: "bg-green-100 text-green-700", automations: 4 }
  ];

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

  const handleFileUploadTraining = (event) => {
    const files = event.target.files;
    if (files.length === 0) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAiSuggestions([
        `Successfully processed ${files.length} document(s)`,
        "New content patterns detected",
        "AI learning enhanced",
        "Updated proposal templates available"
      ]);
      setShowAIAssistant(true);
    }, 3000);
  };

  const addBudgetItem = () => {
    const newId = Math.max(...newProposal.budgetItems.map(item => item.id)) + 1;
    setNewProposal({
      ...newProposal,
      budgetItems: [...newProposal.budgetItems, { id: newId, item: '', description: '', amount: '', quantity: 1 }]
    });
  };

  const removeBudgetItem = (id) => {
    if (newProposal.budgetItems.length > 1) {
      setNewProposal({
        ...newProposal,
        budgetItems: newProposal.budgetItems.filter(item => item.id !== id)
      });
    }
  };

  const updateBudgetItem = (id, field, value) => {
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
      const quantity = parseInt(item.quantity) || 1;
      return total + (amount * quantity);
    }, 0);
  };

  const handleFileUpload = (files) => {
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

  const removeFile = (fileId) => {
    setNewProposal({
      ...newProposal,
      uploadedFiles: newProposal.uploadedFiles.filter(file => file.id !== fileId)
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleCreateProposal = () => {
    if (!newProposal.title || !newProposal.client) {
      alert('Please fill in the proposal title and client name');
      return;
    }

    const totalBudget = calculateTotalBudget();
    const proposal = {
      id: Date.now(),
      title: newProposal.title,
      client: newProposal.client,
      clientEmail: newProposal.clientEmail,
      status: "draft",
      value: totalBudget,
      created: new Date().toISOString().split('T')[0],
      opens: 0,
      engagement: 0,
      tags: ['new-proposal'],
      budgetItems: newProposal.budgetItems,
      files: newProposal.uploadedFiles,
      description: newProposal.description,
      template: newProposal.template
    };

    setProposals([...proposals, proposal]);
    setCurrentProposal(proposal);
    
    // Reset the form
    setNewProposal({
      title: '',
      client: '',
      clientEmail: '',
      budget: '',
      description: '',
      template: 'professional',
      budgetItems: [
        { id: 1, item: '', description: '', amount: '', quantity: 1 }
      ],
      uploadedFiles: []
    });
    
    setAiSuggestions([
      `Created proposal: "${proposal.title}" with ${proposal.budgetItems.length} budget items`,
      "AI analyzed uploaded documents for relevant content",
      "Generated pricing recommendations based on similar proposals",
      "Ready to add executive summary and project timeline"
    ]);
    setShowAIAssistant(true);
    
    setActiveTab('proposal-view');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
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
                JD
              </div>
              <span className="text-sm font-medium">John Doe</span>
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
          
          <div className="p-4 m-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">AI Assistant</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-xs text-purple-600">47 proposals analyzed</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8 rounded-xl">
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
                    <div className="text-2xl font-bold">$193K</div>
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
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Brain className="w-6 h-6 text-purple-600" />
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
                
                <div className="divide-y">
                  {proposals.map((proposal) => (
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
                              {proposal.created}
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
                              setCurrentProposal(proposal);
                              setActiveTab('proposal-view');
                            }}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => alert(`Editing ${proposal.title}`)}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => alert(`Copying ${proposal.title}`)}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => alert(`Sharing ${proposal.title}`)}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                          onClick={() => alert('Editing proposal')}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                        
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
                              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
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
                                  {currentProposal.clientEmail && (
                                    <p className="text-gray-600">{currentProposal.clientEmail}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">Prepared By:</h3>
                                <div className="text-gray-700">
                                  <p className="font-medium text-lg">ProposalAI Pro</p>
                                  <p className="text-gray-600">Generated on {currentProposal.created}</p>
                                  <p className="text-gray-600">Proposal ID: #{currentProposal.id}</p>
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
                                  <div className="text-2xl font-bold text-blue-600">{currentProposal.budgetItems.length}</div>
                                  <div className="text-blue-700 font-medium">Service Components</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                  <div className="text-2xl font-bold text-purple-600">30 Days</div>
                                  <div className="text-purple-700 font-medium">Estimated Timeline</div>
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
                              {currentProposal.budgetItems.map((item, index) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {index + 1}. {item.item || `Service Item ${index + 1}`}
                                      </h3>
                                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                        <span>Quantity: {item.quantity}</span>
                                        <span>•</span>
                                        <span>Unit Price: ${parseFloat(item.amount || 0).toLocaleString()}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-blue-600">
                                        ${((parseFloat(item.amount) || 0) * (parseInt(item.quantity) || 1)).toLocaleString()}
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
                                {currentProposal.budgetItems.map((item, index) => (
                                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                    <div className="flex-1">
                                      <span className="font-medium">{item.item || `Service Item ${index + 1}`}</span>
                                      <span className="text-gray-600 ml-2">x {item.quantity}</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold">
                                        ${((parseFloat(item.amount) || 0) * (parseInt(item.quantity) || 1)).toLocaleString()}
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
                              <span className="font-medium">{currentProposal.created}</span>
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
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Create Proposal
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Description
                      </label>
                      <textarea
                        value={newProposal.description}
                        onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                        placeholder="Describe the project scope and objectives..."
                        rows="4"
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
                              rows="2"
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

          {(activeTab === 'ai-training' || activeTab === 'integrations' || activeTab === 'analytics' || activeTab === 'team' || activeTab === 'settings') && (
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
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
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
    </div>
  );
};

export default ProposalSystem;