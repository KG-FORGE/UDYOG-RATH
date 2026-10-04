import React from 'react';

export const DisclaimerBar: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: 'var(--warn-bg)',
        borderBottom: '1px solid #FFE08A',
        color: 'var(--warn-text)',
        fontSize: '0.8rem',
        padding: '4px 0',
        textAlign: 'center',
        fontWeight: 600
      }}
      role="note"
      aria-label="Hackathon Prototype Notice"
    >
      <div className="container">
        Smart India Hackathon 2026 prototype by Team KG-FORGE (Problem Statement SIH26130). This is not an official Government of Maharashtra website. All data shown is illustrative.
      </div>
    </div>
  );
};
