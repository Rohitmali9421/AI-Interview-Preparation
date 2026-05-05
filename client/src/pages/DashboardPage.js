import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, interviewAPI } from '../services/api';
import StatCard from '../components/common/StatCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          userAPI.getStats(),
          interviewAPI.getAnalytics()
        ]);
        setStats(statsRes.data.stats);
        setAnalytics(analyticsRes.data.analytics);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const domains = [
    { id: 'software-engineer', label: 'Software Engineer', icon: '💻', color: 'rgba(97,218,251,0.15)' },
    { id: 'project-manager', label: 'Project Manager', icon: '📋', color: 'rgba(255,212,59,0.15)' },
    { id: 'product-designer', label: 'Product Designer', icon: '🎨', color: 'rgba(248,152,32,0.15)' },
    { id: 'sales-executive', label: 'Sales Executive', icon: '🤝', color: 'rgba(34,197,94,0.15)' },
    { id: 'nurse', label: 'Registered Nurse', icon: '🏥', color: 'rgba(239,68,68,0.15)' },
    { id: 'other', label: 'Custom Role', icon: '✨', color: 'rgba(79,142,247,0.15)' }
  ];

  const handleQuickStart = (d) => {
    navigate('/setup', { state: { jobTitle: d.id === 'other' ? '' : d.label } });
  };

  const chartData = analytics?.scoreTrend?.map((s, i) => ({
    name: `#${i + 1}`,
    score: s.score
  })) || [];

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fadeIn" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            {stats?.totalInterviews > 0
              ? `You've completed ${stats.completedInterviews} interviews. Keep going!`
              : 'Ready to ace your next interview? Start practicing now.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/realtime-setup')}
            style={{ padding: '12px 24px', fontSize: 15, background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            🎙️ Real-Time Mode
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/setup')}
            style={{ padding: '12px 24px', fontSize: 15 }}
          >
            ▶ Start Interview
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 animate-fadeIn" style={{ marginBottom: 32, animationDelay: '0.1s' }}>
        <StatCard
          label="Total Interviews"
          value={stats?.totalInterviews || 0}
          icon="📋"
          color="rgba(79,142,247,0.1)"
        />
        <StatCard
          label="Average Score"
          value={`${stats?.averageScore || 0}/10`}
          icon="⭐"
          color="rgba(245,158,11,0.1)"
        />
        <StatCard
          label="Current Streak"
          value={`${stats?.streak || 0} 🔥`}
          icon="🔥"
          color="rgba(239,68,68,0.1)"
        />
        <StatCard
          label="Last Score"
          value={stats?.lastScore ? `${stats.lastScore}/10` : 'N/A'}
          icon="🎯"
          color="rgba(34,197,94,0.1)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginBottom: 32 }}
        className="responsive-grid">
        {/* Score Trend Chart */}
        <div className="card animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
            Score Progression
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 220, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12
            }}>
              <div style={{ fontSize: 48 }}>📊</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Complete interviews to see your progress
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/setup')}>
                Take First Interview
              </button>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="card animate-fadeIn" style={{ animationDelay: '0.25s' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Recent Sessions
          </h3>
          {stats?.recentSessions?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.recentSessions.map(s => (
                <div key={s._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {s.domain} • {s.type}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    background: getScoreColor(s.overallScore).bg,
                    color: getScoreColor(s.overallScore).text
                  }}>
                    {s.overallScore}/10
                  </div>
                </div>
              ))}
              <Link to="/history" style={{ textDecoration: 'none' }}>
                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--accent)', marginTop: 4, cursor: 'pointer' }}>
                  View all history →
                </div>
              </Link>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎬</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No interviews yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Domain Quick Start */}
      <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
          Quick Practice
        </h2>
        <div className="grid-3">
          {domains.map(d => (
            <button
              key={d.id}
              onClick={() => handleQuickStart(d)}
              className="card"
              style={{
                background: d.color,
                border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '20px 24px'
              }}
            >
              <span style={{ fontSize: 32 }}>{d.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{d.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Start practicing →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

const getScoreColor = (score) => {
  if (score >= 8) return { bg: 'rgba(34,197,94,0.15)', text: 'var(--success)' };
  if (score >= 6) return { bg: 'rgba(245,158,11,0.15)', text: 'var(--warning)' };
  return { bg: 'rgba(239,68,68,0.15)', text: 'var(--danger)' };
};

export default DashboardPage;
