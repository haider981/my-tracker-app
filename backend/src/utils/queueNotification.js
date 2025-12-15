// // backend/src/utils/queueNotification.js
// const notificationQueue = require('../config/queue');

// /**
//  * Queue a notification job
//  * @param {Object} params - Notification parameters
//  * @param {number|string} params.userId - User ID to notify
//  * @param {string} params.type - Notification type
//  * @param {Object} params.data - Notification data
//  * @param {Object} options - Queue options (optional)
//  */
// async function queueNotification({ userId, type, data }, options = {}) {
//   try {
//     // Add userId to the data object so the worker can access it
//     const jobData = {
//       userId,
//       type,
//       data
//     };

//     const job = await notificationQueue.add(
//       jobData,
//       {
//         priority: options.priority || 1,
//         delay: options.delay || 0,
//         ...options,
//       }
//     );
    
//     console.log(`📮 Queued notification: ${type} for user ${userId} (Job ID: ${job.id})`);
//     return job;
//   } catch (error) {
//     console.error(`❌ Error queueing notification (type: ${type}, userId: ${userId}):`, error);
//     throw error;
//   }
// }

// module.exports = { queueNotification };


const notificationQueue = require('../config/queue');

/**
 * Queue a notification job
 * @param {Object} params - Notification parameters
 * @param {number|string} params.userId - User ID to notify
 * @param {string} params.type - Notification type
 * @param {Object} params.data - Notification data
 * @param {Object} options - Queue options (optional)
 */
async function queueNotification({ userId, type, data }, options = {}) {
  try {
    const jobData = {
      userId,
      type,
      data
    };
    
    const job = await notificationQueue.add(
      jobData,
      {
        priority: options.priority || 1,
        delay: options.delay || 0,
        ...options,
      }
    );
    
    // ✅ FIXED - Use parentheses!
    console.log(`📮 Queued notification: ${type} for user ${userId} (Job ID: ${job.id})`);
    return job;
    
  } catch (error) {
    console.error(`❌ Error queueing notification (type: ${type}, userId: ${userId}):`, error);
    throw error;
  }
}

module.exports = { queueNotification };
