const express = require('express');
const router = express.Router();
const multer = require('multer');
const { startRealtime, getNextQuestion } = require('../controllers/realtimeController');
const { protect } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(protect);
router.post('/start', upload.single('resume'), startRealtime);
router.post('/:id/next-question', getNextQuestion);

module.exports = router;
