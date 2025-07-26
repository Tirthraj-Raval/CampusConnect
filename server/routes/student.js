const express = require('express');
const router = express.Router();
const studentController = require('../controllers/students/studentController');
const rsvpController = require('../controllers/students/rsvpController');
const feedbackController = require('../controllers/students/feedbackController');
const certificateController = require('../controllers/students/certificatesController');
const subscriptionController = require('../controllers/students/subscriptionController');
const notificationController = require('../controllers/students/notificationController');
const {ensureAuthenticated} = require('../middlewares/auth');

// Student Profile
router.get('/me', ensureAuthenticated, studentController.getStudentProfile);
router.put('/me', ensureAuthenticated, studentController.updateStudentProfile);
router.delete('/me', ensureAuthenticated, studentController.deleteStudentAccount);

// Subscriptions
router.get('/subscriptions', ensureAuthenticated, subscriptionController.getSubscriptions);
router.post('/subscriptions/:club_id', ensureAuthenticated, subscriptionController.subscribeClub);
router.delete('/subscriptions/:clubId', ensureAuthenticated, subscriptionController.unsubscribeClub);
router.get('/subscriptions/events', ensureAuthenticated, subscriptionController.getSubscribedClubEvents)

// RSVPs
router.get('/rsvps', ensureAuthenticated, rsvpController.getStudentRSVPs);
router.post('/rsvps', ensureAuthenticated, rsvpController.rsvpEvent);
router.delete('/rsvps/:eventId', ensureAuthenticated, rsvpController.cancelRSVP);
router.get('/event-capacity', ensureAuthenticated, rsvpController.getEventCapacities);

// Feedback
router.post('/feedback', ensureAuthenticated, feedbackController.submitFeedback);
router.get('/feedback/:eventId', ensureAuthenticated, feedbackController.getStudentFeedback);

// Certificates
router.get('/certificates', ensureAuthenticated, certificateController.getStudentCertificates);

// Notifications
router.get('/notifications', ensureAuthenticated, notificationController.getStudentNotifications);
router.post('/notifications/:notificationId/read', ensureAuthenticated, notificationController.markNotificationAsRead);
router.get('/notifications/unread', ensureAuthenticated, notificationController.getUnreadNotifications);
router.get('/activity-status', ensureAuthenticated, notificationController.getActivityStatus);

// Search For anything
router.get('/search', ensureAuthenticated, studentController.globalSearch);


module.exports = router;
