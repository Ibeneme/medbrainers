import { productName } from "@/constants/site";

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

export const faqData: FAQItem[] = [
    {
        id: "emr-integration",
        question: `How easily can ${productName} replace our current paper or legacy system?`,
        answer:
            `${productName} is built for zero-downtime migration. Our onboarding team helps digitize legacy paper files and bulk-import patient records from existing databases, ensuring your doctors and nurses can start consulting without losing historical data.`,
    },
    {
        id: "hmo-claims",
        question: `Does ${productName} support HMO billing and automated claims?`,
        answer:
            `Yes. ${productName} includes an automated HMO workflow that tracks patient pre-authorizations, compiles treatment tariff codes, and generates clean billing claims to reduce claim rejections and speed up reimbursements.`,
    },
    {
        id: "pharmacy-lab",
        question: "How does stock tracking work across multi-branch pharmacies and labs?",
        answer:
            "Our system links the consultation portal directly with the pharmacy and laboratory wards. Prescriptions and lab requisitions update inventory in real time, preventing drug stockouts and automatically flagging expiring items.",
    },
    {
        id: "data-security",
        question: "Is patient medical data secure and compliant?",
        answer:
            `Security is core to ${productName}. All patient EHR records are encrypted at rest and in transit. We enforce strict role-based access control (RBAC), multi-factor authentication, and full audit logs for HIPAA and local data protection regulations.`,
    },
    {
        id: "staff-training",
        question: "What kind of support and training do you provide for hospital staff?",
        answer:
            "We provide both on-site and remote training tailored for doctors, front-desk administrators, pharmacists, and lab technicians. Plus, our dedicated health support team is available 24/7 to resolve any issues immediately.",
    },
    {
        id: "offline-access",
        question: "What happens if our hospital internet connection goes down?",
        answer:
            `${productName} features local sync capabilities and offline caching so clinical consultations, triage notes, and prescriptions continue uninterrupted even during internet downtime. Data automatically syncs once connection restores.`,
    },
];