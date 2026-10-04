import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

export const NavBar: React.FC = () => {
  const { t } = useTranslation();
  const userRole = localStorage.getItem('udyograth_user_role');

  const navLinks = [
    { to: '/', label: t('nav_home') },
    { to: '/approvals', label: t('nav_know_approvals') },
    { to: '/wizard', label: 'Enterprise Profile' },
    { to: '/documents', label: 'Document Centre' },
    { to: '/applications', label: t('nav_apply_track') },
    { to: '/incentives', label: t('nav_incentives') },
    { to: '/inspections', label: t('nav_inspections') },
    { to: '/grievance', label: t('nav_grievance') },
    { to: '/assistant', label: t('nav_knowledge') },
    { to: '/analytics', label: t('nav_dashboards') },
    { to: '/project-info', label: t('nav_project_info') },
  ];

  if (userRole === 'OFFICER' || userRole === 'ADMIN') {
    navLinks.splice(5, 0, { to: '/workbench', label: t('nav_workbench') });
  }

  return (
    <nav
      style={{
        backgroundColor: 'var(--navy)',
        borderBottom: '2px solid var(--saffron)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}
      aria-label="Main Navigation"
    >
      <div className="container" style={{ padding: '0 8px' }}>
        <ul
          style={{
            display: 'flex',
            listStyle: 'none',
            flexWrap: 'wrap',
            margin: 0,
            padding: 0
          }}
        >
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                style={({ isActive }) => ({
                  display: 'inline-block',
                  padding: '11px 14px',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  backgroundColor: isActive ? 'var(--blue)' : 'transparent',
                  borderBottom: isActive ? '3px solid var(--saffron)' : '3px solid transparent',
                  transition: 'background-color 0.15s ease'
                })}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
