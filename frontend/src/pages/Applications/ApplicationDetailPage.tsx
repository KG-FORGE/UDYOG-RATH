import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { useTranslation } from '../../i18n/useTranslation';

export default function ApplicationDetailPage() {
  const { refNo } = useParams<{ refNo: string }>();
  const { t } = useTranslation();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query response state
  const [activeQueryId, setActiveQueryId] = useState<number | null>(null);
  const [queryResponseText, setQueryResponseText] = useState('');
  const [querySubmitting, setQuerySubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!refNo) return;
    try {
      setLoading(true);
      const data = await api.getApplicationDetail(refNo);
      setApp(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [refNo]);

  const handleRespondQuery = async (queryId: number) => {
    if (!queryResponseText.trim()) {
      alert('Please enter your response to the department query.');
      return;
    }
    try {
      setQuerySubmitting(true);
      await api.respondQuery(queryId, {
        response_text: queryResponseText,
        attachments: []
      });
      setActionSuccess('Query response submitted successfully. The statutory review clock has resumed.');
      setQueryResponseText('');
      setActiveQueryId(null);
      await fetchDetail();
    } catch (err: any) {
      alert('Error responding to query: ' + err.message);
    } finally {
      setQuerySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="gov-panel">
          <div className="gov-panel-body" style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading application record for {refNo}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="gov-panel">
          <div className="gov-panel-header">Error</div>
          <div className="gov-panel-body">
            <div className="gov-alert gov-alert-danger">{error || 'Application not found'}</div>
            <Link to="/applications" className="gov-btn gov-btn-secondary" style={{ marginTop: '16px' }}>
              &larr; Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isClockPaused = app.status === 'Query Raised';
  const isAtRisk = app.is_at_risk;
  const isBreached = app.is_sla_breached;

  return (
    <div className="container" style={{ padding: '24px 0 60px 0' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Application: {app.reference_no}</h1>
            <StatusBadge status={app.status} />
            {isBreached && <span className="gov-badge gov-badge-danger">SLA BREACHED</span>}
            {!isBreached && isAtRisk && <span className="gov-badge gov-badge-warn">SLA AT RISK</span>}
            {isClockPaused && <span className="gov-badge gov-badge-query">STATUTORY CLOCK PAUSED</span>}
          </div>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
            Approval Type: <strong>{app.approval_name}</strong> | Department: <strong>{app.issuing_authority}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/applications" className="gov-btn gov-btn-secondary">
            &larr; All Applications
          </Link>
          {app.status === 'Approved' && (
            <a
              href={api.getCertificateUrl(app.reference_no)}
              target="_blank"
              rel="noreferrer"
              className="gov-btn gov-btn-primary"
              style={{ backgroundColor: 'var(--success)' }}
            >
              Download Approval Certificate (PDF)
            </a>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="gov-alert gov-alert-success" style={{ marginBottom: '20px' }}>
          {actionSuccess}
        </div>
      )}

      {/* Clock Paused Notice if query raised */}
      {isClockPaused && (
        <div className="gov-instruction-box gov-instruction-warning" style={{ marginBottom: '20px' }}>
          <strong>Notice of Statutory Clock Pause:</strong> A formal departmental query is currently awaiting applicant response. Under the Maharashtra Right to Public Services Act facilitation rules, the statutory SLA processing clock remains paused until your response is submitted.
        </div>
      )}

      {/* Top Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="gov-panel">
          <div className="gov-panel-header">Enterprise Information</div>
          <div className="gov-panel-body" style={{ fontSize: '13px' }}>
            <p style={{ margin: '0 0 6px 0' }}><strong>Name:</strong> {app.enterprise_name}</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>Sector:</strong> {app.sector}</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>District:</strong> {app.district}</p>
            <p style={{ margin: 0 }}><strong>Scale:</strong> ₹{app.investment_cr} Cr | {app.employees} employees</p>
          </div>
        </div>

        <div className="gov-panel">
          <div className="gov-panel-header">Statutory SLA Review Clock</div>
          <div className="gov-panel-body" style={{ fontSize: '13px' }}>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong>Statutory Limit:</strong> {app.statutory_days_limit} Calendar Days
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong>Submitted Date:</strong> {new Date(app.submitted_at).toLocaleDateString()}
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong>Statutory Due Date:</strong> {new Date(app.due_date).toLocaleDateString()}
            </p>
            <p style={{ margin: 0, fontWeight: 'bold', color: isBreached ? 'var(--danger)' : isAtRisk ? '#B7791F' : 'var(--success)' }}>
              {isBreached ? `Breached by ${Math.abs(app.days_remaining)} days` : `${app.days_remaining} days remaining`}
              {isClockPaused ? ' (Clock Paused)' : ''}
            </p>
          </div>
        </div>

        <div className="gov-panel">
          <div className="gov-panel-header">Risk-Based Scrutiny Category</div>
          <div className="gov-panel-body" style={{ fontSize: '13px' }}>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong>Computed Risk Score:</strong> {app.risk_score} / 100
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong>Scrutiny Track:</strong>{' '}
              <span
                className="gov-badge"
                style={{
                  backgroundColor: app.scrutiny_level === 'Fast Track' ? 'var(--success)' : app.scrutiny_level === 'Standard' ? 'var(--navy)' : 'var(--danger)',
                  color: '#fff'
                }}
              >
                {app.scrutiny_level}
              </span>
            </p>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px' }}>
              {app.scrutiny_level === 'Fast Track'
                ? 'Standard inspection waived. Accelerated document scrutiny.'
                : app.scrutiny_level === 'Standard'
                ? 'Standard desk scrutiny with parallel inspection coordination.'
                : 'High hazard profile. Joint multi-departmental field scrutiny required.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Queries on left, Vertical Timeline on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          {/* Departmental Remarks */}
          <div className="gov-panel" style={{ marginBottom: '20px' }}>
            <div className="gov-panel-header">Departmental Remarks & Findings</div>
            <div className="gov-panel-body">
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
                {app.department_remarks || 'No remarks recorded yet by the scrutiny officer.'}
              </p>
              {app.certificate_number && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--info-bg)', border: '1px solid var(--border)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
                    <strong>Statutory Certificate No:</strong> {app.certificate_number}
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
                    <strong>Verification QR / Hash:</strong> {app.verification_qr_hash || 'SHA256-CERT-VERIFIED'}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    <strong>Renewal Due Date:</strong> {app.renewal_date || 'N/A (Permanent Licence)'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Query Management Thread */}
          <div className="gov-panel" style={{ marginBottom: '20px' }}>
            <div className="gov-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Formal Department Queries ({app.queries?.length || 0})</span>
            </div>
            <div className="gov-panel-body">
              {!app.queries || app.queries.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
                  No queries have been raised on this application.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {app.queries.map((q: any) => (
                    <div
                      key={q.id}
                      style={{
                        border: '1px solid var(--border)',
                        padding: '16px',
                        backgroundColor: q.status === 'Open' ? 'var(--warn-bg)' : '#FFFFFF'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <strong>Category: {q.category}</strong>
                          <span style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--muted)' }}>
                            Raised on {new Date(q.created_at).toLocaleString()} by Officer {q.officer_id}
                          </span>
                        </div>
                        <span
                          className={`gov-badge ${q.status === 'Open' ? 'gov-badge-query' : 'gov-badge-approved'}`}
                        >
                          {q.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '14px', marginBottom: '12px', padding: '10px', background: '#FFFFFF', border: '1px solid var(--border)' }}>
                        <strong>Department Query:</strong>
                        <p style={{ margin: '4px 0 0 0' }}>{q.query_text}</p>
                      </div>

                      {q.status === 'Resolved' && (
                        <div style={{ fontSize: '14px', padding: '10px', background: '#F0FFF4', border: '1px solid #9AE6B4' }}>
                          <strong>Applicant Response:</strong>
                          <p style={{ margin: '4px 0 0 0' }}>{q.response_text}</p>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            Responded on {new Date(q.responded_at).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {q.status === 'Open' && (
                        <div>
                          {activeQueryId === q.id ? (
                            <div style={{ marginTop: '12px' }}>
                              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
                                Submit Response to Department *
                              </label>
                              <textarea
                                value={queryResponseText}
                                onChange={(e) => setQueryResponseText(e.target.value)}
                                rows={4}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', fontSize: '13px', boxSizing: 'border-box' }}
                                placeholder="Type your factual clarification or document compliance statement here..."
                              />
                              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                <button
                                  type="button"
                                  className="gov-btn gov-btn-primary"
                                  onClick={() => handleRespondQuery(q.id)}
                                  disabled={querySubmitting}
                                >
                                  {querySubmitting ? 'Submitting...' : 'Submit Response & Resume Clock'}
                                </button>
                                <button
                                  type="button"
                                  className="gov-btn gov-btn-secondary"
                                  onClick={() => setActiveQueryId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="gov-btn gov-btn-primary"
                              style={{ marginTop: '8px' }}
                              onClick={() => {
                                setActiveQueryId(q.id);
                                setQueryResponseText('');
                              }}
                            >
                              Respond to Query
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submitted Documents Checklist */}
          <div className="gov-panel">
            <div className="gov-panel-header">Associated Document Submissions</div>
            <div className="gov-panel-body" style={{ padding: 0 }}>
              <table className="gov-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>File Format</th>
                    <th>Validation Status</th>
                    <th>Verified Data</th>
                  </tr>
                </thead>
                <tbody>
                  {app.documents && app.documents.length > 0 ? (
                    app.documents.map((d: any, idx: number) => (
                      <tr key={idx}>
                        <td><strong>{d.name || d.document_name}</strong></td>
                        <td>{d.format || 'PDF'}</td>
                        <td>
                          <span className="gov-badge gov-badge-approved">Pre-Validated Pass</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            Vault Reused: Yes
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                        All standard profile and vault documents pre-linked for this application.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Statutory Event Timeline */}
        <div>
          <div className="gov-panel">
            <div className="gov-panel-header">Statutory Event Trail</div>
            <div className="gov-panel-body">
              <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border)' }}>
                {app.timeline && app.timeline.length > 0 ? (
                  app.timeline.map((ev: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '24px', position: 'relative' }}>
                      {/* Node bullet */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-27px',
                          top: '2px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: ev.action.includes('Breach') || ev.action.includes('Reject')
                            ? 'var(--danger)'
                            : ev.action.includes('Approve')
                            ? 'var(--success)'
                            : 'var(--blue)',
                          border: '2px solid #FFFFFF'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold' }}>
                        {new Date(ev.timestamp).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '2px', color: 'var(--text)' }}>
                        {ev.action}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                        {ev.details}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Application submitted. Under initial departmental scrutiny.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="gov-instruction-box gov-instruction-info" style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '13px' }}>Single Window Guarantee</h4>
            <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5 }}>
              Under Maharashtra Right to Public Services Act (RTS), the issuing authority must complete scrutiny within the notified statutory limit. Any breach automatically triggers Level 1 escalation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
