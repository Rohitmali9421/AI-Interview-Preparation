const { GoogleGenerativeAI } = require('@google/generative-ai');

const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// Helper for retrying AI calls with exponential backoff
const retryWithExponentialBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 || error.message?.includes('429')) {
        retries++;
        if (retries === maxRetries) throw error;
        const delay = initialDelay * Math.pow(2, retries - 1);
        console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

// Helper to extract JSON from AI response
const extractJSON = (text) => {
  try {
    // Try to find JSON block
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/);
    const cleanText = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(cleanText);
  } catch (error) {
    // If that fails, try to find the first [ or { and last ] or }
    try {
      const firstBracket = text.indexOf('[');
      const firstBrace = text.indexOf('{');
      let start = -1;
      let end = -1;

      if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        start = firstBracket;
        end = text.lastIndexOf(']') + 1;
      } else if (firstBrace !== -1) {
        start = firstBrace;
        end = text.lastIndexOf('}') + 1;
      }

      if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end));
      }
    } catch (innerError) {
      console.error('Failed to parse JSON even with substring:', innerError);
    }
    throw new Error('Could not parse valid JSON from AI response');
  }
};

// @desc    Generate interview questions
// @route   POST /api/ai/generate-questions
const generateQuestions = async (req, res) => {
  const { type, jobTitle, jobDescription, experienceLevel, difficulty, count = 5 } = req.body;
  const questionCount = parseInt(count) || 5;

  try {
    const genAI = getGenAI();
    // Using gemini-2.5-flash
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      }
    });

    let typeContext = '';
    if (type === 'hr') {
      typeContext = 'Focus ONLY on behavioral, situational, and soft skills questions.';
    } else if (type === 'technical') {
      typeContext = `Focus ONLY on core technical concepts, practical implementation, and domain-specific challenges for ${jobTitle}.`;
    } else {
      typeContext = `Provide a balance of HR/behavioral questions and technical/domain-specific questions for ${jobTitle}.`;
    }

    const prompt = `You are a world-class professional interviewer with 20 years of experience. 
Generate exactly ${questionCount} (no more, no less) UNIQUE and focused interview questions for the following role:

- Job Title: ${jobTitle}
- Job Description: ${jobDescription || 'Standard industry requirements for this role'}
- Experience Level: ${experienceLevel}
- Interview Style: ${type}
- Difficulty: ${difficulty}

Specific Instructions:
1. ${typeContext}
2. Ensure questions are clear and direct, avoiding overly complex or multi-part scenarios.
3. Questions should be designed for concise answers (approx. 5 lines or 60-80 words).
4. Tailor questions specifically to the Job Description where possible.
5. Provide a brief "hint" and 3-5 "expectedKeyPoints" for each question.
6. IMPORTANT: You MUST return exactly ${questionCount} questions in the JSON array.

Respond ONLY with valid JSON array:
[
  {
    "questionText": "Question here",
    "questionType": "technical|hr",
    "difficulty": "${difficulty}",
    "hint": "Brief tip for the candidate",
    "expectedKeyPoints": ["point 1", "point 2"]
  }
]`;

    const result = await retryWithExponentialBackoff(() => model.generateContent(prompt));
    const text = result.response.text();
    let questions = extractJSON(text);

    // Enforce count strictly
    if (Array.isArray(questions)) {
      questions = questions.slice(0, questionCount);
    }

    res.json({ success: true, questions });
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate questions. AI service might be unavailable.' });
  }
};

// @desc    Evaluate the entire interview at once
// @route   POST /api/ai/evaluate-interview
const evaluateFullInterview = async (req, res) => {
  const { questions, jobTitle, jobDescription, experienceLevel, type, difficulty, eyeContactScore } = req.body;
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3, // Lower for more consistent evaluation
      }
    });

    const interviewData = questions.map((q, i) => ({
      index: i + 1,
      question: q.questionText,
      answer: q.userAnswer || '(Skipped)'
    }));

    const eyeContactContext = eyeContactScore !== undefined 
      ? `\nCandidate's Avg Eye Contact Score: ${eyeContactScore}/100 (This score represents how consistently the candidate maintained eye contact with the camera/interviewer).`
      : "";

    const prompt = `As an expert professional interviewer, evaluate this complete interview session.

Role: ${jobTitle}
Description: ${jobDescription || 'Standard requirements'}
Experience Level: ${experienceLevel}
Interview Type: ${type}
Difficulty: ${difficulty}${eyeContactContext}

Interview Data:
${JSON.stringify(interviewData, null, 2)}

Instructions:
1. For each question, compare the candidate's answer with a professional "model answer" for this role.
2. Provide:
   - scores (overall, clarity, accuracy, relevance, communication) from 0-10
   - detailed feedback (2-3 sentences) identifying strengths and missing points
   - a comprehensive modelAnswer
3. Provide an overall summary of the performance relative to ${experienceLevel} expectations. ${eyeContactScore !== undefined ? 'Mention their eye contact/non-verbal communication performance in the summary.' : ''}
4. Identify 3 specific strengths and 3 actionable weaknesses.
5. Provide 3 specific recommendations for improvement.

Respond ONLY with valid JSON:
{
  "questionEvaluations": [
    {
      "index": 1,
      "scores": { "overall": 0, "clarity": 0, "accuracy": 0, "relevance": 0, "communication": 0 },
      "feedback": "",
      "modelAnswer": ""
    }
  ],
  "overallSummary": "",
  "strengths": [],
  "weaknesses": [],
  "recommendations": [],
  "overallScore": 0,
  "categoryScores": { "clarity": 0, "accuracy": 0, "relevance": 0, "communication": 0 }
}`;

    const result = await retryWithExponentialBackoff(() => model.generateContent(prompt));
    const text = result.response.text();
    const evaluation = extractJSON(text);

    res.json({ success: true, evaluation });
  } catch (error) {
    console.error('Full evaluation error:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate interview' });
  }
};

// Deprecated: Moving to consolidated evaluation
const evaluateAnswer = async (req, res) => {
  res.status(410).json({ message: 'This endpoint is deprecated. Use /evaluate-interview' });
};

// Deprecated: Moving to consolidated evaluation
const generateReport = async (req, res) => {
  res.status(410).json({ message: 'This endpoint is deprecated. Use /evaluate-interview' });
};

module.exports = { generateQuestions, evaluateAnswer, generateReport, evaluateFullInterview };
