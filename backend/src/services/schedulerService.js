// const cron = require('node-cron');
// const { autoSubmitWorklogsAndAssignLeave } = require('../controllers/scheduledJobController');

// /**
//  * Initialize all scheduled jobs
//  */
// const initializeScheduledJobs = () => {
//   console.log('Initializing scheduled jobs...');

//   // Schedule auto-submit worklogs and leave assignment at 22:30 (10:30 PM) every day
//   // Cron format: second minute hour day month dayOfWeek
//   // '0 30 22 * * *' = At 22:30:00 every day
//   const autoSubmitAndLeaveJob = cron.schedule('0 57 09 * * *', async () => {
//     console.log('🕙 Running scheduled auto-submit worklogs and leave assignment at 22:30...');
    
//     try {
//       const result = await autoSubmitWorklogsAndAssignLeave();
      
//       if (result.success) {
//         console.log('✅ Auto-submit worklogs and leave assignment completed:', {
//           processed: result.processed,
//           submitted: result.submitted,
//           leaveAssigned: result.leaveAssigned,
//           message: result.message
//         });
        
//         // Log details of processed users
//         if (result.processedUsers && result.processedUsers.length > 0) {
//           console.log('📋 Processed users details:');
//           result.processedUsers.forEach(user => {
//             console.log(`   - ${user.name}: ${user.action} ${user.entriesCount ? `(${user.entriesCount} entries)` : `(${user.hours || 0} hours)`}`);
//           });
//         }
//       } else {
//         console.error('❌ Auto-submit worklogs and leave assignment failed:', result.error);
//       }
//     } catch (error) {
//       console.error('❌ Scheduled auto-submit worklogs and leave assignment error:', error);
//     }
//   }, {
//     scheduled: true,
//     timezone: "Asia/Kolkata" 
//   });

//   // Test job for debugging - runs every 2 minutes
//   const testJob = cron.schedule('*/2 * * * *', async () => {
//     console.log('🧪 Test job running every 2 minutes - Current time:', new Date().toLocaleString("en-IN", {timeZone: "Asia/Kolkata"}));
    
//     // Uncomment below lines to test the auto-submit function every 2 minutes (for debugging only)
//     // console.log('🧪 Running test auto-submit...');
//     // const result = await autoSubmitWorklogsAndAssignLeave();
//     // console.log('🧪 Test result:', result.message);
//   }, {
//     scheduled: false // Disabled by default
//   });

//   console.log('📅 Scheduled jobs initialized:');
//   console.log('   - Auto-submit worklogs and leave assignment: Every day at 22:30 IST');
//   console.log('   - Test job: Disabled (can be enabled for debugging)');

//   return {
//     autoSubmitAndLeaveJob,
//     testJob,
//     // Method to start test job for debugging
//     startTestJob: () => {
//       console.log('🧪 Starting test job for debugging...');
//       testJob.start();
//     },
//     // Method to stop test job
//     stopTestJob: () => {
//       console.log('🛑 Stopping test job...');
//       testJob.stop();
//     },
//     // Method to manually trigger the auto-submit job (useful for testing)
//     triggerAutoSubmitJob: async () => {
//       console.log('🔄 Manually triggering auto-submit worklogs and leave assignment...');
//       try {
//         const result = await autoSubmitWorklogsAndAssignLeave();
//         console.log('✅ Manual trigger result:', result);
//         return result;
//       } catch (error) {
//         console.error('❌ Manual trigger error:', error);
//         return { success: false, error: error.message };
//       }
//     }
//   };
// };

// /**
//  * Stop all scheduled jobs (useful for graceful shutdown)
//  */
// const stopAllScheduledJobs = () => {
//   console.log('🛑 Stopping all scheduled jobs...');
//   cron.getTasks().forEach((task, name) => {
//     task.stop();
//     console.log(`   - Stopped job: ${name}`);
//   });
// };

// module.exports = {
//   initializeScheduledJobs,
//   stopAllScheduledJobs
// };


// src/services/schedulerService.js - Updated version
const cron = require('node-cron');
const { autoSubmitWorklogsAndAssignLeave } = require('../controllers/scheduledJobController');

let scheduledJobs = {};

const IST_TIMEZONE = 'Asia/Kolkata';

function initializeScheduledJobs() {
  console.log('Initializing scheduled jobs...');

  try {
    // Main auto-submit job - runs at 22:30 IST daily
    const autoSubmitTask = cron.schedule('30 22 * * *', async () => {
      console.log(`🚀 Auto-submit job triggered at: ${new Date().toLocaleString('en-IN', { timeZone: IST_TIMEZONE })}`);
      
      try {
        const result = await autoSubmitWorklogsAndAssignLeave();
        console.log('Auto-submit job completed:', result);
      } catch (error) {
        console.error('Auto-submit job failed:', error);
      }
    }, {
      scheduled: true,
      timezone: IST_TIMEZONE
    });

    scheduledJobs['auto-submit'] = autoSubmitTask;

    // Optional: Test job for debugging (disabled by default)
    const shouldEnableTestJob = process.env.ENABLE_TEST_JOB === 'true';
    
    if (shouldEnableTestJob) {
      const testTask = cron.schedule('*/2 * * * *', () => {
        const now = new Date().toLocaleString('en-IN', { 
          timeZone: IST_TIMEZONE,
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        console.log(`🧪 Test job running every 2 minutes - Current time: ${now}`);
      }, {
        scheduled: true,
        timezone: IST_TIMEZONE
      });
      
      scheduledJobs['test'] = testTask;
      console.log('   - Test job: Enabled (runs every 2 minutes)');
    } else {
      console.log('   - Test job: Disabled (can be enabled for debugging)');
    }

    console.log('📅 Scheduled jobs initialized:');
    console.log('   - Auto-submit worklogs and leave assignment: Every day at 22:30 IST');
    
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
