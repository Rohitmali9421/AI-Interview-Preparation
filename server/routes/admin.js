const express = require('express');
const router = express.Router();
const { getAllUsers, getPlatformAnalytics, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/users', getAllUsers);
router.get('/analytics', getPlatformAnalytics);
router.delete('/users/:id', deleteUser);

module.exports = router;
