import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import bcrypt
from sqlmodel import Session, select
from backend.app.database import engine, init_db
from backend.models import (
    User,
    EnterpriseProfile,
    Application,
    ApplicationEvent,
    QueryTicket,
    JointInspection,
    SchemeApplication,
    Grievance,
    AuditLog,
    Notification
)
from backend.services.audit import append_audit_entry
from backend.services.risk import compute_risk_profile
from backend.services.sla import get_current_system_time

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

DEFAULT_PASSWORD_HASH = hash_password("Demo123!")

def seed_database(force: bool = False):
    init_db()
    with Session(engine) as session:
        # Check if already seeded
        existing_users = session.exec(select(User)).first()
        if existing_users and not force:
            print("Database already contains seeded data.")
            return

        # Clear existing data if force
        if force:
            for tbl in [Notification, Grievance, SchemeApplication, JointInspection, QueryTicket, ApplicationEvent, Application, EnterpriseProfile, AuditLog, User]:
                session.query(tbl).delete()
            session.commit()

        print("Seeding demo users...")
        users = [
            # 1. Entrepreneur
            User(
                username="applicant",
                full_name="Kunal Patil",
                email="kunal.patil@sahyadri.in",
                role="APPLICANT",
                hashed_password=DEFAULT_PASSWORD_HASH
            ),
            # 2. Department Officers (8 departments)
            User(
                username="officer_mpcb",
                full_name="Dr. Sanjay Sawant (Sub-Regional Officer)",
                email="sro.pune@mpcb.gov.in",
                role="OFFICER",
                department_code="MPCB",
                hashed_password=DEFAULT_PASSWORD_HASH
            ),
            User(
                username="officer_fire",
                full_name="Chief Fire Officer R. K. Shinde",
                email="cfo.pune@mahafireservice.gov.in",
                role="OFFICER",
                department_code="FIRE",
                hashed_password=DEFAULT_PASSWORD_HASH
            ),
            User(
                username="officer_dish",
                full_name="Joint Director A. B. Kadam",
                email="jd.pune@dish.gov.in",
                role="OFFICER",
                department_code="DISH",
                hashed_password=DEFAULT_PASSWORD_HASH
            ),
            User(
                username="officer_msedcl",
                full_name="Executive Engineer V. P. More",
                email="ee.chakan@msedcl.in",
                role="OFFICER",
                department_code="MSEDCL",
                hashed_password=DEFAULT_PASSWORD_HASH
            ),
            User(
                username="officer_midc",
                full_name="Regional Officer P. N. Thorat",
                email="ro.pune@midcindia.org",
                role="OFFICER",
                department_code="MIDC",
                hashed_password=DEFAULT_PASSWORD_HASH
            ),
            User(
                username="officer_labour",
                full_name="Labour Officer S. M. Gite",
                email="dcl.pune@mahalabour.gov.in",
                role="OFFICER",
                department_code="LABOUR",
                hashed_password=DEFAULT_PASSWORD_HASH
            ),
            User(
                username="officer_metrology",
                full_name="Inspector Legal Metrology H. S. Joshi",
                email="ilm.pune@legalmetrology.gov.in",
                role="OFFICER",
                department_code="LEGAL_METROLOGY",
                hashed_password=DEFAULT_PASSWORD_HASH
            ),
            User(
                username="officer_local",
                full_name="Municipal Commissioner / Town Officer G. B. Pawar",
                email="townplanning@pune.gov.in",
                role="OFFICER",
                department_code="LOCAL_BODY",
                hashed_password=DEFAULT_PASSWORD_HASH
            ),
            # 3. MAITRI Nodal Admin
            User(
                username="admin_maitri",
                full_name="Smt. Rohini Deshmukh (MAITRI Nodal Officer)",
                email="nodal.admin@maitri.gov.in",
                role="ADMIN",
                hashed_password=DEFAULT_PASSWORD_HASH
            ),
        ]

        for u in users:
            session.add(u)
        session.commit()

        applicant_user = session.exec(select(User).where(User.username == "applicant")).first()

        print("Seeding demo enterprises...")
        # Enterprise 1: Sahyadri Precision Components (Standard scrutiny)
        ent1_risk = compute_risk_profile({
            "sector": "engineering", "investment_cr": 18.0, "hazardous": False,
            "effluent": False, "boiler": False, "storage_flammables": False, "is_midc": True
        })
        ent1 = EnterpriseProfile(
            user_id=applicant_user.id,
            name="Sahyadri Precision Components Pvt. Ltd.",
            constitution_type="Private Limited",
            pan="AABCS1234F",
            udyam_no="UDYAM-MH-12-0012345",
            registered_address="Plot No. C-44, MIDC Chakan Phase II, Pune - 410501",
            pin_code="410501",
            sector="engineering",
            activity_description="Precision automobile ancillary components, CNC gear blanks and transmission parts manufacturing.",
            stage="new",
            investment_cr=18.0,
            employees=120,
            power_kw=400.0,
            water_kld=40.0,
            district="Pune",
            is_midc=True,
            midc_area_name="Chakan Phase II",
            land_type="Industrial Lease",
            hazardous=False,
            effluent=False,
            boiler=False,
            explosives=False,
            storage_flammables=False,
            export_activity=True,
            risk_score=ent1_risk["risk_score"],
            risk_category=ent1_risk["risk_category"],
            pan_verified=True,
            udyam_verified=True,
            land_verified=True,
            address_verified=True
        )

        # Enterprise 2: Konkan Fresh Foods LLP (Fast Track)
        ent2_risk = compute_risk_profile({
            "sector": "food processing", "investment_cr": 3.5, "hazardous": False,
            "effluent": False, "boiler": False, "storage_flammables": False, "is_midc": True
        })
        ent2 = EnterpriseProfile(
            user_id=applicant_user.id,
            name="Konkan Fresh Foods LLP",
            constitution_type="LLP",
            pan="AAFCK9876G",
            udyam_no="UDYAM-MH-18-0056789",
            registered_address="Plot B-12, Mirjole Industrial Area, Ratnagiri - 415612",
            pin_code="415612",
            sector="food processing",
            activity_description="Alphonso mango pulp canning, aseptic packaging and fruit beverage processing.",
            stage="expansion",
            investment_cr=3.5,
            employees=35,
            power_kw=80.0,
            water_kld=15.0,
            district="Ratnagiri",
            is_midc=True,
            midc_area_name="Mirjole Industrial Area",
            land_type="Industrial Lease",
            hazardous=False,
            effluent=False,
            boiler=False,
            explosives=False,
            storage_flammables=False,
            export_activity=False,
            risk_score=ent2_risk["risk_score"],
            risk_category=ent2_risk["risk_category"],
            pan_verified=True,
            udyam_verified=True,
            land_verified=True,
            address_verified=True
        )

        # Enterprise 3: Vidarbha Agro Chemicals Pvt. Ltd. (Detailed Scrutiny)
        ent3_risk = compute_risk_profile({
            "sector": "chemicals", "investment_cr": 60.0, "hazardous": True,
            "effluent": True, "boiler": True, "storage_flammables": True, "is_midc": True
        })
        ent3 = EnterpriseProfile(
            user_id=applicant_user.id,
            name="Vidarbha Agro Chemicals Pvt. Ltd.",
            constitution_type="Private Limited",
            pan="AABCV5544H",
            udyam_no="UDYAM-MH-20-0099881",
            registered_address="Plot D-8, Butibori Industrial Zone, Nagpur - 441122",
            pin_code="441122",
            sector="chemicals",
            activity_description="Agrochemical formulations, pesticide technical synthesis and bulk fertilizer additives.",
            stage="new",
            investment_cr=60.0,
            employees=240,
            power_kw=1200.0,
            water_kld=250.0,
            district="Nagpur",
            is_midc=True,
            midc_area_name="Butibori MIDC",
            land_type="Industrial Lease",
            hazardous=True,
            effluent=True,
            boiler=True,
            explosives=False,
            storage_flammables=True,
            export_activity=True,
            risk_score=ent3_risk["risk_score"],
            risk_category=ent3_risk["risk_category"],
            pan_verified=True,
            udyam_verified=False,
            land_verified=True,
            address_verified=False
        )

        session.add(ent1)
        session.add(ent2)
        session.add(ent3)
        session.commit()
        session.refresh(ent1)
        session.refresh(ent2)
        session.refresh(ent3)

        print("Seeding 12 multi-department applications...")
        now = datetime.now(timezone.utc)

        seed_apps = [
            # App 1: Sahyadri - Consent to Establish (Under Scrutiny)
            Application(
                ref_no="MH-UR-2026-000101",
                enterprise_id=ent1.id,
                approval_id="MPCB_CTE",
                approval_name="Consent to Establish (CTE)",
                department_code="MPCB",
                issuing_authority="Maharashtra Pollution Control Board (MPCB)",
                status="Under Scrutiny",
                risk_level=ent1.risk_category,
                risk_score=ent1.risk_score,
                sla_total_days=45,
                submitted_at=now - timedelta(days=12),
                sla_due_date=now - timedelta(days=12) + timedelta(days=45),
                departmental_remarks="Technical scrutiny of effluent handling schematics in progress by Pune Regional Sub-Office."
            ),
            # App 2: Sahyadri - Provisional Fire NOC (Query Raised, SLA Clock Paused)
            Application(
                ref_no="MH-UR-2026-000102",
                enterprise_id=ent1.id,
                approval_id="FIRE_CLEARANCE",
                approval_name="Provisional Fire Safety Clearance (Fire NOC)",
                department_code="FIRE",
                issuing_authority="Maharashtra Fire Services / MIDC Fire Brigade",
                status="Query Raised",
                risk_level=ent1.risk_category,
                risk_score=ent1.risk_score,
                sla_total_days=30,
                submitted_at=now - timedelta(days=18),
                sla_due_date=now - timedelta(days=18) + timedelta(days=30),
                clock_paused=True,
                paused_at=now - timedelta(days=2),
                total_paused_seconds=0,
                departmental_remarks="Query raised regarding underground static fire reservoir capacity."
            ),
            # App 3: Sahyadri - Building Permit (Approved with Certificate)
            Application(
                ref_no="MH-UR-2026-000103",
                enterprise_id=ent1.id,
                approval_id="BUILDING_PERMIT",
                approval_name="Industrial Building Plan Sanction",
                department_code="MIDC",
                issuing_authority="MIDC Special Planning Authority",
                status="Approved",
                risk_level=ent1.risk_category,
                risk_score=ent1.risk_score,
                sla_total_days=30,
                submitted_at=now - timedelta(days=28),
                sla_due_date=now - timedelta(days=28) + timedelta(days=30),
                approved_at=now - timedelta(days=3),
                certificate_id="MIDC/BLD/2026/08821",
                certificate_url="/api/applications/MH-UR-2026-000103/certificate",
                qr_code_data="UDYOGRATH-VERIFY:MH-UR-2026-000103:APPROVED:MIDC",
                departmental_remarks="Architectural drawing and structural load calculations approved in full."
            ),
            # App 4: Sahyadri - Power Connection (Inspection Scheduled)
            Application(
                ref_no="MH-UR-2026-000104",
                enterprise_id=ent1.id,
                approval_id="MSEDCL_POWER",
                approval_name="Industrial High Tension / Low Tension Electricity Connection",
                department_code="MSEDCL",
                issuing_authority="Maharashtra State Electricity Distribution Co. Ltd.",
                status="Inspection Scheduled",
                risk_level=ent1.risk_category,
                risk_score=ent1.risk_score,
                sla_total_days=21,
                submitted_at=now - timedelta(days=8),
                sla_due_date=now - timedelta(days=8) + timedelta(days=21),
                departmental_remarks="Site inspection coordinated with Common Joint Inspection schedule."
            ),
            # App 5: Sahyadri - Factory Plan (Submitted)
            Application(
                ref_no="MH-UR-2026-000105",
                enterprise_id=ent1.id,
                approval_id="FACTORY_PLAN",
                approval_name="Factory Plan Approval",
                department_code="DISH",
                issuing_authority="Directorate of Industrial Safety and Health (DISH)",
                status="Submitted",
                risk_level=ent1.risk_category,
                risk_score=ent1.risk_score,
                sla_total_days=30,
                submitted_at=now - timedelta(days=2),
                sla_due_date=now - timedelta(days=2) + timedelta(days=30),
                departmental_remarks="Awaiting assignment to designated factory inspector."
            ),
            # App 6: Sahyadri - Water Supply (Approved)
            Application(
                ref_no="MH-UR-2026-000106",
                enterprise_id=ent1.id,
                approval_id="MIDC_WATER",
                approval_name="Industrial Water Supply Connection",
                department_code="MIDC",
                issuing_authority="MIDC Water Works Pune",
                status="Approved",
                risk_level=ent1.risk_category,
                risk_score=ent1.risk_score,
                sla_total_days=15,
                submitted_at=now - timedelta(days=20),
                sla_due_date=now - timedelta(days=20) + timedelta(days=15),
                approved_at=now - timedelta(days=6),
                certificate_id="MIDC/WTR/2026/04419",
                certificate_url="/api/applications/MH-UR-2026-000106/certificate",
                qr_code_data="UDYOGRATH-VERIFY:MH-UR-2026-000106:APPROVED:WATER",
                departmental_remarks="40 KLD water tapping sanctioned from Chakan main feeder."
            ),

            # App 7: Konkan Fresh Foods - Food Safety Licence (Fast Track Approved)
            Application(
                ref_no="MH-UR-2026-000201",
                enterprise_id=ent2.id,
                approval_id="FOOD_SAFETY_LIC",
                approval_name="State Food Safety Manufacturing Licence",
                department_code="FDA",
                issuing_authority="Food and Drug Administration (FDA) Maharashtra",
                status="Approved",
                risk_level="Fast Track",
                risk_score=ent2.risk_score,
                sla_total_days=15,
                submitted_at=now - timedelta(days=10),
                sla_due_date=now - timedelta(days=10) + timedelta(days=15),
                approved_at=now - timedelta(days=1),
                certificate_id="FDA/FSSAI/MH/2026/0091",
                certificate_url="/api/applications/MH-UR-2026-000201/certificate",
                qr_code_data="UDYOGRATH-VERIFY:MH-UR-2026-000201:APPROVED:FSSAI",
                departmental_remarks="Fast-track self-certification cleared under low-hazard food processing protocol."
            ),
            # App 8: Konkan Fresh Foods - Legal Metrology (Under Scrutiny)
            Application(
                ref_no="MH-UR-2026-000202",
                enterprise_id=ent2.id,
                approval_id="LEGAL_METROLOGY",
                approval_name="Packaged Commodities Manufacturer Registration",
                department_code="LEGAL_METROLOGY",
                issuing_authority="Department of Legal Metrology, Maharashtra",
                status="Under Scrutiny",
                risk_level="Fast Track",
                risk_score=ent2.risk_score,
                sla_total_days=7,
                submitted_at=now - timedelta(days=3),
                sla_due_date=now - timedelta(days=3) + timedelta(days=7),
                departmental_remarks="Specimen pouch and can label dimensions verified."
            ),

            # App 9: Vidarbha Agro Chemicals - Prior Environmental Clearance (Detailed Scrutiny, Under Scrutiny)
            Application(
                ref_no="MH-UR-2026-000301",
                enterprise_id=ent3.id,
                approval_id="ENV_CLEARANCE",
                approval_name="Prior Environmental Clearance (EC)",
                department_code="ENVIRONMENT",
                issuing_authority="State Environment Impact Assessment Authority (SEIAA)",
                status="Under Scrutiny",
                risk_level="Detailed Scrutiny",
                risk_score=ent3.risk_score,
                sla_total_days=90,
                submitted_at=now - timedelta(days=40),
                sla_due_date=now - timedelta(days=40) + timedelta(days=90),
                departmental_remarks="SEAC Category 5(b) technical appraisal scheduled."
            ),
            # App 10: Vidarbha Agro Chemicals - Hazardous Waste Authorisation (Under Scrutiny)
            Application(
                ref_no="MH-UR-2026-000302",
                enterprise_id=ent3.id,
                approval_id="MPCB_HAZ_WASTE",
                approval_name="Hazardous Waste Management Authorisation",
                department_code="MPCB",
                issuing_authority="Maharashtra Pollution Control Board (MPCB)",
                status="Under Scrutiny",
                risk_level="Detailed Scrutiny",
                risk_score=ent3.risk_score,
                sla_total_days=30,
                submitted_at=now - timedelta(days=22),
                sla_due_date=now - timedelta(days=22) + timedelta(days=30),
                departmental_remarks="Common TSDF Butibori membership contract verified."
            ),

            # App 11: DELAY DEMO 1 - Contract Labour Licence (BREACHED / OVERDUE for Escalation Demo)
            Application(
                ref_no="MH-UR-2026-000107",
                enterprise_id=ent1.id,
                approval_id="CONTRACT_LABOUR",
                approval_name="Principal Employer Registration (Contract Labour)",
                department_code="LABOUR",
                issuing_authority="Office of the Commissioner of Labour",
                status="Under Scrutiny",
                risk_level="Standard",
                risk_score=40.0,
                sla_total_days=15,
                # Submitted 20 days ago, SLA was 15 days -> Breached by 5 days!
                submitted_at=now - timedelta(days=20),
                sla_due_date=now - timedelta(days=5),
                departmental_remarks="Statutory timeline exceeded. Eligible for automated Level 1 departmental escalation."
            ),

            # App 12: DELAY DEMO 2 - Tree Felling Permission (CRITICAL AT RISK - 1 Day Remaining)
            Application(
                ref_no="MH-UR-2026-000108",
                enterprise_id=ent1.id,
                approval_id="TREE_TRANSIT",
                approval_name="Tree Felling / Transit Permission",
                department_code="LOCAL_BODY",
                issuing_authority="Tree Authority, Local Municipal Body",
                status="Under Scrutiny",
                risk_level="Standard",
                risk_score=40.0,
                sla_total_days=21,
                # Submitted 20 days ago, SLA was 21 days -> Only 1 day remaining (<25% risk alert)!
                submitted_at=now - timedelta(days=20),
                sla_due_date=now + timedelta(days=1),
                departmental_remarks="At risk of statutory SLA breach within 24 hours."
            )
        ]

        for a in seed_apps:
            session.add(a)
        session.commit()

        # Seed Query Ticket for App 2 (Fire Clearance)
        app2 = session.exec(select(Application).where(Application.ref_no == "MH-UR-2026-000102")).first()
        fire_officer = session.exec(select(User).where(User.username == "officer_fire")).first()
        query1 = QueryTicket(
            application_id=app2.id,
            officer_id=fire_officer.id,
            officer_name=fire_officer.full_name,
            department_code="FIRE",
            category="Technical Clarification",
            query_text="Clarify underground static water reservoir dimension. Architectural drawing indicates 100,000 litres capacity whereas standard norms for 400 kW industrial load mandate minimum 150,000 litres dedicated storage.",
            raised_at=now - timedelta(days=2),
            is_resolved=False
        )
        session.add(query1)

        # Seed Application Events for App 2
        evt1 = ApplicationEvent(
            application_id=app2.id,
            event_type="SUBMITTED",
            title="Application Dispatched",
            description="Combined Application Form submitted and statutory tracking initiated.",
            actor_name="Kunal Patil",
            actor_role="APPLICANT",
            created_at=now - timedelta(days=18)
        )
        evt2 = ApplicationEvent(
            application_id=app2.id,
            event_type="QUERY_RAISED",
            title="Statutory Query Raised by Fire Officer",
            description="Query raised regarding water reservoir capacity. Statutory SLA clock automatically paused.",
            actor_name=fire_officer.full_name,
            actor_role="OFFICER",
            created_at=now - timedelta(days=2)
        )
        evt3 = ApplicationEvent(
            application_id=app2.id,
            event_type="CLOCK_PAUSED",
            title="SLA Clock Paused",
            description="Clock paused in accordance with Maharashtra Industry Facilitation Act Section 8 pending applicant clarification.",
            actor_name="System Orchestrator",
            actor_role="SYSTEM",
            created_at=now - timedelta(days=2)
        )
        session.add(evt1)
        session.add(evt2)
        session.add(evt3)

        # Seed Common Joint Inspection for Sahyadri (Enterprise 1)
        joint_insp = JointInspection(
            enterprise_id=ent1.id,
            lead_officer_name="Dr. Sanjay Sawant (Lead Scrutiny Officer, MPCB)",
            lead_department="MPCB",
            status="Proposed",
            scheduled_date=(now + timedelta(days=4)).strftime("%Y-%m-%d"),
            time_slot="10:30 AM - 01:30 PM",
            location_address="Plot No. C-44, MIDC Chakan Phase II, Pune - 410501",
            departments_json=json.dumps(["MPCB", "FIRE", "DISH", "MSEDCL"]),
            department_attendance_json=json.dumps({"MPCB": "Confirmed", "FIRE": "Confirmed", "DISH": "Pending", "MSEDCL": "Confirmed"}),
            department_findings_json=json.dumps({"MPCB": "Pending physical visit", "FIRE": "Pending site inspection"}),
            visits_saved=3,
            applicant_confirmation="Confirmed",
            applicant_remarks="Facility available for joint inspection. Electrical sub-station and fire hydrant lines ready for demonstration."
        )
        session.add(joint_insp)

        # Seed Grievance for App 11 (Breached Contract Labour Application)
        app11 = session.exec(select(Application).where(Application.ref_no == "MH-UR-2026-000107")).first()
        grievance1 = Grievance(
            application_id=app11.id,
            enterprise_id=ent1.id,
            grievance_ref="GR-2026-00042",
            escalation_level=1,
            status="Active",
            subject="Statutory SLA Breach - Delay in Contract Labour Registration",
            description="Statutory timeline of 15 days elapsed without issuance of registration or query. Seeking Level 1 departmental intervention.",
            level_1_notified_at=now - timedelta(days=2),
            officer_response="Assigned for urgent priority scrutiny by District Labour Officer."
        )
        session.add(grievance1)

        # Seed Scheme Applications for Incentives
        scheme_app1 = SchemeApplication(
            enterprise_id=ent1.id,
            scheme_code="PSI_CAPITAL_SUBSIDY",
            scheme_name="Package Scheme of Incentives (PSI) - Industrial Capital Subsidy",
            estimated_benefit_amount="₹6.30 Crore (Illustrative)",
            status="Submitted",
            application_date=now - timedelta(days=5),
            disbursement_notes="CAF acknowledgment verified; awaiting final CTO issuance."
        )
        session.add(scheme_app1)

        # Seed Initial In-App & Simulated Notifications
        notif1 = Notification(
            recipient_email="kunal.patil@sahyadri.in",
            recipient_phone="+91-98220-11223",
            recipient_name="Kunal Patil",
            channel="IN_APP",
            title="Fire Department Clarification Required",
            message="Query raised on Fire NOC application MH-UR-2026-000102. Statutory SLA clock is paused.",
            is_read=False,
            timestamp=now - timedelta(days=2)
        )
        notif2 = Notification(
            recipient_email="kunal.patil@sahyadri.in",
            recipient_phone="+91-98220-11223",
            recipient_name="Kunal Patil",
            channel="SMS",
            title="Joint Inspection Scheduled",
            message="[UDYOGRATH] Consolidated joint inspection for 4 departments scheduled on " + (now + timedelta(days=4)).strftime("%d-%b-%Y") + " at 10:30 AM.",
            is_read=True,
            timestamp=now - timedelta(days=1)
        )
        notif3 = Notification(
            recipient_email="nodal.admin@maitri.gov.in",
            recipient_phone="+91-98200-99881",
            recipient_name="Rohini Deshmukh",
            channel="EMAIL",
            title="SLA Breach Alert: Labour Department",
            message="Application MH-UR-2026-000107 has exceeded the statutory 15-day timeline. Level 1 escalation initiated.",
            is_read=False,
            timestamp=now - timedelta(days=2)
        )
        session.add(notif1)
        session.add(notif2)
        session.add(notif3)
        session.commit()

        # Seed Cryptographic Audit Trail
        print("Seeding initial SHA-256 tamper-evident audit records...")
        append_audit_entry(
            session=session,
            actor="SYSTEM_INIT",
            role="SYSTEM",
            action="GENESIS_SYSTEM_INITIALIZATION",
            resource_type="System",
            resource_id="SYS-001",
            details="UDYOGRATH SIH26130 platform initialized with versioned rulebook v1.0.0 and verified regulatory corpus.",
            timestamp=now - timedelta(days=30)
        )
        append_audit_entry(
            session=session,
            actor="kunal.patil@sahyadri.in",
            role="APPLICANT",
            action="PROFILE_CREATED",
            resource_type="EnterpriseProfile",
            resource_id=str(ent1.id),
            details="Registered Sahyadri Precision Components Pvt. Ltd. (CIN U29200PN2021PTC199882) in Verified Data Vault.",
            timestamp=now - timedelta(days=29)
        )
        append_audit_entry(
            session=session,
            actor="kunal.patil@sahyadri.in",
            role="APPLICANT",
            action="MULTI_DISPATCH_SUBMITTED",
            resource_type="Application",
            resource_id="MH-UR-2026-000101",
            details="Dispatched parallel applications across MPCB, FIRE, MIDC, DISH, MSEDCL.",
            timestamp=now - timedelta(days=18)
        )
        append_audit_entry(
            session=session,
            actor="cfo.pune@mahafireservice.gov.in",
            role="OFFICER",
            action="QUERY_RAISED",
            resource_type="QueryTicket",
            resource_id=str(query1.id),
            details="Raised technical query on static reservoir capacity; paused statutory clock.",
            timestamp=now - timedelta(days=2)
        )

        print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database(force=True)
