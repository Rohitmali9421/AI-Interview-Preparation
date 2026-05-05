import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, realtimeAPI, aiAPI } from '../services/api';
import { useSpeech, useSpeechRecognition } from '../hooks/useSpeech';

const AIAvatar = ({ isSpeaking, isThinking }) => (
  <div style={{
    width: 140, height: 140,
    borderRadius: '50%',
    background: 'var(--gradient-accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 64, position: 'relative',
    boxShadow: isSpeaking ? '0 0 50px rgba(79,142,247,0.5)' : '0 0 20px rgba(79,142,247,0.1)',
    transition: 'all 0.3s ease'
  }}>
    {isThinking ? '🧠' : '🤖'}
    {isSpeaking && (
      <div className="waveform" style={{ position: 'absolute', bottom: -15 }}>
        {[1,2,3,4,5].map(i => <div key={i} className="waveform-bar" style={{ height: Math.random() * 20 + 10 }} />)}
      </div>
    )}
  </div>
);

const RealtimeInterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { speak, stopSpeaking, isSpeaking } = useSpeech();
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState('loading'); // loading | speaking | listening | thinking | complete
  const [history, setHistory] = useState([]);
  
  const silenceTimer = useRef(null);
  const isInitialized = useRef(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  // Initial load
  useEffect(() => {
    if (isInitialized.current) return;
    
    const init = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;
      try {
        const res = await interviewAPI.getOne(id);
        const sess = res.data.session;
        setSession(sess);
        
        setPhase('speaking');
        // Welcome message first to "settle" the interviewer
        const welcomeText = `Welcome to your real-time ${sess.jobTitle} interview. I've reviewed your background and we'll start with some introductory questions. Let's begin.`;
        
        speak(welcomeText, () => {
          fetchNextQuestion('');
        });
      } catch (err) {
        console.error(err);
        isInitialized.current = false;
        navigate('/dashboard');
      }
    };
    init();

    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [id, navigate, speak, stopSpeaking, stopListening]);

  const fetchNextQuestion = async (lastAns) => {
    setPhase('thinking');
    try {
      const res = await realtimeAPI.getNextQuestion(id, { lastAnswer: lastAns });
      if (res.data.complete) {
        finishInterview();
        return;
      }
      const q = res.data.question;
      setCurrentQuestion(q);
      setHistory(prev => [...prev, { type: 'ai', text: q.questionText }]);
      setPhase('speaking');
      speak(q.questionText, () => {
        setPhase('listening');
        startListening((text) => setAnswer(text));
      });
    } catch (err) {
      console.error(err);
      setPhase('listening');
    }
  };

  // Automatic submission after silence in voice mode
  useEffect(() => {
    if (phase === 'listening' && transcript) {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        handleSubmitAnswer();
      }, 3500); // 3.5 seconds of silence to auto-submit
    }
    return () => clearTimeout(silenceTimer.current);
  }, [transcript, phase]);

  // Sync transcript to answer state for visual feedback
  useEffect(() => {
    if (transcript) setAnswer(transcript);
  }, [transcript]);

  const handleSubmitAnswer = async () => {
    if (phase !== 'listening') return;
    
    const finalAnswer = transcript || answer;
    if (!finalAnswer.trim()) return;

    stopListening();
    setHistory(prev => [...prev, { type: 'user', text: finalAnswer }]);
    resetTranscript();
    setAnswer('');
    
    // Save answer to DB
    try {
      await interviewAPI.submitAnswer(id, {
        questionIndex: session.questions.length - 1,
        userAnswer: finalAnswer,
        answerMethod: 'voice'
      });
    } catch (err) { console.error(err); }

    fetchNextQuestion(finalAnswer);
  };

  const finishInterview = async () => {
    setPhase('loading');
    // Realtime sessions currently go straight to result, 
    // but in the future we could add a final evaluation step here
    setTimeout(() => {
      navigate(`/result/${id}`);
    }, 1500);
  };

  if (phase === 'loading' && !session) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3 }} />
        <p style={{ color: 'var(--text-secondary)' }}>Initializing Real-Time Session...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'var(--bg-primary)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 1200,
      margin: '0 auto'
    }}>
      {/* Header aligned with InterviewPage */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 32,
        padding: '16px 24px',
        background: 'var(--bg-secondary)',
        borderRadius: 16,
        border: '1px solid var(--border)'
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Real-Time Interview</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Adaptive Session • {session?.jobTitle} • {session?.difficulty}
          </p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn btn-secondary" 
          style={{ padding: '8px 16px', fontSize: 13, border: '1px solid var(--danger)', color: 'var(--danger)' }}
        >
          Quit Session
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, flex: 1 }}>
        
        {/* Left: Chat history / visual interaction */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: 0 }}>
          <div className="card" style={{ 
            flex: 1, 
            padding: 24, 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 20
          }}>
            {history.length === 0 && phase !== 'thinking' && (
              <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)' }}>
                <p>The interviewer is preparing the first question...</p>
              </div>
            )}
            
            {history.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.type === 'ai' ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                padding: '14px 18px',
                borderRadius: msg.type === 'ai' ? '2px 18px 18px 18px' : '18px 18px 2px 18px',
                background: msg.type === 'ai' ? 'var(--bg-primary)' : 'var(--gradient-accent)',
                color: msg.type === 'ai' ? 'var(--text-primary)' : '#fff',
                fontSize: 15,
                lineHeight: 1.6,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: msg.type === 'ai' ? '1px solid var(--border)' : 'none'
              }}>
                {msg.text}
              </div>
            ))}
            {phase === 'thinking' && (
              <div style={{ alignSelf: 'flex-start', padding: '14px 18px', background: 'var(--bg-primary)', borderRadius: '2px 18px 18px 18px', border: '1px solid var(--border)' }}>
                <div className="dot-flashing" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            background: 'var(--bg-secondary)', 
            padding: 16, 
            borderRadius: 16,
            border: '1px solid var(--border)'
          }}>
            <input 
              type="text" 
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={phase === 'listening' ? "Speak now or type your answer..." : "Please wait..."}
              style={{ 
                flex: 1, 
                padding: '14px 20px', 
                borderRadius: 12, 
                border: '1px solid var(--border)', 
                background: 'var(--bg-primary)', 
                color: 'var(--text-primary)',
                fontSize: 15
              }}
              onKeyPress={e => e.key === 'Enter' && handleSubmitAnswer()}
              disabled={phase !== 'listening'}
            />
            <button 
              onClick={handleSubmitAnswer} 
              className="btn btn-primary" 
              disabled={phase !== 'listening' || !answer.trim()}
              style={{ borderRadius: 12, padding: '0 24px' }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Right: AI Avatar & Session Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ 
            padding: 40, 
            textAlign: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 24,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 20
          }}>
            <AIAvatar isSpeaking={isSpeaking} isThinking={phase === 'thinking'} />
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>AI Interviewer</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ 
                  width: 8, height: 8, borderRadius: '50%', 
                  background: phase === 'listening' ? '#4ade80' : phase === 'speaking' ? '#4f8ef7' : '#94a3b8' 
                }} />
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                  {phase === 'speaking' ? '🔊 Speaking...' : phase === 'listening' ? '👂 Listening...' : phase === 'thinking' ? '🧠 Analyzing...' : 'Ready'}
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ 
            padding: 24,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 20
          }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📊</span> Session Info
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Role</p>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{session?.jobTitle}</p>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Experience Level</p>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{session?.experienceLevel}</p>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Questions Asked</p>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{history.filter(m => m.type === 'ai').length}</p>
              </div>
            </div>
          </div>
          
          {currentQuestion?.hint && phase === 'listening' && (
            <div className="card" style={{ 
              padding: 20, 
              background: 'rgba(79, 142, 247, 0.1)', 
              border: '1px dashed var(--accent)',
              borderRadius: 16
            }}>
              <p style={{ fontSize: 13, color: 'var(--accent)', margin: 0 }}>
                <strong>💡 Tip:</strong> {currentQuestion.hint}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RealtimeInterviewPage;
