import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { SvgDependencyGraph } from '../../components/DependencyGraph/SvgDependencyGraph';
import { ParallelVsSequentialBar } from '../../components/TimelineBar/ParallelVsSequentialBar';
import { useTranslation } from '../../i18n/useTranslation';

export const ApprovalsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [selectedEntId, setSelectedEntId] = useState<number>(1);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'graph' | 'timeline'>('table');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listEnterprises().then((list) => {
      setEnterprises(list);
      if (list.length > 0) {
        setSelectedEntId(list[0].id);
        fetchApprovals(list[0].id);
      }
    });
  }, []);

  const fetchApprovals = async (entId: number) => {
    setLoading(true);
    try {
      const res = await api.evaluateApprovals(entId);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterpriseChange = (id: number) => {
    setSelectedEntId(id);
    fetchApprovals(id);
  };

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      {/* Page Title & Profile Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--navy)' }}>
            {t('nav_know_approvals')} (Deterministic Statutory Checklist)
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            Every statutory requirement below is determined by the versioned rules engine with explicit citation of legal bases and plain-language matching rationale.
          </p>
        </div>

        {/* Enterprise Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '6px 12px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy)' }}>Evaluating Enterprise:</span>
          <select
            value={selectedEntId}
            onChange={(e) => handleEnterpriseChange(parseInt(e.target.value, 10))}
            className="form-select"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.85rem' }}
          >
            {enterprises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.sector} - {e.risk_category || 'Standard'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Illustrative Notice */}
      <div className="instruction-box instruction-warn" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          <strong>Notice:</strong> {t('illustrative_note')} Fees, legal basis labels, and statutory timelines reflect illustrative provisions under the Maharashtra Facilitation Act framework.
        </span>
        <button
          onClick={() => navigate('/documents')}
          className="btn btn-primary btn-sm"
          style={{ marginLeft: '12px' }}
        >
          Validate Document Readiness &rarr;
        </button>
      </div>

      {/* Three Views Tab Strip */}
      <div className="tabs-strip">
        <button
          onClick={() => setActiveTab('table')}
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
        >
          1. Statutory Approvals Table ({data?.approvals?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
        >
          2. Directed Dependency Graph (SVG)
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
        >
          3. Parallel vs Sequential Timeline (Gestation Savings)
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          Evaluating rules engine against enterprise parameters...
        </div>
      )}

      {/* VIEW 1: Formal Administrative Table */}
      {!loading && activeTab === 'table' && data && (
        <div className="table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No.</th>
                <th>Approval / Licence</th>
                <th>Issuing Authority</th>
                <th>Legal Basis (Illustrative)</th>
                <th>Why Required (Rule Evaluation)</th>
                <th>Prerequisite</th>
                <th>Parallel Group</th>
                <th>Statutory SLA</th>
                <th>Fee (Illustrative)</th>
                <th>Mandatory Documents</th>
              </tr>
            </thead>
            <tbody>
              {data.approvals.map((app: any, idx: number) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 700, color: 'var(--muted)' }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{app.name}</div>
                    <code style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{app.id}</code>
                    {app.applied && (
                      <div style={{ marginTop: '4px' }}>
                        <span className="status-badge status-Submitted" style={{ fontSize: '0.7rem' }}>
                          Applied: {app.application_ref}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{app.authority}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{app.legal_basis_label}</td>
                  <td style={{ fontSize: '0.84rem', color: '#0F2D54', backgroundColor: 'var(--info-bg)', maxWidth: '240px' }}>
                    {app.why_required}
                  </td>
                  <td>
                    {app.prerequisites && app.prerequisites.length > 0 ? (
                      <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 600 }}>
                        {app.prerequisites.join(', ')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>None (Direct)</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{app.parallel_group}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{app.sla_days} Days</span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                      (Std: {app.sla_standard}d / Fast: {app.sla_fast_track}d)
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{app.fee_label}</td>
                  <td>
                    <div style={{ fontSize: '0.78rem' }}>
                      {(app.documents || []).map((doc: any, dIdx: number) => (
                        <div key={dIdx} style={{ marginBottom: '2px' }}>
                          • {doc.name} {doc.mandatory && <span style={{ color: 'var(--danger)' }}>*</span>}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: Directed Dependency Graph */}
      {!loading && activeTab === 'graph' && data && (
        <SvgDependencyGraph approvals={data.approvals} />
      )}

      {/* VIEW 3: Horizontal Timeline Comparison */}
      {!loading && activeTab === 'timeline' && data && (
        <ParallelVsSequentialBar data={data.timeline_comparison} />
      )}
    </div>
  );
};
