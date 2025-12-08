// backend/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const verifyToken = require('../middleware/auth'); // Use your existing auth middleware

// Get unread notification count (for sidebar badge)
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

// Get unread notifications (for polling)
router.get('/unread', verifyToken, notificationController.getUnreadNotifications);

// Get all notifications with pagination (for notifications page)
router.get('/', verifyToken, notificationController.getAllNotifications);

router.patch('/mark-all-read', verifyToken, notificationController.markAllAsRead);

router.patch('/:notificationId/read', verifyToken, notificationController.markAsRead);

module.exports = router;
