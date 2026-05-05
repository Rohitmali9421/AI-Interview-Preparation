const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionType: { type: String, default: 'general' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  hint: { type: String, default: '' },
  userAnswer: { type: String, default: '' },
  answerMethod: { type: String, enum: ['voice', 'text', 'skipped'], default: 'text' },
  timeTaken: { type: Number, default: 0 }, // seconds
  scores: {
    overall: { type: Number, default: 0, min: 0, max: 10 },
    clarity: { type: Number, default: 0, min: 0, max: 10 },
    accuracy: { type: Number, default: 0, min: 0, max: 10 },
    relevance: { type: Number, default: 0, min: 0, max: 10 },
    communication: { type: Number, default: 0, min: 0, max: 10 }
  },
  feedback: { type: String, default: '' },
  modelAnswer: { type: String, default: '' },
  skipped: { type: Boolean, default: false }
});

const interviewSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    default: 'General'
  },
  jobTitle: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    default: ''
  },
  experienceLevel: {
    type: String,
    enum: ['fresher', 'mid', 'senior', 'lead'],
    default: 'mid'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  duration: {
    type: Number, // minutes
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'abandoned'],
    default: 'pending'
  },
  questions: [questionSchema],
  startTime: { type: Date },
  endTime: { type: Date },
  actualDuration: { type: Number, default: 0 }, // seconds
  overallScore: { type: Number, default: 0 },
  categoryScores: {
    clarity: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    relevance: { type: Number, default: 0 },
    communication: { type: Number, default: 0 }
  },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  recommendations: [{ type: String }],
  aiSummary: { type: String, default: '' },
  eyeContactScore: { type: Number, default: 0 },
  resumeContent: { type: String, default: '' },
  isRealtime: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for performance
interviewSessionSchema.index({ user: 1, createdAt: -1 });
interviewSessionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
