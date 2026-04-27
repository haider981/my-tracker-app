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
const { NotificationService } = require('../services/notificationService');

const notificationService = new NotificationService();

function getNotificationMethod(type) {
  const methodMap = {
    ENTRY_APPROVED_BY_SPOC: 'notifyEntryApprovedBySpoc',
    ENTRY_REJECTED_BY_SPOC: 'notifyEntryRejectedBySpoc',
    ENTRY_APPROVED_BY_ADMIN: 'notifyEntryApprovedByAdmin',
    ENTRY_REJECTED_BY_ADMIN: 'notifyEntryRejectedByAdmin',
    ENTRY_ADDED_BY_ADMIN: 'notifyEntryAddedByAdmin',
    ENTRY_EDITED_BY_ADMIN: 'notifyEntryEditedByAdmin',
    MISSING_ENTRY_APPROVED_BY_SPOC: 'notifyMissingEntryApprovedBySpoc',
    MISSING_ENTRY_REJECTED_BY_SPOC: 'notifyMissingEntryRejectedBySpoc',
    MISSING_ENTRY_APPROVED_BY_ADMIN: 'notifyMissingEntryApprovedByAdmin',
    MISSING_ENTRY_REJECTED_BY_ADMIN: 'notifyMissingEntryRejectedByAdmin',
    NIGHT_SHIFT_MARKED: 'notifyNightShiftMarked',
    SUNDAY_SHIFT_MARKED: 'notifySundayShiftMarked',
    SPOC_ENTRY_APPROVED_BY_ADMIN: 'notifySpocEntryApproved',
    SPOC_ENTRY_REJECTED_BY_ADMIN: 'notifySpocEntryRejected',
    SPOC_MISSING_ENTRY_APPROVED: 'notifySpocMissingEntryApproved',
    SPOC_MISSING_ENTRY_REJECTED: 'notifySpocMissingEntryRejected',
    SPOC_SHIFT_MARKED_BY_ADMIN: 'notifySpocShiftMarkedByAdmin',
    PROJECT_APPROVED_BY_ADMIN: 'notifyProjectApproved',
    PROJECT_REJECTED_BY_ADMIN: 'notifyProjectRejected',
  };

  return methodMap[type];
}

async function processNotificationDirectly(type, data, userId) {
  const methodName = getNotificationMethod(type);
  if (!methodName || typeof notificationService[methodName] !== 'function') {
    throw new Error(`Unsupported notification type for direct processing: ${type}`);
  }

  const result = await notificationService[methodName](data);
  console.log(`📩 Direct notification processed: ${type} for user ${userId}`);
  return result;
}

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
    // If Redis isn't configured, process notification directly.
    if (!process.env.REDIS_HOST || !process.env.REDIS_PASSWORD) {
      return await processNotificationDirectly(type, data, userId);
    }

    const jobData = {
      userId,
      type,
      data
    };

    const addJobPromise = notificationQueue.add(
      jobData,
      {
        priority: options.priority || 1,
        delay: options.delay || 0,
        ...options,
      }
    );

    // Avoid blocking API requests too long when Redis is slow/unreachable.
    const job = await Promise.race([
      addJobPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Notification queue timeout')), 1500)
      ),
    ]);
    
    // ✅ FIXED - Use parentheses!
    console.log(`📮 Queued notification: ${type} for user ${userId} (Job ID: ${job.id})`);
    return job;
    
  } catch (error) {
    console.error(`❌ Queue failed, using direct notification (type: ${type}, userId: ${userId}):`, error.message);
    return await processNotificationDirectly(type, data, userId);
  }
}

module.exports = { queueNotification };
