import React from 'react';

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    gap: '20px'
  }}>
    <div style={{ position: 'relative', width: 64, height: 64 }}>
      <div style={{
        position: 'absolute', inset: 0,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <div style={{
        position: 'absolute', inset: 8,
        border: '2px solid transparent',
        borderTopColor: 'var(--accent-secondary)',
        borderRadius: '50%',
        animation: 'spin 1.2s linear infinite reverse'
      }} />
    </div>
    <p style={{ color: 'var(--text-secondary)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14 }}>
      Loading AI Interviewer...
    </p>
  </div>
);

export default LoadingScreen;
