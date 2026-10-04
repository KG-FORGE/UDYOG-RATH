import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ROUTE_LABELS: Record<string, string> = {
  '': 'Home',
  'approvals': 'Know Your Approvals',
  'wizard': 'Enterprise Profile Wizard',
  'documents': 'Document Centre & Pre-Validation',
  'applications': 'Application Tracker & Workflow',
  'workbench': 'Officer Workbench & Scrutiny',
  'inspections': 'Common Inspection Planner',
  'incentives': 'Incentive & Scheme Matcher',
  'grievance': 'Grievance & Statutory Escalation',
  'assistant': 'Knowledge Centre (Regulatory Assistant)',
  'analytics': 'MAITRI Admin Analytics & Delays',
  'project-info': 'Project Information & SIH26130 Mapping',
  'login': 'User Authentication',
  'audit': 'Cryptographic Audit Trail',
  'rules': 'Versioned Rules Management',
  'notifications': 'Notifications Centre'
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return null; // Don't show breadcrumbs on Home page
  }

  return (
    <div
      style={{
        backgroundColor: '#EBEFF4',
        borderBottom: '1px solid var(--border)',
        padding: '6px 0',
        fontSize: '0.82rem',
        marginBottom: '16px'
      }}
      aria-label="Breadcrumb"
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link to="/" style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
          Home
        </Link>
        {pathnames.map((segment, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = ROUTE_LABELS[segment] || decodeURIComponent(segment);

          return (
            <React.Fragment key={routeTo}>
              <span style={{ color: 'var(--muted)' }}>&gt;</span>
              {isLast ? (
                <span style={{ color: 'var(--text)', fontWeight: 700 }}>{label}</span>
              ) : (
                <Link to={routeTo} style={{ color: 'var(--navy)', textDecoration: 'none' }}>
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
