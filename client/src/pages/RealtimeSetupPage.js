import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { realtimeAPI } from '../services/api';

const RealtimeSetupPage = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    jobTitle: '',
    jobDescription: '',
    experienceLevel: 'mid',
    difficulty: 'medium'
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

  const handleStart = async () => {
    if (!config.jobTitle.trim()) {
      setError('Please enter a Job Title.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('jobTitle', config.jobTitle);
      formData.append('jobDescription', config.jobDescription);
      formData.append('experienceLevel', config.experienceLevel);
      formData.append('difficulty', config.difficulty);
      if (resume) formData.append('resume', resume);

      const res = await realtimeAPI.start(formData);
      navigate(`/realtime-interview/${res.data.session._id}`);
    } catch (err) {
      setError('Failed to start real-time session.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800 }}>Real-Time Adaptive Interview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Upload your resume for a personalized, conversation-based interview.</p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Job Title</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer"
              value={config.jobTitle}
              onChange={e => set('jobTitle', e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Upload Resume (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={e => setResume(e.target.files[0])}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
             <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Experience</label>
              <select 
                value={config.experienceLevel} 
                onChange={e => set('experienceLevel', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="fresher">Fresher</option>
                <option value="mid">Mid-Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Difficulty</label>
              <select 
                value={config.difficulty} 
                onChange={e => set('difficulty', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

          <button
            onClick={handleStart}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: 16, marginTop: 10 }}
          >
            {loading ? 'Initializing...' : 'Start Real-Time Session'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealtimeSetupPage;
