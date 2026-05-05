const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');

// @desc    Create new interview session
// @route   POST /api/interviews
const createInterview = async (req, res) => {
  try {
    const { type, domain, jobTitle, jobDescription, experienceLevel, difficulty, duration, totalQuestions } = req.body;
    const session = await InterviewSession.create({
      user: req.user._id,
      type,
      domain: domain || 'General',
      jobTitle,
      jobDescription,
      experienceLevel,
      difficulty,
      duration,
      totalQuestions,
      status: 'pending'
    });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start interview session
// @route   PUT /api/interviews/:id/start
const startInterview = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    session.status = 'in-progress';
    session.startTime = new Date();
    await session.save();
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit answer for a question
// @route   PUT /api/interviews/:id/answer
const submitAnswer = async (req, res) => {
  try {
    const { questionIndex, userAnswer, answerMethod, timeTaken, scores, feedback, modelAnswer, skipped } = req.body;
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (session.questions[questionIndex]) {
      session.questions[questionIndex].userAnswer = userAnswer;
      session.questions[questionIndex].answerMethod = answerMethod || 'text';
      session.questions[questionIndex].timeTaken = timeTaken || 0;
      session.questions[questionIndex].skipped = skipped || false;
      if (scores) session.questions[questionIndex].scores = scores;
      if (feedback) session.questions[questionIndex].feedback = feedback;
      if (modelAnswer) session.questions[questionIndex].modelAnswer = modelAnswer;
    }

    await session.save();
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add questions to session
// @route   PUT /api/interviews/:id/questions
const addQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.questions = questions.map(q => ({
      questionText: q.questionText,
      questionType: q.questionType || 'general',
      difficulty: q.difficulty || session.difficulty,
      hint: q.hint || ''
    }));

    await session.save();
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete interview session
// @route   PUT /api/interviews/:id/complete
const completeInterview = async (req, res) => {
  try {
    const { overallScore, categoryScores, strengths, weaknesses, recommendations, aiSummary, questions, eyeContactScore } = req.body;
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.status = 'completed';
    session.endTime = new Date();
    session.actualDuration = session.startTime
      ? Math.floor((new Date() - session.startTime) / 1000)
      : 0;
    session.overallScore = overallScore || 0;
    if (categoryScores) session.categoryScores = categoryScores;
    if (strengths) session.strengths = strengths;
    if (weaknesses) session.weaknesses = weaknesses;
    if (recommendations) session.recommendations = recommendations;
    if (aiSummary) session.aiSummary = aiSummary;
    if (questions) session.questions = questions;
    if (eyeContactScore !== undefined) session.eyeContactScore = eyeContactScore;

    await session.save();

    // Update user stats
    const user = await User.findById(req.user._id);
    user.totalInterviews += 1;
    const allSessions = await InterviewSession.find({ user: req.user._id, status: 'completed' });
    const totalScore = allSessions.reduce((acc, s) => acc + s.overallScore, 0);
    user.averageScore = Math.round(totalScore / allSessions.length);
    user.lastInterviewDate = new Date();

    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (user.lastInterviewDate && user.lastInterviewDate >= yesterday) {
      user.streak += 1;
    } else {
      user.streak = 1;
    }

    await user.save();

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all interviews for current user
// @route   GET /api/interviews
const getInterviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const sessions = await InterviewSession.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-questions.modelAnswer');

    const total = await InterviewSession.countDocuments(query);

    res.json({
      success: true,
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single interview
// @route   GET /api/interviews/:id
const getInterview = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id).populate('user', 'name email');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user analytics
// @route   GET /api/interviews/analytics
const getAnalytics = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({
      user: req.user._id,
      status: 'completed'
    }).sort({ createdAt: 1 }).select('overallScore categoryScores domain type createdAt');

    // Score trend (last 10)
    const scoreTrend = sessions.slice(-10).map(s => ({
      date: s.createdAt,
      score: s.overallScore,
      domain: s.domain
    }));

    // Domain performance
    const domainPerformance = {};
    sessions.forEach(s => {
      if (!domainPerformance[s.domain]) {
        domainPerformance[s.domain] = { total: 0, count: 0 };
      }
      domainPerformance[s.domain].total += s.overallScore;
      domainPerformance[s.domain].count += 1;
    });

    const domainStats = Object.entries(domainPerformance).map(([domain, data]) => ({
      domain,
      averageScore: Math.round(data.total / data.count),
      count: data.count
    }));

    res.json({
      success: true,
      analytics: {
        scoreTrend,
        domainStats,
        totalInterviews: sessions.length,
        averageScore: sessions.length
          ? Math.round(sessions.reduce((a, s) => a + s.overallScore, 0) / sessions.length)
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createInterview, startInterview, submitAnswer, addQuestions,
  completeInterview, getInterviews, getInterview, getAnalytics
};
