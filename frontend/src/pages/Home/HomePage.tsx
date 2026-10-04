import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const servicesList = [
    { title: 'Combined Application Form (CAF)', desc: 'Unified single-window application for 25+ statutory state clearances across 8 departments.', link: '/wizard' },
    { title: 'Deterministic Rules & Approvals Engine', desc: 'Identify statutory requirements based on capital outlay, sector hazards, and location zoning.', link: '/approvals' },
    { title: 'Document Readiness Pre-Validator', desc: 'Automated verification of PAN, legal name consistency (RapidFuzz), and validity before submission.', link: '/documents' },
    { title: 'Parallel Workflow & SLA Tracker', desc: 'Simultaneous inter-departmental processing with statutory clock pause/resume logic under RTS.', link: '/applications' },
    { title: 'Common Joint Inspection System', desc: 'Consolidate multiple separate departmental visits into a single coordinated joint site inspection.', link: '/inspections' },
    { title: 'State Incentive & Scheme Matcher', desc: 'Automated discovery of capital subsidies, electricity duty waivers, and interest subvention.', link: '/incentives' },
    { title: 'Three-Tier Grievance Escalation', desc: 'Automated statutory escalation matrix for applications exceeding citizen charter timelines.', link: '/grievance' }
  ];

  const whatsNewNotices = [
    { date: '04 Oct 2026', text: 'Common Joint Inspection Protocol operationalized across MPCB, Fire Services, and DISH.' },
    { date: '01 Oct 2026', text: 'Fast-Track risk-based desk appraisal notified for MSME units with investments under ₹10 Crore.' },
    { date: '28 Sep 2026', text: 'Package Scheme of Incentives (PSI 2024 draft) fiscal guidelines integrated into unified single window.' },
    { date: '22 Sep 2026', text: 'Statutory query management mandate: Departments restricted to single-shot query with clock pause.' },
    { date: '15 Sep 2026', text: 'Verified Data Vault rollout: PAN and land records verified once reused across subsequent clearances.' }
  ];

  const keyFigures = [
    { label: 'Statutory Clearances Integrated', value: '25 Clearances', sub: 'Across 8 State Departments' },
    { label: 'Avg Gestation Period Reduction', value: '66.2%', sub: 'From 142 days down to 48 days' },
    { label: 'Site Inspection Visits Saved', value: '85% Fewer Visits', sub: '5 separate visits consolidated to 1' },
    { label: 'Statutory SLA Compliance Rate', value: '88.5%', sub: 'Tracked against RTS timelines' },
    { label: 'Verified Pre-Validation Accuracy', value: '89.3% Fewer Rejections', sub: 'First-time document errors caught' },
  ];

  return (
    <div>
      {/* Navy Purpose Banner Band */}
      <section
        style={{
          backgroundColor: 'var(--navy)',
          color: '#FFFFFF',
          padding: '36px 0',
          borderBottom: '4px solid var(--saffron)'
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '880px' }}>
            <div style={{ fontSize: '0.9rem', color: '#93C5FD', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              State Industrial Facilitation Portal (Problem Statement SIH26130)
            </div>
            <h1 style={{ color: '#FFFFFF', fontSize: '2.1rem', marginBottom: '12px', lineHeight: 1.25 }}>
              UDYOGRATH (उद्योगरथ)
            </h1>
            <p style={{ fontSize: '1.08rem', color: '#E2E8F0', marginBottom: '24px', lineHeight: 1.6 }}>
              Integrated industrial approval, document pre-validation, parallel statutory workflow orchestration, and government incentive facilitation platform for the Government of Maharashtra.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/approvals')}
                className="btn"
                style={{ backgroundColor: 'var(--saffron)', color: '#FFFFFF', border: 'none', padding: '10px 20px', fontSize: '1rem', fontWeight: 700 }}
              >
                {t('btn_know_approvals')} &rarr;
              </button>
              <button
                onClick={() => navigate('/applications')}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', fontSize: '1rem', fontWeight: 700, backgroundColor: '#FFFFFF', color: 'var(--navy)' }}
              >
                {t('btn_track_application')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Section: Services on Left, What's New on Right */}
      <section className="container" style={{ marginTop: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Left Column: Key Industrial Services */}
          <div className="gov-panel">
            <div className="gov-panel-header">
              <span>Industrial Clearances & Orchestration Services</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>Single Window</span>
            </div>
            <div className="gov-panel-body" style={{ padding: 0 }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {servicesList.map((srv, idx) => (
                  <li
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx < servicesList.length - 1 ? '1px solid #E2E8F0' : 'none',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Link
                        to={srv.link}
                        style={{
                          color: 'var(--navy)',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          textDecoration: 'none'
                        }}
                      >
                        {srv.title} &rarr;
                      </Link>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: '4px' }}>
                      {srv.desc}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: What's New Notice List */}
          <div className="gov-panel">
            <div className="gov-panel-header">
              <span>What's New & Departmental Notifications</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>Press Circulars</span>
            </div>
            <div className="gov-panel-body" style={{ padding: 0 }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {whatsNewNotices.map((n, idx) => (
                  <li
                    key={idx}
                    style={{
                      padding: '14px 16px',
                      borderBottom: idx < whatsNewNotices.length - 1 ? '1px solid #E2E8F0' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <span className="new-tag">NEW</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>
                        {n.date}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.4 }}>
                      {n.text}
                    </div>
                  </li>
                ))}
              </ul>

              <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                <Link to="/project-info" style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>
                  View Problem Statement Mapping (SIH26130) &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Row of Five Bordered Key Figures Boxes */}
      <section className="container" style={{ marginTop: '12px' }}>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--navy)' }}>Key Performance Benchmarks</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--warn-text)', backgroundColor: 'var(--warn-bg)', padding: '2px 8px', border: '1px solid #FFE08A', fontWeight: 600 }}>
            Illustrative demo figures
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
            marginBottom: '32px'
          }}
        >
          {keyFigures.map((fig, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderTop: '3px solid var(--navy)',
                padding: '14px',
                borderRadius: '2px'
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', minHeight: '34px' }}>
                {fig.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)', margin: '6px 0' }}>
                {fig.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {fig.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Important Links Row */}
      <section className="container">
        <div className="gov-panel">
          <div className="gov-panel-header">
            <span>Essential Industrial Resources & Portals</span>
          </div>
          <div className="gov-panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ borderLeft: '3px solid var(--blue)', paddingLeft: '10px' }}>
                <a href="https://maitri.mahaonline.gov.in/" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }}>
                  MAITRI Single Window &rarr;
                </a>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Maharashtra Industry Trade & Investment Facilitation Cell.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid var(--saffron)', paddingLeft: '10px' }}>
                <a href="https://udyamregistration.gov.in" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }}>
                  Udyam MSME Portal &rarr;
                </a>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Paperless national registration for micro, small, and medium units.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid var(--green)', paddingLeft: '10px' }}>
                <a href="https://aaplesarkar.mahaonline.gov.in" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }}>
                  Aaple Sarkar RTS &rarr;
                </a>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Maharashtra Right to Public Services portal for time-bound delivery.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid var(--navy)', paddingLeft: '10px' }}>
                <Link to="/assistant" style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }}>
                  UDYOGRATH Knowledge Assistant &rarr;
                </Link>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Grounded BM25 statutory question answering with legal citations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
