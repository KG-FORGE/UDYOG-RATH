import React from 'react';

interface StepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { step: 1, title: 'Step 1: Enterprise Details', subtitle: 'Name, PAN, Constitution, Udyam' },
  { step: 2, title: 'Step 2: Project & Stage', subtitle: 'Sector, Activity, Development Stage' },
  { step: 3, title: 'Step 3: Scale & Location', subtitle: 'Investment, Employees, Power, MIDC' },
  { step: 4, title: 'Step 4: Hazard Flags & Vault', subtitle: 'Effluent, Boilers, Data Vault Save' },
];

export const WizardStepper: React.FC<StepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '4px',
        marginBottom: '24px'
      }}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={4}
    >
      {STEPS.map((s) => {
        const isActive = s.step === currentStep;
        const isCompleted = s.step < currentStep;

        return (
          <div
            key={s.step}
            onClick={() => onStepClick && onStepClick(s.step)}
            style={{
              padding: '10px 12px',
              border: '1px solid',
              borderColor: isActive ? 'var(--navy)' : (isCompleted ? 'var(--green)' : 'var(--border)'),
              backgroundColor: isActive ? 'var(--navy)' : (isCompleted ? '#ECFDF5' : '#FFFFFF'),
              color: isActive ? '#FFFFFF' : 'var(--text)',
              cursor: onStepClick ? 'pointer' : 'default',
              borderRadius: '2px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  backgroundColor: isActive ? 'var(--saffron)' : (isCompleted ? 'var(--green)' : '#E2E8F0'),
                  color: (isActive || isCompleted) ? '#FFFFFF' : 'var(--muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '2px'
                }}
              >
                {isCompleted ? '✓' : s.step}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: isActive ? '#CBD5E1' : 'var(--muted)',
                    marginTop: '2px'
                  }}
                >
                  {s.subtitle}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
