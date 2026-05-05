const InterviewSession = require('../models/InterviewSession');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to extract text from PDF buffer
const extractTextFromPDF = async (buffer) => {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + ' ';
    }

    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to parse PDF resume');
  }
};

const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// @desc    Start real-time interview with resume
// @route   POST /api/realtime/start
const startRealtime = async (req, res) => {
  try {
    const { jobTitle, jobDescription, experienceLevel, difficulty } = req.body;
    let resumeText = '';

    if (req.file) {
      resumeText = await extractTextFromPDF(req.file.buffer);
    }

    const session = await InterviewSession.create({
      user: req.user._id,
      type: 'realtime',
      isRealtime: true,
      jobTitle,
      jobDescription,
      experienceLevel,
      difficulty,
      resumeContent: resumeText,
      duration: 30, // Default for realtime
      totalQuestions: 0, // Dynamic
      status: 'in-progress',
      startTime: new Date()
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error('Start realtime error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get next question for real-time interview
// @route   POST /api/realtime/:id/next-question
const getNextQuestion = async (req, res) => {
  try {
    const { lastAnswer } = req.body;
    const session = await InterviewSession.findById(req.params.id);
    
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const conversationHistory = session.questions.map(q => ({
      question: q.questionText,
      answer: q.userAnswer
    }));

    const prompt = `You are an expert interviewer conducting a REAL-TIME adaptive interview.
    
Candidate Resume: ${session.resumeContent || 'Not provided'}
Target Job: ${session.jobTitle}
Experience Level: ${session.experienceLevel}
Difficulty: ${session.difficulty}

Conversation History:
${JSON.stringify(conversationHistory, null, 2)}

Last Answer provided by candidate: "${lastAnswer || 'N/A'}"

Instructions:
1. PROGRESSION: 
   - If this is the VERY FIRST question (history is empty), start with a warm, simple introductory question (e.g., "Tell me about yourself" or "What interests you about this role?").
   - For the first 2-3 questions, keep them relatively simple and introductory to build rapport.
   - Gradually increase technical depth based on the candidate's responses and the specified difficulty (${session.difficulty}).
2. ANALYSIS: Analyze the last answer and the resume to provide a follow-up.
3. COMPLETION: If the candidate has provided enough information (usually after 8-12 questions for a thorough interview) or if they are clearly struggling, respond with "INTERVIEW_COMPLETE".
4. DYNAMIC: If the last answer was technical, dive deeper. If vague, ask for clarification.
5. Keep the question concise and professional.

Respond ONLY with a JSON object:
{
  "nextQuestion": "The question text or INTERVIEW_COMPLETE",
  "type": "technical|behavioral|introductory",
  "hint": "Brief tip for the candidate"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Simple JSON extraction
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const nextQData = JSON.parse(jsonMatch[0]);

    if (nextQData.nextQuestion === 'INTERVIEW_COMPLETE') {
      session.status = 'completed';
      session.endTime = new Date();
      await session.save();
      return res.json({ success: true, complete: true });
    }

    // Add question to session
    session.questions.push({
      questionText: nextQData.nextQuestion,
      questionType: nextQData.type || 'general',
      hint: nextQData.hint || ''
    });

    await session.save();
    res.json({ success: true, question: session.questions[session.questions.length - 1], index: session.questions.length - 1 });

  } catch (error) {
    console.error('Next question error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { startRealtime, getNextQuestion };
