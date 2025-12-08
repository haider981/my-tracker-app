// backend/src/controllers/notificationController.js
const { NotificationService } = require('../services/notificationService');
const notificationService = new NotificationService();

// Get unread notifications count (for sidebar badge)
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
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

// Get unread notifications (for polling)
exports.getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
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

// Get all notifications with pagination (for notifications page)
exports.getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
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
    const userId = req.user.id;
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
    const userId = req.user.id;
    
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
