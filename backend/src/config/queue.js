// const Queue = require('bull');

// const redisConfig = {
//   host: process.env.REDIS_HOST,
//   port: process.env.REDIS_PORT || 6379,
//   password: process.env.REDIS_PASSWORD,
//   tls: {
//     rejectUnauthorized: false // Required for Upstash
//   },
//   maxRetriesPerRequest: null,
//   enableReadyCheck: false,
// };

// const notificationQueue = new Queue('notifications', {
//   redis: redisConfig,
//   defaultJobOptions: {
//     attempts: 3,
//     backoff: {
//       type: 'exponential',
//       delay: 2000,
//     },
//     removeOnComplete: true,
//     removeOnFail: false,
//   },
// });

// notificationQueue.on('completed', (job) => {
//   console.log(`✓ Job ${job.id} completed`);
// });

// notificationQueue.on('failed', (job, err) => {
//   console.error(`✗ Job ${job.id} failed:`, err.message);
// });

// module.exports = notificationQueue;


const Queue = require('bull');

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const notificationQueue = new Queue('notifications', {
  redis: redisConfig,
  
  // ✅ CRITICAL SETTINGS TO REDUCE REDIS COMMANDS
  settings: {
    stalledInterval: 60000,      // Check for stalled jobs every 60s (was ~5s)
    lockDuration: 60000,         // Lock jobs for 60s
    lockRenewTime: 30000,        // Renew lock every 30s
    maxStalledCount: 2,          // Max times a job can stall before failing
  },
  
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    
    // ✅ AUTO-CLEANUP OLD JOBS - CRITICAL!
    removeOnComplete: {
      age: 3600,    // Remove completed jobs after 1 hour
      count: 100,   // Keep max 100 completed jobs
    },
    removeOnFail: {
      age: 86400,   // Remove failed jobs after 24 hours
    },
  },
});

// ✅ MINIMAL EVENT LOGGING - No Redis queries
notificationQueue.on('completed', (job) => {
  console.log(`✓ Job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`✗ Job ${job.id} failed:`, err.message);
});

module.exports = notificationQueue;
