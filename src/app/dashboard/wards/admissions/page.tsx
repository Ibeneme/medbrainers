"use client";

import { useEffect, useState } from "react";
import Link from "@/components/access/guarded-link";
import {
  BedDouble,
  ChevronRight,
  Plus,
  Search,
  UserPlus,
  X,
  ArrowRightLeft,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchAdmissionRequests,
  fetchAdmissions,
  fetchMyFacilities,
  fetchWards,
  transferPatient,
} from "@/api/slices";
import { useToast } from "@/contexts/toast-context";
import { Modal, CustomDropdown } from "@/components/ui/items";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

import { Can } from "@/components/access/can";
function personName(p: unknown) {
  if (!p || typeof p === "string") return "—";
  const x = p as { firstName?: string; lastName?: string; mrn?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.mrn || "—";
}

function patientIdOf(p: unknown) {
  if (!p || typeof p === "string") return p || "";
  const x = p as { _id?: string };
  return x._id || "";
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export default function AdmissionsPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);

  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const { admissions, loading } = useAppSelector((s) => s.wards);
  const { wards } = useAppSelector((s) => s.wards);
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [transferFor, setTransferFor] = useState<any | null>(null);
  const [toWardId, setToWardId] = useState("");
  const [toBed, setToBed] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferring, setTransferring] = useState(false);

  const closeTransfer = () => {
    setTransferFor(null);
    setToWardId("");
    setToBed("");
    setTransferReason("");
  };

  const doTransfer = async () => {
    if (!activeFacilityId || !transferFor) return;
    if (!toWardId || !toBed)
      return showToast("Choose a ward and a free bed", "error");
    setTransferring(true);
    try {
      await dispatch(
        transferPatient({
          facilityId: activeFacilityId,
          admissionId: transferFor._id,
          payload: {
            toWardId,
            toBedCode: toBed,
            reason: transferReason.trim() || undefined,
          },
        })
      ).unwrap();
      showToast("Patient transferred");
      closeTransfer();
      dispatch(fetchAdmissions({ facilityId: activeFacilityId }));
      dispatch(fetchWards(activeFacilityId));
    } catch (err) {
      showToast(typeof err === "string" ? err : "Transfer failed", "error");
    } finally {
      setTransferring(false);
    }
  };

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(fetchAdmissions({ facilityId: activeFacilityId }));
    dispatch(fetchWards(activeFacilityId));
    dispatch(
      fetchAdmissionRequests({
        facilityId: activeFacilityId,
        status: "pending",
      })
    );
  }, [dispatch, activeFacilityId]);

  const q = query.trim().toLowerCase();
  const filteredAdmissions = admissions.filter((a: any) => {
    if (!q) return true;
    const name = personName(a.patient).toLowerCase();
    const mrn = (a.patient?.mrn || "").toLowerCase();
    const wardName = (a.ward?.name || "").toLowerCase();
    const bedCode = (a.bedCode || "").toLowerCase();
    const diagnosis = (a.admittingDiagnosis || "").toLowerCase();
    return (
      name.includes(q) ||
      mrn.includes(q) ||
      wardName.includes(q) ||
      bedCode.includes(q) ||
      diagnosis.includes(q)
    );
  });

  const softShadow = isDark
    ? "0 4px 24px rgba(0,0,0,0.25)"
    : "0 4px 24px rgba(0,0,0,0.04)";

  if (!activeFacilityId) {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-20 text-center"
        style={{ color: colors.text }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${PRIMARY_COLOR}15` }}
        >
          <BedDouble size={28} style={{ color: PRIMARY_COLOR }} />
        </div>
        <p className="text-lg font-semibold">Select a facility first</p>
        <p className="mt-1 text-sm opacity-60">
          Choose a facility to manage admissions
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {loading && <DarkBlurOverlayLoader text="Loading admissions…" />}

      <div className="space-y-6" style={{ color: ui.text }}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${PRIMARY_COLOR}18`,
                color: PRIMARY_COLOR,
              }}
            >
              <UserPlus size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                Admissions & Transfers
              </h1>
              <p className="truncate text-sm opacity-55">
                {activeFacility?.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/wards"
              className="rounded-2xl px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: ui.card, boxShadow: softShadow }}
            >
              Wards view
            </Link>
            <Link
              href="/dashboard/wards/admissions/new"
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                backgroundColor: PRIMARY_COLOR,
                boxShadow: `0 8px 24px ${PRIMARY_COLOR}35`,
              }}
            >
              <Plus size={16} />
              Admit patient
            </Link>
          </div>
        </div>

        {/* Main card */}
        <section
          className="space-y-5 rounded-3xl p-5 sm:p-6"
          style={{ backgroundColor: ui.card, boxShadow: softShadow }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                Active admissions
              </h2>
              <span
                className="rounded-full px-3 py-1 text-sm font-medium"
                style={{ backgroundColor: ui.inner }}
              >
                {admissions.length}
              </span>
            </div>

            <div
              className="flex min-w-[240px] max-w-sm flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5"
              style={{ backgroundColor: ui.inner }}
            >
              <Search size={16} className="shrink-0 opacity-40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient, MRN, ward, bed…"
                className="w-full bg-transparent text-sm outline-none placeholder:opacity-40"
                style={{ color: ui.text }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-lg p-0.5 opacity-50 hover:opacity-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {filteredAdmissions.length === 0 && !loading ? (
            <div
              className="rounded-2xl py-16 text-center text-sm opacity-55"
              style={{ backgroundColor: ui.inner }}
            >
              {admissions.length === 0
                ? "No active admissions."
                : "Nothing matches your search."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAdmissions.map((a: any) => {
                const pid = patientIdOf(a.patient);
                const pObj = a.patient || {};
                const name = personName(a.patient);
                const wardName = a.ward?.name || "General Ward";
                const diagnosisText = a.admittingDiagnosis || "None specified";

                return (
                  <div
                    key={a._id}
                    className="grid items-center gap-4 rounded-2xl p-4 transition-all hover:opacity-95 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] lg:gap-5"
                    style={{ backgroundColor: ui.inner }}
                  >
                    {/* Patient */}
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: `${PRIMARY_COLOR}20`,
                          color: PRIMARY_COLOR,
                        }}
                      >
                        {initialsOf(name)}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/patients/${pid}`}
                          className="block truncate text-[15px] font-semibold hover:underline"
                        >
                          {name}
                        </Link>
                        {pObj.mrn && (
                          <p className="truncate font-mono text-xs opacity-50">
                            {pObj.mrn}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ward / bed */}
                    <div className="min-w-0 text-sm">
                      <p className="truncate font-medium">
                        {wardName} ·{" "}
                        <span style={{ color: PRIMARY_COLOR }}>
                          {a.bedCode}
                        </span>
                      </p>
                      <p className="truncate text-xs capitalize opacity-55">
                        {diagnosisText}
                      </p>
                    </div>

                    {/* Admitted */}
                    <div className="text-xs opacity-55">
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider opacity-70">
                        Admitted
                      </p>
                      {new Date(a.admittedAt).toLocaleString()}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Link
                        href={`/dashboard/patients/${pid}`}
                        className="inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-medium transition-all hover:opacity-80"
                        style={{ backgroundColor: ui.card }}
                      >
                        View <ChevronRight size={13} />
                      </Link>
                      <Can perm="wards.write"><button
                        type="button"
                        onClick={() => setTransferFor(a)}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all hover:opacity-80"
                        style={{ backgroundColor: ui.card }}
                      >
                        <ArrowRightLeft size={13} />
                        Transfer
                      </button></Can>
                      <Link
                        href={`/dashboard/wards/discharges?admissionId=${a._id}`}
                        className="inline-flex items-center rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                        style={{
                          backgroundColor: PRIMARY_COLOR,
                          boxShadow: `0 4px 12px ${PRIMARY_COLOR}30`,
                        }}
                      >
                        Discharge
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Transfer Modal */}
      <Modal
        open={!!transferFor}
        title={`Transfer ${personName(transferFor?.patient)}`}
        onClose={closeTransfer}
        ui={ui}
      >
        <div className="space-y-5">
          <p className="text-sm opacity-60">
            Currently in {transferFor?.ward?.name || "ward"} · bed{" "}
            {transferFor?.bedCode}
          </p>

          <CustomDropdown
            label="Move to ward"
            value={toWardId}
            options={wards.map((w) => ({
              label: `${w.name} (${
                (w.beds || []).filter((b) => b.status === "available").length
              } free)`,
              value: w._id,
            }))}
            onChange={(val) => {
              setToWardId(val);
              setToBed("");
            }}
            placeholder="Select destination ward…"
            isDark={isDark}
            colors={colors}
            border={ui.inner}
            searchable
          />

          <CustomDropdown
            label="Bed"
            value={toBed}
            options={(wards.find((w) => w._id === toWardId)?.beds || [])
              .filter((b) => b.status === "available")
              .map((b) => ({
                label: b.code,
                value: b.code,
              }))}
            onChange={(val) => setToBed(val)}
            placeholder={toWardId ? "Select free bed…" : "Select ward first…"}
            isDark={isDark}
            colors={colors}
            border={ui.inner}
          />

          <div>
            <label className="mb-2 block text-xs font-medium opacity-55">
              Reason
            </label>
            <textarea
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Enter transfer reason or clinical notes…"
              className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none border placeholder:opacity-40"
              style={{
                backgroundColor: ui.inner,
                color: ui.text,
                borderColor: ui.inner,
              }}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              onClick={closeTransfer}
              className="rounded-2xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: ui.inner }}
            >
              Cancel
            </button>
            <button
              onClick={doTransfer}
              disabled={transferring}
              className="rounded-2xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: PRIMARY_COLOR,
                boxShadow: `0 6px 16px ${PRIMARY_COLOR}30`,
              }}
            >
              {transferring ? "Transferring…" : "Transfer"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
