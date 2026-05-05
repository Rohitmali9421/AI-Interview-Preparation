import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { interviewAPI, aiAPI } from '../services/api';

const TYPES = [
  { id: 'technical', label: 'Domain Specific', desc: 'Core knowledge & practical skills', icon: '🎯' },
  { id: 'hr', label: 'HR / Behavioral', desc: 'Soft skills & situational', icon: '🤝' },
  { id: 'mixed', label: 'Mixed', desc: 'Both domain and HR', icon: '⚖️' }
];

const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher', desc: '0-2 years', icon: '🌱' },
  { id: 'mid', label: 'Mid-Level', desc: '2-5 years', icon: '🚀' },
  { id: 'senior', label: 'Senior', desc: '5-10 years', icon: '🧠' },
  { id: 'lead', label: 'Lead/Manager', desc: '10+ years', icon: '👑' }
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: 'var(--success)' },
  { id: 'medium', label: 'Medium', color: 'var(--warning)' },
  { id: 'hard', label: 'Hard', color: 'var(--danger)' }
];

const QUESTION_COUNTS = [
  { id: 3, label: '3 Qs', icon: '📝' },
  { id: 5, label: '5 Qs', icon: '📝' },
  { id: 8, label: '8 Qs', icon: '📝' },
  { id: 10, label: '10 Qs', icon: '📝' }
];

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
      {title}
    </h3>
    {children}
  </div>
);

const OptionGrid = ({ options, selected, onSelect, cols = 4 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
    {options.map(opt => (
      <button
        key={opt.id}
        onClick={() => onSelect(opt.id)}
        style={{
          padding: '16px 12px',
          borderRadius: 12,
          border: `2px solid ${selected === opt.id ? 'var(--accent)' : 'var(--border)'}`,
          background: selected === opt.id ? 'var(--accent-glow)' : 'var(--bg-secondary)',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'var(--transition)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6
        }}
      >
        <div style={{ fontSize: 24 }}>{opt.icon}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: selected === opt.id ? 'var(--accent)' : 'var(--text-primary)' }}>
          {opt.label}
        </div>
        {opt.desc && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{opt.desc}</div>
        )}
      </button>
    ))}
  </div>
);

const SetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [config, setConfig] = useState({
    type: location.state?.type || 'mixed',
    jobTitle: location.state?.jobTitle || '',
    jobDescription: location.state?.jobDescription || '',
    experienceLevel: location.state?.experienceLevel || 'mid',
    difficulty: location.state?.difficulty || 'medium',
    duration: location.state?.duration || 10,
    questions: location.state?.totalQuestions || 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

  const handleStart = async () => {
    if (!config.jobTitle.trim()) {
      setError('Please enter a Job Title to proceed.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Create session
      const sessionRes = await interviewAPI.create({
        type: config.type,
        jobTitle: config.jobTitle,
        jobDescription: config.jobDescription,
        experienceLevel: config.experienceLevel,
        difficulty: config.difficulty,
        duration: config.duration,
        totalQuestions: config.questions
      });
      const sessionId = sessionRes.data.session._id;

      let finalQuestions;
      if (location.state?.existingQuestions) {
        // Reuse same questions
        finalQuestions = location.state.existingQuestions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          difficulty: q.difficulty,
          hint: q.hint
        }));
      } else {
        // Generate new questions
        const qRes = await aiAPI.generateQuestions({
          type: config.type,
          jobTitle: config.jobTitle,
          jobDescription: config.jobDescription,
          experienceLevel: config.experienceLevel,
          difficulty: config.difficulty,
          count: config.questions
        });
        finalQuestions = qRes.data.questions;
      }

      // Save questions to session
      await interviewAPI.addQuestions(sessionId, finalQuestions);

      // Navigate to interview
      navigate(`/interview/${sessionId}`);
    } catch (err) {
      setError('Failed to start interview. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div className="animate-fadeIn" style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
          {location.state?.existingQuestions ? 'Retry Interview' : 'Setup Your Interview'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
          {location.state?.existingQuestions 
            ? 'Practicing again with the same set of questions.' 
            : "Tell us about the role you're practicing for."}
        </p>
        {location.state?.existingQuestions && (
          <div style={{ marginTop: 12 }}>
            <span className="badge badge-blue" style={{ padding: '8px 16px', fontSize: 12 }}>
              🔄 Same Questions Mode Active
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }} className="responsive-grid">
        <div className="card animate-fadeIn" style={{ animationDelay: '0.1s', padding: 32 }}>
          <Section title="1. Role Information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Product Manager, Staff Nurse, Marketing Head"
                  value={config.jobTitle}
                  onChange={e => set('jobTitle', e.target.value)}
                  style={{
                    width: '100%', padding: '14px 18px', borderRadius: 12,
                    border: '2px solid var(--border)', background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', fontSize: 15, outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Job Description (Optional)</label>
                <textarea
                  placeholder="Paste the job description or key requirements here for a more personalized interview..."
                  value={config.jobDescription}
                  onChange={e => set('jobDescription', e.target.value)}
                  style={{
                    width: '100%', padding: '14px 18px', borderRadius: 12,
                    border: '2px solid var(--border)', background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', fontSize: 15, outline: 'none',
                    minHeight: 120, resize: 'vertical', fontFamily: 'inherit',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>
          </Section>

          <Section title="2. Experience Level">
            <OptionGrid options={EXPERIENCE_LEVELS} selected={config.experienceLevel} onSelect={v => set('experienceLevel', v)} cols={4} />
          </Section>

          <Section title="3. Interview Style">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Focus Area</label>
                <OptionGrid options={TYPES} selected={config.type} onSelect={v => set('type', v)} cols={1} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Difficulty</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      onClick={() => set('difficulty', d.id)}
                      style={{
                        padding: '12px',
                        borderRadius: 10,
                        border: `2px solid ${config.difficulty === d.id ? d.color : 'var(--border)'}`,
                        background: config.difficulty === d.id ? `${d.color}15` : 'var(--bg-secondary)',
                        color: config.difficulty === d.id ? d.color : 'var(--text-primary)',
                        cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)'
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="4. Number of Questions">
            <OptionGrid options={QUESTION_COUNTS} selected={config.questions} onSelect={v => set('questions', v)} cols={4} />
          </Section>
        </div>

        {/* Sidebar Summary */}
        <div style={{ position: 'sticky', top: 100 }}>
          <div className="card animate-fadeIn" style={{ animationDelay: '0.2s', padding: 28, marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              Session Ready
            </h3>

            {[
              { label: 'Role', value: config.jobTitle || 'Not set' },
              { label: 'Experience', value: EXPERIENCE_LEVELS.find(e => e.id === config.experienceLevel)?.label },
              { label: 'Style', value: TYPES.find(t => t.id === config.type)?.label },
              { label: 'Difficulty', value: DIFFICULTIES.find(d => d.id === config.difficulty)?.label },
              { label: 'Questions', value: `${config.questions} items` }
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', maxWidth: '180px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.value}
                </span>
              </div>
            ))}

            <div style={{ marginTop: 24, padding: '16px', background: 'var(--accent-glow)', borderRadius: 12, border: '1px solid rgba(79,142,247,0.2)' }}>
              <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700, marginBottom: 6 }}>
                💡 Pro Tip
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Provide a Job Description to get highly specific questions tailored to the exact role requirements.
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, padding: '14px 18px',
              marginBottom: 16, fontSize: 13, color: 'var(--danger)',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '18px', fontSize: 16, borderRadius: 12, boxShadow: '0 8px 24px rgba(79,142,247,0.3)' }}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 20, height: 20 }} /> Crafting interview...</>
            ) : '🚀 Start Practice Session'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
