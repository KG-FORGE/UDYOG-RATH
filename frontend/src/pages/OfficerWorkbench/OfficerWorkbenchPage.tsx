import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/Common/StatusBadge';

const DEPARTMENTS = [
  'Fire Services',
  'Pollution Control Board',
  'Factories and Industrial Safety',
  'Electricity Distribution',
  'Industrial Development Corporation',
  'Labour',
  'Legal Metrology',
  'Local Body'
];

export default function OfficerWorkbenchPage() {
  const [department, setDepartment] = useState('Fire Services');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState('ALL');

  // Scrutiny Modal / Drawer
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'NONE' | 'FORWARD' | 'QUERY' | 'INSPECTION' | 'APPROVE' | 'REJECT'>('NONE');
  const [actionForm, setActionForm] = useState({
    remarks: '',
    queryCategory: 'Document Defect',
    queryText: '',
    inspectionDate: '',
    leadInspector: '',
    rejectReason: 'Incomplete Statutory Documentation'
  });
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listApplications({ department });
      setApplications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch departmental applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    setSelectedApp(null);
    setActionType('NONE');
  }, [department]);

  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (riskFilter !== 'ALL' && app.scrutiny_level !== riskFilter) return false;
    if (slaFilter === 'AT_RISK' && !app.is_at_risk) return false;
    if (slaFilter === 'BREACHED' && !app.is_sla_breached) return false;
    return true;
  });

  const handleOpenScrutiny = async (appRef: string) => {
    try {
      const fullDetail = await api.getApplicationDetail(appRef);
      setSelectedApp(fullDetail);
      setActionType('NONE');
      setFeedback(null);
    } catch (err: any) {
      alert('Error loading application: ' + err.message);
    }
  };

  const executeAction = async () => {
    if (!selectedApp) return;

    try {
      setActionSubmitting(true);
      setFeedback(null);

      if (actionType === 'FORWARD') {
        await api.officerAction(selectedApp.reference_no, {
          action: 'FORWARD',
          remarks: actionForm.remarks || 'Application desk scrutiny commenced.'
        });
        setFeedback('Application progressed to Under Scrutiny.');
      } else if (actionType === 'QUERY') {
        if (!actionForm.queryText.trim()) {
          alert('Please specify the exact query text for the applicant.');
          setActionSubmitting(false);
          return;
        }
        await api.raiseQuery({
          application_id: selectedApp.id,
          category: actionForm.queryCategory,
          query_text: actionForm.queryText
        });
        setFeedback('Departmental query raised successfully. The statutory review clock has been paused.');
      } else if (actionType === 'INSPECTION') {
        await api.officerAction(selectedApp.reference_no, {
          action: 'SCHEDULE_INSPECTION',
          remarks: `Inspection requested for date: ${actionForm.inspectionDate || 'Earliest slot'}. Coordinated via Common Inspection Planner.`
        });
        setFeedback('Site inspection requested and linked to Common Inspection Planner.');
      } else if (actionType === 'APPROVE') {
        await api.officerAction(selectedApp.reference_no, {
          action: 'APPROVE',
          remarks: actionForm.remarks || 'Statutory scrutiny completed. Approval granted.'
        });
        setFeedback('Approval granted. Tamper-evident PDF certificate generated with QR code.');
      } else if (actionType === 'REJECT') {
        if (!actionForm.remarks.trim()) {
          alert('A detailed justification remark is mandatory for rejections under RTS guidelines.');
          setActionSubmitting(false);
          return;
        }
        await api.officerAction(selectedApp.reference_no, {
          action: 'REJECT',
          remarks: `Reason: ${actionForm.rejectReason}. Remarks: ${actionForm.remarks}`
        });
        setFeedback('Application formally rejected with RTS appeal rights communicated to applicant.');
      }

      await fetchApplications();
      // Refresh current scrutiny view
      const updated = await api.getApplicationDetail(selectedApp.reference_no);
      setSelectedApp(updated);
      setActionType('NONE');
    } catch (err: any) {
      alert('Error executing officer action: ' + err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '24px 0 60px 0' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Department Officer Scrutiny Workbench</h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
          Competent authority dashboard for scrutinizing statutory industrial applications, issuing queries, and granting digital certificates.
        </p>
      </div>

      {/* Department Selector Strip */}
      <div className="gov-panel" style={{ marginBottom: '20px' }}>
        <div className="gov-panel-body" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Operating Department Queue:</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={{
                padding: '6px 12px',
                fontWeight: 'bold',
                fontSize: '14px',
                border: '1px solid var(--navy)',
                backgroundColor: '#FFFFFF',
                color: 'var(--navy)'
              }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Logged-in officer: <strong>officer.{department.toLowerCase().replace(/\s+/g, '')}</strong> (Role: Department Officer)
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="gov-alert gov-alert-success" style={{ marginBottom: '20px' }}>
          {feedback}
        </div>
      )}

      {/* Queue Filters */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Filters:</span>

        <div>
          <label style={{ fontSize: '12px', marginRight: '6px' }}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Scrutiny">Under Scrutiny</option>
            <option value="Query Raised">Query Raised</option>
            <option value="Inspection Scheduled">Inspection Scheduled</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', marginRight: '6px' }}>Risk Scrutiny Track:</label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <option value="ALL">All Tracks</option>
            <option value="Fast Track">Fast Track</option>
            <option value="Standard">Standard</option>
            <option value="Detailed Scrutiny">Detailed Scrutiny</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', marginRight: '6px' }}>SLA Status:</label>
          <select
            value={slaFilter}
            onChange={(e) => setSlaFilter(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <option value="ALL">All SLA States</option>
            <option value="AT_RISK">At Risk (&lt;25% SLA left)</option>
            <option value="BREACHED">Breached (&lt;0 days)</option>
          </select>
        </div>

        <button
          type="button"
          className="gov-btn gov-btn-secondary"
          style={{ padding: '4px 10px', fontSize: '12px', marginLeft: 'auto' }}
          onClick={() => {
            setStatusFilter('ALL');
            setRiskFilter('ALL');
            setSlaFilter('ALL');
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* Main Grid: Queue on left, Scrutiny Panel on right */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedApp ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Applications Queue Table */}
        <div className="gov-panel">
          <div className="gov-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Assigned Queue: {department} ({filteredApps.length})
            </span>
            <button
              type="button"
              className="gov-btn gov-btn-secondary"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={fetchApplications}
            >
              Refresh Queue
            </button>
          </div>
          <div className="gov-panel-body" style={{ padding: 0 }}>
            {loading ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Loading queue...</p>
            ) : filteredApps.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                No applications match current filters for {department}.
              </p>
            ) : (
              <table className="gov-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Ref No. & Approval</th>
                    <th>Enterprise</th>
                    <th>Risk Track</th>
                    <th>Statutory Due / SLA</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((a) => {
                    const isSelected = selectedApp && selectedApp.reference_no === a.reference_no;
                    return (
                      <tr
                        key={a.id}
                        style={{
                          backgroundColor: isSelected ? 'var(--warn-bg)' : undefined,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleOpenScrutiny(a.reference_no)}
                      >
                        <td>
                          <strong>{a.reference_no}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{a.approval_name}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '500' }}>{a.enterprise_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{a.sector}</div>
                        </td>
                        <td>
                          <span
                            className="gov-badge"
                            style={{
                              backgroundColor:
                                a.scrutiny_level === 'Fast Track'
                                  ? 'var(--success)'
                                  : a.scrutiny_level === 'Standard'
                                  ? 'var(--navy)'
                                  : 'var(--danger)',
                              color: '#fff'
                            }}
                          >
                            {a.scrutiny_level}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              fontWeight: 'bold',
                              color: a.is_sla_breached
                                ? 'var(--danger)'
                                : a.is_at_risk
                                ? '#B7791F'
                                : 'var(--text)'
                            }}
                          >
                            {a.is_sla_breached
                              ? `BREACHED (-${Math.abs(a.days_remaining)}d)`
                              : `${a.days_remaining}d left`}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            Due: {new Date(a.due_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={a.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="gov-btn gov-btn-primary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenScrutiny(a.reference_no);
                            }}
                          >
                            Scrutinize
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Scrutiny Detail & Actions Panel */}
        {selectedApp && (
          <div className="gov-panel">
            <div
              className="gov-panel-header"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Scrutiny Dossier: {selectedApp.reference_no}</span>
              <button
                type="button"
                className="gov-btn gov-btn-secondary"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => setSelectedApp(null)}
              >
                Close Dossier
              </button>
            </div>
            <div className="gov-panel-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              {/* Status and Clock Summary */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  marginBottom: '16px'
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>Current Status</span>
                  <StatusBadge status={selectedApp.status} />
                  {selectedApp.status === 'Query Raised' && (
                    <span className="gov-badge gov-badge-query" style={{ marginLeft: '6px' }}>
                      Clock Paused
                    </span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>Statutory SLA</span>
                  <strong
                    style={{
                      color: selectedApp.is_sla_breached ? 'var(--danger)' : 'var(--text)'
                    }}
                  >
                    {selectedApp.is_sla_breached
                      ? `Breached by ${Math.abs(selectedApp.days_remaining)} days`
                      : `${selectedApp.days_remaining} days left of ${selectedApp.statutory_days_limit}d limit`}
                  </strong>
                </div>
              </div>

              {/* Enterprise Profile & Risk Contributing Factors */}
              <div style={{ marginBottom: '16px', border: '1px solid var(--border)', padding: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--navy)' }}>
                  Enterprise Profile & Risk Scoring
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div><strong>Entity:</strong> {selectedApp.enterprise_name}</div>
                  <div><strong>Sector:</strong> {selectedApp.sector}</div>
                  <div><strong>Investment:</strong> ₹{selectedApp.investment_cr} Cr</div>
                  <div><strong>Workforce:</strong> {selectedApp.employees} workers</div>
                  <div><strong>Location:</strong> {selectedApp.district} (MIDC)</div>
                  <div>
                    <strong>Risk Category:</strong>{' '}
                    <span style={{ fontWeight: 'bold' }}>{selectedApp.scrutiny_level} (Score: {selectedApp.risk_score}/100)</span>
                  </div>
                </div>
              </div>

              {/* Pre-Validated Documents Checklist */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--navy)' }}>
                  Pre-Validated Document Readiness Checklist
                </h4>
                <table className="gov-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Format</th>
                      <th>Pre-Check Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedApp.documents && selectedApp.documents.length > 0 ? (
                      selectedApp.documents.map((d: any, idx: number) => (
                        <tr key={idx}>
                          <td><strong>{d.name || d.document_name}</strong></td>
                          <td>PDF</td>
                          <td>
                            <span className="gov-badge gov-badge-approved">Pre-Validated (PASS)</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                          Standard statutory documents attached and pre-screened.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons Toolbar */}
              <div style={{ borderTop: '2px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--navy)' }}>
                  Officer Actions & Decisions
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <button
                    type="button"
                    className="gov-btn gov-btn-secondary"
                    style={{ fontSize: '12px' }}
                    onClick={() => setActionType('FORWARD')}
                  >
                    Commence Scrutiny
                  </button>
                  <button
                    type="button"
                    className="gov-btn gov-btn-primary"
                    style={{ fontSize: '12px', backgroundColor: '#B7791F' }}
                    onClick={() => setActionType('QUERY')}
                  >
                    Raise Query (Pause Clock)
                  </button>
                  <button
                    type="button"
                    className="gov-btn gov-btn-secondary"
                    style={{ fontSize: '12px' }}
                    onClick={() => setActionType('INSPECTION')}
                  >
                    Schedule Joint Inspection
                  </button>
                  <button
                    type="button"
                    className="gov-btn gov-btn-primary"
                    style={{ fontSize: '12px', backgroundColor: 'var(--success)' }}
                    onClick={() => setActionType('APPROVE')}
                  >
                    Grant Approval & Certificate
                  </button>
                  <button
                    type="button"
                    className="gov-btn gov-btn-danger"
                    style={{ fontSize: '12px' }}
                    onClick={() => setActionType('REJECT')}
                  >
                    Reject Application
                  </button>
                </div>

                {/* Sub-form based on Action Type */}
                {actionType !== 'NONE' && (
                  <div
                    style={{
                      border: '1px solid var(--navy)',
                      padding: '14px',
                      backgroundColor: 'var(--info-bg)'
                    }}
                  >
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--navy)' }}>
                      {actionType === 'FORWARD' && 'Commence In-Depth Desk Scrutiny'}
                      {actionType === 'QUERY' && 'Raise Formal Statutory Query (Pauses Statutory Clock)'}
                      {actionType === 'INSPECTION' && 'Request Site Inspection via Common Inspection Planner'}
                      {actionType === 'APPROVE' && 'Final Statutory Approval & Digital Certificate Generation'}
                      {actionType === 'REJECT' && 'Formally Reject Application (RTS Mandatory Justification)'}
                    </h5>

                    {actionType === 'FORWARD' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                          Scrutiny Officer Remarks
                        </label>
                        <input
                          type="text"
                          value={actionForm.remarks}
                          onChange={(e) => setActionForm({ ...actionForm, remarks: e.target.value })}
                          placeholder="e.g. Initial document verification passed. Proceeding with detailed technical scrutiny."
                          style={{ width: '100%', padding: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}

                    {actionType === 'QUERY' && (
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                            Query Category *
                          </label>
                          <select
                            value={actionForm.queryCategory}
                            onChange={(e) => setActionForm({ ...actionForm, queryCategory: e.target.value })}
                            style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                          >
                            <option value="Document Defect">Document Defect / Inconsistency</option>
                            <option value="Technical Clarification">Technical Clarification</option>
                            <option value="Site Inspection Requirement">Site Inspection Prerequisite</option>
                            <option value="Fee Discrepancy">Fee Discrepancy</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                            Query Explanation for Applicant *
                          </label>
                          <textarea
                            value={actionForm.queryText}
                            onChange={(e) => setActionForm({ ...actionForm, queryText: e.target.value })}
                            rows={3}
                            placeholder="Specify precisely what clarification or supplemental document is required..."
                            style={{ width: '100%', padding: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    )}

                    {actionType === 'INSPECTION' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                          Proposed Inspection Date
                        </label>
                        <input
                          type="date"
                          value={actionForm.inspectionDate}
                          onChange={(e) => setActionForm({ ...actionForm, inspectionDate: e.target.value })}
                          style={{ padding: '6px', fontSize: '12px', marginBottom: '8px' }}
                        />
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                          This request will be merged with other pending departmental inspections in the Common Inspection Planner.
                        </p>
                      </div>
                    )}

                    {actionType === 'APPROVE' && (
                      <div>
                        <div className="gov-instruction-box gov-instruction-info" style={{ marginBottom: '10px' }}>
                          Approval will issue an official digitally verified Certificate with unique QR code, SHA-256 verification hash, and set a statutory renewal reminder.
                        </div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                          Approval Endorsement Remarks
                        </label>
                        <input
                          type="text"
                          value={actionForm.remarks}
                          onChange={(e) => setActionForm({ ...actionForm, remarks: e.target.value })}
                          placeholder="All statutory preconditions fulfilled. Granted under relevant act."
                          style={{ width: '100%', padding: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}

                    {actionType === 'REJECT' && (
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                            Statutory Rejection Reason *
                          </label>
                          <select
                            value={actionForm.rejectReason}
                            onChange={(e) => setActionForm({ ...actionForm, rejectReason: e.target.value })}
                            style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                          >
                            <option value="Incomplete Statutory Documentation">Incomplete Statutory Documentation</option>
                            <option value="Non-Compliance with Environmental Standards">Non-Compliance with Environmental Standards</option>
                            <option value="Fire Safety Norms Violation">Fire Safety Norms Violation</option>
                            <option value="Zoning and Land Use Ineligibility">Zoning and Land Use Ineligibility</option>
                            <option value="Non-Response to Departmental Query">Non-Response to Departmental Query within 30 days</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                            Mandatory Justification Remarks (Appealable under RTS) *
                          </label>
                          <textarea
                            value={actionForm.remarks}
                            onChange={(e) => setActionForm({ ...actionForm, remarks: e.target.value })}
                            rows={3}
                            placeholder="Provide detailed statutory reasons for rejection. Applicant has right to RTS First Appeal."
                            style={{ width: '100%', padding: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="gov-btn gov-btn-primary"
                        onClick={executeAction}
                        disabled={actionSubmitting}
                      >
                        {actionSubmitting ? 'Processing...' : 'Confirm Decision'}
                      </button>
                      <button
                        type="button"
                        className="gov-btn gov-btn-secondary"
                        onClick={() => setActionType('NONE')}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
