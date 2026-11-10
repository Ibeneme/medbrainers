"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { deleteComplianceRule, fetchComplianceRules, type ComplianceRule } from "@/api/slices";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import { Modal } from "@/components/ui/items";
import type { GuideItem } from "@/components/ui/PageGuide";
import PageFrame, {
  ErrorBanner,
  inputCls,
  labelCls,
  useInputStyle,
  usePageUI,
} from "@/components/dashboard/PageFrame";
import { EmptyRules, RULES_HREF, RuleCard, useCanManageCompliance } from "@/components/compliance/compliance-ui";

const guideItems: GuideItem[] = [
  {
    title: "History Is Kept",
    description:
      "A deleted rule disappears from every list, but its record is kept for auditors. Its code can be reused for a new rule.",
  },
  {
    title: "Give a Reason",
    description: "The reason is stored with the rule so there is a record of why it was removed.",
  },
  {
    title: "Only Paused?",
    description: "If a rule is only on hold, edit it and set the status to Suspended or Retired instead of deleting it.",
  },
];

function DeleteInner() {
  const dispatch = useAppDispatch();
  const params = useSearchParams();
  const preselect = params.get("id") || "";
  const { showToast } = useToast();
  const { ui, border } = usePageUI();
  const inputStyle = useInputStyle();
  const { facilityId } = useFacilityId();
  const canManage = useCanManageCompliance();
  const { rules, listLoading, saving, error } = useAppSelector((s) => s.compliance);

  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<ComplianceRule | null>(null);
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (facilityId) dispatch(fetchComplianceRules({ facilityId, limit: 200 }));
  }, [dispatch, facilityId]);

  // Open the confirm dialog straight away when arriving from a rule's "Delete" button
  useEffect(() => {
    if (opened.current || !preselect || !rules.length) return;
    const r = rules.find((x) => x._id === preselect);
    if (r) {
      opened.current = true;
      setTarget(r);
    }
  }, [preselect, rules]);

  const close = () => {
    if (saving) return;
    setTarget(null);
    setReason("");
    setLocalError(null);
  };

  const confirm = async () => {
    if (!facilityId || !target) return;
    try {
      const res = await dispatch(
        deleteComplianceRule({ facilityId, ruleId: target._id, reason: reason.trim() || undefined })
      ).unwrap();
      showToast(res.message || "Compliance rule deleted", "success");
      setTarget(null);
      setReason("");
      setLocalError(null);
    } catch (e) {
      setLocalError(typeof e === "string" ? e : "Could not delete the compliance rule");
    }
  };

  const list = rules.filter((r) => {
    const q = search.trim().toLowerCase();
    return !q || [r.code, r.title, r.regulatoryBody].filter(Boolean).some((x) => String(x).toLowerCase().includes(q));
  });

  return (
    <PageFrame
      title="Delete compliance rule"
      subtitle="Remove a rule your facility no longer needs to follow."
      backHref={RULES_HREF}
      backLabel="Back to Compliance Rules"
      guideTitle="Delete Rule Guide"
      guideItems={guideItems}
      loading={listLoading && rules.length === 0}
      loadingText="Loading compliance rules..."
    >
      {!canManage ? (
        <div className="rounded-[28px] p-8 text-center space-y-2" style={{ backgroundColor: ui.card }}>
          <ShieldCheck className="mx-auto opacity-30" size={32} />
          <p className="text-sm font-medium">Only facility administrators can delete compliance rules</p>
        </div>
      ) : (
        <>
          <ErrorBanner message={!target ? error : null} />
          <div
            className="flex items-center gap-2 w-full rounded-2xl border px-3.5 py-2.5"
            style={{ backgroundColor: ui.inner, borderColor: border }}
          >
            <Search size={15} className="opacity-50 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rules by title, code or regulator..."
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: ui.text }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="opacity-50 hover:opacity-100">
                <X size={14} />
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <EmptyRules text="No compliance rules found" hint={search ? "Try a different keyword." : "There is nothing to delete."} />
          ) : (
            <div className="rounded-[28px] border overflow-hidden" style={{ backgroundColor: ui.card, borderColor: border }}>
              <div className="divide-y" style={{ borderColor: border }}>
                {list.map((r) => (
                  <RuleCard
                    key={r._id}
                    rule={r}
                    view="list"
                    onClick={() => setTarget(r)}
                    trailing={
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500">
                        <Trash2 size={13} /> Delete
                      </span>
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={Boolean(target)} title="Delete this rule?" onClose={close} ui={ui} maxWidth="max-w-md">
        {target && (
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <Trash2 size={18} />
              </div>
              <p className="text-sm leading-relaxed opacity-75">
                <span className="font-medium">{target.title}</span> ({target.code}) will be removed from your compliance
                rules. Its record is kept for audit purposes.
              </p>
            </div>
            <div>
              <label className={labelCls}>Reason (optional)</label>
              <textarea
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Superseded by the 2026 regulation"
                className={`${inputCls} resize-none`}
                style={inputStyle}
              />
            </div>
            <ErrorBanner message={localError} />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={close}
                className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50"
                style={{ backgroundColor: ui.inner }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={confirm}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-2 bg-red-600"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete rule</span>
                )}
              </button>
            </div>
          </>
        )}
      </Modal>
    </PageFrame>
  );
}

export default function DeleteComplianceRulePage() {
  return (
    <Suspense fallback={null}>
      <DeleteInner />
    </Suspense>
  );
}
