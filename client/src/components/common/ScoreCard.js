import React from 'react';

const ScoreCard = ({ label, score, icon, color = 'var(--accent)' }) => {
  const pct = Math.round((score / 10) * 100);

  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontSize: 36,
        fontWeight: 700,
        fontFamily: 'Syne, sans-serif',
        color,
        lineHeight: 1
      }}>
        {score.toFixed(1)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>/ 10</div>
      <div style={{
        height: 4,
        background: 'var(--bg-secondary)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 8
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 1s ease'
        }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
    </div>
  );
};

export default ScoreCard;
