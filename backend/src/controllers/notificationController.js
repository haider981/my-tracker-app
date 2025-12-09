// // backend/src/controllers/notificationController.js
// const { NotificationService } = require('../services/notificationService');
// const notificationService = new NotificationService();

// // Get unread notifications count (for sidebar badge)
// exports.getUnreadCount = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     const { count } = await notificationService.getUnreadNotifications(userId);
    
//     res.status(200).json({
//       success: true,
//       count,
//     });
//   } catch (error) {
//     console.error('Error fetching unread count:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch notification count',
//     });
//   }
// };

// // Get unread notifications (for polling)
// exports.getUnreadNotifications = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     const { notifications, count } = await notificationService.getUnreadNotifications(userId);
    
//     res.status(200).json({
//       success: true,
//       count,
//       notifications,
//     });
//   } catch (error) {
//     console.error('Error fetching unread notifications:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch notifications',
//     });
//   }
// };

// // Get all notifications with pagination (for notifications page)
// exports.getAllNotifications = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const skip = parseInt(req.query.skip) || 0;
//     const take = parseInt(req.query.take) || 50;
    
//     const result = await notificationService.getNotifications(userId, { skip, take });
    
//     res.status(200).json({
//       success: true,
//       ...result,
//     });
//   } catch (error) {
//     console.error('Error fetching notifications:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch notifications',
//     });
//   }
// };

// // Mark notification as read
// exports.markAsRead = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { notificationId } = req.params;
    
//     await notificationService.markAsRead(notificationId, userId);
    
//     res.status(200).json({
//       success: true,
//       message: 'Notification marked as read',
//     });
//   } catch (error) {
//     console.error('Error marking notification as read:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to mark notification as read',
//     });
//   }
// };

// // Mark all notifications as read
// exports.markAllAsRead = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     const result = await notificationService.markAllAsRead(userId);
    
//     res.status(200).json({
//       success: true,
//       message: 'All notifications marked as read',
//       count: result.count,
//     });
//   } catch (error) {
//     console.error('Error marking all notifications as read:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to mark notifications as read',
//     });
//   }
// };

// backend/src/controllers/notificationController.js
const { NotificationService } = require('../services/notificationService');
const prisma = require('../config/prisma');
const notificationService = new NotificationService();

// Helper function to get actual user ID from email
const getUserId = async (user) => {
  // If token already has numeric id, use it
  if (user.id && typeof user.id === 'number') {
    return user.id;
  }
  
  // Otherwise, look up by email
  const dbUser = await prisma.users.findUnique({
    where: { email: user.email },
    select: { id: true }
  });
  
  if (!dbUser) {
    throw new Error('User not found in database');
  }
  
  return dbUser.id;
};

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = await getUserId(req.user);
    
    const { count } = await notificationService.getUnreadNotifications(userId);
    
    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification count',
    });
  }
};

// Get unread notifications
exports.getUnreadNotifications = async (req, res) => {
  try {
    const userId = await getUserId(req.user);
    
    const { notifications, count } = await notificationService.getUnreadNotifications(userId);
    
    res.status(200).json({
      success: true,
      count,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

// Get all notifications with pagination
exports.getAllNotifications = async (req, res) => {
  try {
    const userId = await getUserId(req.user);
    const skip = parseInt(req.query.skip) || 0;
    const take = parseInt(req.query.take) || 50;
    
    const result = await notificationService.getNotifications(userId, { skip, take });
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = await getUserId(req.user);
    const { notificationId } = req.params;
    
    await notificationService.markAsRead(notificationId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = await getUserId(req.user);
    
    const result = await notificationService.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      count: result.count,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
    });
  }
};

