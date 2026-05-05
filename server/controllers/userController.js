const User = require('../models/User');
const InterviewSession = require('../models/InterviewSession');

// @desc    Get user profile
// @route   GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, skills, targetCompanies, preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (skills) user.skills = skills;
    if (targetCompanies) user.targetCompanies = targetCompanies;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user dashboard stats
// @route   GET /api/users/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [total, completed, lastSession] = await Promise.all([
      InterviewSession.countDocuments({ user: userId }),
      InterviewSession.countDocuments({ user: userId, status: 'completed' }),
      InterviewSession.findOne({ user: userId, status: 'completed' }).sort({ createdAt: -1 })
    ]);

    const recentSessions = await InterviewSession.find({ user: userId, status: 'completed' })
      .sort({ createdAt: -1 }).limit(5).select('overallScore domain type createdAt');

    const user = await User.findById(userId);

    res.json({
      success: true,
      stats: {
        totalInterviews: total,
        completedInterviews: completed,
        averageScore: user.averageScore,
        streak: user.streak,
        lastScore: lastSession?.overallScore || 0,
        recentSessions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfile, updateProfile, getStats };
