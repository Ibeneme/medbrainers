"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { checkDonorEligibility, fetchDonorById } from "@/api/slices";
import { CustomDropdown } from "@/components/ui/items";
import {
  BASE, BackHeader, Btn, Card, DataTable, ENUMS, GroupBadge, KV, KVGrid, Loader, NotFound, Page, Pill,
  fmtDate, fmtDateTime, label, nameOf, toOpts, useBB,
} from "@/components/blood-bank/bb-ui";
import Link from "@/components/access/guarded-link";

export default function DonorDetailPage() {
  const { donorId } = useParams() as { donorId: string };
  const { facilityId, act, bloodBank, ui, isDark, colors } = useBB();
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [dtype, setDtype] = useState("whole_blood");
  const [check, setCheck] = useState<any>(null);

  useEffect(() => {
    if (!facilityId) return;
    setState("loading");
    act(fetchDonorById({ facilityId, donorId }), false).then((r) => setState(r ? "ready" : "missing"));
  }, [facilityId, donorId, act]);

  const d: any = bloodBank.activeDonor?._id === donorId ? bloodBank.activeDonor : null;

  if (state === "loading" || (!d && state === "ready")) return <Page><Loader text="Loading donor…" /></Page>;
  if (!d) return <Page><NotFound what="Donor" href={`${BASE}/donors`} /></Page>;

  const e = d.eligibility;
  const addr = [d.address?.street, d.address?.city, d.address?.state, d.address?.country].filter(Boolean).join(", ");

  return (
    <Page>
      <BackHeader
        href={`${BASE}/donors`}
        title={`${d.firstName} ${d.lastName}`}
        subtitle={<span className="font-mono">{d.donorNumber}</span>}
        right={
          <>
            <Btn href={`${BASE}/donors/${d._id}/edit`} tone="card"><Pencil size={14} /> Edit</Btn>
            <Btn href={`${BASE}/screening/new?donorId=${d._id}`}>Screen donor</Btn>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <GroupBadge group={d.bloodGroup || d.reportedBloodGroup} size="lg" />
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2">
                <Pill value={d.status} />
                <Pill tone="mute">{label(d.donorType)}</Pill>
              </div>
              <p className="text-xs opacity-60">
                {d.bloodGroup ? "Lab-confirmed group" : d.reportedBloodGroup ? "Self-reported group (unconfirmed)" : "Group not yet known"}
              </p>
            </div>
          </div>
          <KVGrid>
            <KV label="Gender"><span className="capitalize">{d.gender}</span></KV>
            <KV label="Date of birth">{fmtDate(d.dateOfBirth)}</KV>
            <KV label="Occupation">{d.occupation}</KV>
            <KV label="Phone">{d.phone}</KV>
            <KV label="Email">{d.email}</KV>
            <KV label="National ID">{d.nationalId}</KV>
            <KV label="Address">{addr}</KV>
            <KV label="Total donations">{d.totalDonations ?? 0}</KV>
            <KV label="Last donation">{fmtDate(d.lastDonationAt)}</KV>
{(d.status || "").startsWith("deferred") && <KV label="Deferred until">{d.deferralUntil ? fmtDate(d.deferralUntil) : "Permanent"}</KV>}
            {d.deferralReason && <KV label="Deferral reason">{d.deferralReason}</KV>}
            <KV label="Registered by">{nameOf(d.registeredBy)}</KV>
          </KVGrid>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold">Eligibility</h2>
          <div
            className="rounded-2xl p-4 text-sm"
            style={{ backgroundColor: e?.eligible ? "#10b9811f" : "#f59e0b1f" }}
          >
            <p className="font-semibold">{e?.eligible ? "Eligible to donate" : "Not eligible right now"}</p>
            {!e?.eligible && e?.nextEligibleAt && <p className="mt-1 text-xs opacity-70">Next eligible {fmtDate(e.nextEligibleAt)}</p>}
            {e?.reasons?.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs opacity-80">
                {e.reasons.map((r: string) => <li key={r}>{r}</li>)}
              </ul>
            )}
          </div>
          <CustomDropdown value={dtype} options={toOpts(ENUMS.donationTypes)} onChange={setDtype} label="Check for donation type" placeholder="Select donation type…" isDark={isDark} colors={colors} border={ui.border} />
          <Btn tone="ghost" full onClick={async () => setCheck(await act(checkDonorEligibility({ facilityId, donorId, donationType: dtype }), false))}>
            Check eligibility
          </Btn>
          {check && check !== true && (
            <p className="text-xs">
              <span className="font-semibold">{check.eligible ? "Eligible" : "Not eligible"}</span>
              {check.nextEligibleAt ? ` · next ${fmtDate(check.nextEligibleAt)}` : ""}
              {check.reasons?.length ? ` · ${check.reasons.join("; ")}` : ""}
            </p>
          )}
        </Card>
      </div>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Recent screenings</h2>
        <DataTable
          head={["Screening", "Date", "Hb (g/dL)", "Outcome", ""]}
          empty="No screenings yet."
          rows={(d.screenings || []).map((s: any) => [
            <span key="n" className="font-mono text-xs">{s.screeningNumber}</span>,
            fmtDateTime(s.screenedAt),
            s.vitals?.hemoglobin ?? "—",
            <Pill key="o" value={s.outcome} />,
            <Link key="l" href={`${BASE}/screening/${s._id}`} className="text-xs font-semibold underline">View</Link>,
          ])}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Donation history</h2>
        <DataTable
          head={["Donation", "Collected", "Type", "Group", "TTI", ""]}
          empty="No donations yet."
          rows={(d.donations || []).map((x: any) => [
            <span key="n" className="font-mono text-xs">{x.donationNumber}</span>,
            fmtDateTime(x.collectedAt),
            `${label(x.donationType)} · ${x.volumeMl} mL`,
            x.grouping?.group || "—",
            <Pill key="t" value={x.tti?.status} />,
            <Link key="l" href={`${BASE}/donations/${x._id}`} className="text-xs font-semibold underline">View</Link>,
          ])}
        />
      </Card>
    </Page>
  );
}
