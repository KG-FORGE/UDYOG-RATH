import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [selectedEntId, setSelectedEntId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Propose slot form
  const [proposingId, setProposingId] = useState<number | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('11:00 AM');
  const [leadOfficer, setLeadOfficer] = useState('Chief Fire Officer / Lead Inspector');

  // Findings modal
  const [findingId, setFindingId] = useState<number | null>(null);
  const [findingDept, setFindingDept] = useState('Fire Services');
  const [findingRemarks, setFindingRemarks] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ents, inspList] = await Promise.all([
        api.listEnterprises(),
        api.listInspections()
      ]);
      setEnterprises(ents);
      setInspections(inspList);
    } catch (err: any) {
      console.error('Error loading inspection data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConsolidate = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await api.consolidateInspections(selectedEntId);
      setFeedback(
        `Success: Consolidated ${res.departments?.length || 4} departmental inspections into Joint Inspection ID: ${res.joint_id || 'JI-' + res.id}. Saved 3 separate factory visits!`
      );
      await loadData();
    } catch (err: any) {
      alert('Consolidation note: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeSlot = async (id: number) => {
    if (!proposedDate) {
      alert('Please select a date for the proposed joint site visit.');
      return;
    }
    try {
      setActionLoading(true);
      await api.proposeInspectionSlot(id, {
        date: proposedDate,
        time_slot: proposedTime,
        lead_officer: leadOfficer
      });
      setFeedback(`Joint inspection slot proposed for ${proposedDate} at ${proposedTime}. Awaiting applicant confirmation.`);
      setProposingId(null);
      await loadData();
    } catch (err: any) {
      alert('Error proposing slot: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      setActionLoading(true);
      await api.confirmInspection(id, {
        confirmed: true,
        applicant_remarks: 'Confirmed by authorized industrial unit representative.'
      });
      setFeedback('Joint inspection schedule confirmed by enterprise. Notification dispatched to all participating departments.');
      await loadData();
    } catch (err: any) {
      alert('Error confirming inspection: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogFindings = async (id: number) => {
    if (!findingRemarks.trim()) {
      alert('Please enter statutory inspection findings.');
      return;
    }
    try {
      setActionLoading(true);
      await api.logInspectionFindings(id, {
        department: findingDept,
        attended: true,
        remarks: findingRemarks,
        status: 'Compliant'
      });
      setFeedback(`Findings logged for ${findingDept}. Departmental scrutiny record updated.`);
      setFindingId(null);
      setFindingRemarks('');
      await loadData();
    } catch (err: any) {
      alert('Error logging findings: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Calendar hand-built table for current month (October 2026)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentMonthName = 'October 2026';

  return (
    <div className="container" style={{ padding: '24px 0 60px 0' }}>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Common Joint Inspection Planner</h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
          Consolidates separate visits by Fire, Pollution, Factories, Legal Metrology, and Labour departments into ONE single coordinated site inspection.
        </p>
      </div>

      {feedback && (
        <div className="gov-alert gov-alert-success" style={{ marginBottom: '20px' }}>
          {feedback}
        </div>
      )}

      {/* Consolidation Action Bar */}
      <div
        className="gov-panel"
        style={{
          marginBottom: '24px',
          borderLeft: '4px solid var(--saffron)'
        }}
      >
        <div className="gov-panel-body" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--navy)' }}>
                Consolidate Pending Department Inspections
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Under Ease of Doing Business reform directives, no enterprise shall be subjected to isolated repetitive departmental visits.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select
                value={selectedEntId}
                onChange={(e) => setSelectedEntId(Number(e.target.value))}
                style={{ padding: '6px 10px', fontSize: '13px', fontWeight: 'bold' }}
              >
                {enterprises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.district})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="gov-btn gov-btn-primary"
                onClick={handleConsolidate}
                disabled={actionLoading}
              >
                {actionLoading ? 'Consolidating...' : 'Generate Joint Inspection'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Metric Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div className="gov-panel">
          <div className="gov-panel-header">Visits Saved Metric</div>
          <div className="gov-panel-body" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>4 of 5</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              Individual departmental visits eliminated per industrial unit
            </div>
          </div>
        </div>

        <div className="gov-panel">
          <div className="gov-panel-header">Active Joint Inspections</div>
          <div className="gov-panel-body" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--navy)' }}>
              {inspections.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              Multi-departmental schedules in Maharashtra
            </div>
          </div>
        </div>

        <div className="gov-panel">
          <div className="gov-panel-header">Average Notice Period</div>
          <div className="gov-panel-body" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--blue)' }}>7 Days</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              Advance notice with mandatory enterprise consent
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Scheduled Inspections on left, Calendar Table on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Inspection List */}
        <div>
          <div className="gov-panel">
            <div className="gov-panel-header">Joint Inspection Dossiers</div>
            <div className="gov-panel-body" style={{ padding: '12px' }}>
              {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading joint inspection schedules...</p>
              ) : inspections.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                  No joint inspections currently scheduled. Click 'Generate Joint Inspection' above to consolidate pending visits.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {inspections.map((insp) => (
                    <div
                      key={insp.id}
                      style={{
                        border: '1px solid var(--border)',
                        padding: '16px',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '15px' }}>{insp.joint_id || `JI-${insp.id}`}</strong>
                          <div style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 'bold' }}>
                            {insp.enterprise_name || `Enterprise #${insp.enterprise_id}`}
                          </div>
                        </div>
                        <span
                          className={`gov-badge ${
                            insp.status === 'Completed'
                              ? 'gov-badge-approved'
                              : insp.status === 'Confirmed'
                              ? 'gov-badge-submitted'
                              : 'gov-badge-query'
                          }`}
                        >
                          {insp.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', margin: '8px 0' }}>
                        <div>
                          <strong>Scheduled Date:</strong>{' '}
                          {insp.scheduled_date ? `${insp.scheduled_date} (${insp.time_slot || '11:00 AM'})` : 'Date Slot Pending Allocation'}
                        </div>
                        <div>
                          <strong>Lead Authority:</strong> {insp.lead_department || 'Directorate of Industrial Safety (DISH)'}
                        </div>
                      </div>

                      <div style={{ margin: '10px 0' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                          Participating Departments (Single Combined Visit):
                        </span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {insp.departments && insp.departments.map((d: string, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                backgroundColor: 'var(--info-bg)',
                                border: '1px solid var(--border)',
                                color: 'var(--navy)'
                              }}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                        {insp.status === 'Proposed' && (
                          <>
                            <button
                              type="button"
                              className="gov-btn gov-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => setProposingId(insp.id)}
                            >
                              Propose / Change Slot
                            </button>
                            <button
                              type="button"
                              className="gov-btn gov-btn-primary"
                              style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: 'var(--success)' }}
                              onClick={() => handleConfirm(insp.id)}
                            >
                              Applicant Confirm Slot
                            </button>
                          </>
                        )}

                        {insp.status === 'Confirmed' && (
                          <button
                            type="button"
                            className="gov-btn gov-btn-primary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => setFindingId(insp.id)}
                          >
                            Log Officer Findings & Attendance
                          </button>
                        )}
                      </div>

                      {/* Propose Slot Sub-form */}
                      {proposingId === insp.id && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'var(--warn-bg)', border: '1px solid #ECC94B' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Propose Joint Inspection Slot</h4>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <input
                              type="date"
                              value={proposedDate}
                              onChange={(e) => setProposedDate(e.target.value)}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            />
                            <select
                              value={proposedTime}
                              onChange={(e) => setProposedTime(e.target.value)}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              <option value="10:00 AM">10:00 AM</option>
                              <option value="11:30 AM">11:30 AM</option>
                              <option value="02:00 PM">02:00 PM</option>
                              <option value="03:30 PM">03:30 PM</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="gov-btn gov-btn-primary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => handleProposeSlot(insp.id)}
                            >
                              Save Proposed Slot
                            </button>
                            <button
                              type="button"
                              className="gov-btn gov-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => setProposingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Log Findings Sub-form */}
                      {findingId === insp.id && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'var(--info-bg)', border: '1px solid var(--border)' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Log Department Inspection Findings</h4>
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                              Department
                            </label>
                            <select
                              value={findingDept}
                              onChange={(e) => setFindingDept(e.target.value)}
                              style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                            >
                              {insp.departments && insp.departments.map((d: string) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                              Field Observations & Compliance *
                            </label>
                            <textarea
                              rows={3}
                              value={findingRemarks}
                              onChange={(e) => setFindingRemarks(e.target.value)}
                              placeholder="e.g. Setback distances compliant. Fire hydrants pressure test verified satisfactory."
                              style={{ width: '100%', padding: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="gov-btn gov-btn-primary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => handleLogFindings(insp.id)}
                            >
                              Submit Field Findings
                            </button>
                            <button
                              type="button"
                              className="gov-btn gov-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => setFindingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hand-built Month Calendar */}
        <div>
          <div className="gov-panel">
            <div className="gov-panel-header">{currentMonthName} Inspection Schedule Calendar</div>
            <div className="gov-panel-body" style={{ padding: '12px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginBottom: '6px',
                  color: 'var(--muted)'
                }}
              >
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px'
                }}
              >
                {/* Offset for Oct 2026 starting Thursday (4 blank cells) */}
                <div style={{ height: '50px', backgroundColor: '#F0F0F0', border: '1px solid #E0E0E0' }} />
                <div style={{ height: '50px', backgroundColor: '#F0F0F0', border: '1px solid #E0E0E0' }} />
                <div style={{ height: '50px', backgroundColor: '#F0F0F0', border: '1px solid #E0E0E0' }} />
                <div style={{ height: '50px', backgroundColor: '#F0F0F0', border: '1px solid #E0E0E0' }} />

                {daysInMonth.map((day) => {
                  const hasJoint = day === 14 || day === 22;
                  const isToday = day === 4;

                  return (
                    <div
                      key={day}
                      style={{
                        minHeight: '50px',
                        border: '1px solid var(--border)',
                        padding: '4px',
                        backgroundColor: isToday ? '#FFF9DB' : hasJoint ? '#EBF8FF' : '#FFFFFF',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: isToday ? 'bold' : 'normal' }}>{day}</span>
                        {isToday && <span style={{ fontSize: '9px', color: 'var(--saffron)', fontWeight: 'bold' }}>TODAY</span>}
                      </div>

                      {hasJoint && (
                        <div
                          style={{
                            backgroundColor: 'var(--navy)',
                            color: '#FFFFFF',
                            fontSize: '9px',
                            padding: '1px 3px',
                            textAlign: 'center',
                            borderRadius: '1px'
                          }}
                        >
                          Joint (5 Dept)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--muted)' }}>
                <strong>Calendar Legend:</strong>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#EBF8FF', border: '1px solid #3182CE' }} />
                    Joint Multi-Dept Inspection
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#FFF9DB', border: '1px solid #D69E2E' }} />
                    Current Demo Date
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
