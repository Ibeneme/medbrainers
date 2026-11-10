"use client";

import { SessionBrowser } from "@/components/telemedicine/SessionBrowser";

export default function PastConsultationsPage() {
  return (
    <SessionBrowser
      scope="past"
      title="Past Consultations"
      subtitle="Completed, missed and cancelled visits"
      empty="No past visits yet."
    />
  );
}
