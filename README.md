UDYOGRATH (उद्योगरथ)

Integrated Industrial Approval and Compliance Management Platform

Smart India Hackathon 2026 prototype | Problem Statement SIH26130 | Government of Maharashtra | Team KG-FORGE

Disclaimer: UDYOGRATH is a hackathon prototype. It is not an official Government of Maharashtra website and is not connected to any government system. All approvals data, timelines, fees, incentives and statistics are illustrative.

Project Preview

UDYOGRATH — Integrated Industrial Approval and Compliance Management Platform

⸻

1. Problem

An industrial unit may need many registrations, licences, no-objection certificates, inspections and renewals from different departments. What is required depends on sector, location, project size and stage. Applicants struggle to find the applicable approvals, understand documents, track timelines and reach incentives. Departments receive incomplete applications, repeat scrutiny, coordinate manually and have little visibility of bottlenecks.

Problem statement title: Efficiency in streamlining industrial approvals, compliance processes, and access to government support services.

2. Solution

UDYOGRATH is an end-to-end approval orchestration platform. It:

1. Determines which approvals an enterprise needs, in what order, and why.
2. Validates document readiness before submission.
3. Coordinates parallel departmental workflows and joint inspections.
4. Tracks statutory timelines and escalates delays.
5. Connects eligible units to government incentives.

Design principle: rules decide, AI only explains. Every requirement shown to a user comes from a deterministic, versioned rules engine that states why it applies. The knowledge assistant explains with citations, shows a confidence level, and abstains when unsure. Officers always keep final approval authority.

3. Problem Statement to Module Mapping

Problem statement requirement UDYOGRATH module
Customised approval checklist Rules Engine, Know Your Approvals
Guide applicants through documentation Document Centre
Pre-validate submissions Readiness Validator and Readiness Score
Reuse verified data Verified Data Vault
Coordinate parallel departmental workflows Orchestration Engine, Dependency Chart
Schedule inspections Common Inspection Planner
Track service-level timelines SLA Tracker with statutory clock pause and resume
Issue alerts Notifications Centre (simulated SMS and e-mail)
Regulatory knowledge engine Knowledge Centre (cited retrieval)
Risk-based scrutiny Risk Scorer: Fast Track, Standard, Detailed
Grievance escalation Grievance and three-level Escalation Matrix
Single dashboard for applications, approvals, renewals, incentives Applicant and Officer dashboards
Analytics to identify delays Admin Analytics and bottleneck table
Access to incentives and support schemes Incentive and Scheme Matcher

4. Features

For Entrepreneurs

- Four-step enterprise profile wizard covering enterprise, project, scale, location and hazard flags
- Customised approval checklist with the rule that fired, issuing authority, statutory timeline and documents required
- Table, dependency chart and timeline views, with days saved by parallel processing
- Document upload with validation: file type and size, field extraction, expiry check, name and address consistency, and plain-language fixes
- Readiness Score per approval and overall; submission is gated by the score
- Application tracker with reference numbers, SLA countdown, query thread and timeline
- Incentive matching with eligibility reasons
- Knowledge Centre with citations, confidence badge and abstention
- Grievance filing and escalation trail

For Department Officers

- Queue by department with filters for status, SLA risk and risk level
- Scrutiny screen with document viewer, validator results and checklist
- Raise query, pause statutory clock, forward, schedule inspection, approve or reject
- Certificate preview with QR and verification ID
- Mandatory rejection reason

For MAITRI Nodal Admin

- Delay analytics by department against statutory timelines
- Bottleneck ranking, rejection reasons, incomplete-application rate, query ageing and escalation counts
- Versioned rules management with a test panel
- Append-only audit trail with SHA-256 hash chain and integrity check
- Demo Controls: advance the demo clock, reset data and guided demo

Platform

- Government-portal interface with utility bar, text-size controls, contrast toggle, skip link, breadcrumbs and policy footer
- English, Marathi and Hindi interface
- WCAG 2.1 AA oriented: keyboard navigation, visible focus and no colour-only information
- Works offline; the LLM is optional

5. Architecture

React + Vite frontend (plain CSS design tokens)
| REST (JWT)
FastAPI backend
|-- rules_engine versioned JSON rules, condition evaluator, reasons
|-- readiness validators, field extraction, name matching, scoring
|-- sla statutory clock, pause/resume, breach detection
|-- risk risk score and scrutiny level
|-- inspections joint inspection consolidation
|-- incentives eligibility matching
|-- rag BM25 retrieval, optional LLM phrasing, citations
|-- audit append-only log, SHA-256 hash chain
|-- adapters simulated connectors (identity, land, tax, single window)
SQLite database | local file storage | APScheduler (SLA ticks, demo clock)

Adapter layer: real integrations (identity, land records, tax registration, state and national single-window portals) would plug in through backend/adapters. In this prototype every connector is simulated and clearly marked as such.

6. Tech Stack

Layer Technology
Frontend React 18, Vite, TypeScript, React Router, plain CSS, Recharts
Fonts Noto Sans and Noto Sans Devanagari (self-hosted via @fontsource)
Backend Python 3.11, FastAPI, SQLModel / SQLAlchemy, Pydantic, JWT
Data SQLite
Retrieval rank_bm25
Document checks pdfplumber, rapidfuzz
Scheduling APScheduler
Sample documents reportlab
Tests pytest

7. Repository Structure

udyograth/
backend/
app/ FastAPI app entry
models/ database models
routers/ API routes
services/ rules_engine, readiness, sla, risk, inspections,
incentives, rag, audit
adapters/ simulated external connectors
rules/ versioned rule sets (JSON)
seeds/ demo enterprises, applications, knowledge passages
scripts/ make_sample_docs.py
tests/
frontend/
src/
components/ pages/ styles/tokens.css i18n/ api/
samples/ generated demo documents
screenshots/ README and project screenshots
README.md

8. Getting Started

Prerequisites: Python 3.11+, Node.js 18+, npm.

Backend

cd backend
python -m venv .venv
source .venv/bin/activate # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

Backend runs at:

http://localhost:8000

Frontend

cd frontend
npm install
npm run dev

Frontend runs at:

http://localhost:5173

Demo data is seeded automatically on first launch.

Generate Sample Documents

cd backend
python scripts/make_sample_docs.py

This creates PDFs in /samples, including one document with a deliberate enterprise-name mismatch and one expired certificate.

Environment Variables

Variable Purpose
GEMINI_API_KEY Enables LLM phrasing in the Knowledge Centre. Without it, a deterministic template quotes retrieved passages.
JWT_SECRET Overrides the default development secret.

9. Demo Accounts

Password for all demo users:

Demo123!

Role Login
Entrepreneur entrepreneur@demo
Fire Services officer officer.fire@demo
MAITRI nodal admin maitri.admin@demo

Seeded Demo Enterprises

Enterprise Sector, location Expected scrutiny
Sahyadri Precision Components Pvt. Ltd. Engineering, Pune district, MIDC area Standard
Konkan Fresh Foods LLP Food processing, Ratnagiri Fast Track
Vidarbha Agro Chemicals Pvt. Ltd. Chemicals, Nagpur Detailed

All names and identifiers are fictional.

10. Three-Minute Demo Walkthrough

1. Home: introduce the problem and the platform.
1. Profile Wizard: enter the Sahyadri Precision profile once.
1. Know Your Approvals: read the checklist and the reason for each approval, then view the dependency chart and days saved by parallel processing.
1. Document Centre: upload the flawed sample, see the failure and suggested fix, upload the corrected file, watch the Readiness Score rise, then submit.
1. Applications and Queries: see parallel reference numbers and SLA clocks; as the Fire Services officer, raise a query and watch the clock pause, then resume after the reply.
1. Escalation: as admin, advance the Demo Clock by 15 days and follow the alerts and Level 1 and Level 2 escalations.
1. Analytics and Project Information: view delay analytics by department, then the problem statement mapping.

Optional Demonstrations

- Risk-based scrutiny using Vidarbha Agro Chemicals
- Common Inspection Planner
- Incentive Matcher
- Knowledge Centre with an off-topic question to demonstrate abstention
- Audit trail integrity check

11. Rules Engine

Rules are data, not code. Each approval definition in backend/rules includes:

- id, name, authority, legal_basis_label
- conditions: nested all/any conditions over profile fields such as sector, investment, employees, power load, hazardous, effluent, boiler, stage, MIDC and export
- prerequisites and parallel_group
- sla_days for standard and fast-track cases
- fee_label and documents with mandatory flags, validators and accepted formats
- reason_template, filled with matching values so the interface can state why an approval applies

Rule sets are versioned. Editing a rule in the admin console saves a new version and keeps earlier versions viewable. The condition evaluator is implemented in-house and covered by unit tests.

12. Testing

cd backend
pytest

Coverage includes the rules engine, SLA clock pause and resume, risk scoring, name matching, audit hash chain, escalation timing and an end-to-end smoke test of the main flow.

13. Limitations

- All regulatory data, timelines, fees, legal-basis labels and incentive details are illustrative and simplified.
- Government system integrations are simulated through the adapter layer.
- Document field extraction is a prototype and falls back to an editable form when extraction fails.
- SMS and e-mail are logged, not sent.
- The Knowledge Centre uses short original summaries, not the full text of any law.
- Not security-hardened for production use.

14. Roadmap

- Real connectors for state and national single-window systems, identity, land and tax records
- Production-grade OCR and document classification
- Officer-configurable deemed-approval and auto-escalation policies
- District-level dashboards
- Production database, role administration and security audit

15. References and Acknowledgements

- MAITRI, Government of Maharashtra: https://maitri.mahaonline.gov.in/
- National Single Window System (NSWS), DPIIT / Invest India: https://www.nsws.gov.in
- Aaple Sarkar, Maharashtra Right to Public Services Act, 2015: https://aaplesarkar.mahaonline.gov.in
- Udyam Registration Portal, Ministry of MSME: https://udyamregistration.gov.in
- Business Reforms Action Plan (BRAP), DPIIT: https://www.dpiit.gov.in
- Maharashtra Industry, Trade and Investment Facilitation Act, 2023 (summary): https://ksandk.com/newsletter/maharashtra-industry-trade-and-investment-facilitation-act-2023/
- World Bank Business Ready (B-READY): https://www.worldbank.org/en/businessready

16. Team

KG-FORGE, Smart India Hackathon 2026.
