import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export const DemoControlsBar: React.FC<{ onTourToggle?: () => void }> = ({ onTourToggle }) => {
  const [clockData, setClockData] = useState<{ offset_days: number; simulated_date_formatted: string }>({
    offset_days: 0,
    simulated_date_formatted: 'Loading...'
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();

  const fetchClock = async () => {
    try {
      const data = await api.getDemoClock();
      setClockData(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClock();
  }, []);

  const handleAdvance = async (days: number) => {
    setLoading(true);
    try {
      const res = await api.advanceDemoClock(days);
      await fetchClock();
      setStatusMsg(`Advanced by ${days} days! ${res.breaches_detected} SLA breaches, ${res.escalations_triggered} escalations checked.`);
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (e: any) {
      alert('Error advancing clock: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all demo data and clock to initial state?')) return;
    setLoading(true);
    try {
      await api.resetDemoData();
      await fetchClock();
      setStatusMsg('Demo data and clock reset successfully!');
      setTimeout(() => setStatusMsg(''), 4000);
      window.location.reload();
    } catch (e: any) {
      alert('Error resetting demo: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username: string) => {
    try {
      const res = await api.login({ username, password: 'Demo123!' });
      localStorage.setItem('udyograth_token', res.access_token);
      localStorage.setItem('udyograth_user_role', res.user.role);
      localStorage.setItem('udyograth_user_name', res.user.full_name);
      localStorage.setItem('udyograth_user_dept', res.user.department_code || '');

      if (res.user.role === 'OFFICER') {
        navigate('/workbench');
      } else if (res.user.role === 'ADMIN') {
        navigate('/analytics');
      } else {
        navigate('/wizard');
      }
      window.location.reload();
    } catch (e: any) {
      alert('Login failed: ' + e.message);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0F2D54',
        color: '#FFFFFF',
        borderBottom: '2px solid var(--saffron)',
        fontSize: '0.82rem',
        padding: '5px 0'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        {/* Left: Clock Display & Advance Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ backgroundColor: 'var(--saffron)', color: '#FFFFFF', padding: '2px 6px', fontWeight: 700, borderRadius: 2 }}>
            DEMO CLOCK
          </span>
          <span style={{ fontWeight: 600, color: '#93C5FD' }}>
            {clockData.simulated_date_formatted} (+{clockData.offset_days}d)
          </span>

          <span style={{ color: '#475569' }}>|</span>

          <span style={{ color: '#CBD5E1' }}>Advance:</span>
          <button
            onClick={() => handleAdvance(1)}
            disabled={loading}
            className="btn btn-sm btn-secondary"
            style={{ padding: '1px 6px', fontSize: '0.75rem', height: 22 }}
          >
            +1 Day
          </button>
          <button
            onClick={() => handleAdvance(3)}
            disabled={loading}
            className="btn btn-sm btn-secondary"
            style={{ padding: '1px 6px', fontSize: '0.75rem', height: 22 }}
          >
            +3 Days
          </button>
          <button
            onClick={() => handleAdvance(7)}
            disabled={loading}
            className="btn btn-sm btn-secondary"
            style={{ padding: '1px 6px', fontSize: '0.75rem', height: 22 }}
          >
            +7 Days
          </button>
          <button
            onClick={() => handleAdvance(15)}
            disabled={loading}
            className="btn btn-sm btn-secondary"
            style={{ padding: '1px 6px', fontSize: '0.75rem', height: 22, backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}
            title="Triggers SLA Breaches & RTS Escalations"
          >
            +15 Days (Trigger Breaches)
          </button>
        </div>

        {/* Right: Quick Role Switch & Guided Tour */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#CBD5E1' }}>Switch Demo Role:</span>
          <button
            onClick={() => handleQuickLogin('applicant')}
            className="btn btn-sm btn-secondary"
            style={{ padding: '1px 6px', fontSize: '0.75rem', height: 22 }}
          >
            Entrepreneur
          </button>
          <button
            onClick={() => handleQuickLogin('officer_fire')}
            className="btn btn-sm btn-secondary"
            style={{ padding: '1px 6px', fontSize: '0.75rem', height: 22 }}
          >
            Fire Officer
          </button>
          <button
            onClick={() => handleQuickLogin('officer_mpcb')}
            className="btn btn-sm btn-secondary"
            style={{ padding: '1px 6px', fontSize: '0.75rem', height: 22 }}
          >
            Pollution Board
          </button>
          <button
            onClick={() => handleQuickLogin('admin_maitri')}
            className="btn btn-sm btn-secondary"
            style={{ padding: '1px 6px', fontSize: '0.75rem', height: 22 }}
          >
            MAITRI Admin
          </button>

          <span style={{ color: '#475569' }}>|</span>

          {onTourToggle && (
            <button
              onClick={onTourToggle}
              style={{
                background: 'var(--saffron)',
                color: '#FFFFFF',
                border: 'none',
                padding: '2px 8px',
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.75rem',
                height: 22
              }}
            >
              3-Min Guided Demo
            </button>
          )}

          <button
            onClick={handleReset}
            disabled={loading}
            className="btn btn-sm btn-danger"
            style={{ padding: '1px 6px', fontSize: '0.75rem', height: 22 }}
          >
            Reset
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          style={{
            backgroundColor: '#1E293B',
            color: '#86EFAC',
            textAlign: 'center',
            padding: '2px',
            fontSize: '0.75rem',
            borderTop: '1px solid #334155'
          }}
        >
          {statusMsg}
        </div>
      )}
    </div>
  );
};
