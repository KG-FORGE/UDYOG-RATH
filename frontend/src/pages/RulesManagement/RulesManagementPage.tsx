import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function RulesManagementPage() {
  const [rulesMeta, setRulesMeta] = useState<any | null>(null);
  const [currentRulesJson, setCurrentRulesJson] = useState<string>('');
  const [jsonText, setJsonText] = useState<string>('');
  const [newVersion, setNewVersion] = useState<string>('1.1.0');
  const [versionNotes, setVersionNotes] = useState<string>('Updated fast-track parameters and timeline limits');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sandbox Test State
  const [sandboxProfile, setSandboxProfile] = useState({
    sector: 'engineering',
    investment_cr: 15.0,
    employees: 90,
    power_kw: 350,
    water_kld: 25,
    district: 'Pune',
    midc_area: true,
    hazardous_materials: false,
    effluent_generation: false,
    boiler_required: false,
    explosives_or_flammables: false,
    export_activity: true,
    project_stage: 'new'
  });
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);
  const [testingSandbox, setTestingSandbox] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const [meta, rawJson] = await Promise.all([
        api.getRulesMetadata(),
        api.getCurrentRulesJson()
      ]);
      setRulesMeta(meta);
      const formatted = JSON.stringify(rawJson, null, 2);
      setCurrentRulesJson(formatted);
      setJsonText(formatted);
    } catch (err: any) {
      console.error('Error loading rules:', err);
    }
  };

  const handleSaveNewVersion = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      alert('Invalid JSON syntax in rules editor. Please correct syntax errors before saving.');
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await api.saveRuleVersion({
        version: newVersion,
        notes: versionNotes,
        rules_data: parsed
      });
      setFeedback(`Rule set version ${newVersion} saved successfully and activated as current state rule set.`);
      await loadRules();
    } catch (err: any) {
      alert('Error saving rule version: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRunSandbox = async () => {
    let parsedRules: any = null;
    try {
      parsedRules = JSON.parse(jsonText);
    } catch {
      alert('Invalid JSON in editor. Fix syntax to test against sandbox.');
      return;
    }

    try {
      setTestingSandbox(true);
      const res = await api.testRuleSandbox({
        profile: sandboxProfile,
        rules_data: parsedRules
      });
      setSandboxResult(res);
    } catch (err: any) {
      alert('Error evaluating sandbox: ' + err.message);
    } finally {
      setTestingSandbox(false);
    }
  };

  return (
    <div className="container" style={{ padding: '24px 0 60px 0' }}>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Deterministic Rules Engine Management & Versioning</h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
          Rules are data, not code. Manage versioned statutory approval definitions, nested conditions, and evaluate live sandbox scenarios.
        </p>
      </div>

      {feedback && (
        <div className="gov-alert gov-alert-success" style={{ marginBottom: '20px' }}>
          {feedback}
        </div>
      )}

      {/* Version Summary Bar */}
      <div className="gov-panel" style={{ marginBottom: '24px' }}>
        <div className="gov-panel-body" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <strong>Active Rule Version:</strong>{' '}
              <span className="gov-badge gov-badge-approved" style={{ marginLeft: '6px' }}>
                v{rulesMeta?.active_version || '1.0.0'}
              </span>
              <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--muted)' }}>
                Total Approvals Seeded: <strong>{rulesMeta?.approval_count || 25}</strong> | Conditions: <strong>Nested All/Any</strong>
              </span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Rule Engine Standard: ISO/IEC 19770 Verifiable Compliance
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: JSON Editor on left, Sandbox on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Rules JSON Editor */}
        <div className="gov-panel">
          <div className="gov-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Versioned Approval Rules Definition (JSON)</span>
            <button
              type="button"
              className="gov-btn gov-btn-secondary"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={() => setJsonText(currentRulesJson)}
            >
              Revert Changes
            </button>
          </div>
          <div className="gov-panel-body" style={{ padding: '16px' }}>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={22}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '11px',
                padding: '10px',
                border: '1px solid var(--border)',
                backgroundColor: '#FAFAFA',
                boxSizing: 'border-box',
                lineHeight: 1.4
              }}
            />

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold' }}>New Version:</label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold' }}>Changelog / Notes:</label>
                  <input
                    type="text"
                    value={versionNotes}
                    onChange={(e) => setVersionNotes(e.target.value)}
                    style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="gov-btn gov-btn-primary"
                onClick={handleSaveNewVersion}
                disabled={saving}
              >
                {saving ? 'Publishing Version...' : `Save as Version ${newVersion}`}
              </button>
            </div>
          </div>
        </div>

        {/* Live Sandbox Evaluation */}
        <div>
          <div className="gov-panel" style={{ marginBottom: '20px' }}>
            <div className="gov-panel-header">Test Rules Engine Against Sandbox Profile</div>
            <div className="gov-panel-body" style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--muted)' }}>
                Tweak parameters to verify which statutory approvals trigger and review generated 'Why Required' statements.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold' }}>Sector</label>
                  <select
                    value={sandboxProfile.sector}
                    onChange={(e) => setSandboxProfile({ ...sandboxProfile, sector: e.target.value })}
                    style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                  >
                    <option value="engineering">Engineering</option>
                    <option value="food_processing">Food Processing</option>
                    <option value="chemicals">Chemicals</option>
                    <option value="pharmaceuticals">Pharmaceuticals</option>
                    <option value="textiles">Textiles</option>
                    <option value="plastics">Plastics</option>
                    <option value="electronics">Electronics</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold' }}>Investment (₹ Cr)</label>
                  <input
                    type="number"
                    value={sandboxProfile.investment_cr}
                    onChange={(e) => setSandboxProfile({ ...sandboxProfile, investment_cr: Number(e.target.value) })}
                    style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold' }}>Employees</label>
                  <input
                    type="number"
                    value={sandboxProfile.employees}
                    onChange={(e) => setSandboxProfile({ ...sandboxProfile, employees: Number(e.target.value) })}
                    style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold' }}>Power Load (kW)</label>
                  <input
                    type="number"
                    value={sandboxProfile.power_kw}
                    onChange={(e) => setSandboxProfile({ ...sandboxProfile, power_kw: Number(e.target.value) })}
                    style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Hazard flags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sandboxProfile.hazardous_materials}
                    onChange={(e) => setSandboxProfile({ ...sandboxProfile, hazardous_materials: e.target.checked })}
                  />
                  <span>Hazardous materials stored / used</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sandboxProfile.effluent_generation}
                    onChange={(e) => setSandboxProfile({ ...sandboxProfile, effluent_generation: e.target.checked })}
                  />
                  <span>Industrial trade effluent generation</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sandboxProfile.boiler_required}
                    onChange={(e) => setSandboxProfile({ ...sandboxProfile, boiler_required: e.target.checked })}
                  />
                  <span>Steam boiler installed</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sandboxProfile.export_activity}
                    onChange={(e) => setSandboxProfile({ ...sandboxProfile, export_activity: e.target.checked })}
                  />
                  <span>Export activity intended (IEC required)</span>
                </label>
              </div>

              <button
                type="button"
                className="gov-btn gov-btn-primary"
                style={{ width: '100%' }}
                onClick={handleRunSandbox}
                disabled={testingSandbox}
              >
                {testingSandbox ? 'Evaluating Rules...' : 'Run Sandbox Evaluation'}
              </button>
            </div>
          </div>

          {/* Sandbox Evaluation Output */}
          {sandboxResult && (
            <div className="gov-panel">
              <div className="gov-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Sandbox Output ({sandboxResult.matched_approvals?.length || 0} Approvals Triggered)</span>
                <span className="gov-badge gov-badge-approved">Deterministic Match</span>
              </div>
              <div className="gov-panel-body" style={{ maxHeight: '340px', overflowY: 'auto', padding: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sandboxResult.matched_approvals?.map((app: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: '#FFFFFF',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong>{app.name}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{app.issuing_authority}</span>
                      </div>
                      <div style={{ color: 'var(--navy)', fontWeight: 'bold', fontSize: '11px' }}>
                        Why Required: {app.why_required}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                        Parallel Group: <strong>{app.parallel_group}</strong> | SLA: <strong>{app.statutory_sla_days} Days</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
