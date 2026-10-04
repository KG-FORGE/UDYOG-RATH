import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function IncentivesPage() {
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [selectedEntId, setSelectedEntId] = useState<number>(1);
  const [eligibleData, setEligibleData] = useState<any | null>(null);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyModalScheme, setApplyModalScheme] = useState<any | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [applying, setApplying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async (entId: number) => {
    try {
      setLoading(true);
      const [ents, eligible, myApps] = await Promise.all([
        api.listEnterprises(),
        api.getEligibleSchemes(entId),
        api.getMySchemeApplications(entId)
      ]);
      setEnterprises(ents);
      setEligibleData(eligible);
      setMyApplications(myApps);
    } catch (err: any) {
      console.error('Error loading incentive schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedEntId);
  }, [selectedEntId]);

  const handleApply = async () => {
    if (!applyModalScheme) return;
    if (!consentChecked) {
      alert('Please check the statutory declaration consent box.');
      return;
    }
    try {
      setApplying(true);
      const schemeCode = applyModalScheme.code || applyModalScheme.scheme_id || applyModalScheme.scheme_code;
      const res = await api.applyForScheme({
        enterprise_id: selectedEntId,
        scheme_code: schemeCode
      });
      setFeedback(`Incentive claim submitted successfully! Reference: ${res.application?.reference_no || 'MH-INC-' + (res.id || selectedEntId)}. Awaiting Directorate of Industries review.`);
      setApplyModalScheme(null);
      setConsentChecked(false);
      await loadData(selectedEntId);
    } catch (err: any) {
      alert('Error applying for scheme: ' + err.message);
    } finally {
      setApplying(false);
    }
  };

  const selectedEnterprise = enterprises.find((e) => e.id === selectedEntId);
  const schemesList = eligibleData?.schemes || eligibleData?.eligible_schemes || [];

  return (
    <div className="container" style={{ padding: '24px 0 60px 0' }}>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Incentive and Scheme Eligibility Matcher</h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
          Rule-driven entitlement discovery matching your enterprise profile directly to Maharashtra State industrial policy subsidies and fiscal exemptions.
        </p>
      </div>

      {/* Illustrative Notice */}
      <div className="gov-instruction-box gov-instruction-warning" style={{ marginBottom: '20px' }}>
        <strong>Important Notice:</strong> All scheme criteria, grant amounts, and eligibility determinations shown are illustrative prototype figures. Final fiscal sanctions are governed by the Directorate of Industries under the Maharashtra Industrial Policy 2019 / MSME Policy.
      </div>

      {feedback && (
        <div className="gov-alert gov-alert-success" style={{ marginBottom: '20px' }}>
          {feedback}
        </div>
      )}

      {/* Enterprise Selector */}
      <div className="gov-panel" style={{ marginBottom: '24px' }}>
        <div className="gov-panel-body" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Evaluating Enterprise Profile:</label>
            <select
              value={selectedEntId}
              onChange={(e) => setSelectedEntId(Number(e.target.value))}
              style={{ padding: '6px 12px', fontSize: '14px', fontWeight: 'bold' }}
            >
              {enterprises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.sector} (₹{e.investment_cr} Cr, {e.district})
                </option>
              ))}
            </select>
            {selectedEnterprise && (
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                District: <strong>{selectedEnterprise.district}</strong> | Stage: <strong>{selectedEnterprise.project_stage || selectedEnterprise.stage}</strong> | Category: <strong>MSME</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Eligible Schemes List */}
      <div className="gov-panel" style={{ marginBottom: '24px' }}>
        <div className="gov-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Matched Eligible State Schemes ({schemesList.length})
          </span>
          <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#FFFFFF' }}>
            Automated Rule Engine Match
          </span>
        </div>
        <div className="gov-panel-body" style={{ padding: '16px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Evaluating profile against state incentive rules...</p>
          ) : schemesList.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)' }}>
              No schemes currently match this specific profile configuration.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {schemesList.map((scheme: any, idx: number) => {
                const schemeTitle = scheme.name || scheme.title;
                const schemeCode = scheme.code || scheme.scheme_id;
                const isAlreadyApplied = scheme.has_applied || myApplications.some(
                  (a) => a.scheme_code === schemeCode || a.scheme_name === schemeTitle
                );
                const reasons = scheme.eligibility_reasons || scheme.reasons || [];
                const docs = scheme.documents || scheme.required_documents || [];
                const benefit = scheme.estimated_benefit || scheme.benefit_label;

                return (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--border)',
                      padding: '16px',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--navy)' }}>
                          {schemeTitle}
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          Authority: <strong>{scheme.authority || 'Directorate of Industries, Maharashtra'}</strong> | Policy: <strong>PSI 2019 / MSME Support</strong>
                        </span>
                      </div>
                      <span className="gov-badge gov-badge-approved">ELIGIBLE</span>
                    </div>

                    <p style={{ margin: '8px 0', fontSize: '13px', color: 'var(--text)' }}>
                      {scheme.benefit_label || scheme.description}
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '12px',
                        backgroundColor: 'var(--bg)',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        margin: '12px 0'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--muted)', display: 'block' }}>
                          ESTIMATED FISCAL BENEFIT (ILLUSTRATIVE)
                        </span>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--success)', marginTop: '2px' }}>
                          {benefit}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--muted)', display: 'block' }}>
                          WHY YOU QUALIFY (DETERMINISTIC RULE MATCH)
                        </span>
                        <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12px', color: 'var(--text)' }}>
                          {reasons.map((r: string, rIdx: number) => (
                            <li key={rIdx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        <strong>Required Pre-Requisite Documents:</strong> {docs.join(', ') || 'Udyam Certificate, Investment Invoices, Bank Sanction'}
                      </div>
                      <div>
                        {isAlreadyApplied ? (
                          <span className="gov-badge gov-badge-submitted" style={{ padding: '6px 12px' }}>
                            Application Submitted
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="gov-btn gov-btn-primary"
                            onClick={() => {
                              setApplyModalScheme(scheme);
                              setConsentChecked(false);
                            }}
                          >
                            Apply for Incentive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submitted Incentive Applications Table */}
      <div className="gov-panel">
        <div className="gov-panel-header">Submitted Incentive Claims & Sanctions Tracker</div>
        <div className="gov-panel-body" style={{ padding: 0 }}>
          {myApplications.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
              No incentive applications have been submitted for {selectedEnterprise?.name || 'this enterprise'} yet.
            </p>
          ) : (
            <table className="gov-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Claim Ref No.</th>
                  <th>Scheme Name</th>
                  <th>Estimated Benefit</th>
                  <th>Submitted Date</th>
                  <th>Claim Status</th>
                </tr>
              </thead>
              <tbody>
                {myApplications.map((app) => (
                  <tr key={app.id}>
                    <td><strong>{app.reference_no || `MH-INC-${app.id}`}</strong></td>
                    <td>{app.scheme_name}</td>
                    <td>{app.benefit_details || '₹50.0 Lakhs (Illustrative)'}</td>
                    <td>{new Date(app.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className="gov-badge gov-badge-submitted">Under Directorate Verification</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {applyModalScheme && (
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
              <span>Submit Incentive Claim: {applyModalScheme.name || applyModalScheme.title}</span>
              <button
                type="button"
                onClick={() => setApplyModalScheme(null)}
                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '16px' }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>
                Applying for enterprise: <strong>{selectedEnterprise?.name}</strong> (Udyam: {selectedEnterprise?.udyam_number || 'MH-12-004567'})
              </p>
              <div className="gov-instruction-box gov-instruction-info" style={{ marginBottom: '16px' }}>
                Estimated Fiscal Entitlement: <strong>{applyModalScheme.estimated_benefit || applyModalScheme.benefit_label}</strong>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <span>
                    I hereby declare that all investment figures, land documents, and bank particulars submitted under the Verified Data Vault are factual. I agree to pre-audit inspection by the District Industries Centre.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="gov-btn gov-btn-secondary"
                  onClick={() => setApplyModalScheme(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="gov-btn gov-btn-primary"
                  onClick={handleApply}
                  disabled={applying || !consentChecked}
                >
                  {applying ? 'Submitting Claim...' : 'Confirm & Submit Claim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
