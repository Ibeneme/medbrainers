"use client";

import Cells from "../home/dna/cells";
import FeaturePage, { type FeatureItem } from "./FeaturePage";

const items: FeatureItem[] = [
  {
    id: "security",
    title: "Security & Compliance",
    tagline: "Enterprise protection out of the box",
    intro:
      "Patient data deserves uncompromising security. Encrypted at rest and in transit, with granular role-based permissions and complete audit trails.",
    features: [
      "End-to-end encryption (AES-256)",
      "Role-based access control & permissions",
      "Immutable audit logs for compliance",
      "HIPAA, GDPR & local data standards ready",
    ],
    art: "security",
  },
  {
    id: "implementation",
    title: "Implementation & Training",
    tagline: "Up and running without the disruption",
    intro:
      "We work alongside your team to configure workflows, set up staff accounts and ensure everyone is confident before day one.",
    features: [
      "Dedicated onboarding specialist",
      "Workflow mapping for your specific practice",
      "Interactive staff training sessions",
      "Go-live support and monitoring",
    ],
    art: "training",
  },
  {
    id: "support",
    title: "Support You Can Reach",
    tagline: "Real help from healthcare system experts",
    intro:
      "When you need assistance, you reach clinical and technical engineers who understand healthcare workflows, not a scripted bot.",
    features: [
      "Priority in-app and phone support",
      "Average response time under 15 minutes",
      "Continuous system updates and guidance",
      "Dedicated account manager for hospitals",
    ],
    art: "support",
  },
  {
    id: "migration",
    title: "Data Migration",
    tagline: "Bring your history with you",
    intro:
      "Transitioning from legacy software or paper files? We securely import patient records, schedules and history without losing context.",
    features: [
      "Automated legacy data mapping",
      "Secure transfer protocols",
      "Data integrity verification checks",
      "Zero downtime during transition",
    ],
    art: "migration",
  },
];

export default function WhyChooseUsPage() {
  return (
    <>
      <FeaturePage
        headline={{
          before: "Built around",
          middle: "the people who",
          accent: "use it.",
        }}
        subtitle="Whether it's a single clinic or a full hospital, we focus on what makes a system actually work in daily practice."
        browseLabel="Explore why us"
        visionLabel="/Why Choose Us/"
        visionLead="is built around the people who use it. Whether it's a single clinic or a full hospital, we focus on what makes a system actually work in daily practice."
        visionMuted="Security, training, support and migration that don't get in your way."
        // heroImage="/assets/landing-page-images/team/ikenna.svg"
        heroImage="/assets/landing-page-images/home/hero_a.svg"
        heroImageAlt="Ikenna - Founder & Team"
        items={items}
        closing={{
          title: "Ready to experience the difference?",
          text: "See how Medicules fits your daily workflow with a personalized walkthrough.",
        }}
      />
      <div className="relative w-full h-[420px] overflow-hidden bg-black">
        <Cells />
      </div>
    </>
  );
}
