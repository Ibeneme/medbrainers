"use client";
import { BASE } from "@/components/emergency/er-ui";
import { DispositionForm } from "@/components/emergency/disposition-ui";

export default function NewErReferralPage() {
  return <DispositionForm types={["refer"]} title="Refer / transfer patient" subtitle="Send to another facility" listHref={`${BASE}/referrals`} cta="Record referral" />;
}
