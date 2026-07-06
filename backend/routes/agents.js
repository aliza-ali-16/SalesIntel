const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Customer, FollowUp, Email, AgentLog } = require('../models/schemas');
const { ManagerAgent, EmailAgent } = require('../services/embeddedAgents');
const axios = require('axios');
const nodemailer = require('nodemailer');

// Setup SMTP transporter conditionally
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });
}

// Helper function to join customer data with related collections manually
// This ensures it works seamlessly on both Mongoose and local JSON databases
// Helper function to join customer data with related collections manually
// This ensures it works seamlessly on both Mongoose and local JSON databases
async function joinWithCustomer(items, userId, customerKey = 'customerId') {
  const customers = await Customer.find({ userId });
  return items.map(item => {
    const itemObj = typeof item.toObject === 'function' ? item.toObject() : item;
    const targetId = itemObj[customerKey];
    if (!targetId) return { ...itemObj, customer: null };
    const customer = customers.find(c => c._id.toString() === targetId.toString());
    return {
      ...itemObj,
      customer: customer ? { name: customer.name, email: customer.email, category: customer.category } : null
    };
  });
}

// @route   POST /api/agents/analyze
// @desc    Manually trigger Multi-Agent workflow on existing customer database
// @access  Private
router.post('/analyze', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id });
    if (customers.length === 0) {
      return res.status(400).json({ message: 'No customer data available. Please upload a CRM file first.' });
    }

    const useEmbedded = process.env.USE_EMBEDDED_AGENTS === 'true' || process.env.USE_EMBEDDED_AGENTS === 'only_json';
    
    if (useEmbedded) {
      console.log("Delegating database analysis to embedded Node agent engine...");
      const manager = new ManagerAgent();
      const result = await manager.processCRMData(customers, req.user.id);
      res.json({
        message: 'Multi-Agent flow executed successfully by Embedded Node engine.',
        details: result
      });
    } else {
      console.log(`Delegating database analysis to FastAPI service at ${process.env.AI_SERVICE_URL}...`);
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/agents/analyze`, {
        data: customers
      });
      const result = aiResponse.data;

      if (result.success && result.scoredLeads) {
        // Persist Python results into MongoDB / JSON fallback collections
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

        // Save Emails
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

        // Write Python agent logs to DB
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

      res.json({
        message: 'Multi-Agent flow executed successfully by Python FastAPI.',
        details: result
      });
    }
  } catch (err) {
    console.error('❌ Multi-Agent execution failed:', err.message);
    res.status(500).json({ message: 'Multi-Agent processing failed', error: err.message });
  }
});// @route   GET /api/agents/leads
// @desc    Get all scored leads (customers sorted by score descending)
// @access  Private
router.get('/leads', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id });
    customers.sort((a, b) => b.score - a.score);
    res.json(customers);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/agents/dashboard-stats
// @desc    Retrieve compiled SaaS dashboard statistics and chart details
// @access  Private
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id });
    const logs = await AgentLog.find({ userId: req.user.id });
    
    const total = customers.length;
    const hot = customers.filter(c => c.category === 'HOT').length;
    const warm = customers.filter(c => c.category === 'WARM').length;
    const cold = customers.filter(c => c.category === 'COLD').length;
    
    const purchasers = customers.filter(c => c.purchases > 0).length;
    const conversionRate = total > 0 ? Math.round((purchasers / total) * 100) : 0;
    
    // Aggregated Expected Revenue calculation
    let expectedRevenue = 0;
    customers.forEach(c => {
      const insightsObj = c.insights || {};
      const revStr = insightsObj.expectedRevenue || "$0";
      const value = parseInt(revStr.replace(/[^0-9]/g, '')) || 0;
      expectedRevenue += value;
    });

    // Compute Agent Performance
    const performanceMap = {};
    logs.forEach(l => {
      const name = l.agentName;
      if (!name) return;
      if (!performanceMap[name]) {
        performanceMap[name] = { name, count: 0, totalTime: 0, failures: 0 };
      }
      performanceMap[name].count++;
      performanceMap[name].totalTime += parseInt(l.executionTime) || 0;
      if (l.status === 'failed') {
        performanceMap[name].failures++;
      }
    });

    const agentPerformance = Object.values(performanceMap).map(p => ({
      name: p.name,
      averageTime: p.count > 0 ? Math.round(p.totalTime / p.count) : 0,
      executions: p.count,
      failures: p.failures
    }));

    // Average Engagement statistics for BarChart
    const getAvgMetrics = (list) => {
      if (list.length === 0) return { visits: 0, opens: 0, purchases: 0 };
      const sumVisits = list.reduce((a, b) => a + (b.visits || 0), 0);
      const sumOpens = list.reduce((a, b) => a + (b.opens || 0), 0);
      const sumPurchases = list.reduce((a, b) => a + (b.purchases || 0), 0);
      return {
        visits: Math.round(sumVisits / list.length),
        opens: Math.round(sumOpens / list.length),
        purchases: Math.round(sumPurchases / list.length)
      };
    };

    const hotEng = getAvgMetrics(customers.filter(c => c.category === 'HOT'));
    const warmEng = getAvgMetrics(customers.filter(c => c.category === 'WARM'));
    const coldEng = getAvgMetrics(customers.filter(c => c.category === 'COLD'));

    res.json({
      stats: {
        totalLeads: total,
        hotLeads: hot,
        warmLeads: warm,
        coldLeads: cold,
        conversionRate,
        expectedRevenue: `$${expectedRevenue.toLocaleString()}`
      },
      distribution: [
        { name: 'Hot Leads', value: hot, color: '#ef4444' },
        { name: 'Warm Leads', value: warm, color: '#f59e0b' },
        { name: 'Cold Leads', value: cold, color: '#3b82f6' }
      ],
      engagement: [
        { name: 'COLD', Opens: coldEng.opens, Visits: coldEng.visits, Purchases: coldEng.purchases },
        { name: 'WARM', Opens: warmEng.opens, Visits: warmEng.visits, Purchases: warmEng.purchases },
        { name: 'HOT', Opens: hotEng.opens, Visits: hotEng.visits, Purchases: hotEng.purchases }
      ],
      agentPerformance
    });
  } catch (err) {
    console.error('❌ Failed to retrieve dashboard metrics:', err.message);
    res.status(500).json({ message: "Server metrics error", error: err.message });
  }
});

// @route   GET /api/agents/followups
// @desc    Get all scheduled follow-ups (joined with customer details)
// @access  Private
router.get('/followups', auth, async (req, res) => {
  try {
    const followups = await FollowUp.find({ userId: req.user.id });
    const joined = await joinWithCustomer(followups, req.user.id, 'customerId');
    res.json(joined);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/agents/followups/:id/complete
// @desc    Mark a follow-up action as completed
// @access  Private
router.post('/followups/:id/complete', auth, async (req, res) => {
  try {
    const updated = await FollowUp.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { status: 'completed' } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'FollowUp not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/agents/emails
// @desc    Get all generated outreach email drafts (joined with customer details)
// @access  Private
router.get('/emails', auth, async (req, res) => {
  try {
    const emails = await Email.find({ userId: req.user.id });
    const joined = await joinWithCustomer(emails, req.user.id, 'customerId');
    res.json(joined);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/agents/emails/:id/regenerate
// @desc    Regenerate outreach email draft for a specific customer
// @access  Private
router.post('/emails/:id/regenerate', auth, async (req, res) => {
  try {
    const emailDraft = await Email.findOne({ _id: req.params.id, userId: req.user.id });
    if (!emailDraft) {
      return res.status(404).json({ message: 'Email draft not found' });
    }

    const customer = await Customer.findOne({ _id: emailDraft.customerId, userId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Call Email Agent directly
    const emailAgent = new EmailAgent();
    const newContent = await emailAgent.run(customer, { score: customer.score, category: customer.category }, { company: customer.company, industry: customer.industry }, { strategy: customer.insights?.strategy || 'Demo request' }, req.user.id);

    const updated = await Email.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        $set: {
          subject: newContent.output.subject,
          body: newContent.output.body,
          cta: newContent.output.callToAction,
          followUpPlan: newContent.output.followUpPlan,
          status: 'pending' // Reset approval status on regeneration
        }
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('❌ Failed to regenerate email:', err.message);
    res.status(500).json({ message: 'Failed to regenerate email', error: err.message });
  }
});

// @route   POST /api/agents/emails/:id/approve
// @desc    Approve a generated email draft for dispatch
// @access  Private
router.post('/emails/:id/approve', auth, async (req, res) => {
  try {
    const updated = await Email.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        $set: {
          status: 'approved',
          approvedBy: req.user.id,
          approvedAt: new Date().toISOString()
        }
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Email draft not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Approve action failed', error: err.message });
  }
});

// @route   POST /api/agents/emails/:id/reject
// @desc    Reject a generated email draft
// @access  Private
router.post('/emails/:id/reject', auth, async (req, res) => {
  try {
    const updated = await Email.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        $set: {
          status: 'rejected',
          approvedBy: req.user.id,
          approvedAt: new Date().toISOString()
        }
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Email draft not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Reject action failed', error: err.message });
  }
});

// @route   POST /api/agents/emails/:id/send
// @desc    Execute dispatching an approved outreach email
// @access  Private
router.post('/emails/:id/send', auth, async (req, res) => {
  try {
    const emailDraft = await Email.findOne({ _id: req.params.id, userId: req.user.id });
    if (!emailDraft) {
      return res.status(404).json({ message: 'Email draft not found' });
    }

    if (emailDraft.status !== 'approved') {
      return res.status(400).json({ message: 'Email must be approved by a human before dispatching.' });
    }

    const customer = await Customer.findOne({ _id: emailDraft.customerId, userId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: 'Associated customer not found for this email draft' });
    }

    const transporter = getSmtpTransporter();
    let sendResult = null;
    let isMock = true;

    if (transporter) {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: customer.email,
        subject: emailDraft.subject,
        text: emailDraft.body
      };
      sendResult = await transporter.sendMail(mailOptions);
      isMock = false;
    }

    if (!isMock) {
      // Process real dispatch log
      await AgentLog.create({
        userId: req.user.id,
        agentName: 'Outbound Dispatcher',
        action: `Dispatched approved sales email to customer ${customer.name} (${customer.email})`,
        input: { emailId: emailDraft._id, to: customer.email, subject: emailDraft.subject },
        output: { status: 'sent', messageId: sendResult.messageId },
        status: 'success',
        executionTime: 350
      });
    } else {
      // Process mock dispatch: log the outbound transaction
      await AgentLog.create({
        userId: req.user.id,
        agentName: 'Outbound Dispatcher',
        action: `Dispatched approved sales email (MOCK) to customer reference ID: ${emailDraft.customerId}`,
        input: emailDraft,
        output: { status: 'dispatched', responseCode: 200, info: 'SMTP not configured, mock mode active' },
        status: 'success',
        executionTime: 150
      });
    }

    // Delete or update draft to complete
    await Email.deleteMany({ _id: req.params.id, userId: req.user.id });

    if (!isMock) {
      res.json({ message: `Email dispatched successfully to ${customer.email}.`, success: true });
    } else {
      res.json({ 
        message: 'Email mock-dispatched successfully. Note: Configure SMTP credentials in backend/.env for real dispatching.', 
        success: true, 
        isMock: true 
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Send operation failed', error: err.message });
  }
});

// @route   GET /api/agents/logs
// @desc    Get execution steps and system triggers
// @access  Private
router.get('/logs', auth, async (req, res) => {
  try {
    const logs = await AgentLog.find({ userId: req.user.id });
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(logs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
