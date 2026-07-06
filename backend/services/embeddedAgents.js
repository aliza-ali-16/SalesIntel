const axios = require('axios');
const { Customer, FollowUp, Email, AgentLog } = require('../models/schemas');
const vectorDb = require('./vectorDb');
const socketService = require('./socketService');

// Helper to log detailed agent executions in MongoDB / JSON fallback
async function logAgentExecution(agentName, action, input, output, status, executionTime, error = '', userId = 'test_user_id') {
  console.log(`[${agentName.toUpperCase()}]: ${action}`);
  try {
    await AgentLog.create({
      agentName,
      action,
      input,
      output,
      status,
      executionTime,
      error,
      userId
    });
    
    // Broadcast status update in real-time to socket clients
    socketService.emitEvent('agent_status', { 
      agentName, 
      status: status === 'success' ? 'Idle' : 'Running',
      action 
    });

    if (status === 'failure' || error) {
      socketService.emitEvent('agent_error', { 
        message: `${agentName}: ${error || action}` 
      });
    }
  } catch (err) {
    console.error('❌ Failed to write agent log to database:', err.message);
  }
}

// Guess company and domain from email address
function extractCompanyDetails(email, name) {
  try {
    const parts = email.split('@');
    if (parts.length === 2) {
      const domain = parts[1];
      const domainName = domain.split('.')[0];
      const company = domainName.charAt(0).toUpperCase() + domainName.slice(1);
      return { company, domain };
    }
  } catch (e) {
    // Ignore and fallback
  }
  return { company: 'Private Corporate', domain: 'unknown.com' };
}

// Call Gemini Model via REST API with prompt validation
async function runGeminiPrompt(prompt, fallbackFunc, ...args) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return await fallbackFunc(...args);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, { timeout: 8000 });

    const rawText = response.data.candidates[0].content.parts[0].text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("AI returned malformed non-JSON output.");
  } catch (err) {
    console.warn(`[GEMINI ERROR] Prompt failed (${err.message}). Using fallback.`);
    return await fallbackFunc(...args);
  }
}

// 1. CRM Intelligence Agent
class CRMIntelligenceAgent {
  async fallback(c) {
    const visits = parseInt(c.visits) || 0;
    const opens = parseInt(c.opens) || 0;
    const purchases = parseInt(c.purchases) || 0;
    const score = visits * 3 + opens * 5 + purchases * 10;
    const risk = purchases > 0 ? 'LOW' : (visits > 5 ? 'MEDIUM' : 'HIGH');
    return {
      insights: `Customer shows engagement with ${visits} visits, ${opens} opens and ${purchases} purchases.`,
      engagementScore: Math.min(100, score),
      riskLevel: risk,
      opportunities: purchases > 0 ? "Offer loyalty upgrade" : "Trigger product demo offer"
    };
  }

  async run(c) {
    const startTime = Date.now();
    const prompt = `
      Analyze customer data for behavior summary, risk of churn, and opportunities.
      Customer Details:
      Name: ${c.name}
      Email: ${c.email}
      Website Visits: ${c.visits || 0}
      Email Opens: ${c.opens || 0}
      Purchases: ${c.purchases || 0}

      Output MUST be a JSON object with keys:
      - "insights": Summary of customer behavior (1-2 sentences).
      - "engagementScore": Integer 0-100 representing health/engagement.
      - "riskLevel": "LOW", "MEDIUM", or "HIGH" (risk of churn).
      - "opportunities": Immediate sales upsell or conversion opportunities.
      Do not wrap in markdown or include text outside the JSON structure.
    `;
    const output = await runGeminiPrompt(prompt, this.fallback.bind(this), c);
    const execTime = Date.now() - startTime;
    return { output, execTime };
  }
}

// 2. Customer Research Agent
class CustomerResearchAgent {
  async fallback(name, email, company, domain) {
    const tldSector = domain.endsWith('.gov') ? 'Government' : (domain.endsWith('.edu') ? 'Education' : 'Software & Technology');
    return {
      company,
      industry: tldSector,
      possiblePainPoints: ["Manual CRM data management", "Lack of sales insights"],
      salesOpportunities: "Sales workflow automation",
      recommendedStrategy: "Introduce platform integration demo"
    };
  }

  async run(c) {
    const startTime = Date.now();
    const { company, domain } = extractCompanyDetails(c.email, c.name);
    const prompt = `
      Research target company/customer details based on profile information.
      Profile:
      Name: ${c.name}
      Email: ${c.email}
      Suggested Company: ${company}
      Suggested Domain: ${domain}

      Output MUST be a JSON object with keys:
      - "company": Confirmed/corrected company name.
      - "industry": Main industry vertical.
      - "possiblePainPoints": Array of 2-3 logical corporate pain points.
      - "salesOpportunities": Best opportunity fit.
      - "recommendedStrategy": Recommended strategy for sales pitch.
      Do not wrap in markdown.
    `;
    const output = await runGeminiPrompt(prompt, this.fallback.bind(this), c.name, c.email, company, domain);
    const execTime = Date.now() - startTime;
    return { output, execTime };
  }
}

// 3. Advanced Lead Scoring Agent
class AdvancedLeadScoringAgent {
  async fallback(c, research) {
    const visits = parseInt(c.visits) || 0;
    const opens = parseInt(c.opens) || 0;
    const purchases = parseInt(c.purchases) || 0;
    const score = Math.min(100, visits * 3 + opens * 5 + purchases * 10);
    const category = score >= 80 ? 'HOT' : (score >= 50 ? 'WARM' : 'COLD');
    return {
      score,
      category,
      confidence: 0.85,
      reason: "Standard engagement scoring based on visits and purchases."
    };
  }

  async run(c, research) {
    const startTime = Date.now();
    const prompt = `
      Calculate AI-assisted lead score (0-100) and tier based on customer engagement metrics and research.
      Customer:
      Name: ${c.name}
      Visits: ${c.visits || 0}
      Opens: ${c.opens || 0}
      Purchases: ${c.purchases || 0}
      Company: ${research.company}
      Industry: ${research.industry}
      Pain Points: ${(research.possiblePainPoints || []).join(', ')}

      Output MUST be a JSON object with keys:
      - "score": Integer 0-100.
      - "category": "HOT", "WARM", or "COLD".
      - "confidence": Float 0.0-1.0.
      - "reason": Detailed explanation of the score.
      Do not wrap in markdown.
    `;
    const output = await runGeminiPrompt(prompt, this.fallback.bind(this), c, research);
    const execTime = Date.now() - startTime;
    return { output, execTime };
  }
}

// 4. Sales Strategy Agent
class SalesStrategyAgent {
  async fallback(name, scoreCategory) {
    if (scoreCategory === 'HOT') {
      return {
        strategy: "Urgent direct outreach",
        nextAction: "Schedule live platform walkthrough",
        recommendedChannel: "Email",
        priority: "High"
      };
    } else if (scoreCategory === 'WARM') {
      return {
        strategy: "Educational nurturing",
        nextAction: "Send case study report",
        recommendedChannel: "LinkedIn",
        priority: "Medium"
      };
    } else {
      return {
        strategy: "Cold awareness campaign",
        nextAction: "Share industrial blog resources",
        recommendedChannel: "Email",
        priority: "Low"
      };
    }
  }

  async run(c, scoring, research) {
    const startTime = Date.now();
    const prompt = `
      Decide the best sales approach and playbook actions for this customer.
      Lead profile:
      Name: ${c.name}
      Company: ${research.company}
      Lead Score: ${scoring.score} (${scoring.category})
      Opportunities: ${research.salesOpportunities}

      Output MUST be a JSON object with keys:
      - "strategy": Sales strategy title.
      - "nextAction": Specific immediate action.
      - "recommendedChannel": "Email", "LinkedIn", "Phone", or "Meeting".
      - "priority": "High", "Medium", or "Low".
      Do not wrap in markdown.
    `;
    const output = await runGeminiPrompt(prompt, this.fallback.bind(this), c.name, scoring.category);
    const execTime = Date.now() - startTime;
    return { output, execTime };
  }
}

// 5. Email Agent
class EmailAgent {
  async fallback(c, scoring, research, strategy, context) {
    const category = scoring.category || 'COLD';
    const company = research.company || 'your company';
    const name = c.name || 'there';

    let subject = '', body = '', cta = '', followUp = '';

    if (category === 'HOT') {
      subject = `Scaling workflows for ${company}`;
      body = `Hi ${name},\n\nI noticed your team has been evaluating our platform. Given your fast growth, let's connect for a 15-minute demo to map out custom sync integrations for ${company}.\n\nBest,\nSales Intelligence Team`;
      cta = "Book Demo Call";
      followUp = "Send case study if no answer in 3 days.";
    } else if (category === 'WARM') {
      subject = `CRM automation resources for ${company}`;
      body = `Hi ${name},\n\nI saw you checked out our platform tools recently. I wanted to share this direct blueprint for increasing sales analytics efficiency at ${company}.\n\nBest,\nSales Intelligence Team`;
      cta = "Download CRM Blueprint";
      followUp = "Send email follow-up in 5 days.";
    } else {
      subject = `Sales alignment guide - ${company}`;
      body = `Hi ${name},\n\nWe know coordinating data feeds is manual. Here are our top articles to automate lead ingestion pipelines.\n\nBest,\nSales Intelligence Team`;
      cta = "Read Whitepaper";
      followUp = "Add to monthly newsletter cycle.";
    }

    return { subject, body, callToAction: cta, followUpPlan: followUp };
  }

  async run(c, scoring, research, strategy, userId = 'test_user_id') {
    const startTime = Date.now();
    
    // Retrieve previous campaign interactions from Vector database memory
    let contextStr = "No prior campaign context.";
    try {
      const memories = await vectorDb.queryMemory(c.email, 2, c.email, userId);
      if (memories && memories.length > 0) {
        contextStr = memories.map(m => m.text).join(' ');
      }
    } catch (e) {
      console.warn("⚠️ Failed to retrieve vector memory context:", e.message);
    }

    const prompt = `
      Generate a personalized B2B outreach email based on lead data and previous history memory context.
      Target Lead:
      Name: ${c.name}
      Company: ${research.company}
      Score Tier: ${scoring.score}/100 (${scoring.category})
      Target Pain Points: ${(research.possiblePainPoints || []).join(', ')}
      Outreach strategy: ${strategy.strategy}
      Next Action: ${strategy.nextAction}
      
      Previous Campaign Interactions Context:
      "${contextStr}"
      
      Requirements:
      - Incorporate the previous campaign context if it recommends approaches (e.g. if discounts failed, do not mention discounts; use educational approach).
      - Structure output as JSON containing exactly: "subject", "body", "callToAction", "followUpPlan".
      - Write the email from "Sales Intelligence Platform".
      - Do not wrap in markdown.
    `;
    const output = await runGeminiPrompt(prompt, this.fallback.bind(this), c, scoring, research, strategy, contextStr);
    const execTime = Date.now() - startTime;

    // Save generated email profile text into Vector DB Memory for future runs context
    try {
      const memoryText = `Campaign email generated. Subject: ${output.subject}. Strategy: ${strategy.strategy}. CTA: ${output.callToAction}.`;
      await vectorDb.saveMemory(c.email, memoryText, { timestamp: new Date().toISOString(), type: 'email' }, userId);
    } catch (e) {
      console.warn("⚠️ Failed to save Vector Memory:", e.message);
    }

    return { output, execTime };
  }
}

// 6. Revenue Forecast Agent
class RevenueForecastAgent {
  async fallback(leads) {
    const total = leads.length;
    if (total === 0) return { expectedRevenue: "$0", conversionProbability: "0%", confidence: 1.0 };

    const hotCount = leads.filter(l => l.category === 'HOT').length;
    const warmCount = leads.filter(l => l.category === 'WARM').length;
    const expected = (hotCount * 5000) + (warmCount * 1500);
    const prob = `${Math.round(((hotCount * 0.8 + warmCount * 0.4) / total) * 100)}%`;

    return {
      expectedRevenue: `$${expected.toLocaleString()}`,
      conversionProbability: prob,
      confidence: 0.85
    };
  }

  async run(leads) {
    const startTime = Date.now();
    const leadsSummary = leads.map(l => ({
      email: l.email,
      category: l.category,
      score: l.score,
      purchases: l.purchases || 0
    }));

    const prompt = `
      Forecast sales conversions and pipeline revenue for these leads:
      Leads summary:
      ${JSON.stringify(leadsSummary, null, 2)}

      Output MUST be a JSON object with keys:
      - "expectedRevenue": Expected pipeline revenue as a string, e.g., "$25,000".
      - "conversionProbability": Overall estimated conversion likelihood, e.g., "78%".
      - "confidence": Float 0.0-1.0 representing forecast confidence.
      Do not wrap in markdown.
    `;
    const output = await runGeminiPrompt(prompt, this.fallback.bind(this), leads);
    const execTime = Date.now() - startTime;
    return { output, execTime };
  }
}

// 7. Manager Agent (Controller / Orchestrator)
class ManagerAgent {
  constructor() {
    this.crmAgent = new CRMIntelligenceAgent();
    this.researchAgent = new CustomerResearchAgent();
    this.scoringAgent = new AdvancedLeadScoringAgent();
    this.strategyAgent = new SalesStrategyAgent();
    this.emailAgent = new EmailAgent();
    this.forecastAgent = new RevenueForecastAgent();
  }

  async processCRMData(rawData, userId = 'test_user_id') {
    const runId = Math.random().toString(36).substring(7);
    console.log(`[MANAGER AGENT] Running upgraded Node JS Multi-Agent workflow... (Run ID: ${runId})`);

    const scoredLeads = [];
    const executionLogs = [];

    try {
      for (const record of rawData) {
        if (!record.email || !record.name) continue;
        const email = record.email.trim().toLowerCase();
        const name = record.name.trim();

        // 1. CRM Intelligence
        const crmRes = await this.crmAgent.run(record);
        await logAgentExecution('CRM Analyzer Agent', `Analyzed lead metrics for ${name}`, record, crmRes.output, 'success', crmRes.execTime, '', userId);
        executionLogs.push({ agentName: 'CRM Analyzer Agent', action: `Analyzed lead metrics for ${name}`, input: record, output: crmRes.output, status: 'success', executionTime: crmRes.execTime });

        // 2. Customer Research
        const researchRes = await this.researchAgent.run(record);
        await logAgentExecution('Customer Research Agent', `Researched corporate context for ${companyNameFromEmail(email)}`, { email, name }, researchRes.output, 'success', researchRes.execTime, '', userId);
        executionLogs.push({ agentName: 'Customer Research Agent', action: `Researched corporate context for ${companyNameFromEmail(email)}`, input: { email, name }, output: researchRes.output, status: 'success', executionTime: researchRes.execTime });

        // 3. Lead Scoring
        const scoringRes = await this.scoringAgent.run(record, researchRes.output);
        await logAgentExecution('Lead Scoring Agent', `Scored lead tier for ${name}`, { record, research: researchRes.output }, scoringRes.output, 'success', scoringRes.execTime, '', userId);
        executionLogs.push({ agentName: 'Lead Scoring Agent', action: `Scored lead tier for ${name}`, input: { record, research: researchRes.output }, output: scoringRes.output, status: 'success', executionTime: scoringRes.execTime });

        // 4. Sales Playbook Strategy
        const strategyRes = await this.strategyAgent.run(record, scoringRes.output, researchRes.output);
        await logAgentExecution('Sales Strategy Agent', `Generated playbook actions for ${name}`, { score: scoringRes.output, research: researchRes.output }, strategyRes.output, 'success', strategyRes.execTime, '', userId);
        executionLogs.push({ agentName: 'Sales Strategy Agent', action: `Generated playbook actions for ${name}`, input: { score: scoringRes.output, research: researchRes.output }, output: strategyRes.output, status: 'success', executionTime: strategyRes.execTime });

        // 5. Outreach Email Ingest
        const emailRes = await this.emailAgent.run(record, scoringRes.output, researchRes.output, strategyRes.output, userId);
        await logAgentExecution('Email Agent', `Generated outreach templates for ${name}`, { score: scoringRes.output, strategy: strategyRes.output }, emailRes.output, 'success', emailRes.execTime, '', userId);
        executionLogs.push({ agentName: 'Email Agent', action: `Generated outreach templates for ${name}`, input: { score: scoringRes.output, strategy: strategyRes.output }, output: emailRes.output, status: 'success', executionTime: emailRes.execTime });

        // Collect and compile profile record
        const lead = {
          name,
          email,
          visits: parseInt(record.visits) || 0,
          opens: parseInt(record.opens || record.email_opens) || 0,
          purchases: parseInt(record.purchases) || 0,
          company: researchRes.output.company,
          industry: researchRes.output.industry,
          score: scoringRes.output.score,
          category: scoringRes.output.category,
          insights: {
            insights: crmRes.output.insights,
            engagementScore: crmRes.output.engagementScore,
            riskLevel: crmRes.output.riskLevel,
            opportunities: crmRes.output.opportunities,
            confidence: scoringRes.output.confidence,
            reason: scoringRes.output.reason,
            strategy: strategyRes.output.strategy,
            nextAction: strategyRes.output.nextAction,
            recommendedChannel: strategyRes.output.recommendedChannel,
            priority: strategyRes.output.priority,
            expectedRevenue: '', // will be populated
            conversionProbability: ''
          },
          emailDraft: {
            subject: emailRes.output.subject,
            body: emailRes.output.body,
            cta: emailRes.output.callToAction,
            followUpPlan: emailRes.output.followUpPlan
          }
        };

        scoredLeads.push(lead);
      }

      // 6. Revenue Forecast
      const forecastRes = await this.forecastAgent.run(scoredLeads);
      await logAgentExecution('Revenue Forecast Agent', `Forecasted expected revenue on cohort`, scoredLeads.map(l => l.email), forecastRes.output, 'success', forecastRes.execTime, '', userId);
      executionLogs.push({ agentName: 'Revenue Forecast Agent', action: `Forecasted expected revenue on cohort`, input: scoredLeads.map(l => l.email), output: forecastRes.output, status: 'success', executionTime: forecastRes.execTime });

      // Enrich expected revenue per lead based on probabilities
      for (const lead of scoredLeads) {
        const estValue = lead.category === 'HOT' ? 5000 : (lead.category === 'WARM' ? 1500 : 100);
        const prob = lead.category === 'HOT' ? 90 : (lead.category === 'WARM' ? 40 : 5);
        lead.insights.expectedRevenue = `$${estValue.toLocaleString()}`;
        lead.insights.conversionProbability = `${prob}%`;
      }

      // Save/Update database records
      const savedCustomers = [];
      for (const sl of scoredLeads) {
        const doc = await Customer.findOneAndUpdate(
          { email: sl.email, userId },
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
              userId
            }
          },
          { new: true, upsert: true }
        );
        savedCustomers.push(doc);
        
        // Notify socket clients of newly processed/updated B2B lead
        socketService.emitEvent('new_lead', {
          name: sl.name,
          email: sl.email,
          score: sl.score,
          category: sl.category
        });
      }

      // Save Followups
      for (const sl of scoredLeads) {
        const customer = savedCustomers.find(c => c.email === sl.email);
        if (customer) {
          const daysToAdd = sl.category === 'HOT' ? 0 : (sl.category === 'WARM' ? 3 : 30);
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + daysToAdd);
          
          await FollowUp.findOneAndUpdate(
            { customerId: customer._id, userId },
            { $set: { date: followUpDate.toISOString().split('T')[0], status: 'pending', userId } },
            { new: true, upsert: true }
          );
        }
      }

      // Save Emails (status pending for human approval)
      for (const sl of scoredLeads) {
        const customer = savedCustomers.find(c => c.email === sl.email);
        if (customer) {
          await Email.findOneAndUpdate(
            { customerId: customer._id, userId },
            {
              $set: {
                subject: sl.emailDraft.subject,
                body: sl.emailDraft.body,
                cta: sl.emailDraft.cta,
                followUpPlan: sl.emailDraft.followUpPlan,
                status: 'pending',
                approvedBy: null,
                approvedAt: null,
                userId
              }
            },
            { new: true, upsert: true }
          );

          // Notify socket clients of newly generated outreach copy drafts
          socketService.emitEvent('email_generated', {
            customerName: sl.name
          });
        }
      }

      // Compile stats summary
      const totalCount = savedCustomers.length;
      let totalScore = 0;
      savedCustomers.forEach(c => totalScore += (c.insights?.engagementScore || 0));
      const avgEngage = totalCount > 0 ? (totalScore / totalCount).toFixed(1) : 0;

      const topCustomers = [...savedCustomers]
        .sort((a, b) => b.purchases - a.purchases)
        .slice(0, 3)
        .map(c => `${c.name} (${c.purchases} purchases)`);

      const summary = {
        totalCustomers: totalCount,
        averageEngagement: avgEngage,
        topCustomers
      };

      await logAgentExecution('Manager Agent', `Completed workflow execution. Processed ${totalCount} records. Expected Revenue: ${forecastRes.output.expectedRevenue}`, null, forecastRes.output, 'success', 0, '', userId);

      return {
        success: true,
        summary,
        forecast: forecastRes.output,
        customerCount: totalCount
      };

    } catch (err) {
      await logAgentExecution('Manager Agent', `Workflow execution failed: ${err.message}`, null, null, 'failed', 0, err.stack, userId);
      throw err;
    }
  }
}

// Utility to parse company name from email
function companyNameFromEmail(email) {
  try {
    const parts = email.split('@');
    if (parts.length === 2) {
      const domainName = parts[1].split('.')[0];
      return domainName.charAt(0).toUpperCase() + domainName.slice(1);
    }
  } catch (e) {}
  return 'Corporate Client';
}

module.exports = {
  ManagerAgent,
  CRMIntelligenceAgent,
  CustomerResearchAgent,
  LeadScoringAgent: AdvancedLeadScoringAgent,
  FollowUpAgent: SalesStrategyAgent, // aliased for route compatibility
  EmailAgent,
  RevenueForecastAgent
};
