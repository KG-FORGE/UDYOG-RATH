import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

export const UtilityBar: React.FC = () => {
  const { language, setLanguage, fontSize, setFontSize, highContrast, toggleHighContrast } = useTranslation();

  return (
    <div
      style={{
        backgroundColor: '#EBEFF4',
        borderBottom: '1px solid var(--border)',
        fontSize: '0.82rem',
        padding: '3px 0'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {/* Left Accessibility Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <span style={{ color: 'var(--muted)', cursor: 'default' }}>
            Screen Reader Access
          </span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ color: 'var(--navy)', fontWeight: 600 }}>
            Maharashtra Industrial Single Window
          </span>
        </div>

        {/* Right Accessibility & Language Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Text Size Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--muted)', marginRight: '4px' }}>Text Size:</span>
            <button
              onClick={() => setFontSize('sm')}
              style={{
                padding: '1px 5px',
                fontSize: '0.75rem',
                border: '1px solid var(--border)',
                background: fontSize === 'sm' ? 'var(--navy)' : '#FFFFFF',
                color: fontSize === 'sm' ? '#FFFFFF' : 'var(--text)',
                cursor: 'pointer'
              }}
              title="Small text"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              style={{
                padding: '1px 5px',
                fontSize: '0.8rem',
                border: '1px solid var(--border)',
                background: fontSize === 'md' ? 'var(--navy)' : '#FFFFFF',
                color: fontSize === 'md' ? '#FFFFFF' : 'var(--text)',
                cursor: 'pointer'
              }}
              title="Normal text"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              style={{
                padding: '1px 5px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                border: '1px solid var(--border)',
                background: fontSize === 'lg' ? 'var(--navy)' : '#FFFFFF',
                color: fontSize === 'lg' ? '#FFFFFF' : 'var(--text)',
                cursor: 'pointer'
              }}
              title="Large text"
            >
              A+
            </button>
          </div>

          <span style={{ color: 'var(--border)' }}>|</span>

          {/* High Contrast Toggle */}
          <button
            onClick={toggleHighContrast}
            style={{
              padding: '2px 8px',
              border: '1px solid var(--border)',
              background: highContrast ? '#000000' : '#FFFFFF',
              color: highContrast ? '#FFFFFF' : 'var(--text)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
            title="Toggle High Contrast"
          >
            {highContrast ? 'Standard Contrast' : 'High Contrast'}
          </button>

          <span style={{ color: 'var(--border)' }}>|</span>

          {/* Language Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setLanguage('en')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: language === 'en' ? 700 : 400,
                color: language === 'en' ? 'var(--navy)' : 'var(--muted)',
                textDecoration: language === 'en' ? 'underline' : 'none'
              }}
            >
              English
            </button>
            <span style={{ color: 'var(--border)' }}>/</span>
            <button
              onClick={() => setLanguage('mr')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: language === 'mr' ? 700 : 400,
                color: language === 'mr' ? 'var(--navy)' : 'var(--muted)',
                textDecoration: language === 'mr' ? 'underline' : 'none'
              }}
            >
              मराठी
            </button>
            <span style={{ color: 'var(--border)' }}>/</span>
            <button
              onClick={() => setLanguage('hi')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: language === 'hi' ? 700 : 400,
                color: language === 'hi' ? 'var(--navy)' : 'var(--muted)',
                textDecoration: language === 'hi' ? 'underline' : 'none'
              }}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
