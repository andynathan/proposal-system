// routes/files.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { File, Proposal } = require('../models');
const { authenticate } = require('../middleware/auth');
const documentProcessor = require('../services/documentProcessor');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Upload files
router.post('/upload', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    const { proposalId, type = 'proposal_attachment' } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify proposal ownership if proposalId is provided
    if (proposalId) {
      const proposal = await Proposal.findOne({
        where: { id: proposalId, userId: req.user.id }
      });
      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileRecord = await File.create({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${file.filename}`,
        type,
        proposalId: proposalId || null,
        userId: req.user.id
      });

      // Process document for text extraction
      if (type === 'training_document' || type === 'proposal_attachment') {
        try {
          const extractedText = await documentProcessor.extractText(file.path, file.mimetype);
          await fileRecord.update({ 
            extractedText,
            isProcessed: true 
          });
        } catch (error) {
          console.error('Text extraction failed:', error);
        }
      }

      uploadedFiles.push(fileRecord);
    }

    res.status(201).json({ files: uploadedFiles });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get user files
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, proposalId } = req.query;
    const whereClause = { userId: req.user.id };

    if (type) whereClause.type = type;
    if (proposalId) whereClause.proposalId = proposalId;

    const files = await File.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Delete file
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const file = await File.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete physical file
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('Failed to delete physical file:', error);
    }

    // Delete database record
    await file.destroy();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;

// services/documentProcessor.js
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const fs = require('fs').promises;

class DocumentProcessor {
  async extractText(filePath, mimeType) {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(filePath);
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromWord(filePath);
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          return await this.extractFromExcel(filePath);
        case 'text/plain':
          return await this.extractFromText(filePath);
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      throw error;
    }
  }

  async extractFromPDF(filePath) {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  async extractFromWord(filePath) {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  async extractFromExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const sheetText = XLSX.utils.sheet_to_csv(sheet);
      text += `Sheet: ${sheetName}\n${sheetText}\n\n`;
    });
    
    return text;
  }

  async extractFromText(filePath) {
    return await fs.readFile(filePath, 'utf8');
  }

  // Analyze document for proposal patterns
  analyzeProposalPatterns(text) {
    const patterns = {
      pricing: this.extractPricingInfo(text),
      timeline: this.extractTimelineInfo(text),
      services: this.extractServiceInfo(text),
      clientInfo: this.extractClientInfo(text)
    };
    
    return patterns;
  }

  extractPricingInfo(text) {
    const priceRegex = /\$[\d,]+(?:\.\d{2})?/g;
    const prices = text.match(priceRegex) || [];
    return prices.map(price => parseFloat(price.replace(/[$,]/g, '')));
  }

  extractTimelineInfo(text) {
    const timelineRegex = /(\d+)\s*(days?|weeks?|months?)/gi;
    return text.match(timelineRegex) || [];
  }

  extractServiceInfo(text) {
    const serviceKeywords = [
      'consulting', 'development', 'design', 'marketing', 'analysis',
      'implementation', 'training', 'support', 'maintenance'
    ];
    
    const foundServices = [];
    serviceKeywords.forEach(service => {
      if (text.toLowerCase().includes(service)) {
        foundServices.push(service);
      }
    });
    
    return foundServices;
  }

  extractClientInfo(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    
    return {
      emails: text.match(emailRegex) || [],
      phones: text.match(phoneRegex) || []
    };
  }
}

module.exports = new DocumentProcessor();

// routes/ai.js
const express = require('express');
const { OpenAI } = require('openai');
const { File, User, Proposal, BudgetItem, AITraining } = require('../models');
const { authenticate } = require('../middleware/auth');
const documentProcessor = require('../services/documentProcessor');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI-powered proposal generation
router.post('/generate-proposal', authenticate, async (req, res) => {
  try {
    const { description, clientName, industry, budget } = req.body;

    // Check AI credits
    if (req.user.aiCredits < 1) {
      return res.status(402).json({ error: 'Insufficient AI credits' });
    }

    // Get user's training data
    const trainingFiles = await File.findAll({
      where: { userId: req.user.id, type: 'training_document', isProcessed: true },
      limit: 5
    });

    let context = '';
    trainingFiles.forEach(file => {
      if (file.extractedText) {
        context += file.extractedText.substring(0, 1000) + '\n';
      }
    });

    const prompt = `
      Based on the following context from successful proposals and the project details, generate a professional proposal structure:

      Context from previous proposals:
      ${context}

      New Project Details:
      - Client: ${clientName}
      - Industry: ${industry || 'General'}
      - Budget Range: ${budget || 'Not specified'}
      - Description: ${description}

      Please generate:
      1. Executive Summary (2-3 paragraphs)
      2. Recommended budget items with quantities and pricing
      3. Project timeline
      4. Key deliverables

      Format as JSON with sections: executiveSummary, budgetItems, timeline, deliverables
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    // Deduct AI credit
    await req.user.update({ aiCredits: req.user.aiCredits - 1 });

    const response = completion.choices[0].message.content;
    
    try {
      const generated = JSON.parse(response);
      res.json(generated);
    } catch (parseError) {
      // If JSON parsing fails, return raw text
      res.json({ 
        executiveSummary: response,
        budgetItems: [],
        timeline: '',
        deliverables: []
      });
    }

  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

// Process training documents
router.post('/train', authenticate, async (req, res) => {
  try {
    const { fileIds } = req.body;

    if (!fileIds || fileIds.length === 0) {
      return res.status(400).json({ error: 'No files provided for training' });
    }

    const files = await File.findAll({
      where: { 
        id: fileIds, 
        userId: req.user.id,
        isProcessed: true
      }
    });

    let totalPatterns = 0;
    const analysisResults = [];

    for (const file of files) {
      if (file.extractedText) {
        const patterns = documentProcessor.analyzeProposalPatterns(file.extractedText);
        
        // Store training data
        await AITraining.create({
          userId: req.user.id,
          fileId: file.id,
          extractedPatterns: patterns,
          documentType: 'proposal',
          isActive: true
        });

        analysisResults.push({
          fileId: file.id,
          filename: file.originalName,
          patterns
        });

        totalPatterns += Object.keys(patterns).length;
      }
    }

    res.json({
      message: 'Training completed successfully',
      processedFiles: files.length,
      patternsExtracted: totalPatterns,
      analysisResults
    });

  } catch (error) {
    console.error('AI training error:', error);
    res.status(500).json({ error: 'AI training failed' });
  }
});

// Get AI suggestions for proposal improvement
router.post('/suggestions', authenticate, async (req, res) => {
  try {
    const { proposalId } = req.body;

    const proposal = await Proposal.findOne({
      where: { id: proposalId, userId: req.user.id },
      include: [BudgetItem]
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Analyze proposal content
    const proposalText = `
      Title: ${proposal.title}
      Description: ${proposal.description}
      Client: ${proposal.clientName}
      Total Value: $${proposal.totalValue}
      Budget Items: ${proposal.BudgetItems.map(item => `${item.name}: $${item.totalPrice}`).join(', ')}
    `;

    const prompt = `
      Analyze this proposal and provide 3-5 specific improvement suggestions:
      
      ${proposalText}
      
      Focus on:
      - Pricing optimization
      - Missing services or deliverables
      - Timeline considerations
      - Risk mitigation
      - Client value proposition
      
      Return as JSON array of suggestions with 'type' and 'suggestion' fields.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 800
    });

    const response = completion.choices[0].message.content;
    
    try {
      const suggestions = JSON.parse(response);
      res.json({ suggestions });
    } catch (parseError) {
      res.json({ 
        suggestions: [
          { type: 'general', suggestion: response }
        ]
      });
    }

  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Voice to text conversion
router.post('/voice-to-text', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Convert audio to text using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
    });

    // Clean up uploaded audio file
    await fs.unlink(req.file.path);

    res.json({ text: transcription.text });

  } catch (error) {
    console.error('Voice transcription error:', error);
    res.status(500).json({ error: 'Voice transcription failed' });
  }
});

module.exports = router;

// routes/analytics.js
const express = require('express');
const { Op } = require('sequelize');
const { Analytics, Proposal, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Track proposal events
router.post('/track', async (req, res) => {
  try {
    const { proposalId, eventType, eventData, proposalToken } = req.body;

    let proposalIdToUse = proposalId;

    // If token provided, find proposal by token
    if (proposalToken && !proposalId) {
      const proposal = await Proposal.findOne({
        where: { publicToken: proposalToken }
      });
      if (proposal) {
        proposalIdToUse = proposal.id;
      }
    }

    if (!proposalIdToUse) {
      return res.status(400).json({ error: 'Proposal not found' });
    }

    await Analytics.create({
      proposalId: proposalIdToUse,
      eventType,
      eventData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Event tracked successfully' });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Get proposal analytics
router.get('/proposal/:id', authenticate, async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const analytics = await Analytics.findAll({
      where: { proposalId: proposal.id },
      order: [['timestamp', 'DESC']]
    });

    // Calculate metrics
    const metrics = {
      totalViews: analytics.filter(a => a.eventType === 'view').length,
      uniqueViews: [...new Set(analytics.filter(a => a.eventType === 'view').map(a => a.ipAddress))].length,
      downloads: analytics.filter(a => a.eventType === 'download').length,
      emailOpens: analytics.filter(a => a.eventType === 'email_open').length,
      linkClicks: analytics.filter(a => a.eventType === 'link_click').length,
      averageTimeSpent: this.calculateAverageTimeSpent(analytics),
      engagementScore: this.calculateEngagementScore(analytics)
    };

    res.json({
      proposal: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        sentAt: proposal.sentAt,
        viewedAt: proposal.viewedAt
      },
      metrics,
      events: analytics.slice(0, 50) // Latest 50 events
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get dashboard analytics
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get user's proposals
    const proposals = await Proposal.findAll({
      where: { 
        userId: req.user.id,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const proposalIds = proposals.map(p => p.id);

    // Get analytics for user's proposals
    const analytics = await Analytics.findAll({
      where: {
        proposalId: { [Op.in]: proposalIds },
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // Calculate dashboard metrics
    const metrics = {
      totalProposals: proposals.length,
      sentProposals: proposals.filter(p => ['sent', 'viewed', 'accepted', 'rejected'].includes(p.status)).length,
      acceptedProposals: proposals.filter(p => p.status === 'accepted').length,
      totalValue: proposals.reduce((sum, p) => sum + parseFloat(p.totalValue), 0),
      acceptedValue: proposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + parseFloat(p.totalValue), 0),
      winRate: proposals.length > 0 ? (proposals.filter(p => p.status === 'accepted').length / proposals.filter(p => ['sent', 'viewed', 'accepted', 'rejected'].includes(p.status)).length * 100) : 0,
      totalViews: analytics.filter(a => a.eventType === 'view').length,
      averageEngagement: this.calculateAverageEngagement(analytics, proposalIds)
    };

    res.json({ metrics, period });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Helper methods
router.calculateAverageTimeSpent = (analytics) => {
  const timeEvents = analytics.filter(a => a.eventType === 'time_spent');
  if (timeEvents.length === 0) return 0;
  
  const totalTime = timeEvents.reduce((sum, event) => {
    return sum + (event.eventData?.duration || 0);
  }, 0);
  
  return Math.round(totalTime / timeEvents.length);
};

router.calculateEngagementScore = (analytics) => {
  let score = 0;
  
  // Base score for views
  score += analytics.filter(a => a.eventType === 'view').length * 10;
  
  // Bonus for section views
  score += analytics.filter(a => a.eventType === 'section_view').length * 5;
  
  // Bonus for downloads
  score += analytics.filter(a => a.eventType === 'download').length * 15;
  
  // Bonus for time spent (per minute)
  const timeEvents = analytics.filter(a => a.eventType === 'time_spent');
  const totalMinutes = timeEvents.reduce((sum, event) => sum + ((event.eventData?.duration || 0) / 60), 0);
  score += totalMinutes * 2;
  
  return Math.min(100, Math.round(score));
};

router.calculateAverageEngagement = (analytics, proposalIds) => {
  if (proposalIds.length === 0) return 0;
  
  const totalEngagement = proposalIds.reduce((sum, proposalId) => {
    const proposalAnalytics = analytics.filter(a => a.proposalId === proposalId);
    return sum + this.calculateEngagementScore(proposalAnalytics);
  }, 0);
  
  return Math.round(totalEngagement / proposalIds.length);
};

module.exports = router;