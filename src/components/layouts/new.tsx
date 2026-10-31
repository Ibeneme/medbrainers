const NAV_ITEMS: NavItem[] = [
    // ─── Overview ───────────────────────────────────────────
    {
      category: "Overview",
      label: "Dashboard",
      href: "/dashboard/dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    {
      label: "Telemedicine & Virtual",
      icon: <Video size={16} />,
      children: [
        {
          label: "Virtual Consultations",
          href: "/dashboard/telemedicine",
          children: [
            {
              label: "Live Video Consultation Lobby",
              href: "/dashboard/telemedicine/lobby",
            },
            {
              label: "WebRTC Peer Connection & Audio/Video Logs",
              href: "/dashboard/telemedicine/webrtc",
            },
            {
              label: "Virtual Waiting Room Queue",
              href: "/dashboard/telemedicine/waiting-room",
            },
          ],
        },
        {
          label: "Remote Patient Monitoring",
          href: "/dashboard/telemedicine/rpm",
          children: [
            {
              label: "Wearable Vitals Continuous Stream",
              href: "/dashboard/telemedicine/rpm/stream",
            },
            {
              label: "Automated Threshold Alert Triggers",
              href: "/dashboard/telemedicine/rpm/alerts",
            },
          ],
        },
      ],
    },
    {
      label: "AI Clinical Analysis",
      icon: <Sparkles size={16} />,
      children: [
        {
          label: "AI Diagnostic Support",
          href: "/dashboard/ai/diagnostics",
          children: [
            {
              label: "Differential Diagnosis Assistant",
              href: "/dashboard/ai/diagnostics/differential",
            },
            {
              label: "Medical Imaging AI Scan Analysis",
              href: "/dashboard/ai/diagnostics/imaging",
            },
          ],
        },
        {
          label: "Automated Chart Summary",
          href: "/dashboard/ai/summary",
          children: [
            {
              label: "LLM Encounter Chart Synthesis",
              href: "/dashboard/ai/summary/synthesis",
            },
            {
              label: "Historical Chart Timeline Extraction",
              href: "/dashboard/ai/summary/timeline",
            },
          ],
        },
        {
          label: "Predictive Risk Scoring",
          href: "/dashboard/ai/risk-scoring",
          children: [
            {
              label: "Sepsis & Deterioration Early Warning",
              href: "/dashboard/ai/risk-scoring/sepsis",
            },
            {
              label: "Readmission Probability Analytics",
              href: "/dashboard/ai/risk-scoring/readmission",
            },
          ],
        },
        {
          label: "Drug Interaction Checker",
          href: "/dashboard/ai/interactions",
          children: [
            {
              label: "Polypharmacy Contraindication Engine",
              href: "/dashboard/ai/interactions/polypharmacy",
            },
            {
              label: "Pharmacogenomic Allergy Alerts",
              href: "/dashboard/ai/interactions/allergies",
            },
          ],
        },
      ],
    },
  
    // ─── Clinical Care ─────────────────────────────────────
    {
      category: "Clinical Care",
      label: "Patients Management",
      icon: <Users size={16} />,
      children: [
        {
          label: "Patient Directory & MPI",
          href: "/dashboard/patients",
          children: [
            {
              label: "Master Patient Index Search",
              href: "/dashboard/patients/mpi",
            },
            {
              label: "Record Deduplication & Merge Tool",
              href: "/dashboard/patients/deduplication",
            },
          ],
        },
        {
          label: "Register Patient & Intake",
          href: "/dashboard/patients/register",
          children: [
            {
              label: "New Patient Demographic Form",
              href: "/dashboard/patients/register/form",
            },
            {
              label: "Insurance & Guarantor Verification",
              href: "/dashboard/patients/register/insurance",
            },
          ],
        },
        {
          label: "Encounter Timeline & History",
          href: "/dashboard/patients/timeline",
          children: [
            {
              label: "Chronological Visit Aggregator",
              href: "/dashboard/patients/timeline/visits",
            },
            {
              label: "Cross-Departmental Notes History",
              href: "/dashboard/patients/timeline/notes",
            },
          ],
        },
      ],
    },
    {
      label: "Inpatient & Wards",
      icon: <BedDouble size={16} />,
      children: [
        {
          label: "Ward & Bed Management",
          href: "/dashboard/wards",
          children: [
            {
              label: "Interactive Ward Census & Bed Map",
              href: "/dashboard/wards/map",
            },
            {
              label: "Bed Occupancy & Turnover Analytics",
              href: "/dashboard/wards/occupancy",
            },
          ],
        },
        {
          label: "Admissions & Transfers",
          href: "/dashboard/wards/admissions",
          children: [
            {
              label: "Inpatient Admission Orders",
              href: "/dashboard/wards/admissions/orders",
            },
            {
              label: "Inter-Ward & ICU Transfer Logs",
              href: "/dashboard/wards/admissions/transfers",
            },
          ],
        },
        {
          label: "Nursing Care Plans",
          href: "/dashboard/wards/nursing",
          children: [
            {
              label: "Standardized Nursing Interventions",
              href: "/dashboard/wards/nursing/interventions",
            },
            {
              label: "Round Timers & Shift Checklists",
              href: "/dashboard/wards/nursing/rounds",
            },
          ],
        },
        {
          label: "Discharge Summaries",
          href: "/dashboard/wards/discharges",
          children: [
            {
              label: "Discharge Checklist & Med Reconciliation",
              href: "/dashboard/wards/discharges/reconciliation",
            },
            {
              label: "Signed Patient Discharge Letters",
              href: "/dashboard/wards/discharges/letters",
            },
          ],
        },
      ],
    },
    {
      label: "Appointments & Queue",
      icon: <CalendarCheck size={16} />,
      children: [
        {
          label: "Master Calendar",
          href: "/dashboard/appointments",
          children: [
            {
              label: "Multi-Provider Schedule Grid",
              href: "/dashboard/appointments/grid",
            },
            {
              label: "Clinic Room Booking Manager",
              href: "/dashboard/appointments/rooms",
            },
          ],
        },
        {
          label: "Book Appointment",
          href: "/dashboard/appointments/book",
          children: [
            {
              label: "Outpatient Slot Reservation",
              href: "/dashboard/appointments/book/slot",
            },
            {
              label: "Recurring Appointment Series",
              href: "/dashboard/appointments/book/recurring",
            },
          ],
        },
        {
          label: "Patient Check-in / Queue",
          href: "/dashboard/appointments/queue",
          children: [
            {
              label: "Digital Kiosk Check-in Feed",
              href: "/dashboard/appointments/queue/kiosk",
            },
            {
              label: "Waiting Room Live Display Board",
              href: "/dashboard/appointments/queue/board",
            },
          ],
        },
        {
          label: "Triage Desk",
          href: "/dashboard/appointments/triage",
          children: [
            {
              label: "Walk-in Acuity Scoring",
              href: "/dashboard/appointments/triage/scoring",
            },
            {
              label: "Priority Escalation Queue",
              href: "/dashboard/appointments/triage/escalation",
            },
          ],
        },
      ],
    },
    {
      label: "Consultation & SOAP",
      icon: <Stethoscope size={16} />,
      children: [
        {
          label: "Active Consultations",
          href: "/dashboard/consultations",
          children: [
            {
              label: "In-Progress Encounter Room",
              href: "/dashboard/consultations/active",
            },
            {
              label: "Structured SOAP Note Workspace",
              href: "/dashboard/consultations/soap",
            },
          ],
        },
        {
          label: "Vitals & Biometrics",
          href: "/dashboard/consultations/vitals",
          children: [
            {
              label: "Manual Vitals Entry (BP, HR, Temp, SpO2)",
              href: "/dashboard/consultations/vitals/entry",
            },
            {
              label: "Biometric Trend Graphs",
              href: "/dashboard/consultations/vitals/trends",
            },
          ],
        },
        {
          label: "Diagnoses & ICD-11",
          href: "/dashboard/clinical/diagnoses",
          children: [
            {
              label: "ICD-11 Code Search & Selector",
              href: "/dashboard/clinical/diagnoses/icd11",
            },
            {
              label: "Primary & Secondary Diagnosis Mapping",
              href: "/dashboard/clinical/diagnoses/mapping",
            },
          ],
        },
      ],
    },
  
    // ─── Diagnostics & Pharmacy ────────────────────────────
    {
      category: "Diagnostics & Pharmacy",
      label: "Laboratory & Pathology",
      icon: <FlaskConical size={16} />,
      children: [
        { label: "Laboratory", href: "/dashboard/labs" },
        {
          label: "Lab Requests",
          href: "/dashboard/labs/requests",
          children: [
            {
              label: "Modality Specific Test Entry",
              href: "/dashboard/labs/requests/entry",
            },
            {
              label: "Clinical Indication & ICD-10 Coding",
              href: "/dashboard/labs/requests/icd10",
            },
            {
              label: "Priority Triage (Routine, Urgent, STAT)",
              href: "/dashboard/labs/requests/triage",
            },
            {
              label: "Fasting & Patient Prep Logs",
              href: "/dashboard/labs/requests/prep",
            },
            {
              label: "Referring Clinician Portal",
              href: "/dashboard/labs/requests/physician-portal",
            },
          ],
        },
        {
          label: "Specimen Tracking",
          href: "/dashboard/labs/specimens",
          children: [
            {
              label: "Barcode Accessioning & Generation",
              href: "/dashboard/labs/specimens/accession",
            },
            {
              label: "Phlebotomy & Collection Tracking",
              href: "/dashboard/labs/specimens/collection",
            },
            {
              label: "Chain of Custody & Transport Log",
              href: "/dashboard/labs/specimens/chain-custody",
            },
            {
              label: "Sample Rejection & Quality Control",
              href: "/dashboard/labs/specimens/qc",
            },
          ],
        },
        {
          label: "Results Verification",
          href: "/dashboard/labs/results",
          children: [
            {
              label: "Auto-Verification Rules & Flags",
              href: "/dashboard/labs/results/auto-verification",
            },
            {
              label: "Pathology Structured Templates",
              href: "/dashboard/labs/results/pathology-templates",
            },
            {
              label: "Delta Checks & Trends",
              href: "/dashboard/labs/results/trends",
            },
            {
              label: "Report Workflow & Signoff",
              href: "/dashboard/labs/results/workflow",
            },
          ],
        },
        { label: "Pathology Catalog", href: "/dashboard/labs/catalog" },
      ],
    },
    {
      label: "Radiology & PACS",
      icon: <FileScan size={16} />,
      children: [
        {
          label: "X-Ray / MRI Requests",
          href: "/dashboard/radiology/requests",
          children: [
            {
              label: "Modality Specific Order Entry",
              href: "/dashboard/radiology/requests/order-entry",
              children: [
                {
                  label: "X-Ray Orders",
                  href: "/dashboard/radiology/requests/xray",
                },
                {
                  label: "MRI Orders",
                  href: "/dashboard/radiology/requests/mri",
                },
                { label: "CT Orders", href: "/dashboard/radiology/requests/ct" },
                {
                  label: "Ultrasound Orders",
                  href: "/dashboard/radiology/requests/ultrasound",
                },
                {
                  label: "Mammography Orders",
                  href: "/dashboard/radiology/requests/mammography",
                },
              ],
            },
            {
              label: "Clinical Indication & ICD-10",
              href: "/dashboard/radiology/requests/icd10",
            },
            {
              label: "Priority Triage Management",
              href: "/dashboard/radiology/requests/triage",
            },
            {
              label: "Contrast & Allergy Checkpoints",
              href: "/dashboard/radiology/requests/contrast-screening",
            },
            {
              label: "Referring Physician Portal",
              href: "/dashboard/radiology/requests/physician-portal",
            },
            {
              label: "Pre-Auth & Insurance Tracking",
              href: "/dashboard/radiology/requests/insurance",
            },
          ],
        },
        {
          label: "Imaging Worklist",
          href: "/dashboard/radiology/worklist",
          children: [
            {
              label: "Real-Time Modality Status Queues",
              href: "/dashboard/radiology/worklist/status-queues",
            },
            {
              label: "Technologist Task Allocation",
              href: "/dashboard/radiology/worklist/tasks",
            },
            {
              label: "Patient Appointment & Arrival",
              href: "/dashboard/radiology/worklist/scheduling",
            },
            {
              label: "Preparation Instruction Logs",
              href: "/dashboard/radiology/worklist/preparations",
            },
            {
              label: "Automated Accession Generation",
              href: "/dashboard/radiology/worklist/accession",
            },
          ],
        },
        {
          label: "DICOM Viewer & Reports",
          href: "/dashboard/radiology/viewer",
          children: [
            {
              label: "OHIF / Cornerstone Web Viewer",
              href: "/dashboard/radiology/viewer/ohif",
            },
            {
              label: "MPR & 3D Visualization Controls",
              href: "/dashboard/radiology/viewer/mpr-3d",
            },
            {
              label: "Window/Level, Zoom, Pan & Measure",
              href: "/dashboard/radiology/viewer/tools",
            },
            {
              label: "Backblaze B2 Streaming Storage",
              href: "/dashboard/radiology/viewer/backblaze-b2",
            },
            {
              label: "Specialty Structured Templates",
              href: "/dashboard/radiology/viewer/templates",
            },
            {
              label: "Voice-to-Text Dictation",
              href: "/dashboard/radiology/viewer/dictation",
            },
            {
              label: "Signoff & Signature Workflow",
              href: "/dashboard/radiology/viewer/workflow",
            },
          ],
        },
      ],
    },
    {
      label: "Pharmacy & Dispensary",
      icon: <Pill size={16} />,
      children: [
        {
          label: "e-Prescriptions Queue",
          href: "/dashboard/pharmacy/prescriptions",
        },
        {
          label: "Drug Inventory & Stock",
          href: "/dashboard/pharmacy/inventory",
        },
        { label: "Dispensing & Refills", href: "/dashboard/pharmacy/dispense" },
        {
          label: "Controlled Substances Log",
          href: "/dashboard/pharmacy/controlled",
        },
      ],
    },
    {
      label: "Blood Bank",
      icon: <HeartPulse size={16} />,
      children: [
        {
          label: "Inventory & Blood Types Management",
          href: "/dashboard/blood-bank",
          children: [
            {
              label: "ABO & Rhesus Stock Levels",
              href: "/dashboard/blood-bank/inventory/stock",
            },
            {
              label: "Component Preparation (Plasma/Platelets)",
              href: "/dashboard/blood-bank/inventory/components",
            },
            {
              label: "Quarantine & Expiry Audit Logs",
              href: "/dashboard/blood-bank/inventory/audit",
            },
          ],
        },
        {
          label: "Crossmatch & Compatibility Testing",
          href: "/dashboard/blood-bank/crossmatch",
          children: [
            {
              label: "Requisition & Sample Match Queue",
              href: "/dashboard/blood-bank/crossmatch/queue",
            },
            {
              label: "Major & Minor Compatibility Logs",
              href: "/dashboard/blood-bank/crossmatch/results",
            },
            {
              label: "Serological Screening (HIV/Hepatitis)",
              href: "/dashboard/blood-bank/crossmatch/screening",
            },
          ],
        },
        {
          label: "Transfusion Records & Adverse Events",
          href: "/dashboard/blood-bank/transfusions",
          children: [
            {
              label: "Bedside Administration Log",
              href: "/dashboard/blood-bank/transfusions/bedside",
            },
            {
              label: "Vitals & Infusion Monitoring",
              href: "/dashboard/blood-bank/transfusions/vitals",
            },
            {
              label: "Adverse Reaction Incident Report",
              href: "/dashboard/blood-bank/transfusions/adverse",
            },
          ],
        },
      ],
    },
  
    // ─── Specialty Care ────────────────────────────────----
    {
      category: "Specialty Care",
      label: "Maternal & Child Health",
      icon: <Activity size={16} />,
      children: [
        {
          label: "Antenatal / ANC Records",
          href: "/dashboard/maternal/antenatal",
          children: [
            {
              label: "Trimester Risk Stratification",
              href: "/dashboard/maternal/antenatal/risk",
            },
            {
              label: "Maternal Vitals & Fundal Logs",
              href: "/dashboard/maternal/antenatal/vitals",
            },
            {
              label: "Obstetric Ultrasound Archives",
              href: "/dashboard/maternal/antenatal/ultrasound",
            },
          ],
        },
        {
          label: "Labor & Delivery Log (Partograph)",
          href: "/dashboard/maternal/delivery",
          children: [
            {
              label: "Electronic Partograph Monitor",
              href: "/dashboard/maternal/delivery/partograph",
            },
            {
              label: "Newborn APGAR & Resuscitation",
              href: "/dashboard/maternal/delivery/newborn",
            },
            {
              label: "Postpartum Recovery Log",
              href: "/dashboard/maternal/delivery/postpartum",
            },
          ],
        },
        {
          label: "Immunization & Vaccination",
          href: "/dashboard/maternal/immunization",
          children: [
            {
              label: "National Immunization Schedules",
              href: "/dashboard/maternal/immunization/schedule",
            },
            {
              label: "Vaccine Batch & Cold Chain Log",
              href: "/dashboard/maternal/immunization/batch",
            },
            {
              label: "Missed Dose & Reminder Alerts",
              href: "/dashboard/maternal/immunization/alerts",
            },
          ],
        },
        {
          label: "Pediatric Growth Charts",
          href: "/dashboard/maternal/pediatrics",
          children: [
            {
              label: "WHO Growth Percentiles (Height/Weight)",
              href: "/dashboard/maternal/pediatrics/percentiles",
            },
            {
              label: "Head Circumference & BMI Tracker",
              href: "/dashboard/maternal/pediatrics/bmi",
            },
          ],
        },
      ],
    },
    {
      label: "Emergency & ER",
      icon: <Siren size={16} />,
      children: [
        {
          label: "ER Trauma Board (ESI Triage)",
          href: "/dashboard/emergency",
          children: [
            {
              label: "5-Level ESI Triage Queue",
              href: "/dashboard/emergency/triage",
            },
            {
              label: "Trauma Resuscitation Flowsheets",
              href: "/dashboard/emergency/resuscitation",
            },
            {
              label: "Bed Occupancy & Wait Times",
              href: "/dashboard/emergency/occupancy",
            },
          ],
        },
        {
          label: "Ambulance Dispatch & Pre-Hospital",
          href: "/dashboard/emergency/ambulance",
          children: [
            {
              label: "GPS Fleet Tracking & ETA Logs",
              href: "/dashboard/emergency/ambulance/tracking",
            },
            {
              label: "Paramedic Handoff & Vitals Intake",
              href: "/dashboard/emergency/ambulance/handoff",
            },
          ],
        },
        {
          label: "Critical Care Monitor Integration",
          href: "/dashboard/emergency/critical",
          children: [
            {
              label: "Real-Time Telemetry Stream (ECG/SpO2)",
              href: "/dashboard/emergency/critical/telemetry",
            },
            {
              label: "High/Low Alarm Log & Audit",
              href: "/dashboard/emergency/critical/alarms",
            },
          ],
        },
      ],
    },
    {
      label: "Surgical Theater",
      icon: <Scissors size={16} />,
      children: [
        {
          label: "OR Schedule",
          href: "/dashboard/theater/schedule",
          children: [
            {
              label: "Master Operating Room Booking",
              href: "/dashboard/theater/schedule/master",
            },
            {
              label: "Pre-Anesthesia Evaluation Log",
              href: "/dashboard/theater/schedule/anesthesia",
            },
          ],
        },
        {
          label: "Surgical Safety Checklists",
          href: "/dashboard/theater/checklist",
          children: [
            {
              label: "WHO Surgical Safety Sign-In/Out",
              href: "/dashboard/theater/checklist/who",
            },
            {
              label: "Instrument & Sponge Count Verification",
              href: "/dashboard/theater/checklist/counts",
            },
          ],
        },
        {
          label: "Post-Op Recovery",
          href: "/dashboard/theater/recovery",
          children: [
            {
              label: "PACU Aldrete Score Tracking",
              href: "/dashboard/theater/recovery/pacu",
            },
            {
              label: "Surgical Ward Transfer Criteria",
              href: "/dashboard/theater/recovery/transfer",
            },
          ],
        },
      ],
    },
  
    // ─── Administration & Billing ──────────────────────────
    {
      category: "Administration & Billing",
      label: "Billing & HMO Claims",
      icon: <Receipt size={16} />,
      children: [
        { label: "Patient Invoices & POS", href: "/dashboard/billing/invoices" },
        { label: "HMO & Insurance Claims", isComingSoon: true },
        { label: "Pre-authorizations", isComingSoon: true },
        { label: "Service Price Catalog", href: "/dashboard/billing/catalog" },
      ],
    },
    {
      label: "Facilities & Workspaces",
      icon: <Building2 size={16} />,
      children: [
        { label: "Active Facility & Tenants", href: "/dashboard/workspace" },
        {
          label: "Departments & Units",
          href: "/dashboard/workspace/departments",
        },
        {
          label: "Facility Invitations & RBAC",
          href: "/dashboard/workspace/invitations",
        },
        { label: "Create Facility", href: "/dashboard/workspace/create" },
        {
          label: "Create Department",
          href: "/dashboard/workspace/departments/create",
        },
      ],
    },
    {
      label: "Staff & Rosters",
      icon: <UsersRound size={16} />,
      children: [
        { label: "Staff Directory", href: "/dashboard/workspace/teams" },
        { label: "Shift Roster & On-Call", href: "/dashboard/staff/roster" },
      ],
    },
    {
      label: "Tasks & Handover",
      icon: <ListTodo size={16} />,
      children: [
        { label: "All Tasks", href: "/dashboard/tasks" },
        { label: "Assigned to me", href: "/dashboard/tasks/my" },
        { label: "Shift Handover Log", href: "/dashboard/tasks/handover" },
      ],
    },
  
    // ─── Reports & Compliance ──────────────────────────────
    {
      category: "Reports & Compliance",
      label: "Analytics & Clinical Audit",
      href: "/dashboard/reports",
      icon: <CreditCard size={16} />,
    },
    {
      label: "HIPAA & Security Compliance",
      href: "/dashboard/compliance",
      icon: <ShieldCheck size={16} />,
    },
    {
      label: "Audit Logs",
      href: "/dashboard/compliance/audit-logs",
      icon: <ShieldAlert size={16} />,
    },
  
    // ─── Settings ──────────────────────────────────────────
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings size={16} />,
    },
  ];