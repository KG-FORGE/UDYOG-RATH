import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: '#1E293B',
        color: '#E2E8F0',
        borderTop: '4px solid var(--navy)',
        marginTop: '40px',
        fontSize: '0.88rem'
      }}
    >
      <div className="container" style={{ padding: '32px 16px 20px 16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            marginBottom: '28px'
          }}
        >
          {/* Column 1: About */}
          <div>
            <h4
              style={{
                color: '#FFFFFF',
                fontSize: '1rem',
                borderBottom: '2px solid var(--saffron)',
                paddingBottom: '6px',
                marginBottom: '12px'
              }}
            >
              About Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/project-info" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                  Project Information (SIH26130)
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/project-info" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                  Problem Statement Mapping
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/assistant" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                  Statutory Regulatory Corpus
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Team: KG-FORGE (Smart India Hackathon)</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Policies */}
          <div>
            <h4
              style={{
                color: '#FFFFFF',
                fontSize: '1rem',
                borderBottom: '2px solid var(--saffron)',
                paddingBottom: '6px',
                marginBottom: '12px'
              }}
            >
              Portal Policies
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#CBD5E1' }}>Terms of Use & Legal Disclaimer</span>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#CBD5E1' }}>Privacy Policy & Data Security</span>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#CBD5E1' }}>Hyperlinking Policy</span>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#CBD5E1' }}>Accessibility Statement (WCAG 2.1 AA)</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Help & Support */}
          <div>
            <h4
              style={{
                color: '#FFFFFF',
                fontSize: '1rem',
                borderBottom: '2px solid var(--saffron)',
                paddingBottom: '6px',
                marginBottom: '12px'
              }}
            >
              Help & Grievance
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/grievance" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                  Right to Public Services Appeals
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/assistant" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                  Frequently Asked Questions (FAQ)
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <Link to="/audit" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                  Cryptographic Audit Trail
                </Link>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#CBD5E1' }}>Toll Free Helpline: 1800-120-8040 (Demo)</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Verified External Links (Official Only) */}
          <div>
            <h4
              style={{
                color: '#FFFFFF',
                fontSize: '1rem',
                borderBottom: '2px solid var(--saffron)',
                paddingBottom: '6px',
                marginBottom: '12px'
              }}
            >
              Verified Government Portals
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                <a
                  href="https://maitri.mahaonline.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#93C5FD', textDecoration: 'none' }}
                >
                  MAITRI Portal Maharashtra &rarr;
                </a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a
                  href="https://www.nsws.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#93C5FD', textDecoration: 'none' }}
                >
                  National Single Window System (NSWS) &rarr;
                </a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a
                  href="https://aaplesarkar.mahaonline.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#93C5FD', textDecoration: 'none' }}
                >
                  Aaple Sarkar RTS Maharashtra &rarr;
                </a>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <a
                  href="https://udyamregistration.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#93C5FD', textDecoration: 'none' }}
                >
                  Udyam MSME Registration &rarr;
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line Notice */}
        <div
          style={{
            borderTop: '1px solid #334155',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.8rem',
            color: '#94A3B8'
          }}
        >
          <div>
            Content owned by: Prototype data, illustrative. Designed and developed by Team KG-FORGE (Smart India Hackathon 2026).
          </div>
          <div>
            Last updated: 04 October 2026 | Total Visitors: 1,48,290
          </div>
        </div>
      </div>
    </footer>
  );
};
