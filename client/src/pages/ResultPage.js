import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ScoreCard from '../components/common/ScoreCard';
import StatCard from '../components/common/StatCard';

const ResultPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [activeQ, setActiveQ] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewAPI.getOne(id)
      .then(res => setSession(res.data.session))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh-64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3 }} />
      </div>
    );
  }

  if (!session) return null;

  const score = session.overallScore || 0;
  const scoreColor = score >= 8 ? 'var(--success)' : score >= 6 ? 'var(--warning)' : 'var(--danger)';
  const answeredQs = session.questions?.filter(q => !q.skipped && q.userAnswer) || [];

  const radarData = [
    { subject: 'Clarity', value: Math.round(session.categoryScores?.clarity || 0) * 10 },
    { subject: 'Accuracy', value: Math.round(session.categoryScores?.accuracy || 0) * 10 },
    { subject: 'Relevance', value: Math.round(session.categoryScores?.relevance || 0) * 10 },
    { subject: 'Communication', value: Math.round(session.categoryScores?.communication || 0) * 10 }
  ];

  const readiness = score >= 9 ? 'Excellent' : score >= 7.5 ? 'Ready' : score >= 6 ? 'Almost Ready' : score >= 4 ? 'Needs Work' : 'Not Ready';
  const readinessColor = score >= 7.5 ? 'var(--success)' : score >= 5 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fadeIn" style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, marginBottom: 6 }}>
            Interview Complete! 🎉
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {session.jobTitle?.toUpperCase()} • {session.type} • {session.difficulty} • {new Date(session.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/setup" className="btn btn-primary">New Interview</Link>
          <Link to="/history" className="btn btn-secondary">View History</Link>
        </div>
      </div>

      {/* Overall score hero */}
      <div className="card animate-fadeIn" style={{
        marginBottom: 24,
        padding: 36,
        animationDelay: '0.1s',
        background: `linear-gradient(135deg, var(--bg-card) 0%, ${scoreColor}11 100%)`,
        border: `1px solid ${scoreColor}33`,
        display: 'flex',
        alignItems: 'center',
        gap: 40,
        flexWrap: 'wrap'
      }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 80, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: scoreColor, lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 4 }}>out of 10</div>
          <div style={{
            marginTop: 12,
            padding: '6px 16px',
            borderRadius: 100,
            background: `${readinessColor}22`,
            color: readinessColor,
            fontSize: 14,
            fontWeight: 700
          }}>
            {readiness}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16 }}>
            {session.aiSummary || `You answered ${answeredQs.length} out of ${session.questions?.length || 0} questions.`}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>📝</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session.questions?.length || 0} questions</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{answeredQs.length} answered</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>⏱</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {Math.round((session.actualDuration || 0) / 60)} min
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 24 }}>
        {/* Category scores */}
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Category Breakdown
          </h2>
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <ScoreCard label="Clarity" score={session.categoryScores?.clarity || 0} icon="💬" color="var(--accent)" />
            <ScoreCard label="Accuracy" score={session.categoryScores?.accuracy || 0} icon="🎯" color="var(--accent-secondary)" />
            <ScoreCard label="Relevance" score={session.categoryScores?.relevance || 0} icon="⚖️" color="var(--info)" />
            <ScoreCard label="Communication" score={session.categoryScores?.communication || 0} icon="🗣️" color="var(--success)" />
          </div>

          {session.eyeContactScore !== undefined && (
            <div style={{ marginBottom: 24 }}>
              <StatCard 
                label="Average Eye Contact Score" 
                value={`${session.eyeContactScore}%`} 
                icon="👁️" 
                color="rgba(168, 85, 247, 0.1)"
                sub="Non-verbal communication metric"
              />
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)', marginBottom: 12 }}>
                💪 Strengths
              </h4>
              {session.strengths?.length ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {session.strengths.map((s, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>{s}
                    </li>
                  ))}
                </ul>
              ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Complete more questions for analysis.</p>}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', marginBottom: 12 }}>
                📈 Areas to Improve
              </h4>
              {session.weaknesses?.length ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {session.weaknesses.map((w, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--warning)', flexShrink: 0 }}>→</span>{w}
                    </li>
                  ))}
                </ul>
              ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No weaknesses identified.</p>}
            </div>
          </div>
        </div>

        {/* Radar + Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Performance Radar</h4>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(v) => [`${v}%`, '']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🎓 Recommendations</h4>
            {session.recommendations?.length ? (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {session.recommendations.map((r, i) => (
                  <li key={i} style={{
                    fontSize: 13, color: 'var(--text-secondary)',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    borderLeft: '3px solid var(--accent)'
                  }}>
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Practice more to get personalized recommendations.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Question-by-question review */}
      <div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          Question Review
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {session.questions?.map((q, i) => (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setActiveQ(activeQ === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', padding: '18px 24px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)'
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${getScoreColor(q.scores?.overall || 0)}22`,
                  color: getScoreColor(q.scores?.overall || 0),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0
                }}>
                  {q.scores?.overall || 0}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{q.questionText}</div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{activeQ === i ? '▲' : '▼'}</span>
              </button>

              {activeQ === i && (
                <div style={{ padding: '0 24px 20px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <h5 style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
                        Your Answer
                      </h5>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, padding: 14, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                        {q.userAnswer || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Skipped</span>}
                      </div>
                    </div>
                    {q.modelAnswer && (
                      <div>
                        <h5 style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
                          Model Answer
                        </h5>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, padding: 14, background: 'rgba(79,142,247,0.05)', borderRadius: 8, border: '1px solid rgba(79,142,247,0.15)' }}>
                          {q.modelAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                  {q.feedback && (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(245,158,11,0.05)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
                      <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>AI Feedback: </span>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{q.feedback}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
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

export default ResultPage;
