"use client";

import Cells from "../home/dna/cells";
import FeaturePage, { type FeatureItem } from "./FeaturePage";

/* Section ids match the navbar links (/facility-type#dental-practices, ...) */
const items: FeatureItem[] = [
  {
    id: "dental-practices",
    title: "Dental Practices",
    tagline: "Odontograms & treatment plans",
    intro:
      "Chart every tooth visually, plan treatment with confidence and keep patients coming back with timely recalls, all in a system designed around dentistry.",
    features: [
      "Graphical odontogram charting",
      "Treatment plans and procedure history",
      "Dental imaging and document attachments",
      "Recall lists and appointment reminders",
    ],
    art: "dental",
  },
  {
    id: "pharmacies",
    title: "Pharmacies",
    tagline: "Dispensing & stock control",
    intro:
      "Dispense accurately, never run out of essentials and keep every prescription traceable, whether the pharmacy is inside a hospital or on its own.",
    features: [
      "Prescription-to-dispensing workflow",
      "Live stock levels with low-stock alerts",
      "Batch and expiry date tracking",
      "Supplier orders and purchase records",
    ],
    art: "pharmacy",
  },
  {
    id: "maternity-centres",
    title: "Maternity Centres",
    tagline: "Antenatal to postnatal care",
    intro:
      "Support mothers and newborns from the first antenatal visit through delivery and postnatal care, with every step recorded in one connected chart.",
    features: [
      "Antenatal registration and visit scheduling",
      "Delivery records and labour progress notes",
      "Newborn records and immunisation tracking",
      "Postnatal follow-up with automatic reminders",
    ],
    art: "maternity",
  },
  {
    id: "occupational-health",
    title: "Occupational Health",
    tagline: "Workplace screening & reporting",
    intro:
      "Purpose-built for company and industrial clinics, covering the medicals, incident records and reporting that employers and regulators expect.",
    features: [
      "Pre-employment and periodic medical examinations",
      "Occupational injury and incident logs",
      "Fitness-to-work certificates in a few clicks",
      "Company-level health and absence reports",
    ],
    art: "industry",
  },
];

export default function FacilityTypePage() {
  return (
    <>
      <FeaturePage
        headline={{
          before: "Made for the way",
          middle: "your kind of facility",
          accent: "really works.",
        }}
        subtitle="Dentists, pharmacists, midwives and occupational health teams all work differently. The platform adapts to each."
        browseLabel="Find your facility type"
        visionLabel="/Your facility type/"
        visionLead="isn't one-size-fits-all. Each specialty gets the charts, workflows and reports it actually needs, not a generic form with a new label."
        visionMuted="Here's how the platform fits four of the facility types we serve most."
        items={items}
        closing={{
          title: "Don't see your type of facility?",
          text: "Tell us how you work and we'll show you how the platform can be set up around it.",
        }}
      />
      <div className="relative w-full h-[420px] overflow-hidden bg-black">
        <Cells />
      </div>
    </>
  );
}
