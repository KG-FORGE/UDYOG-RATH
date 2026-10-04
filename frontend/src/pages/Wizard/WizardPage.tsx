import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardStepper } from '../../components/Stepper/WizardStepper';
import { api } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';

export const WizardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [selectedEntId, setSelectedEntId] = useState<number | null>(null);
  const [savedProfile, setSavedProfile] = useState<any>(null);
  const [riskInfo, setRiskInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Enterprise Details
    name: 'Sahyadri Precision Components Pvt. Ltd.',
    constitution_type: 'Private Limited',
    pan: 'AABCS1234F',
    udyam_no: 'UDYAM-MH-12-0012345',
    registered_address: 'Plot No. C-44, MIDC Chakan Phase II, Pune - 410501',
    pin_code: '410501',

    // Step 2: Project
    sector: 'engineering',
    activity_description: 'Precision automobile ancillary components, CNC gear blanks and transmission parts manufacturing.',
    stage: 'new',

    // Step 3: Scale & Location
    investment_cr: 18.0,
    employees: 120,
    power_kw: 400.0,
    water_kld: 40.0,
    district: 'Pune',
    is_midc: true,
    midc_area_name: 'Chakan Phase II Industrial Area',
    land_type: 'Industrial Lease',

    // Step 4: Hazard Flags
    hazardous: false,
    effluent: false,
    boiler: false,
    explosives: false,
    storage_flammables: false,
    export_activity: true
  });

  const loadEnterpriseList = async () => {
    try {
      const list = await api.listEnterprises();
      setEnterprises(list);
      if (list.length > 0 && selectedEntId === null) {
        setSelectedEntId(list[0].id);
        loadEnterpriseDetails(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadEnterpriseDetails = async (id: number) => {
    try {
      const data = await api.getEnterprise(id);
      const ent = data.enterprise;
      setFormData({
        name: ent.name,
        constitution_type: ent.constitution_type,
        pan: ent.pan,
        udyam_no: ent.udyam_no || '',
        registered_address: ent.registered_address || '',
        pin_code: ent.pin_code || '',
        sector: ent.sector,
        activity_description: ent.activity_description,
        stage: ent.stage,
        investment_cr: ent.investment_cr,
        employees: ent.employees,
        power_kw: ent.power_kw,
        water_kld: ent.water_kld,
        district: ent.district,
        is_midc: ent.is_midc,
        midc_area_name: ent.midc_area_name || '',
        land_type: ent.land_type || 'Industrial Lease',
        hazardous: ent.hazardous,
        effluent: ent.effluent,
        boiler: ent.boiler,
        explosives: ent.explosives,
        storage_flammables: ent.storage_flammables,
        export_activity: ent.export_activity
      });
      setSavedProfile(ent);
      setRiskInfo(data.risk_profile);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadEnterpriseList();
  }, []);

  const handleSelectDemoEnterprise = (id: number) => {
    setSelectedEntId(id);
    loadEnterpriseDetails(id);
    setCurrentStep(1);
    setMsg('Loaded enterprise profile into wizard.');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const created = await api.createEnterprise(formData);
      setSavedProfile(created);
      const data = await api.getEnterprise(created.id);
      setRiskInfo(data.risk_profile);
      setSelectedEntId(created.id);
      setMsg(`Profile successfully saved to Verified Data Vault! Risk Category: ${created.risk_category} (Score: ${created.risk_score}).`);
      await loadEnterpriseList();
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      {/* Page Title & Preset Loader */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--navy)' }}>
            Enterprise Profile Wizard (Verified Data Vault)
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            Complete the 4-step wizard to register legal entity parameters. Requirements and risk classification are derived deterministically.
          </p>
        </div>

        {/* Demo Preset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '6px 12px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy)' }}>Load Preset Enterprise:</span>
          {enterprises.map((e) => (
            <button
              key={e.id}
              onClick={() => handleSelectDemoEnterprise(e.id)}
              className="btn btn-sm"
              style={{
                backgroundColor: selectedEntId === e.id ? 'var(--navy)' : '#F1F5F9',
                color: selectedEntId === e.id ? '#FFFFFF' : 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              {e.name.split(' ')[0]} ({e.risk_category || 'Standard'})
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className="instruction-box instruction-info">
          {msg}
        </div>
      )}

      {/* 4-Step Numbered Rectangles Stepper */}
      <WizardStepper currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />

      {/* Wizard Form Panels */}
      <div className="gov-panel">
        <div className="gov-panel-header">
          {currentStep === 1 && <span>Step 1 of 4: Enterprise Identity & Constitutional Attributes</span>}
          {currentStep === 2 && <span>Step 2 of 4: Industrial Project Classification & Stage</span>}
          {currentStep === 3 && <span>Step 3 of 4: Project Scale, Utilities & Geographic Location</span>}
          {currentStep === 4 && <span>Step 4 of 4: Environmental, Thermal & Hazardous Risk Indicators</span>}
          <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>Step {currentStep} of 4</span>
        </div>

        <div className="gov-panel-body">
          {/* STEP 1: Enterprise Details */}
          {currentStep === 1 && (
            <div>
              <div className="instruction-box instruction-info">
                Fields entered here are cryptographically verified and anchored into the <strong>Verified Data Vault</strong>. Subsequent clearances reuse these attributes automatically.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Full Legal Registered Enterprise Name <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Sahyadri Precision Components Pvt. Ltd."
                    required
                  />
                  <div className="form-help">Must match PAN card and Certificate of Incorporation exactly.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Constitution of Business Entity <span className="req-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.constitution_type}
                    onChange={(e) => handleInputChange('constitution_type', e.target.value)}
                  >
                    <option value="Private Limited">Private Limited Company</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                    <option value="Partnership">Partnership Firm</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Public Limited">Public Limited Company</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Permanent Account Number (PAN) <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.pan}
                    onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder="e.g. AABCS1234F"
                    required
                  />
                  <div className="form-help">Standard 10-digit Indian Income Tax PAN format.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Udyam MSME Registration Number (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.udyam_no}
                    onChange={(e) => handleInputChange('udyam_no', e.target.value)}
                    placeholder="e.g. UDYAM-MH-12-0012345"
                  />
                  <div className="form-help">Enter if already registered with Ministry of MSME.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Registered Office / Factory Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.registered_address}
                    onChange={(e) => handleInputChange('registered_address', e.target.value)}
                    placeholder="e.g. Plot No. C-44, MIDC Chakan Phase II, Pune"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.pin_code}
                    onChange={(e) => handleInputChange('pin_code', e.target.value)}
                    maxLength={6}
                    placeholder="410501"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Project Details */}
          {currentStep === 2 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Industrial Sector <span className="req-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                  >
                    <option value="engineering">Engineering & Automobile Ancillary</option>
                    <option value="food processing">Food Processing & Beverages</option>
                    <option value="textiles">Textiles & Garments</option>
                    <option value="chemicals">Chemicals & Petrochemicals</option>
                    <option value="plastics">Plastics & Polymer Processing</option>
                    <option value="pharmaceuticals">Pharmaceuticals & Bulk Drugs</option>
                    <option value="electronics">Electronics & IT Hardware</option>
                  </select>
                  <div className="form-help">Determines baseline environmental & DISH safety regulatory pathways.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Project Stage <span className="req-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.stage}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                  >
                    <option value="new">New Green-Field Industrial Unit</option>
                    <option value="expansion">Brown-Field Expansion / Capacity Addition</option>
                    <option value="operating">Operating Unit (Periodic Compliance)</option>
                    <option value="renewal">Regulatory Renewal Cycle</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">
                  Detailed Manufacturing Activity Description <span className="req-star">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.activity_description}
                  onChange={(e) => handleInputChange('activity_description', e.target.value)}
                  placeholder="Describe manufacturing process, raw materials, intermediates, and final end-products."
                />
              </div>
            </div>
          )}

          {/* STEP 3: Scale & Location */}
          {currentStep === 3 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Proposed Gross Capital Investment (₹ Crore) <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.investment_cr}
                    onChange={(e) => handleInputChange('investment_cr', parseFloat(e.target.value) || 0)}
                    required
                  />
                  <div className="form-help">Gross block in land, building, plant & machinery.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Direct Workforce / Employees <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.employees}
                    onChange={(e) => handleInputChange('employees', parseInt(e.target.value, 10) || 0)}
                    required
                  />
                  <div className="form-help">Triggers DISH Factory Plan (≥10) & Contract Labour (≥50).</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Power Requirement (Connected Load kW) <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    className="form-input"
                    value={formData.power_kw}
                    onChange={(e) => handleInputChange('power_kw', parseFloat(e.target.value) || 0)}
                    required
                  />
                  <div className="form-help">Triggers MSEDCL HT/LT line feasibility.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Water Requirement (KLD) <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    className="form-input"
                    value={formData.water_kld}
                    onChange={(e) => handleInputChange('water_kld', parseFloat(e.target.value) || 0)}
                    required
                  />
                  <div className="form-help">Daily requirement in kilo litres per day.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">District Location <span className="req-star">*</span></label>
                  <select
                    className="form-select"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                  >
                    <option value="Pune">Pune</option>
                    <option value="Ratnagiri">Ratnagiri</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Thane">Thane</option>
                    <option value="Aurangabad">Chhatrapati Sambhajinagar (Aurangabad)</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Kolhapur">Kolhapur</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Zoning & Estate Type <span className="req-star">*</span></label>
                  <select
                    className="form-select"
                    value={formData.is_midc ? 'true' : 'false'}
                    onChange={(e) => handleInputChange('is_midc', e.target.value === 'true')}
                  >
                    <option value="true">Within Notified MIDC Industrial Area</option>
                    <option value="false">Non-MIDC Private Land (NA Conversion Required)</option>
                  </select>
                  <div className="form-help">Non-MIDC land mandates separate Revenue NA clearance.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Industrial Area Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.midc_area_name}
                    onChange={(e) => handleInputChange('midc_area_name', e.target.value)}
                    placeholder="e.g. Chakan Phase II / Butibori / Mirjole"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Hazard Flags */}
          {currentStep === 4 && (
            <div>
              <div className="instruction-box instruction-warn">
                Legal Notice: False declaration of hazardous processes or boiler installations constitutes a violation under Section 15 of the Environment (Protection) Act 1986 and Factories Act 1948.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div style={{ border: '1px solid var(--border)', padding: '12px', backgroundColor: '#F8FAFC' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.hazardous}
                      onChange={(e) => handleInputChange('hazardous', e.target.checked)}
                      style={{ marginTop: '4px', width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>Hazardous Materials & Waste</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Involves manufacture or handling of Schedule I/II hazardous chemicals or generates toxic residues requiring MPCB Authorisation.
                      </div>
                    </div>
                  </label>
                </div>

                <div style={{ border: '1px solid var(--border)', padding: '12px', backgroundColor: '#F8FAFC' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.effluent}
                      onChange={(e) => handleInputChange('effluent', e.target.checked)}
                      style={{ marginTop: '4px', width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>Trade Effluent Generation</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Unit discharges trade effluent or wet chemical washings requiring dedicated Effluent Treatment Plant (ETP/STP).
                      </div>
                    </div>
                  </label>
                </div>

                <div style={{ border: '1px solid var(--border)', padding: '12px', backgroundColor: '#F8FAFC' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.boiler}
                      onChange={(e) => handleInputChange('boiler', e.target.checked)}
                      style={{ marginTop: '4px', width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>Steam Boiler / Pressure Vessel</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Facility installs steam boilers, economizers or pressure vessels governed under Indian Boiler Regulations (IBR 1950).
                      </div>
                    </div>
                  </label>
                </div>

                <div style={{ border: '1px solid var(--border)', padding: '12px', backgroundColor: '#F8FAFC' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.storage_flammables}
                      onChange={(e) => handleInputChange('storage_flammables', e.target.checked)}
                      style={{ marginTop: '4px', width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>Bulk Storage of Flammables / Solvents</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Bulk storage tanks exceeding Petroleum Rules / PESO statutory exemption thresholds.
                      </div>
                    </div>
                  </label>
                </div>

                <div style={{ border: '1px solid var(--border)', padding: '12px', backgroundColor: '#F8FAFC' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.export_activity}
                      onChange={(e) => handleInputChange('export_activity', e.target.checked)}
                      style={{ marginTop: '4px', width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>International Export Activities</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Enterprise engages in direct merchandise exports or outward trade (requires DGFT Importer-Exporter Code IEC).
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="btn btn-secondary"
            >
              &larr; {t('btn_back')}
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="btn btn-primary"
              >
                {t('btn_next')} &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={loading}
                className="btn"
                style={{ backgroundColor: 'var(--green)', color: '#FFFFFF', padding: '10px 24px', fontWeight: 700, border: 'none' }}
              >
                {loading ? 'Saving to Vault...' : 'Save Profile & Compute Rules Engine Checklist &rarr;'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Verified Data Vault & Risk Outcome Summary Panel (Post-Save / When Profile Active) */}
      {riskInfo && (
        <div className="gov-panel" style={{ marginTop: '24px' }}>
          <div className="gov-panel-header" style={{ backgroundColor: 'var(--blue)' }}>
            <span>Verified Data Vault & Deterministic Risk Classification Result</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active Profile Record</span>
          </div>
          <div className="gov-panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Risk Summary */}
              <div style={{ border: '1px solid var(--border)', padding: '16px', backgroundColor: '#F8FAFC' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Assigned Regulatory Scrutiny Track
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '8px 0' }}>
                  <span
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: riskInfo.risk_category === 'Fast Track' ? 'var(--success)' : (riskInfo.risk_category === 'Standard' ? 'var(--blue)' : 'var(--danger)')
                    }}
                  >
                    {riskInfo.risk_category}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>
                    (Score: {riskInfo.risk_score} / 100)
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text)' }}>
                  {riskInfo.description}
                </p>

                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => navigate('/approvals')}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                  >
                    View Deterministic Approvals Checklist &rarr;
                  </button>
                </div>
              </div>

              {/* Contributing Risk Factors */}
              <div>
                <h4 style={{ fontSize: '0.92rem', color: 'var(--navy)', marginBottom: '8px' }}>
                  Contributing Risk Factors (Evaluated by Section 4 Rules)
                </h4>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)' }}>
                  <table className="gov-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Factor</th>
                        <th>Specific Detail</th>
                        <th>Risk Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(riskInfo.factors || []).map((f: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{f.factor}</td>
                          <td>{f.detail}</td>
                          <td style={{ fontWeight: 700, color: f.weight > 0 ? 'var(--navy)' : 'var(--muted)' }}>
                            +{f.weight}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
