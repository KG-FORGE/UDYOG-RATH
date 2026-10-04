import React from 'react';

export const TricolourStrip: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '4px',
        overflow: 'hidden'
      }}
      aria-hidden="true"
    >
      <div style={{ flex: 1, backgroundColor: 'var(--saffron)' }} />
      <div style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
      <div style={{ flex: 1, backgroundColor: 'var(--green)' }} />
    </div>
  );
};
