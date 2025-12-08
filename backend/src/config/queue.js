const Queue = require('bull');

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false // Required for Upstash
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const notificationQueue = new Queue('notifications', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

notificationQueue.on('completed', (job) => {
  console.log(`✓ Job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`✗ Job ${job.id} failed:`, err.message);
});

module.exports = notificationQueue;
