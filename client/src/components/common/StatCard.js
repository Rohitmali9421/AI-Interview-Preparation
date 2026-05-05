import React from 'react';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{
      width: 52, height: 52,
      borderRadius: 14,
      background: color || 'var(--accent-glow)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24, flexShrink: 0
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

export default StatCard;
