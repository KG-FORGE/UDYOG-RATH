import React from 'react';
import { Link } from 'react-router-dom';

const SIH_MAPPINGS = [
  {
    requirement: 'Customised checklist of required approvals & legal basis',
    problemAspect: 'Navigating dozens of state & municipal clearances without clarity on applicability',
    module: 'Know Your Approvals (Deterministic Rules Engine)',
    path: '/approvals',
    implementation: 'Evaluates 25+ statutory rules against enterprise scale, sector, power, hazard flags, and site factors. Displays exact legal basis and plain-text "Why Required" reasoning.',
    status: 'Delivered (Rule-Driven)'
  },
  {
    requirement: 'Guidance on documentation & preparation',
    problemAspect: 'Lack of clear specifications for formats, validity periods, and department requirements',
    module: 'Document Centre & Pre-Validation Engine',
    path: '/documents',
    implementation: 'Provides tailored document lists per approval with mandatory flags, accepted file types, and detailed preparation guidelines.',
    status: 'Delivered'
  },
  {
    requirement: 'Pre-validation of documents before formal submission',
    problemAspect: 'High rate of rejections and queries due to minor name typos, expired certificates, and format mismatches',
    module: 'Document Readiness Validator',
    path: '/documents',
    implementation: 'Runs automated RapidFuzz fuzzy name matching (>85%), PDF text extraction via pdfplumber, expiry checks, and PIN consistency. Computes 0-100 Readiness Score and blocks submission below 80.',
    status: 'Delivered (RapidFuzz + pdfplumber)'
  },
  {
    requirement: 'Reuse of verified data across departments',
    problemAspect: 'Applicant repeatedly re-entering PAN, address, Udyam, and land details for every department',
    module: 'Verified Data Vault',
    path: '/wizard',
    implementation: 'Stores once-verified profile and document attributes in an encrypted vault, auto-populating subsequent departmental forms with clear "Reused from verified data" badge.',
    status: 'Delivered (Vault Architecture)'
  },
  {
    requirement: 'Orchestration of parallel departmental workflows',
    problemAspect: 'Departments working sequentially, causing clearance delays of 120-180 days',
    module: 'Parallel Workflow Coordinator & Dependency Graph',
    path: '/approvals',
    implementation: 'Classifies approvals into independent parallel groups (e.g. Fire NOC, CTE, Building Permission simultaneously). Displays SVG dependency chart and timeline showing sequential vs parallel days saved.',
    status: 'Delivered (SVG Graph + Critical Path)'
  },
  {
    requirement: 'Coordinated site inspection scheduling',
    problemAspect: 'Multiple uncoordinated departmental visits disrupting industrial factory construction',
    module: 'Common Inspection Planner',
    path: '/inspections',
    implementation: 'Consolidates separate visits (Fire, Pollution, Factories, Legal Metrology, Labour) into ONE joint inspection with interactive month calendar and "Visits Saved" metric.',
    status: 'Delivered (Joint Planner)'
  },
  {
    requirement: 'Real-time SLA tracking with clock pause/resume',
    problemAspect: 'Lack of transparency on statutory deadlines under Maharashtra RTS Act',
    module: 'Statutory SLA Clock & Query Manager',
    path: '/applications',
    implementation: 'Tracks calendar SLA countdowns. Automatically pauses the legal clock when an officer raises a query and resumes it when the applicant responds.',
    status: 'Delivered (Statutory Logic)'
  },
  {
    requirement: 'Multi-channel proactive alerts & reminders',
    problemAspect: 'Applicants unaware of pending queries or approaching statutory deadlines',
    module: 'Notifications & Dispatch Log',
    path: '/notifications',
    implementation: 'Dispatches in-app priority alerts alongside simulated TRAI DLT-standard SMS and SMTP email logs for approaching SLAs, queries, and sanctions.',
    status: 'Delivered (Multi-Channel Log)'
  },
  {
    requirement: 'Single unified dashboard for applicant and administration',
    problemAspect: 'Fragmented siloed portals requiring separate logins across departments',
    module: 'Consolidated Applications Tracker & MAITRI Portal',
    path: '/applications',
    implementation: 'Single pane of glass tracking all clearances with unified reference numbers (MH-UR-YYYY-NNNNNN), real-time status badges, and vertical event trail.',
    status: 'Delivered'
  },
  {
    requirement: 'Intelligent regulatory knowledge assistant',
    problemAspect: 'Navigating voluminous bureaucratic acts and circulars without clear answers',
    module: 'Knowledge Centre (BM25 + RAG Assistant)',
    path: '/knowledge',
    implementation: 'Provides deterministic BM25 search over 42 seeded regulatory summaries with authoritative citations, confidence badges, and strict abstention when out-of-domain.',
    status: 'Delivered (Rules decide, AI explains)'
  },
  {
    requirement: 'Risk-based differentiated scrutiny',
    problemAspect: 'Treating low-risk micro-enterprises with the same cumbersome scrutiny as hazardous chemical plants',
    module: 'Risk-Based Scrutiny Engine',
    path: '/officer',
    implementation: 'Computes objective 0-100 risk score based on hazard flags, effluent, investment scale, and power load. Segregates into Fast Track (<35), Standard (35-69), and Detailed Scrutiny (>=70).',
    status: 'Delivered (Deterministic Scoring)'
  },
  {
    requirement: 'Right-to-Services grievance & automated escalation',
    problemAspect: 'No recourse when applications languish past statutory deadlines without justification',
    module: 'RTS Grievance Redressal & 3-Tier Escalation',
    path: '/grievance',
    implementation: 'Enforces Maharashtra RTS Act 2015. Automatically escalates delayed applications to Level 1 Nodal Officer upon breach, Level 2 MAITRI Admin after 3 days, and Level 3 Appellate Authority.',
    status: 'Delivered (3-Tier RTS Matrix)'
  },
  {
    requirement: 'Delay bottleneck analytics & administrative insights',
    problemAspect: 'State leadership unable to pinpoint which departments or officers cause systemic clearance delays',
    module: 'MAITRI Administrative Analytics',
    path: '/analytics',
    implementation: 'Visualizes actual vs statutory days per department, bottleneck heat rankings, query ageing distribution, rejection cause breakdown, and CSV data export.',
    status: 'Delivered (Recharts + Heat Table)'
  },
  {
    requirement: 'Industrial scheme and fiscal incentive matching',
    problemAspect: 'Enterprises unaware of state capital subsidies, power duty waivers, and interest subventions',
    module: 'Incentive & Scheme Matcher',
    path: '/incentives',
    implementation: 'Evaluates enterprise district, investment, and sector to match 6 illustrative Maharashtra Industrial Policy schemes with clear qualification reasons and benefit estimates.',
    status: 'Delivered (Rule-Driven Matcher)'
  }
];

export default function ProjectInfoPage() {
  return (
    <div className="container" style={{ padding: '24px 0 60px 0' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Project Information & SIH26130 Problem Statement Mapping</h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
          Official Hackathon technical dossier for Smart India Hackathon 2026.
        </p>
      </div>

      {/* Meta Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="gov-panel">
          <div className="gov-panel-header">Hackathon Challenge</div>
          <div className="gov-panel-body" style={{ fontSize: '13px' }}>
            <p style={{ margin: '0 0 6px 0' }}><strong>Problem Statement ID:</strong> SIH26130</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>State / Ministry:</strong> Government of Maharashtra</p>
            <p style={{ margin: 0 }}><strong>Target Entity:</strong> MAITRI (Maharashtra Industry, Trade and Investment Facilitation Cell)</p>
          </div>
        </div>

        <div className="gov-panel">
          <div className="gov-panel-header">Team Particulars</div>
          <div className="gov-panel-body" style={{ fontSize: '13px' }}>
            <p style={{ margin: '0 0 6px 0' }}><strong>Team Name:</strong> KG-FORGE</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>Platform Name:</strong> UDYOGRATH (उद्योगरथ)</p>
            <p style={{ margin: 0 }}><strong>Core Tagline:</strong> Integrated Industrial Approval and Compliance Management Platform</p>
          </div>
        </div>

        <div className="gov-panel">
          <div className="gov-panel-header">Design & Architectural Philosophy</div>
          <div className="gov-panel-body" style={{ fontSize: '13px' }}>
            <p style={{ margin: '0 0 6px 0' }}><strong>Core Principle:</strong> Rules decide, AI only explains</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>Aesthetic:</strong> Strict GIGW Government Portal standard</p>
            <p style={{ margin: 0 }}><strong>Security:</strong> SHA-256 block-chained tamper-evident audit ledger</p>
          </div>
        </div>
      </div>

      {/* Problem Statement Details */}
      <div className="gov-panel" style={{ marginBottom: '24px' }}>
        <div className="gov-panel-header">SIH26130 Problem Statement Title & Scope</div>
        <div className="gov-panel-body" style={{ padding: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--navy)' }}>
            "Efficiency in streamlining industrial approvals, compliance processes, and access to government support services."
          </h3>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' }}>
            Establishment of a manufacturing or industrial enterprise in India typically requires navigating upwards of 25 separate state, municipal, and statutory departmental approvals. Enterprises face severe friction from lack of clear requirements, repetitive document submissions, uncoordinated physical inspections, and untracked administrative delays. UDYOGRATH solves this through an end-to-end deterministic orchestration platform engineered specifically for the Government of Maharashtra and MAITRI.
          </p>
        </div>
      </div>

      {/* Complete Problem Statement Requirements Mapping Table */}
      <div className="gov-panel">
        <div className="gov-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>SIH26130 Requirement-to-Module Traceability Matrix ({SIH_MAPPINGS.length} Core Dimensions)</span>
          <span className="gov-badge gov-badge-approved">100% Comprehensive Coverage</span>
        </div>
        <div className="gov-panel-body" style={{ padding: 0 }}>
          <table className="gov-table" style={{ margin: 0, fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Problem Statement Requirement</th>
                <th style={{ width: '200px' }}>Industry Pain Point Addressed</th>
                <th style={{ width: '180px' }}>UDYOGRATH Solution Module</th>
                <th>Technical Architecture & Verification</th>
                <th style={{ width: '120px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {SIH_MAPPINGS.map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{item.requirement}</strong></td>
                  <td style={{ color: 'var(--muted)' }}>{item.problemAspect}</td>
                  <td>
                    <Link to={item.path} style={{ fontWeight: 'bold', color: 'var(--blue)' }}>
                      {item.module} &rarr;
                    </Link>
                  </td>
                  <td>{item.implementation}</td>
                  <td>
                    <span className="gov-badge gov-badge-approved">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
