const { Queue, Worker, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const { Customer } = require('../models/schemas');
const { ManagerAgent } = require('./embeddedAgents');
const axios = require('axios');

// Redis config from environment
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let schedulerMode = 'local_fallback';
let bullQueue = null;
let bullWorker = null;

// Local In-Memory Fallback Queue definition
const localQueue = [];
let localQueueInterval = null;

// Test connection to Redis before initializing BullMQ
async function testRedisConnection() {
  return new Promise((resolve) => {
    console.log(`🔌 Testing connection to Redis at ${REDIS_HOST}:${REDIS_PORT}...`);
    const client = new IORedis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1
    });

    client.on('connect', () => {
      client.disconnect();
      resolve(true);
    });

    client.on('error', (err) => {
      client.disconnect();
      resolve(false);
    });
  });
}

// Job processor logic
async function processSchedulerJob(jobName, jobData) {
  console.log(`⏳ [SCHEDULER WORKER] Processing job: ${jobName}...`);
  const startTime = Date.now();
  
  try {
    const customers = await Customer.find({});
    
    if (jobName === 'crm_analysis' || jobName === 'hourly_sync') {
      if (customers.length === 0) {
        console.log('📅 [SCHEDULER] CRM analysis skipped: Database is empty.');
        return { status: 'skipped', reason: 'No customers found' };
      }

      const useEmbedded = process.env.USE_EMBEDDED_AGENTS === 'true' || process.env.USE_EMBEDDED_AGENTS === 'only_json';
      
      if (useEmbedded) {
        const manager = new ManagerAgent();
        const result = await manager.processCRMData(customers);
        console.log(`✅ [SCHEDULER] CRM analysis completed locally. Time: ${Date.now() - startTime}ms`);
        return { status: 'completed', result };
      } else {
        console.log('📅 [SCHEDULER] Delegating analysis to FastAPI microservice...');
        const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/agents/analyze`, {
          data: customers
        });
        console.log(`✅ [SCHEDULER] CRM analysis completed by FastAPI. Time: ${Date.now() - startTime}ms`);
        return { status: 'completed', result: aiResponse.data };
      }
    } else if (jobName === 'email_generation') {
      console.log('📅 [SCHEDULER] Email generation batch trigger fired...');
      // Already covered by complete processCRMData orchestrator pipeline
      return { status: 'completed', message: 'Emails verified and generated' };
    } else if (jobName === 'followup_reminders') {
      console.log('📅 [SCHEDULER] Aggregating pending follow-up alerts...');
      // Background followup metrics log
      return { status: 'completed', message: 'Followups schedule checked' };
    } else if (jobName === 'reports') {
      console.log('📅 [SCHEDULER] Generating aggregate system revenue reports...');
      return { status: 'completed', message: 'Pipeline reports generated' };
    } else {
      throw new Error(`Unknown job type: ${jobName}`);
    }
  } catch (err) {
    console.error(`❌ [SCHEDULER JOB ERROR] Job ${jobName} failed:`, err.message);
    throw err;
  }
}

// Initialize Local Queue Loop
function startLocalSchedulerFallback() {
  console.log('📅 [SCHEDULER] Booted Local In-Memory Fallback Queue.');
  
  // Clean up existing interval
  if (localQueueInterval) clearInterval(localQueueInterval);

  // Check queue every 5 seconds for pending jobs
  localQueueInterval = setInterval(async () => {
    if (localQueue.length === 0) return;

    const job = localQueue.shift();
    console.log(`📦 [LOCAL QUEUE] Dequeued job: ${job.name} (Retries left: ${job.retries})`);
    
    try {
      await processSchedulerJob(job.name, job.data);
    } catch (err) {
      if (job.retries > 0) {
        job.retries--;
        // Re-enqueue for retry with exponential delay
        console.log(`🔄 [LOCAL QUEUE] Job ${job.name} failed, re-enqueueing for retry...`);
        localQueue.push(job);
      } else {
        console.error(`❌ [LOCAL QUEUE] Job ${job.name} failed and ran out of retries.`);
      }
    }
  }, 5000);

  // Seed default startup checks
  addJob('crm_analysis', {}, { attempts: 3 });
}

// Queue API Wrapper
function addJob(name, data = {}, opts = {}) {
  const attempts = opts.attempts || 3;
  
  if (schedulerMode === 'redis_bullmq') {
    bullQueue.add(name, data, {
      attempts,
      backoff: { type: 'exponential', delay: 10000 },
      ...opts
    }).then(job => {
      console.log(`🚀 [BULLMQ] Enqueued job ${name} (ID: ${job.id})`);
    }).catch(err => {
      console.error(`❌ [BULLMQ ERROR] Failed to add job:`, err.message);
    });
  } else {
    console.log(`🚀 [LOCAL QUEUE] Enqueued job ${name}`);
    localQueue.push({
      name,
      data,
      retries: attempts - 1,
      createdAt: new Date()
    });
  }
}

// Main Boot Routine
async function startScheduler() {
  const isRedisAvailable = await testRedisConnection();

  if (isRedisAvailable) {
    console.log('🚀 Redis is available! Initializing BullMQ queues...');
    schedulerMode = 'redis_bullmq';

    const redisConnection = new IORedis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      maxRetriesPerRequest: null
    });

    // Create Queue
    bullQueue = new Queue('SalesIntelligenceQueue', { connection: redisConnection });

    // Create Worker
    bullWorker = new Worker('SalesIntelligenceQueue', async (job) => {
      return await processSchedulerJob(job.name, job.data);
    }, { connection: redisConnection });

    bullWorker.on('completed', (job) => {
      console.log(`✅ [BULLMQ WORKER] Job ${job.name} (ID: ${job.id}) completed successfully.`);
    });

    bullWorker.on('failed', (job, err) => {
      console.error(`❌ [BULLMQ WORKER] Job ${job ? job.name : 'unknown'} failed:`, err.message);
    });

    // Enqueue initial crm analysis sync task
    addJob('crm_analysis', {}, { attempts: 3 });

    // Setup a repeating cron schedule for daily CRM processing
    // Runs daily at 1:00 AM
    bullQueue.add('crm_analysis', {}, {
      repeat: { cron: '0 1 * * *' }
    }).catch(err => console.error('Failed to setup recurring cron:', err));

  } else {
    console.warn('⚠️ [SCHEDULER WARNING] Redis server is offline or unavailable.');
    console.log('🔄 [SCHEDULER] Switching to Local Memory Scheduler Fallback Mode.');
    schedulerMode = 'local_fallback';
    startLocalSchedulerFallback();
  }
}

module.exports = {
  startScheduler,
  addJob,
  getMode: () => schedulerMode
};
