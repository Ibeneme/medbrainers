"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import {
  Empty,
  Header,
  Loader,
  Page,
  Pill,
  SearchBox,
  SectionCard,
  TBASE,
  fmtDateTime,
  idOf,
  isToday,
  nameOf,
  useMembers,
  useSchedule,
} from "@/components/theater/th-ui";
import { useTheme } from "@/contexts/theme-context";

export default function TeamsPage() {
  const { theater, activeFacility, ui, cases } = useSchedule();
  const members = useMembers();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const byId = new Map<string, any>();
    const get = (id: string, name: string) => {
      if (!id) return null;
      if (!byId.has(id))
        byId.set(id, {
          id,
          name,
          surgeon: 0,
          anaesthetist: 0,
          scrub: 0,
          today: 0,
          next: null as any,
        });
      return byId.get(id);
    };
    members.forEach((m: any) =>
      get(m.id, `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email)
    );
    cases
      .filter((c) => c.status !== "cancelled")
      .forEach((c: any) => {
        const roles: Array<[string, any]> = [
          ["surgeon", c.surgeon],
          ["anaesthetist", c.anaesthetist],
          ["scrub", c.scrubNurse],
        ];
        roles.forEach(([role, ref]) => {
          const row = get(idOf(ref), nameOf(ref));
          if (!row) return;
          row[role]++;
          if (isToday(c.scheduledStart)) row.today++;
          if (
            new Date(c.scheduledStart) > new Date() &&
            c.status !== "completed" &&
            (!row.next ||
              new Date(c.scheduledStart) < new Date(row.next.scheduledStart))
          )
            row.next = c;
        });
      });
    return [...byId.values()]
      .filter((r) => r.surgeon + r.anaesthetist + r.scrub > 0)
      .filter(
        (r) => !q.trim() || r.name.toLowerCase().includes(q.toLowerCase())
      )
      .sort(
        (a, b) =>
          b.today - a.today ||
          b.surgeon +
            b.anaesthetist +
            b.scrub -
            (a.surgeon + a.anaesthetist + a.scrub)
      );
  }, [cases, members, q]);

  const { colors } = useTheme();
  return (
    <Page>
      <Header
        icon={<Users size={22} />}
        title="Surgical Teams"
        subtitle={activeFacility?.name}
      />
      <>
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search staff member…"
        />
        <p className="text-xs opacity-55">
          Built from the theatre schedule: each surgeon, anaesthetist and scrub
          nurse with their workload. <br /> Assign people when you{" "}
          <Link href={`${TBASE}/schedule/new`} className="underline">
            schedule a case
          </Link>
          .
        </p>
        {theater.listLoading && cases.length === 0 ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty>No team members assigned to cases yet.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="space-y-2.5 rounded-2xl p-4"
                style={{ backgroundColor: colors.shadeBg }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-semibold">{r.name}</p>
                  {r.today > 0 && <Pill tone="info">{r.today} today</Pill>}
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {r.surgeon > 0 && (
                    <Pill tone="mute">{r.surgeon} as surgeon</Pill>
                  )}
                  {r.anaesthetist > 0 && (
                    <Pill tone="mute">{r.anaesthetist} as anaesthetist</Pill>
                  )}
                  {r.scrub > 0 && <Pill tone="mute">{r.scrub} as scrub</Pill>}
                </div>
                <p className="text-xs opacity-60">
                  {r.next
                    ? `Next: ${r.next.procedureName} · ${fmtDateTime(
                        r.next.scheduledStart
                      )}`
                    : "No upcoming cases"}
                </p>
              </div>
            ))}
          </div>
        )}
      </>
    </Page>
  );
}
