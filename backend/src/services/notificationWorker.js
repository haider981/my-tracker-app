// // backend/src/services/notificationWorker.js
// const notificationQueue = require('../config/queue');
// const { NotificationService } = require('./notificationService');

// const notificationService = new NotificationService();

// // Process notification jobs
// notificationQueue.process(async (job) => {
//   const { userId, type, data } = job.data;  // ✅ FIXED - Extract userId
  
//   console.log(`🔄 Processing notification: ${type} for user ${userId}`);  // ✅ FIXED - Use parentheses

//   try {
//     const methodMap = {
//       ENTRY_APPROVED_BY_SPOC: 'notifyEntryApprovedBySpoc',
//       ENTRY_REJECTED_BY_SPOC: 'notifyEntryRejectedBySpoc',
//       ENTRY_APPROVED_BY_ADMIN: 'notifyEntryApprovedByAdmin',
//       ENTRY_REJECTED_BY_ADMIN: 'notifyEntryRejectedByAdmin',
//       ENTRY_ADDED_BY_ADMIN: 'notifyEntryAddedByAdmin',
//       ENTRY_EDITED_BY_ADMIN: 'notifyEntryEditedByAdmin',
//       MISSING_ENTRY_APPROVED_BY_SPOC: 'notifyMissingEntryApprovedBySpoc',
//       MISSING_ENTRY_REJECTED_BY_SPOC: 'notifyMissingEntryRejectedBySpoc',
//       MISSING_ENTRY_APPROVED_BY_ADMIN: 'notifyMissingEntryApprovedByAdmin',
//       MISSING_ENTRY_REJECTED_BY_ADMIN: 'notifyMissingEntryRejectedByAdmin',
//       NIGHT_SHIFT_MARKED: 'notifyNightShiftMarked',
//       SUNDAY_SHIFT_MARKED: 'notifySundayShiftMarked',
//       SPOC_ENTRY_APPROVED_BY_ADMIN: 'notifySpocEntryApproved',
//       SPOC_ENTRY_REJECTED_BY_ADMIN: 'notifySpocEntryRejected',
//       SPOC_MISSING_ENTRY_APPROVED: 'notifySpocMissingEntryApproved',
//       SPOC_MISSING_ENTRY_REJECTED: 'notifySpocMissingEntryRejected',
//       SPOC_SHIFT_MARKED_BY_ADMIN: 'notifySpocShiftMarkedByAdmin',
//       PROJECT_APPROVED_BY_ADMIN: 'notifyProjectApproved',
//       PROJECT_REJECTED_BY_ADMIN: 'notifyProjectRejected',
//     };

//     const methodName = methodMap[type];
    
//     if (methodName && typeof notificationService[methodName] === 'function') {
//       await notificationService[methodName](data);
//       console.log(`✅ Notification ${type} processed successfully for user ${userId}`);  // ✅ FIXED
//     } else {
//       console.warn(`⚠️ Unknown notification type: ${type}`);  // ✅ FIXED
//     }

//     return { success: true, type, userId };  // ✅ Include userId in response
//   } catch (error) {
//     console.error(`❌ Error processing notification ${type} for user ${userId}:`, error);  // ✅ FIXED
//     throw error;
//   }
// });

// console.log('🚀 Notification worker started and listening for jobs...');

// // Graceful shutdown
// process.on('SIGTERM', async () => {
//   console.log('🛑 SIGTERM received, closing notification worker...');
//   await notificationQueue.close();
//   process.exit(0);
// });

// module.exports = notificationQueue;


const notificationQueue = require('../config/queue');
const { NotificationService } = require('./notificationService');

const notificationService = new NotificationService();

// Process notification jobs
notificationQueue.process(async (job) => {
  const { userId, type, data } = job.data;
  
  // ✅ FIXED - Use parentheses, not backticks!
  console.log(`🔄 Processing notification: ${type} for user ${userId}`);
  
  try {
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
    
    const methodName = methodMap[type];
    
    if (methodName && typeof notificationService[methodName] === 'function') {
      await notificationService[methodName](data);
      console.log(`✅ Notification ${type} processed successfully for user ${userId}`);
    } else {
      console.warn(`⚠️ Unknown notification type: ${type}`);
    }
    
    return { success: true, type, userId };
    
  } catch (error) {
    console.error(`❌ Error processing notification ${type} for user ${userId}:`, error);
    throw error; // Let Bull handle retries
  }
});

console.log('🚀 Notification worker started and listening for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing notification worker...');
  await notificationQueue.close();
  process.exit(0);
});

module.exports = notificationQueue;
