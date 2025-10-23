// models/Template.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Template = sequelize.define('Template', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    templateType: {
      type: DataTypes.ENUM('professional', 'creative', 'minimal', 'corporate'),
      allowNull: false
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  });

  return Template;
};

// models/Integration.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Integration = sequelize.define('Integration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    platform: {
      type: DataTypes.ENUM('salesforce', 'hubspot', 'zapier', 'make', 'slack', 'google_drive', 'dropbox'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('connected', 'disconnected', 'error', 'pending'),
      defaultValue: 'pending'
    },
    accessToken: {
      type: DataTypes.TEXT
    },
    refreshToken: {
      type: DataTypes.TEXT
    },
    expiresAt: {
      type: DataTypes.DATE
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    webhookUrl: {
      type: DataTypes.STRING
    },
    lastSync: {
      type: DataTypes.DATE
    },
    automationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });

  return Integration;
};

// models/AITraining.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AITraining = sequelize.define('AITraining', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    documentType: {
      type: DataTypes.ENUM('proposal', 'contract', 'email', 'presentation'),
      allowNull: false
    },
    extractedPatterns: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 0.5
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    trainingSource: {
      type: DataTypes.ENUM('file_upload', 'manual_entry', 'api_import'),
      defaultValue: 'file_upload'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  });

  return AITraining;
};

// routes/integrations.js
const express = require('express');
const { Integration, User } = require('../models