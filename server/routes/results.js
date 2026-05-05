const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const InterviewSession = require('../models/InterviewSession');

router.use(protect);

// Get result for a session
router.get('/:id', async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, result: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
