import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export const GuidedTourBox: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [scenario, setScenario] = useState<any>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && !scenario) {
      api.getTourScenario().then(setScenario).catch(console.error);
    }
  }, [isOpen, scenario]);

  if (!isOpen || !scenario) return null;

  const steps = scenario.steps || [];
  const currentStep = steps[currentStepIdx] || steps[0];

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      navigate(steps[nextIdx].route);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      navigate(steps[prevIdx].route);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '420px',
        backgroundColor: '#FFFFFF',
        border: '2px solid var(--navy)',
        boxShadow: 'none',
        zIndex: 9999,
        borderRadius: 2
      }}
      role="dialog"
      aria-label="Guided Demo Tour"
    >
      <div
        style={{
          backgroundColor: 'var(--navy)',
          color: '#FFFFFF',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
          3-Minute Evaluator Tour: Step {currentStepIdx + 1} of {steps.length}
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '14px', fontSize: '0.88rem' }}>
        <h4 style={{ color: 'var(--blue)', marginBottom: '6px' }}>{currentStep.title}</h4>
        <p style={{ color: 'var(--text)', marginBottom: '12px', lineHeight: 1.4 }}>
          {currentStep.description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigate(currentStep.route)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            Go to Screen &rarr;
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              &larr; Back
            </button>
            <button
              onClick={handleNext}
              disabled={currentStepIdx === steps.length - 1}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Next Step &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
