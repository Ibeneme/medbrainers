"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, Baby, BarChart3, Bed, CalendarClock, ClipboardList, HeartPulse, Plus,
  Ruler, Scissors, Stethoscope, Syringe, Users,
} from "lucide-react";
import { fetchMaternityDashboard } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import { BASE, Banner, Btn, Header, Loader, Page, Stat, useMat } from "@/components/maternity/mat-ui";

const SHORTCUTS = [
  { title: "ANC registration", href: "/anc/register", icon: ClipboardList, desc: "Book a new pregnancy" },
  { title: "ANC visits & follow-ups", href: "/anc/visits", icon: CalendarClock, desc: "All pregnancies and visits" },
  { title: "High-risk pregnancies", href: "/anc/high-risk", icon: AlertTriangle, desc: "Active high / very-high risk" },
  { title: "Labour ward board", href: "/labour", icon: Bed, desc: "Women in labour right now" },
  { title: "Partograph", href: "/labour/partograph", icon: Activity, desc: "Cervicograph & observations" },
  { title: "Delivery records", href: "/delivery", icon: HeartPulse, desc: "Mode, blood loss, outcome" },
  { title: "Caesarean log", href: "/delivery/caesarean", icon: Scissors, desc: "Indication and urgency" },
  { title: "Postnatal visits", href: "/postnatal", icon: Stethoscope, desc: "Mother follow-up" },
  { title: "Newborn registry", href: "/newborn", icon: Baby, desc: "Birth weight, Apgar, status" },
  { title: "Immunization", href: "/immunization", icon: Syringe, desc: "Schedule and administer" },
  { title: "Growth monitoring", href: "/growth", icon: Ruler, desc: "Weight, length, MUAC" },
  { title: "Paediatric clinic", href: "/paediatrics", icon: Users, desc: "Child consultations" },
  { title: "Reports", href: "/reports", icon: BarChart3, desc: "Caesarean rate, LBW, coverage" },
];

export default function MaternityDashboard() {
  const { facilityId, act, maternity, activeFacility, ui, softShadow } = useMat();
  const d = maternity.dashboard;

  const load = useCallback(() => {
    if (facilityId) act(fetchMaternityDashboard({ facilityId }), false);
  }, [facilityId, act]);

  useEffect(() => {
    load();
    if (!facilityId) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, facilityId]);

  return (
    <Page>
      <Header
        icon={<Baby size={22} />}
        title="Maternal & Child Health"
        subtitle={activeFacility?.name}
        actions={
          <>
            <Btn href={`${BASE}/labour/admit`} tone="card">Admit to labour</Btn>
            <Btn href={`${BASE}/anc/register`}>
              <Plus size={16} /> Register ANC booking
            </Btn>
          </>
        }
      />

      {!d ? (
        <Loader text="Loading maternity…" />
      ) : (
        <>
          <div className="space-y-3">
            {d.highRisk > 0 && (
              <Banner tone="bad" href={`${BASE}/anc/high-risk`} cta="Review">
                <AlertTriangle size={18} className="text-red-500" />
                {d.highRisk} active high-risk pregnanc{d.highRisk === 1 ? "y" : "ies"} under follow-up
              </Banner>
            )}
            {d.inLabour > 0 && (
              <Banner tone="warn" href={`${BASE}/labour`} cta="Open board">
                <Bed size={18} style={{ color: PRIMARY_COLOR }} />
                {d.inLabour} woman{d.inLabour === 1 ? "" : "en"} currently in the labour ward
              </Banner>
            )}
            {d.nicuAdmitted > 0 && (
              <Banner tone="warn" href={`${BASE}/nicu`} cta="Open NICU">
                <Baby size={18} style={{ color: PRIMARY_COLOR }} />
                {d.nicuAdmitted} baby{d.nicuAdmitted === 1 ? "" : "ies"} admitted to NICU / SCBU
              </Banner>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Stat label="Active ANC" value={d.activeANC} sub="pregnancies under care" href={`${BASE}/anc/visits`} />
            <Stat label="High-risk" value={d.highRisk} sub="high or very high" tone={d.highRisk ? "bad" : undefined} href={`${BASE}/anc/high-risk`} />
            <Stat label="In labour" value={d.inLabour} sub="admitted / active labour" tone={d.inLabour ? "warn" : undefined} href={`${BASE}/labour`} />
            <Stat label="Deliveries today" value={d.deliveriesToday} sub="since midnight" href={`${BASE}/delivery`} />
            <Stat label="NICU / SCBU" value={d.nicuAdmitted} sub="babies admitted" tone={d.nicuAdmitted ? "warn" : undefined} href={`${BASE}/nicu`} />
          </div>
        </>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-tight opacity-70">Workflow</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={`${BASE}${s.href}`}
              className="flex items-center gap-3.5 rounded-2xl p-4 transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: ui.card, boxShadow: softShadow }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${PRIMARY_COLOR}18`, color: PRIMARY_COLOR }}
              >
                <s.icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{s.title}</span>
                <span className="block truncate text-xs opacity-55">{s.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Page>
  );
}
