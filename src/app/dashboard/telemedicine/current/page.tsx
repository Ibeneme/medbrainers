"use client";

import { SessionBrowser } from "@/components/telemedicine/SessionBrowser";

export default function CurrentTelehealthPage() {
  return (
    <SessionBrowser
      scope="current"
      title="Current Telehealth"
      subtitle="Live rooms and visits inside the join window"
      empty="Nothing is open right now. Visits appear here from the join window until they end."
    />
  );
}
