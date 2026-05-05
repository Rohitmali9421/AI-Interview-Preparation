import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, aiAPI } from '../services/api';
import { useSpeech, useSpeechRecognition } from '../hooks/useSpeech';
import io from 'socket.io-client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const WarningModal = ({ onConfirm, message }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
  }}>
    <div className="card" style={{ maxWidth: 400, width: '100%', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: 'var(--danger)' }}>Warning!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
        {message || "Proctoring violation detected. Multiple tab switches or leaving fullscreen may result in interview termination."}
      </p>
      <button onClick={onConfirm} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
        I Understand
      </button>
    </div>
  </div>
);

const FullscreenPrompt = ({ onEnter }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'var(--bg-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
  }}>
    <div className="card" style={{ maxWidth: 450, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🖥️</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Fullscreen Required</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
        To ensure a fair and secure interview environment, you must be in fullscreen mode to proceed.
      </p>
      <button onClick={onEnter} className="btn btn-primary" style={{ width: '100%', padding: '14px', justifyContent: 'center' }}>
        Enter Fullscreen & Begin
      </button>
    </div>
  </div>
);

const WebcamView = ({ onFaceData }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null); // Ref to store the stream
  const [warnings, setWarnings] = useState([]);

  const drawBoundingBoxes = (faces) => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    faces.forEach((face) => {
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(74, 222, 128, 0.8)";
      ctx.rect(face.x, face.y, face.width, face.height);
      ctx.stroke();

      // Label
      ctx.fillStyle = "rgba(74, 222, 128, 0.8)";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText(
        `${(face.confidence * 100).toFixed(0)}% Eye Contact: ${face.eye_contact_percentage.toFixed(0)}%`,
        face.x,
        face.y > 20 ? face.y - 8 : 15
      );
    });
  };

  useEffect(() => {
    const socketUrl =  'https://flask-socket-mediapipe.onrender.com' || 'http://localhost:5001';
    socketRef.current = io(socketUrl);

    socketRef.current.on('face_data', (data) => {
      setWarnings(data.warnings || []);
      if (data.faces) drawBoundingBoxes(data.faces);
      if (onFaceData) onFaceData(data);
    });

    navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } })
      .then(stream => {
        streamRef.current = stream; // Store the stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Webcam error:", err));

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current && socketRef.current.connected) {
        const canvas = canvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const video = videoRef.current;
        if (video.videoWidth === 0) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;

        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        socketRef.current.emit('video_frame', { image: dataUrl });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) socketRef.current.disconnect();
      
      // Stop all tracks from the streamRef
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [onFaceData]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '4/3', border: '1px solid var(--border)' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <canvas ref={overlayCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {warnings.length > 0 && (
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          background: 'rgba(255, 68, 68, 0.85)', color: 'white',
          padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
          textAlign: 'center', zIndex: 10, backdropFilter: 'blur(4px)'
        }}>
          ⚠️ {warnings[0]}
        </div>
      )}
    </div>
  );
};

const AIAvatar = ({ isSpeaking, isThinking }) => (
  <div style={{
    width: 120, height: 120,
    borderRadius: '50%',
    background: 'var(--gradient-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 52,
    position: 'relative',
    boxShadow: isSpeaking ? '0 0 40px rgba(79,142,247,0.6)' : '0 0 20px rgba(79,142,247,0.2)',
    transition: 'box-shadow 0.3s ease',
    animation: isSpeaking ? 'glow 1.5s ease infinite' : 'none'
  }}>
    {isThinking ? '🤔' : '🤖'}
    {isSpeaking && (
      <div style={{
        position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 3, alignItems: 'flex-end'
      }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="waveform-bar" style={{ width: 4, height: `${Math.random() * 16 + 8}px` }} />
        ))}
      </div>
    )}
  </div>
);

const Timer = ({ duration, onExpire }) => {
  const [remaining, setRemaining] = useState(duration);
  const ref = useRef(null);

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(ref.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [duration, onExpire]);

  const pct = (remaining / duration) * 100;
  const color = remaining > duration * 0.5 ? 'var(--success)' : remaining > duration * 0.25 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color }}>
        {Math.floor(remaining / 60).toString().padStart(2, '0')}:{(remaining % 60).toString().padStart(2, '0')}
      </div>
      <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 1s linear, background 0.3s ease' }} />
      </div>
    </div>
  );
};

const InterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { speak, stopSpeaking, isSpeaking } = useSpeech();
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState('loading'); // loading | intro | question | evaluating | next | complete
  const [evaluation, setEvaluation] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [inputMode, setInputMode] = useState('text'); // text | voice
  const [showHint, setShowHint] = useState(false);
  const [eyeContactScores, setEyeContactScores] = useState([]);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [proctoringMessage, setProctoringMessage] = useState("");

  const timerDuration = 120; // 2 min per question

  // Cleanup on unmount: stop voice and camera
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
      if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (exitFs) exitFs.call(document).catch(() => {});
      }
    };
  }, [stopSpeaking, stopListening]);

  // Fullscreen handlers
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().then(() => setIsFullscreen(true));
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen().then(() => setIsFullscreen(true));
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen().then(() => setIsFullscreen(true));
  }, []);

  const checkFullscreen = useCallback(() => {
    setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement));
  }, []);

  // Proctoring: Tab switches
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && phase !== 'loading' && phase !== 'complete') {
      setWarningCount(prev => {
        const next = prev + 1;
        setProctoringMessage(`Warning! Please do not switch tabs. Warning ${next} of 3.`);
        setShowWarningModal(true);
        speak(`Warning! Please do not switch tabs.`);
        return next;
      });
    }
  }, [phase, speak]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('msfullscreenchange', checkFullscreen);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Block context menu & some shortcuts
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 't' || e.key === 'n' || e.key === 'w')) {
        e.preventDefault();
        setProctoringMessage("Keyboard shortcuts are disabled for security.");
        setShowWarningModal(true);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('msfullscreenchange', checkFullscreen);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [checkFullscreen, handleVisibilityChange]);

  const handleFaceData = useCallback((data) => {
    if (data.faces && data.faces.length > 0) {
      const face = data.faces[0];
      setEyeContactScores(prev => [...prev, face.eye_contact_percentage]);
      
      setMetricsHistory(prev => [
        ...prev.slice(-19),
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          confidence: face.confidence * 100,
          eyeContact: face.eye_contact_percentage
        }
      ]);
    }
  }, []);

  // Load session
  useEffect(() => {
    const init = async () => {
      try {
        const res = await interviewAPI.getOne(id);
        const s = res.data.session;
        setSession(s);
        await interviewAPI.start(id);
        setPhase('intro');
        // Greet
        setTimeout(() => {
          speak(
            `Welcome to your ${s.domain} ${s.type} interview. I will ask you ${s.questions?.length || 0} questions. Let's begin with the first question.`,
            () => setPhase('question')
          );
        }, 500);
      } catch (err) {
        console.error(err);
        navigate('/dashboard');
      }
    };
    init();
  }, [id]);

  // Speak question when entering question phase
  useEffect(() => {
    if (phase === 'question' && session?.questions[currentIndex]) {
      speak(session.questions[currentIndex].questionText);
    }
  }, [phase, currentIndex]);

  // Sync voice transcript to answer
  useEffect(() => {
    if (transcript) setAnswer(transcript);
  }, [transcript]);

  const handleTimerExpire = useCallback(() => {
    if (phase === 'question') submitAnswer(true);
  }, [phase, answer]);

  const submitAnswer = async (auto = false) => {
    if (phase !== 'question') return;
    stopSpeaking();
    stopListening();

    const currentQ = session.questions[currentIndex];
    
    // Just record the answer locally for now to avoid rate limits
    const answerData = {
      questionText: currentQ.questionText,
      userAnswer: answer || '(Skipped)',
      answerMethod: inputMode,
      timeTaken: 0,
      skipped: !answer
    };

    const newAnswers = [...answers, answerData];
    setAnswers(newAnswers);

    // Save partial answer to DB (optional, but good for persistence)
    try {
      await interviewAPI.submitAnswer(id, {
        questionIndex: currentIndex,
        userAnswer: answerData.userAnswer,
        answerMethod: answerData.answerMethod,
        skipped: answerData.skipped
      });
    } catch (err) { /* non-critical */ }

    // Move to "transition" instead of "evaluating"
    setPhase('next');
    speak(currentIndex + 1 >= session.questions.length ? "Interview complete. Analyzing your performance..." : "Answer recorded. Moving to the next question.");
  };

  const goNext = async () => {
    resetTranscript();
    setAnswer('');
    setShowHint(false);

    if (currentIndex + 1 >= session.questions.length) {
      await finishInterview();
    } else {
      setCurrentIndex(prev => prev + 1);
      setPhase('question');
    }
  };

  const finishInterview = async () => {
    setPhase('loading');
    
    // Exit fullscreen mode
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (exitFs) exitFs.call(document).catch(() => {});
    }

    const avgEyeContact = eyeContactScores.length > 0
      ? Math.round(eyeContactScores.reduce((a, b) => a + b, 0) / eyeContactScores.length)
      : 0;

    try {
      // One single AI call for the entire interview
      const evalRes = await aiAPI.evaluateInterview({
        questions: answers,
        jobTitle: session.jobTitle,
        jobDescription: session.jobDescription,
        experienceLevel: session.experienceLevel,
        type: session.type,
        difficulty: session.difficulty,
        eyeContactScore: avgEyeContact
      });
      const { questionEvaluations, overallSummary, strengths, weaknesses, recommendations, overallScore, categoryScores } = evalRes.data.evaluation;

      // Update the session with complete evaluations
      // We need to match the backend expectations
      const updatedQuestions = session.questions.map((q, i) => {
        const evaluation = questionEvaluations.find(ev => ev.index === i + 1) || {};
        const userAnswerData = answers[i] || {};
        return {
          ...q,
          userAnswer: userAnswerData.userAnswer,
          scores: evaluation.scores,
          feedback: evaluation.feedback,
          modelAnswer: evaluation.modelAnswer,
          skipped: userAnswerData.skipped
        };
      });

      await interviewAPI.complete(id, {
        overallScore,
        categoryScores,
        strengths,
        weaknesses,
        recommendations,
        aiSummary: overallSummary,
        questions: updatedQuestions,
        eyeContactScore: avgEyeContact
      });

      navigate(`/result/${id}`);
    } catch (err) {
      console.error('Final evaluation error:', err);
      navigate(`/result/${id}`);
    }
  };

  const skipQuestion = () => {
    setAnswer('');
    submitAnswer(true);
  };

  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;

  if (!session || phase === 'loading') {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3 }} />
        <p style={{ color: 'var(--text-secondary)' }}>
          {phase === 'loading' && session ? 'Finalizing your interview...' : 'Preparing your interview...'}
        </p>
      </div>
    );
  }

  const currentQ = session.questions[currentIndex];
  const progress = ((currentIndex) / session.questions.length) * 100;

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
      {!isFullscreen && phase !== 'complete' && <FullscreenPrompt onEnter={enterFullscreen} />}
      {showWarningModal && <WarningModal message={proctoringMessage} onConfirm={() => setShowWarningModal(false)} />}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>
              {session.domain} Interview
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Question {currentIndex + 1} of {session.questions.length}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
             {phase === 'question' && (
              <div className="badge badge-blue" style={{ padding: '6px 12px' }}>
                <span style={{ marginRight: 6 }}>⏱</span>
                <Timer duration={timerDuration} onExpire={handleTimerExpire} />
              </div>
            )}
            <button
              onClick={() => { if (window.confirm('End interview now?')) finishInterview(); }}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              Terminate
            </button>
          </div>
        </div>
        <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gradient-accent)', transition: 'width 0.5s ease', borderRadius: 3 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, flex: 1 }}>
        {/* Left column - Question & Interaction */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Question Card */}
          <div className="card animate-fadeIn" style={{ padding: 32, flex: '0 0 auto' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 800 }}>{currentQ?.questionType}</span>
              <span className="badge badge-blue" style={{ textTransform: 'capitalize', fontSize: 10, fontWeight: 800 }}>{session.difficulty}</span>
              {isSpeaking && (
                <div className="waveform" style={{ marginLeft: 'auto' }}>
                  {[1,2,3,4,5].map(i => <div key={i} className="waveform-bar" />)}
                </div>
              )}
            </div>
            <p style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 24 }}>
              {currentQ?.questionText}
            </p>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => speak(currentQ?.questionText)}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '8px 16px' }}
              >
                🔊 Repeat Question
              </button>
              {currentQ?.hint && phase === 'question' && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: '8px 16px', color: 'var(--accent)' }}
                >
                  💡 {showHint ? 'Hide Hint' : 'Get Hint'}
                </button>
              )}
            </div>

            {showHint && currentQ?.hint && (
              <div className="animate-fadeIn" style={{
                marginTop: 20, padding: '16px',
                background: 'var(--accent-glow)', borderRadius: 12,
                fontSize: 14, color: 'var(--text-secondary)',
                borderLeft: '4px solid var(--accent)', lineHeight: 1.6
              }}>
                <strong>Hint:</strong> {currentQ.hint}
              </div>
            )}
          </div>

          {/* Interaction Card */}
          {(phase === 'question' || phase === 'next') && (
            <div className="card animate-fadeIn" style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>Your Response</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['text', 'voice'].map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        setInputMode(m);
                        if (m === 'voice') startListening(setAnswer);
                        else stopListening();
                      }}
                      style={{
                        padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: inputMode === m ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: inputMode === m ? '#fff' : 'var(--text-secondary)',
                        border: 'none', transition: 'all 0.2s'
                      }}
                    >
                      {m === 'voice' ? '🎤 Voice' : '⌨️ Text'}
                    </button>
                  ))}
                </div>
              </div>

              {isListening && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'recordPulse 1s ease infinite' }} />
                  <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>System is listening... speak clearly.</span>
                </div>
              )}

              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                disabled={phase !== 'question' || inputMode === 'voice'}
                placeholder={inputMode === 'voice' ? 'Transcription will appear here...' : 'Type your detailed answer here...'}
                style={{
                  flex: 1,
                  minHeight: 180,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 20,
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  lineHeight: 1.7,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />

              {phase === 'question' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={skipQuestion} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '14px' }}>
                    Skip
                  </button>
                  <button
                    onClick={() => submitAnswer()}
                    className="btn btn-primary"
                    style={{ flex: 2, justifyContent: 'center', padding: '14px' }}
                    disabled={phase !== 'question'}
                  >
                    Submit Response →
                  </button>
                </div>
              )}

              {phase === 'next' && (
                <button
                  onClick={goNext}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
                >
                  {currentIndex + 1 >= session.questions.length ? 'Finalize Interview' : 'Next Question'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right column - Monitoring & Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Webcam monitoring */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>LIVE MONITORING</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>SECURE</span>
              </div>
            </div>
            <WebcamView onFaceData={handleFaceData} />
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
              <AIAvatar isSpeaking={isSpeaking} isThinking={phase === 'evaluating'} />
            </div>
          </div>

          {/* Real-time Analytics Chart */}
          <div className="card" style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>PERFORMANCE METRICS</h4>
            <div style={{ flex: 1, minHeight: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="eyeContact" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="confidence" stroke="var(--success)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 2, background: 'var(--accent)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Eye Contact</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 2, background: 'var(--success)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confidence</span>
              </div>
            </div>
          </div>

          {/* Current Stats */}
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>EYE CONTACT</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>
                {metricsHistory.length > 0 ? Math.round(metricsHistory[metricsHistory.length-1].eyeContact) : 0}%
              </div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>CONFIDENCE</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>
                {metricsHistory.length > 0 ? Math.round(metricsHistory[metricsHistory.length-1].confidence) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getScoreColor = (score) => {
  if (score >= 8) return 'var(--success)';
  if (score >= 6) return 'var(--warning)';
  return 'var(--danger)';
};

export default InterviewPage;
