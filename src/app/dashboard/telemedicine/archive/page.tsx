"use client";

import { SessionBrowser } from "@/components/telemedicine/SessionBrowser";

export default function UpcomingTelehealthPage() {
  return (
    <SessionBrowser
      scope="upcoming"
      title="Upcoming Telehealth"
      subtitle="Scheduled visits that are not open yet"
      empty="No upcoming visits. Schedule one from Virtual Consultations."
    />
  );
}
