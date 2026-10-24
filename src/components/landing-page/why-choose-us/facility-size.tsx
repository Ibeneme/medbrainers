"use client";

import Cells from "../home/dna/cells";
import FeaturePage, { type FeatureItem } from "./FeaturePage";

/* Section ids match the navbar links (/facility-size#clinics, ...) */
const items: FeatureItem[] = [
  {
    id: "solo-practitioners",
    title: "Solo Practitioners",
    tagline: "Simple charting without the overhead",
    intro:
      "Run your practice without a heavy system or an IT team. Everything you need to see patients, record care and get paid, in a lightweight setup that stays out of your way.",
    features: [
      "Quick patient registration and clinical notes",
      "Appointments and reminders in one place",
      "Simple billing and receipts",
      "Works on the devices you already own",
    ],
    art: "solo",
  },
  {
    id: "clinics",
    title: "Clinics",
    tagline: "Queues, scheduling & billing in one place",
    intro:
      "Keep every practitioner, room and patient moving. Scheduling, the live queue and billing share one record, so the front desk and the consulting room are always in step.",
    features: [
      "Live patient queue and triage status",
      "Scheduling across multiple practitioners",
      "Billing and HMO claims built in",
      "Reports on visits and revenue",
    ],
    art: "clinic",
  },
  {
    id: "hospitals",
    title: "Hospitals",
    tagline: "Wards, departments & staff, fully connected",
    intro:
      "Bring every department onto the same live data, from admissions and wards to labs, pharmacy and billing, so nothing gets lost between handovers.",
    features: [
      "Wards, beds and admissions in one view",
      "Lab, pharmacy and billing connected end to end",
      "Role-based dashboards for each department",
      "Management reporting across the facility",
    ],
    art: "hospital",
  },
  {
    id: "hospital-groups",
    title: "Hospital Groups",
    tagline: "One patient record across every branch",
    intro:
      "Run multiple facilities as one network. A patient seen at one branch is known at all of them, and leadership sees the whole group in a single view.",
    features: [
      "Shared patient records across branches",
      "Centralised reporting for the whole group",
      "Consistent workflows and permissions at every site",
      "Stock and staff visibility across locations",
    ],
    art: "group",
  },
];

export default function FacilitySizePage() {
  return (
    <div>
      <FeaturePage
        headline={{
          before: "Built to fit",
          middle: "every facility, from one room to",
          accent: "many branches.",
        }}
        subtitle="Whether you're a solo practitioner or a hospital group, the platform scales to the way your facility actually runs."
        browseLabel="Find your facility size"
        visionLabel="/Your facility size/"
        visionLead="grows with you. Start with exactly what a small practice needs and add departments, branches and teams as your facility expands."
        visionMuted="No rebuilding, no switching systems. Here's what it looks like at each size."
        items={items}
        closing={{
          title: "Not sure which setup fits your facility?",
          text: "Tell us how many sites, staff and patients you handle and we'll recommend the right starting point.",
        }}
      />
      <div className="relative w-full h-[420px] overflow-hidden bg-black">
        <Cells />
      </div>
    </div>
  );
}
