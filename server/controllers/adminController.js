const User = require('../models/User');
const InterviewSession = require('../models/InterviewSession');

// @desc    Get all users
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');
    const total = await User.countDocuments();
    res.json({ success: true, users, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
const getPlatformAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalInterviews, completedInterviews] = await Promise.all([
      User.countDocuments(),
      InterviewSession.countDocuments(),
      InterviewSession.countDocuments({ status: 'completed' })
    ]);

    const avgScoreResult = await InterviewSession.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$overallScore' } } }
    ]);

    const domainStats = await InterviewSession.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$domain', count: { $sum: 1 }, avgScore: { $avg: '$overallScore' } } }
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalInterviews,
        completedInterviews,
        averageScore: avgScoreResult[0]?.avg?.toFixed(1) || 0,
        domainStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await InterviewSession.deleteMany({ user: req.params.id });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllUsers, getPlatformAnalytics, deleteUser };
