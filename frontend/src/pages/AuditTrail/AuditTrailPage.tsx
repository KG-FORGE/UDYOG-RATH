import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(100);
      setLogs(data);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleVerifyChain = async () => {
    try {
      setVerifying(true);
      setVerifyResult(null);
      const res = await api.verifyAuditChain();
      setVerifyResult(res);
    } catch (err: any) {
      setVerifyResult({
        valid: false,
        message: 'Chain verification failed: ' + err.message
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="container" style={{ padding: '24px 0 60px 0' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Tamper-Evident SHA-256 Audit Trail</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
            Append-only cryptographic ledger recording all state changes, administrative actions, clock adjustments, and regulatory decisions.
          </p>
        </div>
        <button
          type="button"
          className="gov-btn gov-btn-primary"
          onClick={handleVerifyChain}
          disabled={verifying}
        >
          {verifying ? 'Recomputing Cryptographic Hashes...' : 'Verify Chain Integrity'}
        </button>
      </div>

      {/* Verification Result Banner */}
      {verifyResult && (
        <div
          className={`gov-alert ${verifyResult.valid ? 'gov-alert-success' : 'gov-alert-danger'}`}
          style={{ marginBottom: '20px' }}
        >
          <strong>{verifyResult.valid ? 'Cryptographic Integrity Confirmed:' : 'Integrity Compromised:'}</strong>{' '}
          {verifyResult.message ||
            (verifyResult.valid
              ? `All ${verifyResult.records_checked || logs.length} state log blocks successfully verified from Genesis to Head. SHA-256 hashes unbroken.`
              : `Hash mismatch detected at record ID #${verifyResult.broken_at_id}. Audit record has been tampered with.`)}
        </div>
      )}

      {/* Information Banner */}
      <div className="gov-instruction-box gov-instruction-info" style={{ marginBottom: '20px' }}>
        <strong>How it works:</strong> Every state change computes SHA-256(Record_ID + Timestamp + Actor + Action + Target + Prev_Hash). The resulting hash is stored immutably. Clicking "Verify Chain Integrity" recomputes the entire chain from Genesis block #1 to the current Head block to guarantee no officer or admin has altered statutory records retroactively.
      </div>

      {/* Audit Log Table */}
      <div className="gov-panel">
        <div className="gov-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Immutable State Logs ({logs.length} entries)</span>
          <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#FFFFFF' }}>
            Chain Standard: SHA-256 Block Chaining
          </span>
        </div>
        <div className="gov-panel-body" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Loading audit blocks...</p>
          ) : logs.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>No audit records found.</p>
          ) : (
            <table className="gov-table" style={{ margin: 0, fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Block ID</th>
                  <th>Timestamp (UTC)</th>
                  <th>Actor & Role</th>
                  <th>Action Executed</th>
                  <th>Target Entity</th>
                  <th>Block Hash (SHA-256)</th>
                  <th>Previous Block Hash</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="gov-badge gov-badge-draft">#{log.id}</span>
                    </td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <strong>{log.actor_name || log.actor || 'System'}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {log.actor_role || 'Nodal Engine'}
                      </div>
                    </td>
                    <td>
                      <strong>{log.action}</strong>
                      {log.details && (
                        <div style={{ fontSize: '11px', color: 'var(--muted)', maxWidth: '240px' }}>
                          {log.details}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: '500' }}>{log.target_entity || log.target || 'General'}</span>
                    </td>
                    <td>
                      <code
                        title={log.record_hash}
                        style={{
                          fontSize: '11px',
                          backgroundColor: '#EDF2F7',
                          padding: '2px 4px',
                          display: 'inline-block',
                          maxWidth: '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {log.record_hash}
                      </code>
                    </td>
                    <td>
                      <code
                        title={log.prev_hash}
                        style={{
                          fontSize: '11px',
                          backgroundColor: '#EDF2F7',
                          padding: '2px 4px',
                          display: 'inline-block',
                          maxWidth: '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: log.prev_hash === 'GENESIS_BLOCK_00000000000000000000000000000000' ? 'var(--success)' : 'inherit'
                        }}
                      >
                        {log.prev_hash === 'GENESIS_BLOCK_00000000000000000000000000000000' ? 'GENESIS_ROOT' : log.prev_hash}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
