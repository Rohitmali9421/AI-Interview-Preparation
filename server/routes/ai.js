const express = require('express');
const router = express.Router();
const { generateQuestions, evaluateFullInterview } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/generate-questions', generateQuestions);
router.post('/evaluate-interview', evaluateFullInterview);

module.exports = router;
