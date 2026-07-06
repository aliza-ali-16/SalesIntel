import axios from 'axios';

// Scored Leads list
export const getLeads = () => axios.get('/agents/leads');

// Compiled Dashboard metrics
export const getDashboardStats = () => axios.get('/agents/dashboard-stats');

// Outreach email drafts
export const getEmails = () => axios.get('/agents/emails');

// Approve email draft
export const approveEmail = (id) => axios.post(`/agents/emails/${id}/approve`);

// Reject email draft
export const rejectEmail = (id) => axios.post(`/agents/emails/${id}/reject`);

// Dispatch email
export const sendEmail = (id) => axios.post(`/agents/emails/${id}/send`);

// Regenerate draft
export const regenerateEmail = (id) => axios.post(`/agents/emails/${id}/regenerate`);

// Agent system execution logs
export const getLogs = () => axios.get('/agents/logs');

// Manually trigger multi-agent scoring workflow
export const runAnalysis = () => axios.post('/agents/analyze');

// Followup schedule dates
export const getFollowups = () => axios.get('/agents/followups');

// Complete followup item
export const completeFollowup = (id) => axios.post(`/agents/followups/${id}/complete`);
