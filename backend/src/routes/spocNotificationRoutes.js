const express = require('express');
const router = express.Router();
const spocNotificationController = require('../controllers/spocNotificationController');
const verifyToken = require('../middleware/auth'); // Use your existing auth middleware

// Get unread notification count (for sidebar badge)
router.get('/unread-count', verifyToken, spocNotificationController.getUnreadCount);

// Get unread notifications (for polling)
router.get('/unread', verifyToken, spocNotificationController.getUnreadNotifications);

// Get all notifications with pagination (for notifications page)
router.get('/', verifyToken, spocNotificationController.getAllNotifications);

router.patch('/mark-all-read', verifyToken, spocNotificationController.markAllAsRead);

router.patch('/:notificationId/read', verifyToken, spocNotificationController.markAsRead);

module.exports = router;
