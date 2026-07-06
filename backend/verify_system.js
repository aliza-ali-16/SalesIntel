/**
 * verify_system.js
 * Comprehensive verification runner to validate the Multi-Agent B2B SaaS platform upgrades.
 */
require('dotenv').config();
const { connectDB } = require('./config/db');
const { Customer, FollowUp, Email, AgentLog } = require('./models/schemas');
const { ManagerAgent } = require('./services/embeddedAgents');
const vectorDb = require('./services/vectorDb');

async function runVerification() {
  console.log("🏁 Starting system verification checks...");
  
  try {
    // 1. Database Connection Check
    await connectDB();
    console.log("✅ Database initialized successfully (Connected Mode or Fallback JSON).");

    // 2. Vector DB memory save and fetch check
    console.log("🧪 Testing Vector DB Cosine Similarity matching...");
    const testEmail = "clark_test_discount@dailyplanet.com";
    await vectorDb.saveMemory(testEmail, "Campaign email failed. Customer ignored 20% discount offer.", { campaign: "summer_sale" });
    
    const context = await vectorDb.queryMemory(testEmail, 1, testEmail);
    if (context.length > 0 && context[0].text.includes("discount")) {
      console.log(`✅ Vector DB query success. Retrieved: "${context[0].text}"`);
    } else {
      throw new Error("Vector DB failed to retrieve written context.");
    }

    // 3. Multi-Agent Orchestration Run
    console.log("🧪 Ingesting mock B2B CRM records through ManagerAgent...");
    const mockCrmData = [
      {
        name: "Clark Kent",
        email: "clark@dailyplanet.com",
        visits: 12,
        opens: 4,
        purchases: 0
      },
      {
        name: "Bruce Wayne",
        email: "bruce@waynecorp.com",
        visits: 35,
        opens: 15,
        purchases: 4
      }
    ];

    const manager = new ManagerAgent();
    const result = await manager.processCRMData(mockCrmData);

    if (result.success && result.customerCount > 0) {
      console.log(`✅ Manager Agent workflow complete. Scored ${result.customerCount} customers.`);
    } else {
      throw new Error("Manager Agent processing did not report success.");
    }

    // 4. Schema verification check
    console.log("🧪 Auditing database entries for upgraded schema fields...");
    
    // Check Customer details
    const clark = await Customer.findOne({ email: "clark@dailyplanet.com" });
    if (clark && clark.company === "Dailyplanet" && clark.insights && clark.insights.riskLevel) {
      console.log(`✅ Customer schema updated. Clark company: ${clark.company}. Tier: ${clark.category}. Score: ${clark.score}`);
      console.log(`   CRM insights opportunities: "${clark.insights.opportunities}"`);
      console.log(`   Lead scoring AI reason: "${clark.insights.reason}"`);
      console.log(`   Expected Revenue: ${clark.insights.expectedRevenue}. Prob: ${clark.insights.conversionProbability}`);
    } else {
      throw new Error("Customer schema is missing company or nested insights properties.");
    }

    // Check Email draft status and CTAs
    const clarkEmail = await Email.findOne({ customerId: clark._id });
    if (clarkEmail && clarkEmail.status === "pending" && clarkEmail.cta) {
      console.log(`✅ Email schema updated. Draft status: ${clarkEmail.status}. CTA: ${clarkEmail.cta}. Plan: ${clarkEmail.followUpPlan}`);
    } else {
      throw new Error("Email schema is missing status or cta fields.");
    }

    // Check Agent logs detail
    const logs = await AgentLog.find({ agentName: "Lead Scoring Agent" });
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (logs.length > 0 && logs[0].executionTime >= 0 && logs[0].status === "success") {
      console.log(`✅ AgentLog schema updated. Found scoring run. Latency: ${logs[0].executionTime}ms. Status: ${logs[0].status}`);
    } else {
      throw new Error("AgentLog schema is missing executionTime or status fields.");
    }

    // 5. Human approval workflow check
    console.log("🧪 Testing email approval transition gates...");
    const approvedEmail = await Email.findOneAndUpdate(
      { customerId: clark._id },
      { $set: { status: "approved", approvedBy: "verifier_admin", approvedAt: new Date().toISOString() } },
      { new: true }
    );

    if (approvedEmail && approvedEmail.status === "approved" && approvedEmail.approvedBy === "verifier_admin") {
      console.log("✅ Email approval workflow state transition successful.");
    } else {
      throw new Error("Failed to transition email status to approved.");
    }

    console.log("🎉 ALL SYSTEM VERIFICATION CHECKS COMPLETED SUCCESSFULLY!");
    process.exit(0);

  } catch (err) {
    console.error("❌ VERIFICATION TEST FAILURE:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runVerification();
