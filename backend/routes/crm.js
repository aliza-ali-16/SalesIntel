const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const auth = require('../middleware/auth');
const { Customer, FollowUp, Email, AgentLog } = require('../models/schemas');
const { ManagerAgent } = require('../services/embeddedAgents');
const axios = require('axios');

// In-memory file storage keeps the workspace clean
const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/crm/upload
// @desc    Upload CRM CSV file and trigger Multi-Agent workflow
// @access  Private (JWT Protected)
router.post('/upload', [auth, upload.single('file')], async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file' });
  }

  const results = [];
  const stream = Readable.from(req.file.buffer.toString('utf-8'));

  stream
    .pipe(csv())
    .on('data', (data) => {
      // Validate and clean column names (trim spaces and handle potential cases)
      const cleanedRow = {};
      for (const key in data) {
        const cleanKey = key.trim().toLowerCase();
        cleanedRow[cleanKey] = data[key] ? data[key].trim() : '';
      }
      results.push(cleanedRow);
    })
    .on('end', async () => {
      if (results.length === 0) {
        return res.status(400).json({ message: 'The uploaded CSV file is empty' });
      }

      // Check CSV structure: should have name and email
      const firstRow = results[0];
      if (!('name' in firstRow) || !('email' in firstRow)) {
        return res.status(400).json({ 
          message: 'Invalid CSV format. File must contain "name" and "email" columns. Optional: "visits", "email_opens", "purchases".' 
        });
      }

      // Preprocess records to extract initial company and domain names from emails
      results.forEach(row => {
        if (row.email) {
          const email = row.email.trim().toLowerCase();
          const parts = email.split('@');
          if (parts.length === 2) {
            const domain = parts[1];
            const domainName = domain.split('.')[0];
            const company = domainName.charAt(0).toUpperCase() + domainName.slice(1);
            row.company = company;
            row.domain = domain;
          } else {
            row.company = 'Corporate Client';
            row.domain = 'unknown.com';
          }
        } else {
          row.company = 'Corporate Client';
          row.domain = 'unknown.com';
        }
        // Rename keys if needed for compatibility
        if (row.email_opens) {
          row.opens = parseInt(row.email_opens) || 0;
        }
      });

      try {
        const useEmbedded = process.env.USE_EMBEDDED_AGENTS === 'true' || process.env.USE_EMBEDDED_AGENTS === 'only_json';
        
        if (useEmbedded) {
          // Process using Node.js embedded agents
          console.log('Ingesting CRM list locally via Node embedded agent flow...');
          const manager = new ManagerAgent();
          const executionResult = await manager.processCRMData(results, req.user.id);
          return res.json({
            message: 'CRM File parsed and processed locally by Embedded Agent Engine.',
            details: executionResult
          });
        } else {
          // Delegate to Python FastAPI microservice
          console.log(`Delegating CRM ingestion to FastAPI service at ${process.env.AI_SERVICE_URL}...`);
          const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/agents/analyze`, {
            data: results
          });
          
          const result = aiResponse.data;
          
          if (result.success && result.scoredLeads) {
            // Save/Update Customer profiles in MongoDB / JSON database
            const savedCustomers = [];
            for (const sl of result.scoredLeads) {
              const doc = await Customer.findOneAndUpdate(
                { email: sl.email, userId: req.user.id },
                {
                  $set: {
                    name: sl.name,
                    email: sl.email,
                    visits: sl.visits,
                    opens: sl.opens,
                    purchases: sl.purchases,
                    score: sl.score,
                    category: sl.category,
                    company: sl.company,
                    industry: sl.industry,
                    insights: sl.insights,
                    lastInteraction: new Date().toISOString(),
                    userId: req.user.id
                  }
                },
                { new: true, upsert: true }
              );
              savedCustomers.push(doc);
            }

            // Save FollowUps
            for (const sl of result.scoredLeads) {
              const customer = savedCustomers.find(c => c.email === sl.email);
              if (customer) {
                const daysToAdd = sl.category === 'HOT' ? 0 : (sl.category === 'WARM' ? 3 : 30);
                const followUpDate = new Date();
                followUpDate.setDate(followUpDate.getDate() + daysToAdd);
                
                await FollowUp.findOneAndUpdate(
                  { customerId: customer._id, userId: req.user.id },
                  { $set: { date: followUpDate.toISOString().split('T')[0], status: 'pending', userId: req.user.id } },
                  { new: true, upsert: true }
                );
              }
            }

            // Save generated pending emails
            for (const sl of result.scoredLeads) {
              const customer = savedCustomers.find(c => c.email === sl.email);
              if (customer && sl.email) {
                await Email.findOneAndUpdate(
                  { customerId: customer._id, userId: req.user.id },
                  {
                    $set: {
                      subject: sl.email.subject,
                      body: sl.email.body,
                      cta: sl.email.cta,
                      followUpPlan: sl.email.followUpPlan,
                      status: 'pending',
                      approvedBy: null,
                      approvedAt: null,
                      userId: req.user.id
                    }
                  },
                  { new: true, upsert: true }
                );
              }
            }

            // Write logs to database
            if (result.logs) {
              for (const log of result.logs) {
                await AgentLog.create({
                  agentName: log.agentName,
                  action: log.action || `Executed step for ${log.agentName}`,
                  input: log.input,
                  output: log.output,
                  status: log.status,
                  executionTime: log.executionTime,
                  error: log.error,
                  userId: req.user.id
                });
              }
            }
          }

          return res.json({
            message: 'CRM File parsed and processed by Python FastAPI Microservice.',
            details: result
          });
        }
      } catch (err) {
        console.error('❌ CRM Upload Agent Processing Error:', err.message);
        res.status(500).json({ 
          message: 'Error processing CRM data through Agent workflow.',
          error: err.message 
        });
      }
    })
    .on('error', (err) => {
      res.status(500).json({ message: 'Error reading CSV file', error: err.message });
    });
});

// @route   GET /api/crm/customers
// @desc    Retrieve all customers
// @access  Private (JWT Protected)
router.get('/customers', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id });
    res.json(customers);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
