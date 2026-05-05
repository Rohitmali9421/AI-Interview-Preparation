const express = require('express');
const router = express.Router();
const {
  createInterview, startInterview, submitAnswer, addQuestions,
  completeInterview, getInterviews, getInterview, getAnalytics
} = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getInterviews)
  .post(createInterview);

router.get('/analytics', getAnalytics);

router.route('/:id')
  .get(getInterview);

router.put('/:id/start', startInterview);
router.put('/:id/questions', addQuestions);
router.put('/:id/answer', submitAnswer);
router.put('/:id/complete', completeInterview);

module.exports = router;
