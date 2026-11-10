import { productName } from "@/constants/site";

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

export const faqData: FAQItem[] = [
    {
        id: "telemedicine-setup",
        question: "How do virtual consultations and patient session notes work in Telemedicine?",
        answer:
            `With ${productName}'s Telemedicine & Virtual suite, doctors can host secure video consultations, configure telehealth setups, and record patient session notes that sync seamlessly directly back into the central Electronic Medical Record (EMR).`,
    },
    {
        id: "ai-insights",
        question: "What capabilities does the AI Health Insights module provide for clinicians?",
        answer:
            `Our AI-powered tools act as a clinical assistant by offering AI Diagnosis Helpers, instant Medical Record Summaries, Health Risk Predictors, and automated Medication Safety Checks to catch adverse drug interactions early.`,
    },
    {
        id: "wards-bed-management",
        question: "How does Ward & Bed Management track inpatient admissions and transfers?",
        answer:
            `The Inpatient & Wards module gives your nurses and front desk a real-time Bed Board. It handles admission requests, tracks ward bed occupancy, manages admissions & transfers, updates nursing care plans, and generates instant discharge summaries.`,
    },
    {
        id: "labs-radiology",
        question: "How are Laboratory, Pathology, and Radiology results verified and tracked?",
        answer:
            "Orders placed in Consultation & SOAP flow directly into Laboratory & Pathology or Radiology & PACS queues. Staff can track specimens, verify results, manage the pathology catalog, and attach X-Ray or imaging findings straight to the patient chart.",
    },
    {
        id: "pharmacy-inventory",
        question: "How does the Pharmacy & Dispensary manage e-prescriptions and drug stock?",
        answer:
            `The Pharmacy & Dispensary module features an e-prescriptions queue for rapid dispensing. It includes live Drug Inventory & Stock tracking with batch expiry monitoring, low stock alerts, and automated purchase orders to eliminate stockouts.`,
    },
    {
        id: "blood-bank",
        question: "How does the Blood Bank module manage donations, crossmatching, and transfusions?",
        answer:
            "The Blood Bank module covers the complete transfusion lifecycle—from donor registration, screening, and collection drives to grouping, TTI testing, component processing, inventory storage, crossmatching, and post-transfusion reaction logs.",
    },
    {
        id: "maternal-child",
        question: "What features are available for Maternal & Child Health and Paediatrics?",
        answer:
            "Our Maternal & Child Health suite includes Antenatal Care (ANC) visit follow-ups, a Labour Ward Board with partograph tracking, delivery and Caesarean section logs, postnatal care, newborn registries, immunisation schedules, and pediatric growth monitoring.",
    },
    {
        id: "emergency-er",
        question: "How does the Emergency & ER module handle triage and mass casualty events?",
        answer:
            "The Emergency & ER module features a real-time Triage Board, ambulance dispatch logs, patient trackers, resuscitation bay order sets, trauma cases management, and a dedicated Mass Casualty Mode to handle critical patient influx smoothly.",
    },
];