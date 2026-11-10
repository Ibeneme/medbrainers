"use client";

import { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { fetchDonors } from "@/api/slices";
import {
  BASE, Avatar, Btn, Empty, GroupBadge, Header, Loader, Page, Pill, Pills, RowLink,
  SearchBox, SectionCard, ENUMS, GROUP_OPTS, fmtDate, label, toOpts, useBB, useDebounced,
} from "@/components/blood-bank/bb-ui";
import { CustomDropdown } from "@/components/ui/items";

export default function DonorsPage() {
  const { facilityId, act, bloodBank, activeFacility, ui, isDark, colors } = useBB();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [group, setGroup] = useState("");
  const [type, setType] = useState("");
  const search = useDebounced(q);

  useEffect(() => {
    if (!facilityId) return;
    act(
      fetchDonors({
        facilityId,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        bloodGroup: group || undefined,
        donorType: type || undefined,
        limit: 200,
      }),
      false
    );
  }, [facilityId, act, search, status, group, type]);

  const donors = bloodBank.donors;

  return (
    <Page>
      <Header
        icon={<Users size={22} />}
        title="Donor Registry"
        subtitle={activeFacility?.name}
        actions={
          <Btn href={`${BASE}/donors/new`}>
            <Plus size={16} /> Register donor
          </Btn>
        }
      />
      <SectionCard title="Donors" count={donors.length}>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search name, donor no., phone, national ID…" />
          <div className="w-36">
            <CustomDropdown value={group} options={[{ label: "All groups", value: "" }, ...GROUP_OPTS]} onChange={setGroup} placeholder="Blood group" isDark={isDark} colors={colors} border={ui.border} />
          </div>
          <div className="w-48">
            <CustomDropdown value={type} options={[{ label: "All donor types", value: "" }, ...toOpts(ENUMS.donorTypes)]} onChange={setType} placeholder="Donor type" isDark={isDark} colors={colors} border={ui.border} />
          </div>
        </div>
        <Pills
          value={status}
          onChange={setStatus}
          options={[{ value: "all", label: "All" }, ...ENUMS.donorStatuses.map((s) => ({ value: s, label: label(s) }))]}
        />

        {bloodBank.listLoading && donors.length === 0 ? (
          <Loader text="Loading donors…" />
        ) : donors.length === 0 ? (
          <Empty>No donors match. Register a donor to get started.</Empty>
        ) : (
          <div className="space-y-3">
            {donors.map((d) => {
              const name = `${d.firstName} ${d.lastName}`;
              return (
                <RowLink key={d._id} href={`${BASE}/donors/${d._id}`}>
                  <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <Avatar name={name} />
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{name}</p>
                        <p className="truncate font-mono text-xs opacity-50">{d.donorNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <GroupBadge group={d.bloodGroup || d.reportedBloodGroup} size="sm" />
                      <span className="text-xs capitalize opacity-60">{label(d.donorType)}</span>
                    </div>
                    <div className="text-xs opacity-60">
                      {d.eligibility?.eligible ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Eligible to donate</span>
                      ) : d.eligibility?.nextEligibleAt ? (
                        <>Next eligible {fmtDate(d.eligibility.nextEligibleAt)}</>
                      ) : (
                        <>{d.eligibility?.reasons?.[0] || "Not eligible"}</>
                      )}
                      <p className="opacity-70">{d.totalDonations ?? 0} donation{d.totalDonations === 1 ? "" : "s"}</p>
                    </div>
                    <Pill value={d.status} />
                  </div>
                </RowLink>
              );
            })}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
