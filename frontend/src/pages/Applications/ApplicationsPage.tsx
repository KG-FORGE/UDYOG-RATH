import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { useTranslation } from '../../i18n/useTranslation';

export const ApplicationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [apps, setApps] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDept) params.department_code = selectedDept;
      if (selectedStatus) params.status = selectedStatus;
      const list = await api.listApplications(params);
      setApps(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [selectedDept, selectedStatus]);

  const departments = ['MPCB', 'FIRE', 'DISH', 'MSEDCL', 'MIDC', 'LABOUR', 'LEGAL_METROLOGY', 'LOCAL_BODY', 'FDA'];
  const statuses = ['Submitted', 'Under Scrutiny', 'Query Raised', 'Inspection Scheduled', 'Approved', 'Rejected'];

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      {/* Page Title & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--navy)' }}>
            {t('nav_apply_track')} & Statutory SLA Clock
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            Real-time tracking of inter-departmental statutory clearances under Maharashtra Right to Public Services Act (RTS 2015).
          </p>
        </div>

        <div>
          <button
            onClick={() => navigate('/documents')}
            className="btn btn-primary btn-sm"
          >
            + New Combined Application (CAF)
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', backgroundColor: '#FFFFFF', padding: '12px', border: '1px solid var(--border)' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--muted)' }}>Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem', padding: '4px 8px' }}
          >
            <option value="">All Departments (8)</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--muted)' }}>Statutory Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem', padding: '4px 8px' }}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            Showing <strong>{apps.length}</strong> active statutory filings
          </span>
        </div>
      </div>

      {/* Applications Table */}
      <div className="table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Application Ref No.</th>
              <th>Enterprise / Unit</th>
              <th>Approval & Issuing Authority</th>
              <th>Department</th>
              <th>Status</th>
              <th>Submitted Date</th>
              <th>SLA Due Date</th>
              <th>Statutory SLA Remaining</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                  No statutory applications matching selected filters.
                </td>
              </tr>
            ) : (
              apps.map((app) => {
                const sla = app.sla_metrics || {};
                const isBreached = sla.is_breached;
                const isAtRisk = sla.is_at_risk;
                const isPaused = sla.clock_paused;

                return (
                  <tr
                    key={app.id}
                    style={{
                      backgroundColor: isBreached ? '#FFF5F5' : (isAtRisk ? '#FFFBEB' : undefined)
                    }}
                  >
                    <td>
                      <Link
                        to={`/applications/${app.ref_no}`}
                        style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'none' }}
                      >
                        {app.ref_no}
                      </Link>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                        Track: {app.risk_level}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {app.enterprise_name}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{app.approval_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{app.issuing_authority}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--blue)', fontSize: '0.82rem' }}>
                        {app.department_code}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                      {isPaused && (
                        <div style={{ marginTop: '2px', fontSize: '0.72rem', color: 'var(--warn-text)', fontWeight: 700 }}>
                          Clock Paused (Query)
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {new Date(app.submitted_at).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {new Date(app.sla_due_date).toLocaleDateString('en-IN')}
                    </td>
                    {/* Days Remaining / SLA Risk Clock */}
                    <td>
                      {app.status === 'Approved' ? (
                        <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.82rem' }}>
                          Clearance Sanctioned
                        </span>
                      ) : app.status === 'Rejected' ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.82rem' }}>
                          Rejected
                        </span>
                      ) : isBreached ? (
                        <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '0.85rem' }}>
                          BREACHED ({Math.abs(sla.days_remaining)}d overdue)
                        </div>
                      ) : (
                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              color: isAtRisk ? 'var(--danger)' : 'var(--blue)'
                            }}
                          >
                            {sla.days_remaining} Days
                          </div>
                          {isAtRisk && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>
                              CRITICAL RISK (&lt;25%)
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/applications/${app.ref_no}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                      >
                        View Timeline &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
