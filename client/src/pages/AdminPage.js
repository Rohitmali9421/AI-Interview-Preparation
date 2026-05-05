import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([adminAPI.getAnalytics(), adminAPI.getUsers()])
      .then(([aRes, uRes]) => {
        setAnalytics(aRes.data.analytics);
        setUsers(uRes.data.users);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user and all their data?')) return;
    await adminAPI.deleteUser(id);
    setUsers(prev => prev.filter(u => u._id !== id));
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" style={{ width: 40, height: 40, margin: '0 auto' }} /></div>;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Admin Panel</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Platform overview and management</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['overview', 'users'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize', padding: '8px 20px' }}>
            {t === 'overview' ? '📊 Overview' : '👥 Users'}
          </button>
        ))}
      </div>

      {tab === 'overview' && analytics && (
        <div>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Users', value: analytics.totalUsers, icon: '👥' },
              { label: 'Total Interviews', value: analytics.totalInterviews, icon: '📋' },
              { label: 'Completed', value: analytics.completedInterviews, icon: '✅' },
              { label: 'Avg Score', value: analytics.averageScore, icon: '⭐' }
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Domain Performance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analytics.domainStats?.map(d => (
                <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 100, fontSize: 13, textTransform: 'capitalize', fontWeight: 600 }}>{d._id}</div>
                  <div style={{ flex: 1, height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.avgScore / 10) * 100}%`, background: 'var(--gradient-accent)', borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 80, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {d.avgScore?.toFixed(1)}/10 ({d.count})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                {['Name', 'Email', 'Role', 'Interviews', 'Avg Score', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '14px 20px' }}><span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{u.role}</span></td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text-secondary)' }}>{u.totalInterviews}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text-secondary)' }}>{u.averageScore}/10</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 20px' }}>
                    {u.role !== 'admin' && (
                      <button onClick={() => handleDelete(u._id)} className="btn btn-danger" style={{ padding: '4px 12px', fontSize: 12 }}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
