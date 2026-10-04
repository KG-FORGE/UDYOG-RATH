import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [username, setUsername] = useState('applicant');
  const [password, setPassword] = useState('Demo123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  useEffect(() => {
    api.getDemoUsers().then(setDemoUsers).catch(console.error);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ username, password });
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
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (u: any) => {
    setUsername(u.username);
    setPassword(u.password);
  };

  return (
    <div className="container" style={{ maxWidth: '960px', marginTop: '30px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Left Side: Standard Login Form */}
        <div className="gov-panel">
          <div className="gov-panel-header">
            <span>Official Portal Sign-In</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>Single Window</span>
          </div>
          <div className="gov-panel-body">
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '16px' }}>
              Sign in with your registered username and password to access the approval orchestrator, scrutiny workbench, or single window dashboard.
            </p>

            {error && (
              <div className="instruction-box instruction-danger" style={{ marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">
                  Username / Login ID <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password <span className="req-star">*</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="form-help">Default demo password: Demo123!</div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px' }}
                >
                  {loading ? 'Authenticating...' : 'Sign In to UDYOGRATH'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Demo Credentials Notice Box */}
        <div className="gov-panel">
          <div className="gov-panel-header" style={{ backgroundColor: 'var(--blue)' }}>
            <span>Seeded Demo Accounts (Click to Pre-fill)</span>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--saffron)', padding: '1px 6px' }}>
              Demo123!
            </span>
          </div>
          <div className="gov-panel-body" style={{ padding: 0 }}>
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--warn-bg)', borderBottom: '1px solid #FFE08A', fontSize: '0.82rem', color: 'var(--warn-text)' }}>
              Password for all accounts: <strong>Demo123!</strong>. Click any account row below to load into the sign-in form immediately:
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <table className="gov-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Role / Department</th>
                    <th>Username</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {demoUsers.map((u, idx) => (
                    <tr
                      key={idx}
                      style={{ cursor: 'pointer', backgroundColor: username === u.username ? '#EFF6FF' : undefined }}
                      onClick={() => selectUser(u)}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {u.role === 'OFFICER' ? `Officer (${u.department_code})` : u.role}
                        </div>
                      </td>
                      <td>
                        <code>{u.username}</code>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); selectUser(u); }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
