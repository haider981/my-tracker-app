// backend/src/services/notificationService.js
const prisma = require('../config/prisma');

const NOTIFICATION_TYPES = {
  // Employee Entry notifications
  ENTRY_APPROVED_BY_SPOC: 'ENTRY_APPROVED_BY_SPOC',
  ENTRY_REJECTED_BY_SPOC: 'ENTRY_REJECTED_BY_SPOC',
  ENTRY_APPROVED_BY_ADMIN: 'ENTRY_APPROVED_BY_ADMIN',
  ENTRY_REJECTED_BY_ADMIN: 'ENTRY_REJECTED_BY_ADMIN',
  ENTRY_ADDED_BY_ADMIN: 'ENTRY_ADDED_BY_ADMIN',
  ENTRY_EDITED_BY_ADMIN: 'ENTRY_EDITED_BY_ADMIN',

  // Missing Entry notifications
  MISSING_ENTRY_APPROVED_BY_SPOC: 'MISSING_ENTRY_APPROVED_BY_SPOC',
  MISSING_ENTRY_REJECTED_BY_SPOC: 'MISSING_ENTRY_REJECTED_BY_SPOC',
  MISSING_ENTRY_APPROVED_BY_ADMIN: 'MISSING_ENTRY_APPROVED_BY_ADMIN',
  MISSING_ENTRY_REJECTED_BY_ADMIN: 'MISSING_ENTRY_REJECTED_BY_ADMIN',

  // Shift notifications
  NIGHT_SHIFT_MARKED: 'NIGHT_SHIFT_MARKED',
  SUNDAY_SHIFT_MARKED: 'SUNDAY_SHIFT_MARKED',

  // Spoc notifications
  SPOC_ENTRY_APPROVED_BY_ADMIN: 'SPOC_ENTRY_APPROVED_BY_ADMIN',
  SPOC_ENTRY_REJECTED_BY_ADMIN: 'SPOC_ENTRY_REJECTED_BY_ADMIN',
  SPOC_MISSING_ENTRY_APPROVED: 'SPOC_MISSING_ENTRY_APPROVED',
  SPOC_MISSING_ENTRY_REJECTED: 'SPOC_MISSING_ENTRY_REJECTED',
  SPOC_SHIFT_MARKED_BY_ADMIN: 'SPOC_SHIFT_MARKED_BY_ADMIN',
  PROJECT_APPROVED_BY_ADMIN: 'PROJECT_APPROVED_BY_ADMIN',
  PROJECT_REJECTED_BY_ADMIN: 'PROJECT_REJECTED_BY_ADMIN',

  // Admin notifications
  // ADMIN_MISSING_ENTRY_PENDING: 'ADMIN_MISSING_ENTRY_PENDING',
  // ADMIN_PROJECT_REQUEST_PENDING: 'ADMIN_PROJECT_REQUEST_PENDING',
};

class NotificationService {
  /**
   * Create a notification in the database
   * @param {number|string} userId - User ID (will be converted to integer)
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} data - Additional data
   */
  async createNotification({ userId, type, title, message, data = {} }) {
    try {
      // Ensure userId is an integer
      const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;

      if (!Number.isInteger(userIdInt) || userIdInt <= 0) {
        throw new Error(`Invalid userId: ${userId}. Must be a positive integer.`);
      }

      const notification = await prisma.notification.create({
        data: {
          userId: userIdInt,
          type,
          title,
          message,
          data,
          isRead: false,
        },
      });

      console.log(`📬 Notification created: ${notification.id} for user ${userIdInt}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // =================== EMPLOYEE NOTIFICATIONS ===================

  // Employee Entry Approved by SPOC
  async notifyEntryApprovedBySpoc({ employeeId, spocName, entryDate, entryId, bulkCount }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    const message = bulkCount > 1
      ? `${bulkCount} entries of date ${formattedDate} have been approved by your SPOC (${spocName})`
      : `Your entry of date ${formattedDate} has been approved by your SPOC (${spocName})`;

    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.ENTRY_APPROVED_BY_SPOC,
      title: '✓ Entry Approved',
      message,
      data: { entryId, entryDate, spocName, bulkCount },
    });
  }

  // Employee Entry Rejected by SPOC
  async notifyEntryRejectedBySpoc({ employeeId, spocName, entryDate, entryId, reason, bulkCount }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    const message = bulkCount > 1
      ? `${bulkCount} entries of date ${formattedDate} have been rejected by your SPOC (${spocName})`
      : `Your entry of date ${formattedDate} has been rejected by your SPOC (${spocName})`;

    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.ENTRY_REJECTED_BY_SPOC,
      title: '✗ Entry Rejected',
      message,
      data: { entryId, entryDate, spocName, reason, bulkCount },
    });
  }

  // Employee Entry Approved by Admin
  async notifyEntryApprovedByAdmin({ employeeId, adminName, entryDate, entryId, bulkCount }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    const message = bulkCount > 1
      ? `${bulkCount} entries of date ${formattedDate} have been approved by Admin (${adminName})`
      : `Your entry of date ${formattedDate} has been approved by Admin (${adminName})`;

    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.ENTRY_APPROVED_BY_ADMIN,
      title: '✓ Entry Approved by Admin',
      message,
      data: { entryId, entryDate, adminName, bulkCount },
    });
  }

  // Employee Entry Rejected by Admin
  async notifyEntryRejectedByAdmin({ employeeId, adminName, entryDate, entryId, reason, bulkCount }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    const message = bulkCount > 1
      ? `${bulkCount} entries of date ${formattedDate} have been rejected by Admin (${adminName})`
      : `Your entry of date ${formattedDate} has been rejected by Admin (${adminName})`;

    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.ENTRY_REJECTED_BY_ADMIN,
      title: '✗ Entry Rejected by Admin',
      message,
      data: { entryId, entryDate, adminName, reason, bulkCount },
    });
  }

  // Entry Added by Admin
  async notifyEntryAddedByAdmin({ employeeId, adminName, entryDate, entryId, bulkCount }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    const message = bulkCount > 1
      ? `${bulkCount} new entries of date ${formattedDate} have been added by Admin (${adminName})`
      : `New entry of date ${formattedDate} has been added by Admin (${adminName})`;

    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.ENTRY_ADDED_BY_ADMIN,
      title: '📝 New Entry Added',
      message,
      data: { entryId, entryDate, adminName, bulkCount },
    });
  }

  // Entry Edited by Admin
  async notifyEntryEditedByAdmin({ employeeId, adminName, entryDate, entryId, bulkCount }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    const message = bulkCount > 1
      ? `Admin (${adminName}) has edited ${bulkCount} entries of date ${formattedDate}`
      : `Admin (${adminName}) has edited your entry of date ${formattedDate}`;

    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.ENTRY_EDITED_BY_ADMIN,
      title: '✏️ Entry Edited',
      message,
      data: { entryId, entryDate, adminName, bulkCount },
    });
  }

  // =================== MISSING ENTRY NOTIFICATIONS ===================

  // Missing Entry Approved by SPOC
  async notifyMissingEntryApprovedBySpoc({ employeeId, spocName, entryDate, requestId }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.MISSING_ENTRY_APPROVED_BY_SPOC,
      title: '✓ Missing Entry Approved',
      message: `Your missing entry of date ${formattedDate} has been approved by SPOC (${spocName})`,
      data: { requestId, entryDate, spocName },
    });
  }

  // Missing Entry Rejected by SPOC
  async notifyMissingEntryRejectedBySpoc({ employeeId, spocName, entryDate, requestId, reason }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.MISSING_ENTRY_REJECTED_BY_SPOC,
      title: '✗ Missing Entry Rejected',
      message: `Your missing entry of date ${formattedDate} has been rejected by SPOC (${spocName})`,
      data: { requestId, entryDate, spocName, reason },
    });
  }

  // Missing Entry Approved by Admin
  async notifyMissingEntryApprovedByAdmin({ employeeId, adminName, entryDate, requestId }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.MISSING_ENTRY_APPROVED_BY_ADMIN,
      title: '✓ Entry Pushed to Database',
      message: `Admin (${adminName}) approved your missing entry and data of date ${formattedDate} has been pushed into database`,
      data: { requestId, entryDate, adminName },
    });
  }

  // Missing Entry Rejected by Admin
  async notifyMissingEntryRejectedByAdmin({ employeeId, adminName, entryDate, requestId, reason }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.MISSING_ENTRY_REJECTED_BY_ADMIN,
      title: '✗ Missing Entry Rejected',
      message: `Admin (${adminName}) rejected your missing entry of date ${formattedDate}`,
      data: { requestId, entryDate, adminName, reason },
    });
  }

  // =================== SHIFT NOTIFICATIONS ===================

  // Night Shift Marked
  async notifyNightShiftMarked({ employeeId, spocName, shiftDate, shiftId }) {
    const formattedDate = new Date(shiftDate).toLocaleDateString('en-IN');
    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.NIGHT_SHIFT_MARKED,
      title: '🌙 Night Shift Scheduled',
      message: `You have night shift on ${formattedDate} marked by SPOC (${spocName})`,
      data: { shiftId, shiftDate, spocName },
    });
  }

  // Sunday Shift Marked
  async notifySundayShiftMarked({ employeeId, spocName, shiftDate, shiftId }) {
    const formattedDate = new Date(shiftDate).toLocaleDateString('en-IN');
    return this.createNotification({
      userId: employeeId,
      type: NOTIFICATION_TYPES.SUNDAY_SHIFT_MARKED,
      title: '📅 Sunday Shift Scheduled',
      message: `You have upcoming Sunday shift on ${formattedDate} marked by your SPOC (${spocName})`,
      data: { shiftId, shiftDate, spocName },
    });
  }

  // =================== SPOC NOTIFICATIONS ===================

  // SPOC Entry Approved by Admin
  async notifySpocEntryApproved({ spocId, adminName, entryDate, entryId, bulkCount }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    const message = bulkCount > 1
      ? `${bulkCount} entries of date ${formattedDate} have been approved by Admin (${adminName})`
      : `Your entry of date ${formattedDate} has been approved by Admin (${adminName})`;

    return this.createNotification({
      userId: spocId,
      type: NOTIFICATION_TYPES.SPOC_ENTRY_APPROVED_BY_ADMIN,
      title: '✓ Entry Approved',
      message,
      data: { entryId, entryDate, adminName, bulkCount },
    });
  }

  // SPOC Entry Rejected by Admin
  async notifySpocEntryRejected({ spocId, adminName, entryDate, entryId, reason, bulkCount }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    const message = bulkCount > 1
      ? `${bulkCount} entries of date ${formattedDate} have been rejected by Admin (${adminName})`
      : `Your entry of date ${formattedDate} has been rejected by Admin (${adminName})`;

    return this.createNotification({
      userId: spocId,
      type: NOTIFICATION_TYPES.SPOC_ENTRY_REJECTED_BY_ADMIN,
      title: '✗ Entry Rejected',
      message,
      data: { entryId, entryDate, adminName, reason, bulkCount },
    });
  }

  // SPOC Missing Entry Approved
  async notifySpocMissingEntryApproved({ spocId, adminName, entryDate, requestId }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    return this.createNotification({
      userId: spocId,
      type: NOTIFICATION_TYPES.SPOC_MISSING_ENTRY_APPROVED,
      title: '✓ Missing Entry Approved',
      message: `Admin (${adminName}) approved your missing entry of date ${formattedDate}`,
      data: { requestId, entryDate, adminName },
    });
  }

  // SPOC Missing Entry Rejected
  async notifySpocMissingEntryRejected({ spocId, adminName, entryDate, requestId, reason }) {
    const formattedDate = new Date(entryDate).toLocaleDateString('en-IN');
    return this.createNotification({
      userId: spocId,
      type: NOTIFICATION_TYPES.SPOC_MISSING_ENTRY_REJECTED,
      title: '✗ Missing Entry Rejected',
      message: `Admin (${adminName}) rejected your missing entry of date ${formattedDate}`,
      data: { requestId, entryDate, adminName, reason },
    });
  }


  // SPOC Shift Marked by Admin
  async notifySpocShiftMarkedByAdmin({ spocId, adminName, shiftDate, shiftId, shiftType, employeeCount, employeeNames }) {
    const formattedDate = new Date(shiftDate).toLocaleDateString('en-IN');
    const shiftName = shiftType === 'NIGHT' ? 'Night' : 'Sunday';

    // If multiple employees (team members), show count and names
    const message = employeeCount && employeeCount > 1
      ? `Admin (${adminName}) has assigned ${shiftName.toLowerCase()} shifts to ${employeeCount} employee(s) under your supervision on ${formattedDate}: ${employeeNames}`
      : `Admin (${adminName}) marked your ${shiftName.toLowerCase()} shift on ${formattedDate}`;

    return this.createNotification({
      userId: spocId,
      type: NOTIFICATION_TYPES.SPOC_SHIFT_MARKED_BY_ADMIN,
      title: `📅 ${shiftName} Shift${employeeCount > 1 ? 's' : ''} Scheduled`,
      message,
      data: { shiftId, shiftDate, adminName, shiftType, employeeCount, employeeNames },
    });
  }

  // =================== PROJECT NOTIFICATIONS ===================

  // Project Approved
  async notifyProjectApproved({ spocId, adminName, projectName, projectId }) {
    return this.createNotification({
      userId: spocId,
      type: NOTIFICATION_TYPES.PROJECT_APPROVED_BY_ADMIN,
      title: '✓ Project Approved',
      message: `Your project "${projectName}" has been approved by Admin (${adminName})`,
      data: { projectId, projectName, adminName },
    });
  }

  // Project Rejected
  async notifyProjectRejected({ spocId, adminName, projectName, projectId, reason }) {
    return this.createNotification({
      userId: spocId,
      type: NOTIFICATION_TYPES.PROJECT_REJECTED_BY_ADMIN,
      title: '✗ Project Rejected',
      message: `Your project "${projectName}" has been rejected by Admin (${adminName})`,
      data: { projectId, projectName, adminName, reason },
    });
  }

  // =================== ADMIN NOTIFICATIONS ===================

  // Admin: Missing Entry Requests Pending
  // async notifyAdminMissingEntryPending({ adminId, count }) {
  //   return this.createNotification({
  //     userId: adminId,
  //     type: NOTIFICATION_TYPES.ADMIN_MISSING_ENTRY_PENDING,
  //     title: '📋 Missing Entry Requests',
  //     message: `You have ${count} missing entry request(s) to review and push to database`,
  //     data: { count },
  //   });
  // }

  // // Admin: Project Requests Pending
  // async notifyAdminProjectRequestPending({ adminId, count }) {
  //   return this.createNotification({
  //     userId: adminId,
  //     type: NOTIFICATION_TYPES.ADMIN_PROJECT_REQUEST_PENDING,
  //     title: '📋 Project Requests',
  //     message: `You have ${count} project request(s) to approve`,
  //     data: { count },
  //   });
  // }

  // =================== QUERY METHODS ===================

  // Get unread notifications with count
  async getUnreadNotifications(userId) {
    const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: userIdInt,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      notifications,
      count: notifications.length,
    };
  }

  // Get all notifications with pagination
  async getNotifications(userId, { skip = 0, take = 50 }) {
    const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: userIdInt },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where: { userId: userIdInt } }),
      prisma.notification.count({ where: { userId: userIdInt, isRead: false } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      hasMore: skip + take < total
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const notificationIdInt = typeof notificationId === 'string' ? parseInt(notificationId, 10) : notificationId;

    return prisma.notification.updateMany({
      where: {
        id: notificationIdInt,
        userId: userIdInt,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // Mark all as read
  async markAllAsRead(userId) {
    const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    return prisma.notification.updateMany({
      where: {
        userId: userIdInt,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // Delete old notifications (cleanup job)
  async deleteOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    console.log(`🗑️ Deleted ${result.count} old notifications`);
    return result;
  }

  // Get notification count for a user
  async getNotificationCount(userId) {
    const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    const [total, unread] = await Promise.all([
      prisma.notification.count({ where: { userId: userIdInt } }),
      prisma.notification.count({ where: { userId: userIdInt, isRead: false } }),
    ]);

    return { total, unread };
  }
}

module.exports = { NotificationService, NOTIFICATION_TYPES };
