import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout, toggleTheme, theme } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { path: '/setup', label: 'New Interview', icon: '▶' },
    { path: '/history', label: 'History', icon: '◷' },
    { path: '/profile', label: 'Profile', icon: '◉' },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: '⚙' }] : [])
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 64,
      background: 'rgba(8,12,20,0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 24
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--gradient-accent)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18
        }}>🎯</div>
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: 18,
          color: 'white'
        }}>InterviewAI</span>
      </Link>

      {/* Desktop Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }} className="desktop-nav">
        {navLinks.map(link => (
          <Link key={link.path} to={link.path} style={{
            textDecoration: 'none',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            color: isActive(link.path) ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive(link.path) ? 'var(--accent-glow)' : 'transparent',
            transition: 'var(--transition)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 16 }}>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme} style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: 16,
          color: 'var(--text-primary)'
        }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* New Interview CTA */}
        <Link to="/setup" className="btn btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>
          + New Interview
        </Link>

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14
          }}>
            <div style={{
              width: 28, height: 28,
              borderRadius: '50%',
              background: 'var(--gradient-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name?.split(' ')[0]}
            </span>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 8,
              minWidth: 180,
              boxShadow: 'var(--shadow-card)',
              zIndex: 100
            }} onClick={() => setMenuOpen(false)}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              {navLinks.map(link => (
                <Link key={link.path} to={link.path} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 6,
                  textDecoration: 'none', fontSize: 13, color: 'var(--text-secondary)',
                  transition: 'var(--transition)'
                }}>
                  {link.icon} {link.label}
                </Link>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
                <button onClick={handleLogout} style={{
                  width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 6,
                  border: 'none', cursor: 'pointer',
                  background: 'transparent',
                  fontSize: 13, color: 'var(--danger)',
                  transition: 'var(--transition)'
                }}>
                  ⬡ Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
