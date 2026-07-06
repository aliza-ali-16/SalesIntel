import os
import datetime
import json
import time
import google.generativeai as genai
from vector_db import save_memory, query_memory

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Helper to clean and parse JSON response from LLM
def parse_json_response(text):
    text = text.strip()
    # Strip markdown block if model included it
    if "```" in text:
        if "```json" in text:
            start = text.find("```json") + 7
        else:
            start = text.find("```") + 3
        end = text.rfind("```")
        text = text[start:end].strip()
    return json.loads(text)

# Helper to run prompt and return parsed JSON or fallback
def run_llm_prompt(prompt, fallback_func, *args, **kwargs):
    if not GEMINI_API_KEY:
        return fallback_func(*args, **kwargs)
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return parse_json_response(response.text)
    except Exception as e:
        print(f"[LLM WARNING] Gemini prompt failed: {e}. Running rule-based fallback.")
        return fallback_func(*args, **kwargs)

# Helper to guess company and domain from email address
def extract_company_details(email, name):
    try:
        parts = email.split("@")
        if len(parts) == 2:
            domain = parts[1]
            # Strip standard TLDs
            domain_name = domain.split(".")[0]
            # Capitalize first letter
            company = domain_name.capitalize()
            return company, domain
    except:
        pass
    return "Private Corporate", "unknown.com"

# 1. CRM Intelligence Agent
class CRMIntelligenceAgent:
    def fallback(self, c):
        visits = c.get("visits", 0)
        opens = c.get("opens", 0)
        purchases = c.get("purchases", 0)
        score = visits * 3 + opens * 5 + purchases * 10
        risk = "LOW" if purchases > 0 else ("MEDIUM" if visits > 5 else "HIGH")
        return {
            "insights": f"Customer shows engagement with {visits} visits, {opens} opens and {purchases} purchases.",
            "engagementScore": min(100, score),
            "riskLevel": risk,
            "opportunities": "Offer loyalty upgrade" if purchases > 0 else "Trigger product demo offer"
        }

    def run(self, c):
        start_time = time.time()
        prompt = f"""
        Analyze customer data for behavior summary, risk of churn, and opportunities.
        Customer Details:
        Name: {c.get('name')}
        Email: {c.get('email')}
        Website Visits: {c.get('visits', 0)}
        Email Opens: {c.get('opens', 0)}
        Purchases: {c.get('purchases', 0)}

        Output MUST be a JSON object with keys:
        - "insights": Summary of customer behavior (1-2 sentences).
        - "engagementScore": Integer 0-100 representing health/engagement.
        - "riskLevel": "LOW", "MEDIUM", or "HIGH" (risk of churn).
        - "opportunities": Immediate sales upsell or conversion opportunities.
        Do not wrap in markdown or include text outside the JSON structure.
        """
        output = run_llm_prompt(prompt, self.fallback, c)
        exec_time = int((time.time() - start_time) * 1000)
        return output, exec_time

# 2. Customer Research Agent
class CustomerResearchAgent:
    def fallback(self, name, email, company, domain):
        tld_sector = "Government" if domain.endswith(".gov") else ("Education" if domain.endswith(".edu") else "Software & Technology")
        return {
            "company": company,
            "industry": tld_sector,
            "possiblePainPoints": ["Manual CRM data management", "Lack of sales insights"],
            "salesOpportunities": "Sales workflow automation",
            "recommendedStrategy": "Introduce platform integration demo"
        }

    def run(self, c):
        start_time = time.time()
        company, domain = extract_company_details(c.get("email"), c.get("name"))
        prompt = f"""
        Research target company/customer details based on profile information.
        Profile:
        Name: {c.get('name')}
        Email: {c.get('email')}
        Suggested Company: {company}
        Suggested Domain: {domain}

        Output MUST be a JSON object with keys:
        - "company": Confirmed/corrected company name.
        - "industry": Main industry vertical.
        - "possiblePainPoints": Array of 2-3 logical corporate pain points.
        - "salesOpportunities": Best opportunity fit.
        - "recommendedStrategy": Recommended strategy for sales pitch.
        Do not wrap in markdown.
        """
        output = run_llm_prompt(prompt, self.fallback, c.get("name"), c.get("email"), company, domain)
        exec_time = int((time.time() - start_time) * 1000)
        return output, exec_time

# 3. Advanced Lead Scoring Agent
class AdvancedLeadScoringAgent:
    def fallback(self, c, research):
        visits = c.get("visits", 0)
        opens = c.get("opens", 0)
        purchases = c.get("purchases", 0)
        score = min(100, visits * 3 + opens * 5 + purchases * 10)
        category = "HOT" if score >= 80 else ("WARM" if score >= 50 else "COLD")
        return {
            "score": score,
            "category": category,
            "confidence": 0.85,
            "reason": f"Standard engagement scoring based on visits and purchases."
        }

    def run(self, c, research):
        start_time = time.time()
        prompt = f"""
        Calculate AI-assisted lead score (0-100) and tier based on customer engagement metrics and research.
        Customer:
        Name: {c.get('name')}
        Visits: {c.get('visits', 0)}
        Opens: {c.get('opens', 0)}
        Purchases: {c.get('purchases', 0)}
        Company: {research.get('company')}
        Industry: {research.get('industry')}
        Pain Points: {', '.join(research.get('possiblePainPoints', []))}

        Output MUST be a JSON object with keys:
        - "score": Integer 0-100.
        - "category": "HOT", "WARM", or "COLD".
        - "confidence": Float 0.0-1.0.
        - "reason": Details explanation of the score.
        Do not wrap in markdown.
        """
        output = run_llm_prompt(prompt, self.fallback, c, research)
        exec_time = int((time.time() - start_time) * 1000)
        return output, exec_time

# 4. Sales Strategy Agent
class SalesStrategyAgent:
    def fallback(self, name, score_category):
        if score_category == "HOT":
            return {
                "strategy": "Urgent direct outreach",
                "nextAction": "Schedule live platform walkthrough",
                "recommendedChannel": "Email",
                "priority": "High"
            }
        elif score_category == "WARM":
            return {
                "strategy": "Educational nurturing",
                "nextAction": "Send case study report",
                "recommendedChannel": "LinkedIn",
                "priority": "Medium"
            }
        else:
            return {
                "strategy": "Cold awareness campaign",
                "nextAction": "Share industrial blog resources",
                "recommendedChannel": "Email",
                "priority": "Low"
            }

    def run(self, c, scoring, research):
        start_time = time.time()
        prompt = f"""
        Decide the best sales approach and playbook actions for this customer.
        Lead profile:
        Name: {c.get('name')}
        Company: {research.get('company')}
        Lead Score: {scoring.get('score')} ({scoring.get('category')})
        Opportunities: {research.get('salesOpportunities')}

        Output MUST be a JSON object with keys:
        - "strategy": Sales strategy title.
        - "nextAction": Specific immediate action.
        - "recommendedChannel": "Email", "LinkedIn", "Phone", or "Meeting".
        - "priority": "High", "Medium", or "Low".
        Do not wrap in markdown.
        """
        output = run_llm_prompt(prompt, self.fallback, c.get("name"), scoring.get("category"))
        exec_time = int((time.time() - start_time) * 1000)
        return output, exec_time

# 5. Email Agent
class EmailAgent:
    def fallback(self, c, scoring, research, strategy, context):
        category = scoring.get("category", "COLD")
        company = research.get("company", "your company")
        name = c.get("name", "there")
        
        # Check if context warns us about something
        strategy_desc = "educational approach"
        if "discount email failed" in context.lower() or "discount" in context.lower():
            strategy_desc = "industry solution focus"
            
        if category == "HOT":
            subject = f"Optimizing workflows for {company}"
            body = f"Hi {name},\n\nI saw your team is growing quickly. Let's schedule a brief 10-minute demo to explore automation options for {company}.\n\nBest,\nSales Team"
            cta = "Book Live Demo"
            follow_up = "If no answer, email again in 3 days."
        elif category == "WARM":
            subject = f"Increasing sales efficiency at {company}"
            body = f"Hi {name},\n\nThought you might find this guide helpful on automating manual tasks. Let me know if you would like to test the trial version.\n\nBest,\nSales Team"
            cta = "Read Whitepaper"
            follow_up = "Follow up with case study in 5 days."
        else:
            subject = f"Sales intelligence resource for {company}"
            body = f"Hi {name},\n\nWe recently wrote an article explaining CRM automation best practices. Hope you find it useful.\n\nBest,\nSales Team"
            cta = "View Article"
            follow_up = "Add to monthly newsletter campaign."
            
        return {
            "subject": subject,
            "body": body,
            "callToAction": cta,
            "followUpPlan": follow_up
        }

    def run(self, c, scoring, research, strategy):
        start_time = time.time()
        
        # 1. Retrieve history memory from vector DB
        email_addr = c.get("email")
        memories = query_memory(email_addr, limit=2, filter_id=email_addr)
        context_str = ""
        if memories:
            context_str = " ".join([m.get("text") for m in memories])
            print(f"[EMAIL AGENT] Retrieved memory context: {context_str}")
        else:
            context_str = "No prior campaign interaction context recorded."

        prompt = f"""
        Generate a personalized B2B outreach email based on lead data and previous history memory context.
        Target Lead:
        Name: {c.get('name')}
        Company: {research.get('company')}
        Score Tier: {scoring.get('score')}/100 ({scoring.get('category')})
        Target Pain Points: {', '.join(research.get('possiblePainPoints', []))}
        Outreach strategy: {strategy.get('strategy')}
        Next Action: {strategy.get('nextAction')}
        
        Previous Campaign Interactions Context:
        "{context_str}"
        
        Requirements:
        - Incorporate the previous campaign context if it recommends approaches (e.g. if discounts failed, do not mention discounts; use educational approach).
        - Structure output as JSON containing exactly: "subject", "body", "callToAction", "followUpPlan".
        - Do not include placeholders like "[Your Name]". Write the email from "Sales Intelligence Platform".
        - Do not wrap in markdown.
        """
        output = run_llm_prompt(prompt, self.fallback, c, scoring, research, strategy, context_str)
        exec_time = int((time.time() - start_time) * 1000)
        
        # Save this generated action into Vector Memory so future campaigns recall it
        log_text = f"Campaign email sent. Subject: {output.get('subject')}. Strategy: {strategy.get('strategy')}."
        save_memory(email_addr, log_text, {"timestamp": datetime.datetime.utcnow().isoformat(), "action": "email_generation"})
        
        return output, exec_time

# 6. Revenue Forecast Agent
class RevenueForecastAgent:
    def fallback(self, leads):
        total_leads = len(leads)
        if total_leads == 0:
            return {"expectedRevenue": "$0", "conversionProbability": "0%", "confidence": 1.0}
            
        hot_leads = len([l for l in leads if l.get("category") == "HOT"])
        warm_leads = len([l for l in leads if l.get("category") == "WARM"])
        expected_rev = (hot_leads * 5000) + (warm_leads * 1500)
        
        prob = "50%"
        if total_leads > 0:
            prob = f"{int(((hot_leads * 0.8 + warm_leads * 0.4) / total_leads) * 100)}%"
            
        return {
            "expectedRevenue": f"${expected_rev:,}",
            "conversionProbability": prob,
            "confidence": 0.85
        }

    def run(self, leads):
        start_time = time.time()
        leads_summary = []
        for l in leads:
            leads_summary.append({
                "email": l.get("email"),
                "category": l.get("category"),
                "score": l.get("score"),
                "purchases": l.get("purchases", 0)
            })
            
        prompt = f"""
        Calculate expected pipeline revenue, conversion probability, and forecasting confidence based on leads.
        Leads Profile Summary:
        {json.dumps(leads_summary, indent=2)}

        Output MUST be a JSON object with keys:
        - "expectedRevenue": Expected pipeline revenue as a string, e.g., "$25,000".
        - "conversionProbability": Overall estimated conversion likelihood, e.g., "78%".
        - "confidence": Float 0.0-1.0 representing forecast confidence.
        Do not wrap in markdown.
        """
        output = run_llm_prompt(prompt, self.fallback, leads)
        exec_time = int((time.time() - start_time) * 1000)
        return output, exec_time

# 7. Manager Agent (Orchestrator)
class ManagerAgent:
    def __init__(self):
        self.crm_agent = CRMIntelligenceAgent()
        self.research_agent = CustomerResearchAgent()
        self.scoring_agent = AdvancedLeadScoringAgent()
        self.strategy_agent = SalesStrategyAgent()
        self.email_agent = EmailAgent()
        self.forecast_agent = RevenueForecastAgent()

    def process_crm_data(self, raw_data):
        print("[MANAGER AGENT] Running upgraded Python Multi-Agent workflow...")
        
        scored_leads = []
        logs = []
        
        for record in raw_data:
            email = record.get("email", "").strip().lower()
            name = record.get("name", "").strip()
            if not email or not name:
                continue
                
            # A) CRM Intelligence Agent
            crm_out, crm_time = self.crm_agent.run(record)
            logs.append({
                "agentName": "CRM Analyzer Agent",
                "input": record,
                "output": crm_out,
                "status": "success",
                "executionTime": crm_time,
                "error": ""
            })
            
            # B) Customer Research Agent
            res_out, res_time = self.research_agent.run(record)
            logs.append({
                "agentName": "Customer Research Agent",
                "input": {"name": name, "email": email},
                "output": res_out,
                "status": "success",
                "executionTime": res_time,
                "error": ""
            })
            
            # C) Lead Scoring Agent
            score_out, score_time = self.scoring_agent.run(record, res_out)
            logs.append({
                "agentName": "Lead Scoring Agent",
                "input": {"record": record, "research": res_out},
                "output": score_out,
                "status": "success",
                "executionTime": score_time,
                "error": ""
            })
            
            # D) Sales Strategy Agent
            strat_out, strat_time = self.strategy_agent.run(record, score_out, res_out)
            logs.append({
                "agentName": "Sales Strategy Agent",
                "input": {"score": score_out, "research": res_out},
                "output": strat_out,
                "status": "success",
                "executionTime": strat_time,
                "error": ""
            })
            
            # E) Email Agent
            email_out, email_time = self.email_agent.run(record, score_out, res_out, strat_out)
            logs.append({
                "agentName": "Email Agent",
                "input": {"score": score_out, "research": res_out, "strategy": strat_out},
                "output": email_out,
                "status": "success",
                "executionTime": email_time,
                "error": ""
            })
            
            # Compile results for this lead
            company = res_out.get("company", "")
            industry = res_out.get("industry", "")
            
            # Enrich lead dataset
            lead_details = {
                "name": name,
                "email": email,
                "visits": int(record.get("visits", 0)),
                "opens": int(record.get("opens", record.get("email_opens", 0))),
                "purchases": int(record.get("purchases", 0)),
                "company": company,
                "industry": industry,
                "score": score_out.get("score", 0),
                "category": score_out.get("category", "COLD"),
                
                # Nested insights object matching Mongoose Schema CustomerSchema
                "insights": {
                    "insights": crm_out.get("insights", ""),
                    "engagementScore": crm_out.get("engagementScore", 0),
                    "riskLevel": crm_out.get("riskLevel", "HIGH"),
                    "opportunities": crm_out.get("opportunities", ""),
                    "confidence": score_out.get("confidence", 0.0),
                    "reason": score_out.get("reason", ""),
                    "strategy": strat_out.get("strategy", ""),
                    "nextAction": strat_out.get("nextAction", ""),
                    "recommendedChannel": strat_out.get("recommendedChannel", ""),
                    "priority": strat_out.get("priority", "Low"),
                    "expectedRevenue": "", # will be filled or omitted at customer level
                    "conversionProbability": ""
                },
                "email": {
                    "subject": email_out.get("subject", ""),
                    "body": email_out.get("body", ""),
                    "cta": email_out.get("callToAction", ""),
                    "followUpPlan": email_out.get("followUpPlan", "")
                }
            }
            scored_leads.append(lead_details)
            
        # F) Revenue Forecast Agent
        forecast_out, forecast_time = self.forecast_agent.run(scored_leads)
        logs.append({
            "agentName": "Revenue Forecast Agent",
            "input": [{"email": l["email"], "category": l["category"]} for l in scored_leads],
            "output": forecast_out,
            "status": "success",
            "executionTime": forecast_time,
            "error": ""
        })
        
        # Enrich expected revenue per lead if possible based on forecast probabilities
        for lead in scored_leads:
            # Roughly estimate customer expected value
            prob_percent = 90 if lead["category"] == "HOT" else (40 if lead["category"] == "WARM" else 5)
            est_value = 5000 if lead["category"] == "HOT" else (1500 if lead["category"] == "WARM" else 100)
            lead["insights"]["expectedRevenue"] = f"${est_value:,}"
            lead["insights"]["conversionProbability"] = f"{prob_percent}%"

        # Calculate high level metrics
        total = len(scored_leads)
        avg_engage = 0
        if total > 0:
            avg_engage = sum([l["insights"]["engagementScore"] for l in scored_leads]) / total
            
        summary = {
            "totalCustomers": total,
            "averageEngagement": round(avg_engage, 1),
            "topCustomers": [f"{l['name']} ({l['purchases']} purchases)" for l in sorted(scored_leads, key=lambda x: x["purchases"], reverse=True)[:3]]
        }

        print("[MANAGER AGENT] Multi-Agent Python workflow completed.")
        return {
            "success": True,
            "summary": summary,
            "scoredLeads": scored_leads,
            "forecast": forecast_out,
            "logs": logs
        }
