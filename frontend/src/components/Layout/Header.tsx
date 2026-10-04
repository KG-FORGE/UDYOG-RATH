import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { useTranslation } from '../../i18n/useTranslation';

export const Header: React.FC = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('udyograth_token');
  const userRole = localStorage.getItem('udyograth_user_role');
  const userName = localStorage.getItem('udyograth_user_name');

  const handleLogout = () => {
    localStorage.removeItem('udyograth_token');
    localStorage.removeItem('udyograth_user_role');
    localStorage.removeItem('udyograth_user_name');
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/assistant?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border)',
        padding: '12px 0'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Brand Block */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            gap: '16px'
          }}
        >
          <Logo size={56} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--navy)',
                  letterSpacing: '1px',
                  lineHeight: 1
                }}
              >
                {t('site_title')}
              </span>
              <span
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--saffron)',
                  lineHeight: 1
                }}
              >
                {t('site_title_devanagari')}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.86rem',
                color: 'var(--muted)',
                marginTop: '4px',
                fontWeight: 600
              }}
            >
              {t('site_tagline')}
            </div>
          </div>
        </Link>

        {/* Search and User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex' }}>
            <input
              type="text"
              placeholder="Search approvals, acts, circulars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '0.88rem',
                border: '1px solid var(--border)',
                borderRight: 'none',
                borderRadius: '2px 0 0 2px',
                width: '240px'
              }}
              aria-label="Portal search query"
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                borderRadius: '0 2px 2px 0',
                padding: '6px 12px',
                fontSize: '0.85rem'
              }}
            >
              Search
            </button>
          </form>

          {/* User Session Info or Login */}
          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>
                  {userName || 'User'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  Role: <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{userRole}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem' }}
              >
                {t('nav_logout')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
              {t('nav_login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
