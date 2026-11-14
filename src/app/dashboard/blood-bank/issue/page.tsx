"use client";

import { useCallback, useEffect } from "react";
import Link from "@/components/access/guarded-link";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  ClipboardCheck,
  Droplets,
  FlaskConical,
  GitCompare,
  HeartPulse,
  Layers,
  Plus,
  Send,
  Snowflake,
  Syringe,
  Timer,
  Users,
} from "lucide-react";
import { fetchBloodBankDashboard } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  BASE, Banner, Btn, Header, Loader, Page, SectionCard, Stat, RowLink, Empty,
  fmtDateTime, useBB, Ring, Pill,
} from "@/components/blood-bank/bb-ui";

const SHORTCUTS = [
  { title: "Donor registry", href: "/donors", icon: Users, desc: "Register and manage donors" },
  { title: "Donor screening", href: "/screening", icon: ClipboardCheck, desc: "Vitals, Hb and risk assessment" },
  { title: "Donations", href: "/donations", icon: Droplets, desc: "Record collections" },
  { title: "Blood drives", href: "/drives", icon: CalendarDays, desc: "Plan outreach collections" },
  { title: "Grouping & typing", href: "/grouping", icon: FlaskConical, desc: "ABO / Rh with dual check" },
  { title: "TTI testing", href: "/testing", icon: Syringe, desc: "HIV, HBsAg, HCV, syphilis…" },
  { title: "Components", href: "/components", icon: Layers, desc: "Prepare PRC, FFP, platelets" },
  { title: "Inventory", href: "/inventory", icon: Boxes, desc: "Stock by product and group" },
  { title: "Storage & cold chain", href: "/storage", icon: Snowflake, desc: "Fridges, freezers, temperatures" },
  { title: "Expiry & discards", href: "/expiry", icon: Timer, desc: "Near-expiry and wastage" },
  { title: "Crossmatching", href: "/crossmatch", icon: GitCompare, desc: "Compatibility testing" },
  { title: "Issue & dispatch", href: "/issue", icon: Send, desc: "Release units to wards" },
];

export default function BloodBankDashboard() {
  const bb = useBB();
  const { facilityId, act, bloodBank, activeFacility, ui, softShadow } = bb;
  const d = bloodBank.dashboard;

  const load = useCallback(() => {
    if (facilityId) act(fetchBloodBankDashboard({ facilityId }), false);
  }, [facilityId, act]);

  useEffect(() => {
    load();
    if (!facilityId) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, facilityId]);

  const totalStock = d?.redCellsByGroup?.reduce((n, g) => n + g.available, 0) || 0;
  const minTotal = d?.redCellsByGroup?.reduce((n, g) => n + g.minimum, 0) || 0;
  const stockPct = minTotal ? Math.min(100, Math.round((totalStock / minTotal) * 100)) : 0;

  return (
    <Page>
      <Header
        icon={<HeartPulse size={22} />}
        title="Blood Bank"
        subtitle={activeFacility?.name}
        actions={
          <>
            <Btn href={`${BASE}/donors/new`} tone="card">Register donor</Btn>
            <Btn href={`${BASE}/requests/new`}>
              <Plus size={16} /> New blood request
            </Btn>
          </>
        }
      />

      {!d ? (
        <Loader text="Loading blood bank…" />
      ) : (
        <>
          <div className="space-y-3">
            {d.emergencyRequests > 0 && (
              <Banner tone="bad" href={`${BASE}/requests`} cta="Respond">
                <AlertTriangle size={18} className="text-red-500" />
                {d.emergencyRequests} emergency blood request{d.emergencyRequests === 1 ? "" : "s"} open
              </Banner>
            )}
            {d.storageAlarms > 0 && (
              <Banner tone="bad" href={`${BASE}/storage`}>
                <AlertTriangle size={18} className="text-red-500" />
                {d.storageAlarms} storage unit{d.storageAlarms === 1 ? "" : "s"} outside temperature range
              </Banner>
            )}
            {d.openReactions > 0 && (
              <Banner tone="warn" href={`${BASE}/reactions`}>
                <AlertTriangle size={18} style={{ color: PRIMARY_COLOR }} />
                {d.openReactions} transfusion reaction{d.openReactions === 1 ? "" : "s"} still open
              </Banner>
            )}
            {d.pendingRetrospectiveCrossmatches > 0 && (
              <Banner tone="warn" href={`${BASE}/issue`}>
                <AlertTriangle size={18} style={{ color: PRIMARY_COLOR }} />
                {d.pendingRetrospectiveCrossmatches} emergency issue{d.pendingRetrospectiveCrossmatches === 1 ? "" : "s"} waiting for a retrospective crossmatch
              </Banner>
            )}
            {d.expired > 0 && (
              <Banner tone="bad" href={`${BASE}/expiry`} cta="Clear">
                <AlertTriangle size={18} className="text-red-500" />
                {d.expired} expired unit{d.expired === 1 ? "" : "s"} still in stock
              </Banner>
            )}
            {d.lowStockGroups?.length > 0 && (
              <Banner tone="warn" href={`${BASE}/inventory`}>
                <AlertTriangle size={18} style={{ color: PRIMARY_COLOR }} />
                Low red-cell stock: {d.lowStockGroups.join(", ")}
              </Banner>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div
              className="col-span-2 flex items-center gap-5 rounded-3xl p-5 lg:col-span-1"
              style={{ backgroundColor: ui.card, boxShadow: softShadow }}
            >
              <Ring pct={stockPct} size={72} stroke={6} />
              <div>
                <p className="text-xs font-medium opacity-55">Red-cell stock</p>
                <p className="mt-0.5 text-2xl font-semibold tracking-tight">
                  {totalStock}
                  <span className="text-base font-normal opacity-50">/{minTotal}</span>
                </p>
                <p className="text-[11px] opacity-45">vs. minimum level</p>
              </div>
            </div>
            <Stat label="Available units" value={d.availableUnits} sub="ready to crossmatch" href={`${BASE}/inventory`} />
            <Stat label="Expiring soon" value={d.expiringSoon} sub={`within ${d.expiryAlertDays} days`} tone={d.expiringSoon ? "warn" : undefined} href={`${BASE}/expiry`} />
            <Stat label="Open requests" value={d.openRequests} sub="awaiting completion" href={`${BASE}/requests`} />
            <Stat label="Transfusions running" value={d.transfusionsInProgress} sub="in progress now" href={`${BASE}/transfusions`} />
            <Stat label="Donations today" value={d.donationsToday} sub={`${d.readyToDonate} screened & ready`} href={`${BASE}/donations`} />
            <Stat label="Awaiting grouping" value={d.awaitingGrouping} sub="donations to type" href={`${BASE}/grouping`} />
            <Stat label="Awaiting TTI" value={d.awaitingTti} sub="results outstanding" href={`${BASE}/testing`} />
            <Stat label="Issued today" value={d.issuedToday} sub="units dispatched" href={`${BASE}/issue`} />
            <Stat label="Quarantined" value={d.quarantined} sub="not yet cleared" href={`${BASE}/inventory`} />
            <Stat label="Active donors" value={d.activeDonors} sub="in the registry" href={`${BASE}/donors`} />
          </div>

          <SectionCard title="Red-cell stock by group" right={<Btn href={`${BASE}/inventory`} tone="ghost">Full inventory</Btn>}>
            <div className="flex flex-wrap gap-2.5">
              {d.redCellsByGroup.map((g) => (
                <Link
                  key={g.group}
                  href={`${BASE}/inventory?bloodGroup=${encodeURIComponent(g.group)}`}
                  className="flex h-20 w-[92px] flex-col items-center justify-center rounded-2xl px-1 transition-all hover:-translate-y-0.5"
                  style={
                    g.low
                      ? { backgroundColor: "#ef444418", color: "#ef4444", border: "1px solid #ef444440" }
                      : { backgroundColor: ui.inner }
                  }
                >
                  <span className="font-mono text-base font-bold">{g.group}</span>
                  <span className="text-lg font-semibold leading-none">{g.available}</span>
                  <span className="mt-0.5 text-[10px] opacity-60">
                    {g.reserved} reserved · min {g.minimum}
                  </span>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Upcoming blood drives" count={d.upcomingDrives?.length || 0} right={<Btn href={`${BASE}/drives/new`} tone="ghost">Schedule drive</Btn>}>
            {d.upcomingDrives?.length ? (
              <div className="space-y-3">
                {d.upcomingDrives.map((dr) => (
                  <RowLink key={dr._id} href={`${BASE}/drives/${dr._id}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{dr.name}</p>
                        <p className="truncate text-xs opacity-55">
                          {dr.driveNumber} · {dr.location} · {fmtDateTime(dr.scheduledAt)}
                        </p>
                      </div>
                      <Pill value={dr.status} />
                    </div>
                  </RowLink>
                ))}
              </div>
            ) : (
              <Empty>No upcoming drives scheduled.</Empty>
            )}
          </SectionCard>
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
