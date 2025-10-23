// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };

// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, company } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      company
    });

    const token = generateToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        role: user.role,
        aiCredits: user.aiCredits
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user || !await user.validatePassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        role: user.role,
        aiCredits: user.aiCredits
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      company: req.user.company,
      role: req.user.role,
      aiCredits: req.user.aiCredits,
      lastLogin: req.user.lastLogin
    }
  });
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, company } = req.body;
    
    await req.user.update({
      firstName,
      lastName,
      company
    });

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        company: req.user.company,
        role: req.user.role,
        aiCredits: req.user.aiCredits
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;

// routes/proposals.js
const express = require('express');
const { Op } = require('sequelize');
const { Proposal, BudgetItem, File, User, Analytics } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all proposals for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { clientName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const proposals = await Proposal.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: BudgetItem,
          attributes: ['id', 'name', 'quantity', 'unitPrice', 'totalPrice']
        },
        {
          model: File,
          attributes: ['id', 'originalName', 'mimeType', 'size']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      proposals: proposals.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: proposals.count,
        pages: Math.ceil(proposals.count / limit)
      }
    });
  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Get single proposal
router.get('/:id', authenticate, async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: BudgetItem,
          order: [['order', 'ASC']]
        },
        {
          model: File
        }
      ]
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json(proposal);
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({ error: 'Failed to fetch proposal' });
  }
});

// Create new proposal
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      clientName,
      clientEmail,
      description,
      templateType,
      budgetItems = [],
      validUntil
    } = req.body;

    // Calculate total value
    const totalValue = budgetItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    // Create proposal
    const proposal = await Proposal.create({
      title,
      clientName,
      clientEmail,
      description,
      templateType,
      totalValue,
      validUntil,
      userId: req.user.id
    });

    // Create budget items
    if (budgetItems.length > 0) {
      const itemsWithProposalId = budgetItems.map((item, index) => ({
        ...item,
        proposalId: proposal.id,
        order: index,
        totalPrice: item.quantity * item.unitPrice
      }));

      await BudgetItem.bulkCreate(itemsWithProposalId);
    }

    // Fetch complete proposal with items
    const completeProposal = await Proposal.findByPk(proposal.id, {
      include: [BudgetItem, File]
    });

    res.status(201).json(completeProposal);
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

// Update proposal
router.put('/:id', authenticate, async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const {
      title,
      clientName,
      clientEmail,
      description,
      templateType,
      budgetItems = []
    } = req.body;

    // Calculate new total value
    const totalValue = budgetItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    // Update proposal
    await proposal.update({
      title,
      clientName,
      clientEmail,
      description,
      templateType,
      totalValue
    });

    // Update budget items - delete existing and create new ones
    await BudgetItem.destroy({ where: { proposalId: proposal.id } });
    
    if (budgetItems.length > 0) {
      const itemsWithProposalId = budgetItems.map((item, index) => ({
        ...item,
        proposalId: proposal.id,
        order: index,
        totalPrice: item.quantity * item.unitPrice
      }));

      await BudgetItem.bulkCreate(itemsWithProposalId);
    }

    // Fetch updated proposal
    const updatedProposal = await Proposal.findByPk(proposal.id, {
      include: [BudgetItem, File]
    });

    res.json(updatedProposal);
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

// Delete proposal
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    await proposal.destroy();
    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ error: 'Failed to delete proposal' });
  }
});

// Send proposal to client
router.post('/:id/send', authenticate, async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [BudgetItem]
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Update proposal status
    await proposal.update({
      status: 'sent',
      sentAt: new Date()
    });

    // Send email (implement email service)
    const emailService = require('../services/emailService');
    await emailService.sendProposal(proposal, req.user);

    res.json({ message: 'Proposal sent successfully' });
  } catch (error) {
    console.error('Send proposal error:', error);
    res.status(500).json({ error: 'Failed to send proposal' });
  }
});

// Public proposal view (for clients)
router.get('/public/:token', async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      where: { publicToken: req.params.token },
      include: [
        {
          model: BudgetItem,
          order: [['order', 'ASC']]
        },
        {
          model: User,
          attributes: ['firstName', 'lastName', 'company', 'email']
        }
      ]
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Track view
    if (proposal.status === 'sent') {
      await proposal.update({ status: 'viewed', viewedAt: new Date() });
    }

    // Log analytics
    await Analytics.create({
      proposalId: proposal.id,
      eventType: 'view',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(proposal);
  } catch (error) {
    console.error('Public view error:', error);
    res.status(500).json({ error: 'Failed to load proposal' });
  }
});

module.exports = router;

// services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendProposal(proposal, user) {
    const proposalUrl = `${process.env.FRONTEND_URL}/proposal/${proposal.publicToken}`;
    
    const mailOptions = {
      from: `${user.firstName} ${user.lastName} <${process.env.SMTP_USER}>`,
      to: proposal.clientEmail,
      subject: `Proposal: ${proposal.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px; background: white; }
            .proposal-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Proposal</h1>
            </div>
            <div class="content">
              <h2>Hello ${proposal.clientName},</h2>
              <p>I hope this email finds you well. I'm pleased to share a detailed proposal for your upcoming project.</p>
              
              <div class="proposal-info">
                <h3>${proposal.title}</h3>
                <p><strong>Total Investment:</strong> ${proposal.totalValue.toLocaleString()}</p>
                <p><strong>Valid Until:</strong> ${new Date(proposal.validUntil).toLocaleDateString()}</p>
              </div>
              
              <p>Please click the button below to view the complete proposal:</p>
              <a href="${proposalUrl}" class="button">View Proposal</a>
              
              <p>If you have any questions or would like to discuss any aspect of this proposal, please don't hesitate to reach out.</p>
              
              <p>Best regards,<br>
              ${user.firstName} ${user.lastName}<br>
              ${user.company || ''}</p>
            </div>
            <div class="footer">
              <p>This proposal was generated using ProposalAI Pro</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendNotification(to, subject, message) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${subject}</h2>
          <p>${message}</p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
            .