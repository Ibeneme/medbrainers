"use client";
import { ArrowRightLeft } from "lucide-react";
import { DispositionList } from "@/components/emergency/disposition-ui";

export default function ErReferralsPage() {
  return <DispositionList title="Referrals & Transfers" icon={<ArrowRightLeft size={22} />} types={["refer"]} newHref="/referrals/new" newLabel="Refer patient" empty="No referrals recorded." />;
}
