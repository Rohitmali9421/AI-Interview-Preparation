import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await interviewAPI.getAll({ page, limit: 10, ...(filter && { status: filter }) });
        setSessions(res.data.sessions);
        setTotalPages(res.data.totalPages);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [page, filter]);

  const handleRetry = (s) => {
    navigate('/setup', {
      state: {
        jobTitle: s.jobTitle,
        jobDescription: s.jobDescription,
        type: s.type,
        difficulty: s.difficulty,
        experienceLevel: s.experienceLevel,
        duration: s.duration,
        totalQuestions: s.totalQuestions,
        existingQuestions: s.questions // Pass the same questions
      }
    });
  };

  const scoreColor = (s) => s >= 8 ? 'var(--success)' : s >= 6 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800 }}>Interview History</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'completed', 'in-progress', 'abandoned'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 14px', fontSize: 13 }}>
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40, margin: '0 auto' }} /></div>
      ) : sessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 8 }}>No interviews yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Start your first interview to see history here.</p>
          <Link to="/setup" className="btn btn-primary">Start Interview</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map(s => (
            <div key={s._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 24px', flexWrap: 'wrap' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${scoreColor(s.overallScore)}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor(s.overallScore) }}>{s.overallScore || '—'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, textTransform: 'capitalize', marginBottom: 4 }}>
                  {s.jobTitle} • {s.type} Interview
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span className={`badge ${s.difficulty === 'easy' ? 'badge-green' : s.difficulty === 'medium' ? 'badge-yellow' : 'badge-red'}`} style={{ textTransform: 'capitalize' }}>{s.difficulty}</span>
                  <span className={`badge ${s.status === 'completed' ? 'badge-green' : s.status === 'in-progress' ? 'badge-blue' : 'badge-red'}`} style={{ textTransform: 'capitalize' }}>{s.status}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {s.status === 'completed' && (
                  <Link to={`/result/${s._id}`} className="btn btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>View Results</Link>
                )}
                <button 
                  onClick={() => handleRetry(s)} 
                  className="btn btn-primary" 
                  style={{ padding: '7px 16px', fontSize: 13, background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                >
                  🔄 Retry
                </button>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`btn ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`} style={{ width: 36, height: 36, padding: 0, justifyContent: 'center' }}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
