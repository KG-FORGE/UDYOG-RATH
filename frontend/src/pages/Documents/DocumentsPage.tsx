import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';

export const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [selectedEntId, setSelectedEntId] = useState<number>(1);
  const [readinessData, setReadinessData] = useState<any>(null);
  const [approvalList, setApprovalList] = useState<any[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [uploadingDocCode, setUploadingDocCode] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideChecked, setOverrideChecked] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [manualName, setManualName] = useState<string>('');
  const [msg, setMsg] = useState<{ text: string; type: 'info' | 'warn' | 'success' | 'danger' } | null>(null);

  const loadData = async (entId: number) => {
    try {
      const [readiness, approvalsRes, docs] = await Promise.all([
        api.getReadiness(entId),
        api.evaluateApprovals(entId),
        api.listDocuments(entId)
      ]);
      setReadinessData(readiness);
      setApprovalList(approvalsRes.approvals || []);
      setUploadedDocs(docs);
      if (approvalsRes.approvals && approvalsRes.approvals.length > 0 && !selectedAppId) {
        setSelectedAppId(approvalsRes.approvals[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    api.listEnterprises().then((list) => {
      setEnterprises(list);
      if (list.length > 0) {
        setSelectedEntId(list[0].id);
        loadData(list[0].id);
      }
    });
  }, []);

  const handleFileUpload = async (approvalId: string, docCode: string, docName: string, file: File) => {
    setUploadingDocCode(docCode);
    setMsg(null);
    try {
      const formData = new FormData();
      formData.append('enterprise_id', selectedEntId.toString());
      formData.append('approval_id', approvalId);
      formData.append('document_code', docCode);
      formData.append('document_name', docName);
      formData.append('file', file);

      const res = await api.uploadDocument(formData);
      await loadData(selectedEntId);

      if (res.validation_status === 'Fail') {
        setMsg({
          type: 'danger',
          text: `Validation Failed for ${docName}: ${res.issues.map((i: any) => i.issue).join(' | ')}. Fix: ${res.issues.map((i: any) => i.fix).join(' ')}`
        });
      } else if (res.validation_status === 'Warning') {
        setMsg({
          type: 'warn',
          text: `Validation Warning for ${docName} (${res.name_match_score}% match): ${res.issues.map((i: any) => i.issue).join(' | ')}`
        });
      } else {
        setMsg({
          type: 'success',
          text: `Document ${docName} passed pre-validation with 100% legal compliance score!`
        });
      }
    } catch (e: any) {
      setMsg({ type: 'danger', text: 'Upload failed: ' + e.message });
    } finally {
      setUploadingDocCode(null);
    }
  };

  const handleSeedSamples = async () => {
    try {
      await api.seedSampleDocuments(selectedEntId);
      await loadData(selectedEntId);
      setMsg({ type: 'success', text: 'Sample valid and flawed PDFs linked from /samples for demonstration!' });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveManualExtraction = async () => {
    if (!editingDoc) return;
    try {
      await api.updateExtractedFields({
        document_id: editingDoc.id,
        extracted_name: manualName
      });
      setEditingDoc(null);
      await loadData(selectedEntId);
      setMsg({ type: 'success', text: 'Extracted fields updated and name match re-evaluated!' });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmitBatch = async () => {
    try {
      const appIds = approvalList.map((a) => a.id);
      const res = await api.submitBatchApplications({
        enterprise_id: selectedEntId,
        approval_ids: appIds,
        has_documented_override: overrideChecked,
        override_reason: overrideReason
      });
      alert(`Success! Dispatched ${res.applications.length} statutory applications in parallel.`);
      navigate('/applications');
    } catch (e: any) {
      alert('Submission failed: ' + e.message);
    }
  };

  const activeApproval = approvalList.find((a) => a.id === selectedAppId);
  const docMap = new Map(uploadedDocs.map((d) => [`${d.approval_id}:${d.document_code}`, d]));

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      {/* Top Banner & Enterprise Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--navy)' }}>
            Document Centre & Statutory Readiness Validator
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            Upload mandatory documents per clearance. RapidFuzz audits legal entity consistency, pdfplumber parses parameters, and dates are checked for statutory validity.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={selectedEntId}
            onChange={(e) => {
              const id = parseInt(e.target.value, 10);
              setSelectedEntId(id);
              loadData(id);
            }}
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px' }}
          >
            {enterprises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSeedSamples}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            title="Attach pre-generated samples including deliberate flawed and expired files"
          >
            Load Sample PDFs from /samples
          </button>
        </div>
      </div>

      {msg && (
        <div className={`instruction-box instruction-${msg.type}`} style={{ marginBottom: '16px' }}>
          {msg.text}
        </div>
      )}

      {/* Readiness Score Bar */}
      {readinessData && (
        <div className="gov-panel" style={{ backgroundColor: '#F8FAFC', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Composite Document Readiness Score
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: readinessData.can_submit ? 'var(--success)' : 'var(--danger)'
                  }}
                >
                  {readinessData.overall_score} / 100
                </span>
                <span style={{ fontSize: '0.88rem', color: readinessData.can_submit ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                  {readinessData.can_submit ? 'PASS: Application Ready for Parallel Dispatch' : 'ACTION REQUIRED: Minimum 80 Score Required to Submit'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Mandatory Documents Uploaded: {readinessData.uploaded_mandatory_docs} of {readinessData.total_mandatory_docs}
              </div>
            </div>

            {/* Submission / Override Controls */}
            <div>
              {readinessData.can_submit ? (
                <button
                  onClick={handleSubmitBatch}
                  className="btn"
                  style={{ backgroundColor: 'var(--green)', color: '#FFFFFF', padding: '12px 24px', fontWeight: 700, fontSize: '1rem', border: 'none' }}
                >
                  Submit All Applications in Parallel &rarr;
                </button>
              ) : (
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', padding: '10px 14px', borderRadius: 2 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: '#92400E', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={overrideChecked}
                      onChange={(e) => setOverrideChecked(e.target.checked)}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <strong>Enable Documented Override:</strong> Submit below 80 readiness threshold with justifiable cause.
                    </div>
                  </label>
                  {overrideChecked && (
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        placeholder="State mandatory override rationale for departmental review"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.82rem', padding: '4px 8px' }}
                      />
                      <button
                        onClick={handleSubmitBatch}
                        disabled={!overrideReason.trim()}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '6px', width: '100%' }}
                      >
                        Submit with Recorded Override
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Clearance Selector on Left, Document Checklist on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '20px' }}>
        {/* Left Column: Clearances List */}
        <div className="gov-panel">
          <div className="gov-panel-header">
            <span>Required Clearances</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>{approvalList.length}</span>
          </div>
          <div className="gov-panel-body" style={{ padding: 0, maxHeight: '600px', overflowY: 'auto' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {approvalList.map((app) => {
                const isSelected = app.id === selectedAppId;
                const appReadiness = readinessData?.per_approval?.find((p: any) => p.approval_id === app.id);
                const score = appReadiness?.readiness_score || 0;

                return (
                  <li
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      borderLeft: isSelected ? '4px solid var(--navy)' : '4px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? 'var(--navy)' : 'var(--text)' }}>
                        {app.name}
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 2,
                          backgroundColor: score >= 80 ? '#DCFCE7' : (score > 0 ? '#FEF3C7' : '#FEE2E2'),
                          color: score >= 80 ? '#166534' : (score > 0 ? '#92400E' : 'var(--danger)')
                        }}
                      >
                        {score}%
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                      {app.authority}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right Column: Active Clearance Documents Checklist */}
        <div>
          {activeApproval ? (
            <div className="gov-panel">
              <div className="gov-panel-header">
                <div>
                  <span>Document Checklist: {activeApproval.name}</span>
                  <div style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 400, marginTop: '2px' }}>
                    Issuing Authority: {activeApproval.authority} | SLA: {activeApproval.sla_days} Days
                  </div>
                </div>
              </div>

              <div className="gov-panel-body">
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '8px 12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.85rem' }}>
                    Legal Basis: <strong>{activeApproval.legal_basis_label}</strong>
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--blue)', fontWeight: 600 }}>
                    {activeApproval.parallel_group}
                  </span>
                </div>

                {/* Documents Table */}
                <div className="table-container">
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Document Name & Validation Rules</th>
                        <th>Status</th>
                        <th>Name Match / Expiry</th>
                        <th>Data Vault Reuse</th>
                        <th>Action / Upload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeApproval.documents || []).map((req: any) => {
                        const uploaded = docMap.get(`${activeApproval.id}:${req.code}`);
                        const isUploading = uploadingDocCode === req.code;

                        return (
                          <tr key={req.code}>
                            <td style={{ maxWidth: '280px' }}>
                              <div style={{ fontWeight: 700, color: 'var(--navy)' }}>
                                {req.name} {req.mandatory && <span style={{ color: 'var(--danger)' }}>*</span>}
                              </div>
                              <code style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{req.code}</code>
                              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '2px' }}>
                                Validators: {req.validators.join(', ')} (Max 5MB PDF)
                              </div>

                              {/* Issues / Remedial Instructions */}
                              {uploaded && uploaded.issues && uploaded.issues.length > 0 && (
                                <div style={{ marginTop: '6px', padding: '6px 8px', backgroundColor: '#FEF2F2', borderLeft: '3px solid var(--danger)', fontSize: '0.75rem' }}>
                                  {uploaded.issues.map((iss: any, iIdx: number) => (
                                    <div key={iIdx} style={{ marginBottom: '2px' }}>
                                      <strong style={{ color: 'var(--danger)' }}>Issue:</strong> {iss.issue}
                                      <br />
                                      <strong style={{ color: 'var(--blue)' }}>Plain-Language Fix:</strong> {iss.fix}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Validation Status */}
                            <td>
                              {uploaded ? (
                                <div>
                                  <span
                                    className="status-badge"
                                    style={{
                                      backgroundColor: uploaded.validation_status === 'Pass' ? '#DCFCE7' : (uploaded.validation_status === 'Warning' ? '#FEF3C7' : '#FEE2E2'),
                                      color: uploaded.validation_status === 'Pass' ? '#166534' : (uploaded.validation_status === 'Warning' ? '#92400E' : 'var(--danger)'),
                                      borderColor: uploaded.validation_status === 'Pass' ? '#86EFAC' : (uploaded.validation_status === 'Warning' ? '#FCD34D' : '#FCA5A5')
                                    }}
                                  >
                                    {uploaded.validation_status}
                                  </span>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                                    Score: {uploaded.readiness_score_contribution}%
                                  </div>
                                </div>
                              ) : (
                                <span className="status-badge status-Draft">Pending Upload</span>
                              )}
                            </td>

                            {/* Extraction & Name Match */}
                            <td>
                              {uploaded ? (
                                <div style={{ fontSize: '0.78rem' }}>
                                  <div>
                                    Name Match:{' '}
                                    <strong style={{ color: uploaded.name_match_score >= 85 ? 'var(--success)' : 'var(--danger)' }}>
                                      {uploaded.name_match_score}%
                                    </strong>
                                  </div>
                                  {uploaded.is_expired && (
                                    <div style={{ color: 'var(--danger)', fontWeight: 700 }}>
                                      EXPIRED: {uploaded.extracted_fields?.expiry_date}
                                    </div>
                                  )}
                                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                                    Extracted: "{uploaded.extracted_fields?.enterprise_name || 'N/A'}"
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingDoc(uploaded);
                                      setManualName(uploaded.extracted_fields?.enterprise_name || '');
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.7rem', padding: '1px 6px', marginTop: '4px' }}
                                  >
                                    Edit Extracted Fields
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>-</span>
                              )}
                            </td>

                            {/* Data Vault Reuse Status */}
                            <td>
                              {uploaded?.is_vault_reused ? (
                                <span
                                  style={{
                                    backgroundColor: '#EFF6FF',
                                    color: 'var(--blue)',
                                    padding: '2px 6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    border: '1px solid #BFDBFE'
                                  }}
                                >
                                  Reused from verified data
                                </span>
                              ) : (
                                <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Direct Upload</span>
                              )}
                            </td>

                            {/* File Upload Action */}
                            <td>
                              <label
                                className="btn btn-secondary btn-sm"
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '0.78rem',
                                  padding: '4px 10px'
                                }}
                              >
                                {isUploading ? 'Validating...' : (uploaded ? 'Re-upload' : 'Upload File')}
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.png"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleFileUpload(activeApproval.id, req.code, req.name, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              Select a clearance on the left to view document checklist.
            </div>
          )}
        </div>
      </div>

      {/* Modal for Editing Extracted Fields */}
      {editingDoc && (
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
            zIndex: 9999
          }}
        >
          <div style={{ backgroundColor: '#FFFFFF', width: '500px', border: '2px solid var(--navy)', borderRadius: 2 }}>
            <div style={{ backgroundColor: 'var(--navy)', color: '#FFFFFF', padding: '10px 16px', fontWeight: 700 }}>
              Edit Extracted Fields (Prototype Extraction)
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px' }}>
                If automated OCR/text extraction encountered formatting anomalies, correct the legal entity name below to re-run RapidFuzz matching:
              </p>
              <div className="form-group">
                <label className="form-label">Extracted Legal Entity Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualExtraction}
                  className="btn btn-primary btn-sm"
                >
                  Save & Re-evaluate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
