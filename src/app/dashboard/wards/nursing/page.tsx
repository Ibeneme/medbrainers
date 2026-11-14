"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Check,
  ClipboardList,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchCarePlans,
  fetchMyFacilities,
  fetchPatients,
  updateCarePlan,
} from "@/api/slices";
import type { NursingCarePlan } from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";

import { Can } from "@/components/access/can";
const personName = (p: unknown) => {
  if (!p || typeof p === "string") return "—";
  const x = p as { firstName?: string; lastName?: string; mrn?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.mrn || "—";
};
const idOf = (p: unknown) =>
  !p ? "" : typeof p === "string" ? p : (p as { _id?: string })._id || "";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

type Tab = "active" | "completed" | "discontinued" | "all";
const TABS: Tab[] = ["active", "completed", "discontinued", "all"];

export default function NursingCarePlansPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);

  const { activeFacilityId, initialized } = useAppSelector((s) => s.facilities);
  const { carePlans, loading, saving } = useAppSelector((s) => s.wards);

  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  const load = useCallback(() => {
    if (!activeFacilityId) return;
    dispatch(fetchCarePlans({ facilityId: activeFacilityId }));
  }, [dispatch, activeFacilityId]);

  useEffect(() => {
    load();
    if (activeFacilityId)
      dispatch(fetchPatients({ facilityId: activeFacilityId }));
  }, [load, dispatch, activeFacilityId]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: carePlans.length };
    carePlans.forEach((p) => (c[p.status] = (c[p.status] || 0) + 1));
    return c;
  }, [carePlans]);

  const q = query.trim().toLowerCase();
  const shown = carePlans.filter((c) => {
    if (tab !== "all" && c.status !== tab) return false;
    if (!q) return true;
    return (
      personName(c.patient).toLowerCase().includes(q) ||
      ((c.patient as any)?.mrn || "").toLowerCase().includes(q) ||
      (c.diagnosis || "").toLowerCase().includes(q)
    );
  });

  const patch = async (
    plan: NursingCarePlan,
    payload: Parameters<typeof updateCarePlan>[0]["payload"]
  ) => {
    if (!activeFacilityId) return;
    try {
      await dispatch(
        updateCarePlan({
          facilityId: activeFacilityId,
          planId: plan._id,
          payload,
        })
      ).unwrap();
    } catch (err) {
      showToast(
        typeof err === "string" ? err : "Could not update care plan",
        "error"
      );
    }
  };

  const toggleItem = (plan: NursingCarePlan, index: number) => {
    const interventions = (plan.interventions || []).map((i, n) => ({
      description: i.description,
      frequency: i.frequency,
      completed: n === index ? !i.completed : !!i.completed,
    }));
    patch(plan, { interventions });
  };

  if (initialized && !activeFacilityId) {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-16 text-center"
        style={{ color: ui.text }}
      >
        <ClipboardList className="mx-auto mb-3 opacity-30" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-6"
      style={{ color: ui.text }}
    >
      {/* ─── Main card ─────────────────────────────── */}
      <section
        className="space-y-5 rounded-[28px] p-5 sm:p-6"
        style={{ backgroundColor: ui.card }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium tracking-tight">
                Nursing care plans
              </h1>
              <span
                className="rounded-full px-3 py-1 text-sm"
                style={{ backgroundColor: ui.inner }}
              >
                {counts.all || 0}
              </span>
            </div>
            <p className="mt-1 text-xs opacity-55">
              Goals and interventions for admitted patients.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex min-w-[220px] items-center gap-2 rounded-full px-4 py-2.5"
              style={{ backgroundColor: ui.inner }}
            >
              <Search size={14} className="shrink-0 opacity-50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient or diagnosis…"
                className="w-full bg-transparent text-xs outline-none"
                style={{ color: ui.text }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="opacity-50 hover:opacity-100"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <Can path={"/dashboard/wards/nursing/new"}><button
              onClick={() => router.push("/dashboard/wards/nursing/new")}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus size={15} /> New care plan
            </button></Can>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="rounded-full px-4 py-2 text-xs font-medium capitalize transition-colors"
                style={{
                  backgroundColor: active ? PRIMARY_COLOR : ui.inner,
                  color: active ? "#FFFFFF" : ui.text,
                }}
              >
                {t}{" "}
                <span className={active ? "opacity-80" : "opacity-50"}>
                  {counts[t] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Plans */}
        {loading && carePlans.length === 0 ? (
          <div className="py-16 text-center text-xs opacity-60">
            Loading care plans…
          </div>
        ) : shown.length === 0 ? (
          <div
            className="rounded-3xl py-14 text-center text-xs opacity-60"
            style={{ backgroundColor: ui.inner }}
          >
            No care plans here yet.
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {shown.map((plan) => {
              const done = (plan.interventions || []).filter(
                (i) => i.completed
              ).length;
              const total = plan.interventions?.length || 0;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const name = personName(plan.patient);
              const isActive = plan.status === "active";

              return (
                <article
                  key={plan._id}
                  className="space-y-4 rounded-3xl p-5"
                  style={{ backgroundColor: ui.inner }}
                >
                  {/* Patient + status */}
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: `${PRIMARY_COLOR}26`,
                          color: PRIMARY_COLOR,
                        }}
                      >
                        {initialsOf(name)}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/patients/${idOf(plan.patient)}`}
                          className="block truncate text-[15px] font-semibold hover:underline"
                        >
                          {name}
                        </Link>
                        <p className="truncate text-xs opacity-55">
                          {plan.diagnosis || "No diagnosis recorded"}
                        </p>
                      </div>
                    </div>
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize"
                      style={
                        isActive
                          ? {
                              backgroundColor: `${PRIMARY_COLOR}26`,
                              color: PRIMARY_COLOR,
                            }
                          : { backgroundColor: ui.card }
                      }
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: isActive
                            ? PRIMARY_COLOR
                            : "rgba(128,128,128,0.7)",
                        }}
                      />
                      {plan.status}
                    </span>
                  </header>

                  {/* Progress */}
                  {!!total && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] opacity-65">
                        <span>
                          Interventions · {done}/{total}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: ui.card }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PRIMARY_COLOR,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {!!plan.goals?.length && (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider opacity-50">
                        Goals
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.goals.map((g, i) => (
                          <span
                            key={i}
                            className="rounded-full px-3 py-1.5 text-xs"
                            style={{ backgroundColor: ui.card }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interventions checklist */}
                  {!!total && (
                    <ul className="space-y-1.5">
                      {plan.interventions!.map((i, n) => (
                        <li key={i._id || n}>
                          <button
                            type="button"
                            disabled={!isActive || saving}
                            onClick={() => toggleItem(plan, n)}
                            className="flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left text-xs transition-opacity hover:opacity-80 disabled:cursor-default disabled:hover:opacity-100"
                            style={{ backgroundColor: ui.card }}
                          >
                            <span
                              className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                              style={{
                                backgroundColor: i.completed
                                  ? PRIMARY_COLOR
                                  : ui.inner,
                              }}
                            >
                              {i.completed && <Check size={12} color="#fff" />}
                            </span>
                            <span
                              className={
                                i.completed ? "line-through opacity-50" : ""
                              }
                            >
                              {i.description}
                              {i.frequency && (
                                <span className="opacity-60">
                                  {" "}
                                  · {i.frequency}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {plan.notes && (
                    <p className="text-xs leading-relaxed opacity-70">
                      {plan.notes}
                    </p>
                  )}

                  {/* Footer */}
                  <footer className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] opacity-55">
                      Started{" "}
                      {plan.startDate
                        ? new Date(plan.startDate).toLocaleDateString()
                        : "—"}
                      {plan.endDate
                        ? ` · Ended ${new Date(
                            plan.endDate
                          ).toLocaleDateString()}`
                        : ""}
                    </span>
                    {isActive && (
                      <span className="flex gap-2">
                        <Can perm="wards.write"><button
                          onClick={() => patch(plan, { status: "completed" })}
                          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                          <CheckCircle2 size={13} /> Complete
                        </button></Can>
                        <button
                          onClick={() =>
                            patch(plan, { status: "discontinued" })
                          }
                          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-opacity hover:opacity-70"
                          style={{ backgroundColor: ui.card }}
                        >
                          <XCircle size={13} /> Discontinue
                        </button>
                      </span>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
