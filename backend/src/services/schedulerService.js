// const cron = require('node-cron');
// const { autoSubmitWorklogsAndAssignLeave } = require('../controllers/scheduledJobController');

// let scheduledJobs = {};

// const IST_TIMEZONE = 'Asia/Kolkata';

// function initializeScheduledJobs() {
//   console.log('Initializing scheduled jobs...');

//   try {
//     // Main auto-submit job - runs at 22:30 IST daily
//     const autoSubmitTask = cron.schedule('30 22 * * *', async () => {
//       console.log(`🚀 Auto-submit job triggered at: ${new Date().toLocaleString('en-IN', { timeZone: IST_TIMEZONE })}`);
      
//       try {
//         const result = await autoSubmitWorklogsAndAssignLeave();
//         console.log('Auto-submit job completed:', result);
//       } catch (error) {
//         console.error('Auto-submit job failed:', error);
//       }
//     }, {
//       scheduled: true,
//       timezone: IST_TIMEZONE
//     });

//     scheduledJobs['auto-submit'] = autoSubmitTask;

//     // Optional: Test job for debugging (disabled by default)
//     const shouldEnableTestJob = process.env.ENABLE_TEST_JOB === 'true';
    
//     if (shouldEnableTestJob) {
//       const testTask = cron.schedule('*/2 * * * *', () => {
//         const now = new Date().toLocaleString('en-IN', { 
//           timeZone: IST_TIMEZONE,
//           day: '2-digit',
//           month: '2-digit', 
//           year: 'numeric',
//           hour: '2-digit',
//           minute: '2-digit',
//           second: '2-digit',
//           hour12: true
//         });
//         console.log(`🧪 Test job running every 2 minutes - Current time: ${now}`);
//       }, {
//         scheduled: true,
//         timezone: IST_TIMEZONE
//       });
      
//       scheduledJobs['test'] = testTask;
//       console.log('   - Test job: Enabled (runs every 2 minutes)');
//     } else {
//       console.log('   - Test job: Disabled (can be enabled for debugging)');
//     }

//     console.log('📅 Scheduled jobs initialized:');
//     console.log('   - Auto-submit worklogs and leave assignment: Every day at 22:30 IST');
    
//     return scheduledJobs;
//   } catch (error) {
//     console.error('Failed to initialize scheduled jobs:', error);
//     return {};
//   }
// }

// function stopAllScheduledJobs() {
//   console.log('🛑 Stopping all scheduled jobs...');
  
//   Object.keys(scheduledJobs).forEach((jobName) => {
//     try {
//       scheduledJobs[jobName].stop();
//       console.log(`   - Stopped job: ${jobName}`);
//     } catch (error) {
//       console.error(`   - Failed to stop job ${jobName}:`, error);
//     }
//   });

//   scheduledJobs = {};
//   console.log('All scheduled jobs stopped');
// }

// // Backup trigger function (can be called externally)
// async function triggerAutoSubmitManually() {
//   console.log('Manual trigger for auto-submit job initiated');
//   try {
//     const result = await autoSubmitWorklogsAndAssignLeave();
//     console.log('Manual auto-submit completed:', result);
//     return result;
//   } catch (error) {
//     console.error('Manual auto-submit failed:', error);
//     throw error;
//   }
// }

// module.exports = {
//   initializeScheduledJobs,
//   stopAllScheduledJobs,
//   triggerAutoSubmitManually
// };


const cron = require('node-cron');
const { autoSubmitWorklogsAndAssignLeave } = require('../controllers/scheduledJobController');

let scheduledJobs = {};

function initializeScheduledJobs() {
  console.log('Initializing scheduled jobs...');
  
  try {
    // Main auto-submit job - runs at 21:30 UTC daily (3:00 AM IST)
    // UTC timing: 2025-10-15 21:30 UTC = 2025-10-16 03:00 IST
    const autoSubmitTask = cron.schedule('30 21 * * *', async () => {
      const now = new Date();
      console.log(`🚀 Auto-submit job triggered at: ${now.toISOString()} (UTC)`);
      console.log(`   IST time: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      
      try {
        const result = await autoSubmitWorklogsAndAssignLeave();
        console.log('Auto-submit job completed:', result);
      } catch (error) {
        console.error('Auto-submit job failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC' // Changed from 'Asia/Kolkata' to 'UTC'
    });
    
    scheduledJobs['auto-submit'] = autoSubmitTask;

    // Optional: Test job for debugging (disabled by default)
    const shouldEnableTestJob = process.env.ENABLE_TEST_JOB === 'true';
    
    if (shouldEnableTestJob) {
      const testTask = cron.schedule('*/2 * * * *', () => {
        const now = new Date();
        console.log(`🧪 Test job - UTC: ${now.toISOString()}`);
        console.log(`   IST: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      
      scheduledJobs['test'] = testTask;
      console.log('   - Test job: Enabled (runs every 2 minutes)');
    } else {
      console.log('   - Test job: Disabled (can be enabled for debugging)');
    }
    
    console.log('📅 Scheduled jobs initialized:');
    console.log('   - Auto-submit worklogs: Every day at 21:30 UTC (03:00 AM IST)');
    
    return scheduledJobs;
  } catch (error) {
    console.error('Failed to initialize scheduled jobs:', error);
    return {};
  }
}

function stopAllScheduledJobs() {
  console.log('🛑 Stopping all scheduled jobs...');
  
  Object.keys(scheduledJobs).forEach((jobName) => {
    try {
      scheduledJobs[jobName].stop();
      console.log(`   - Stopped job: ${jobName}`);
    } catch (error) {
      console.error(`   - Failed to stop job ${jobName}:`, error);
    }
  });
  
  scheduledJobs = {};
  console.log('All scheduled jobs stopped');
}

// Backup trigger function (can be called externally)
async function triggerAutoSubmitManually() {
  console.log('Manual trigger for auto-submit job initiated');
  try {
    const result = await autoSubmitWorklogsAndAssignLeave();
    console.log('Manual auto-submit completed:', result);
    return result;
  } catch (error) {
    console.error('Manual auto-submit failed:', error);
    throw error;
  }
}

module.exports = {
  initializeScheduledJobs,
  stopAllScheduledJobs,
  triggerAutoSubmitManually
};
