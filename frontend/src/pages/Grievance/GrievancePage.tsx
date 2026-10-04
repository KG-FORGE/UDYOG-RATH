import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function GrievancePage() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Grievance Form
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedAppRef, setSelectedAppRef] = useState('');
  const [category, setCategory] = useState('Delay Beyond Statutory SLA');
  const [description, setDescription] = useState('');

  // Officer action form
  const [actionGrievanceId, setActionGrievanceId] = useState<number | null>(null);
  const [actionDecision, setActionDecision] = useState<'RESOLVE' | 'ESCALATE_L2' | 'ESCALATE_L3'>('RESOLVE');
  const [officerRemarks, setOfficerRemarks] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [gList, aList] = await Promise.all([
        api.listGrievances(),
        api.listApplications()
      ]);
      setGrievances(gList);
      setApplications(aList);
      if (aList.length > 0 && !selectedAppRef) {
        setSelectedAppRef(aList[0].reference_no);
      }
    } catch (err: any) {
      console.error('Error loading grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRaiseGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter grievance details.');
      return;
    }
    try {
      setActionLoading(true);
      const app = applications.find((a) => a.reference_no === selectedAppRef);
      const res = await api.raiseGrievance({
        application_id: app ? app.id : undefined,
        application_ref: selectedAppRef,
        category,
        description
      });
      setFeedback(`Grievance registered under RTS facilitation. Ticket ID: ${res.grievance_ticket || 'GR-' + res.id}. Designated Nodal Officer notified.`);
      setShowRaiseModal(false);
      setDescription('');
      await loadData();
    } catch (err: any) {
      alert('Error raising grievance: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOfficerGrievanceAction = async (id: number) => {
    if (!officerRemarks.trim()) {
      alert('Please enter formal RTS adjudication remarks.');
      return;
    }
    try {
      setActionLoading(true);
      await api.officerGrievanceAction(id, {
        action: actionDecision,
        remarks: officerRemarks
      });
      setFeedback('Adjudication recorded in RTS statutory log.');
      setActionGrievanceId(null);
      setOfficerRemarks('');
      await loadData();
    } catch (err: any) {
      alert('Error updating grievance: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '24px 0 60px 0' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>RTS Grievance Redressal & 3-Tier Escalation Matrix</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
            Statutory appeal mechanism governed by the Maharashtra Right to Public Services Act 2015 for delays and unjust rejections.
          </p>
        </div>
        <button
          type="button"
          className="gov-btn gov-btn-primary"
          onClick={() => setShowRaiseModal(true)}
        >
          File RTS Grievance / Appeal
        </button>
      </div>

      {feedback && (
        <div className="gov-alert gov-alert-success" style={{ marginBottom: '20px' }}>
          {feedback}
        </div>
      )}

      {/* 3-Tier RTS Matrix Infographic Panel */}
      <div className="gov-panel" style={{ marginBottom: '24px' }}>
        <div className="gov-panel-header">Statutory 3-Tier Escalation Architecture (Maharashtra RTS Act)</div>
        <div className="gov-panel-body" style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ border: '1px solid var(--border)', padding: '14px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="gov-badge gov-badge-warn">LEVEL 1</span>
                <strong>Department Nodal Officer</strong>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                Triggered immediately upon initial statutory SLA breach or applicant petition. Officer must investigate and resolve within 3 days.
              </p>
            </div>

            <div style={{ border: '1px solid var(--border)', padding: '14px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="gov-badge gov-badge-query">LEVEL 2</span>
                <strong>MAITRI Nodal Admin (First Appeal)</strong>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                Triggered automatically 3 days after Level 1 if unresolved, or through applicant first appeal. Direct intervention with Head of Department.
              </p>
            </div>

            <div style={{ border: '1px solid var(--border)', padding: '14px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="gov-badge gov-badge-danger">LEVEL 3</span>
                <strong>Competent Appellate Authority (Second Appeal)</strong>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                Triggered after 7 further days. Formal statutory hearing with punitive provisions under Section 19 of Maharashtra RTS Act.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grievance Register Table */}
      <div className="gov-panel">
        <div className="gov-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Registered RTS Grievances & Escalations ({grievances.length})</span>
          <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#FFFFFF' }}>
            Audit-Verified Escalation Trail
          </span>
        </div>
        <div className="gov-panel-body" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Loading RTS grievance records...</p>
          ) : grievances.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)' }}>
              No grievances registered. Advancing the Demo Clock by 15 days will automatically trigger Level 1 & Level 2 SLA escalations on overdue applications.
            </div>
          ) : (
            <table className="gov-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Ticket Ref</th>
                  <th>Application Ref</th>
                  <th>Grievance Category</th>
                  <th>Current Escalation Level</th>
                  <th>Filed Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <strong>{g.ticket_no || `GR-${g.id}`}</strong>
                    </td>
                    <td>
                      <strong>{g.application_ref}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{g.department}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{g.category}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '300px' }}>
                        {g.description}
                      </div>
                    </td>
                    <td>
                      <span
                        className="gov-badge"
                        style={{
                          backgroundColor:
                            g.escalation_level === 'Level 3'
                              ? 'var(--danger)'
                              : g.escalation_level === 'Level 2'
                              ? 'var(--blue)'
                              : '#B7791F',
                          color: '#FFFFFF'
                        }}
                      >
                        {g.escalation_level || 'Level 1'}
                      </span>
                    </td>
                    <td>{new Date(g.created_at).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`gov-badge ${
                          g.status === 'Resolved'
                            ? 'gov-badge-approved'
                            : g.status === 'In Review'
                            ? 'gov-badge-query'
                            : 'gov-badge-danger'
                        }`}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="gov-btn gov-btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => {
                          setActionGrievanceId(g.id);
                          setOfficerRemarks(g.resolution_remarks || '');
                        }}
                      >
                        Adjudicate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Adjudication Modal */}
      {actionGrievanceId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              width: '540px',
              maxWidth: '90%',
              border: '2px solid var(--navy)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--navy)',
                color: '#FFFFFF',
                padding: '12px 16px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>Adjudicate RTS Grievance #{actionGrievanceId}</span>
              <button
                type="button"
                onClick={() => setActionGrievanceId(null)}
                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '16px' }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Adjudication Action
                </label>
                <select
                  value={actionDecision}
                  onChange={(e) => setActionDecision(e.target.value as any)}
                  style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                >
                  <option value="RESOLVE">Resolve Grievance & Issue Statutory Directive</option>
                  <option value="ESCALATE_L2">Escalate to Level 2 (MAITRI Nodal Admin)</option>
                  <option value="ESCALATE_L3">Escalate to Level 3 (Competent Appellate Authority)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Statutory Order / Resolution Remarks *
                </label>
                <textarea
                  rows={4}
                  value={officerRemarks}
                  onChange={(e) => setOfficerRemarks(e.target.value)}
                  placeholder="Record formal administrative findings and compliance direction..."
                  style={{ width: '100%', padding: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="gov-btn gov-btn-secondary"
                  onClick={() => setActionGrievanceId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="gov-btn gov-btn-primary"
                  onClick={() => handleOfficerGrievanceAction(actionGrievanceId)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Recording...' : 'Submit Statutory Decision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Grievance Modal */}
      {showRaiseModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              width: '560px',
              maxWidth: '90%',
              border: '2px solid var(--navy)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--navy)',
                color: '#FFFFFF',
                padding: '12px 16px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>File Formal RTS Grievance / Appeal</span>
              <button
                type="button"
                onClick={() => setShowRaiseModal(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '16px' }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleRaiseGrievance} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Target Application Reference No. *
                </label>
                <select
                  value={selectedAppRef}
                  onChange={(e) => setSelectedAppRef(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                >
                  {applications.map((a) => (
                    <option key={a.id} value={a.reference_no}>
                      {a.reference_no} — {a.approval_name} ({a.issuing_authority})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Grievance Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                >
                  <option value="Delay Beyond Statutory SLA">Delay Beyond Statutory SLA Limit</option>
                  <option value="Unjust Rejection">Arbitrary Rejection Without Statutory Grounds</option>
                  <option value="Repetitive Undue Queries">Repetitive Undue Queries to Delay Process</option>
                  <option value="Demand of Non-Notified Documents">Demand of Non-Notified Documents</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Grievance Particulars & Relief Sought *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="State the facts clearly, citing date of submission and days elapsed beyond notified statutory limit..."
                  style={{ width: '100%', padding: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="gov-btn gov-btn-secondary"
                  onClick={() => setShowRaiseModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gov-btn gov-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Registering...' : 'Register Grievance under RTS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
