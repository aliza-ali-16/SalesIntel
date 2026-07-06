const mongoose = require('mongoose');
const { createModel } = require('../config/db');

// User Model Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }
}, { timestamps: true });

// Customer Model Schema
const CustomerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  visits: { type: Number, default: 0 },
  opens: { type: Number, default: 0 },
  purchases: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  category: { type: String, default: 'COLD' },
  
  // Upgraded production SaaS fields
  company: { type: String, default: '' },
  industry: { type: String, default: '' },
  lastInteraction: { type: String, default: () => new Date().toISOString() },
  lifetimeValue: { type: Number, default: 0 },
  leadHistory: { type: Array, default: [] },
  insights: {
    insights: { type: String, default: '' },
    engagementScore: { type: Number, default: 0 },
    riskLevel: { type: String, default: '' },
    opportunities: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    strategy: { type: String, default: '' },
    nextAction: { type: String, default: '' },
    recommendedChannel: { type: String, default: '' },
    priority: { type: String, default: '' },
    expectedRevenue: { type: String, default: '' },
    conversionProbability: { type: String, default: '' }
  }
}, { timestamps: true });

// FollowUp Model Schema
const FollowUpSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  customerId: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, default: 'pending' } // pending, completed
}, { timestamps: true });

// Email Model Schema
const EmailSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  customerId: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  
  // Upgraded human approval fields
  cta: { type: String, default: '' },
  followUpPlan: { type: String, default: '' },
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  approvedBy: { type: String, default: null },
  approvedAt: { type: String, default: null }
}, { timestamps: true });

// AgentLog Model Schema
const AgentLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  agentName: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toISOString() },
  
  // SaaS logging fields
  input: { type: mongoose.Schema.Types.Mixed, default: null },
  output: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, default: 'success' }, // success, failed
  executionTime: { type: Number, default: 0 }, // in milliseconds
  error: { type: String, default: '' }
}, { timestamps: true });

// Vector Memory Schema for AI context retrieval
const VectorMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true }, // key for lookups e.g., customer email
  text: { type: String, required: true }, // context text content
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  embedding: { type: [Number], required: true } // vector values array
}, { timestamps: true });

module.exports = {
  User: createModel('User', UserSchema),
  Customer: createModel('Customer', CustomerSchema),
  FollowUp: createModel('FollowUp', FollowUpSchema),
  Email: createModel('Email', EmailSchema),
  AgentLog: createModel('AgentLog', AgentLogSchema),
  VectorMemory: createModel('VectorMemory', VectorMemorySchema)
};

