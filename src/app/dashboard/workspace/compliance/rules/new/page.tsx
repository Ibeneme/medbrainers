"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { createComplianceRule, fetchComplianceRules, fetchFacilityMembers } from "@/api/slices";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import { Modal } from "@/components/ui/items";
import type { GuideItem } from "@/components/ui/PageGuide";
import PageFrame, { ErrorBanner, usePageUI } from "@/components/dashboard/PageFrame";
import {
  EMPTY_RULE_FORM,
  RULES_HREF,
  RuleForm,
  categoryLabel,
  formToCreatePayload,
  validateRuleForm,
  useCanManageCompliance,
  type RuleFormValues,
} from "@/components/compliance/compliance-ui";

const guideItems: GuideItem[] = [
  {
    title: "Rule Code & Title",
    description: "Give the rule a short unique code (e.g. CTRL-001) and a clear title everyone will recognise in an audit.",
  },
  {
    title: "Severity & Obligation",
    description:
      "Severity says how serious a breach would be. Mark a rule Mandatory when it comes from law or a regulator, Recommended for best practice.",
  },
  {
    title: "Regulator & Reference",
    description: "Record who issued the rule (e.g. NAFDAC, MDCN) and the clause, so the source can be checked later.",
  },
  {
    title: "Dates & Owner",
    description: "Set the next review date and an owner. Rules past their review or expiry date are flagged on the rules page.",
  },
];

export default function NewComplianceRulePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { showToast } = useToast();
  const { ui } = usePageUI();
  const { facilityId } = useFacilityId();
  const canManage = useCanManageCompliance();
  const saving = useAppSelector((s) => s.compliance.saving);

  const [form, setForm] = useState<RuleFormValues>(EMPTY_RULE_FORM);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (facilityId) dispatch(fetchFacilityMembers(facilityId));
  }, [dispatch, facilityId]);

  const onSubmit = () => {
    const err = validateRuleForm(form);
    setLocalError(err);
    if (!err) setConfirmOpen(true);
  };

  const create = async () => {
    if (!facilityId) return;
    try {
      const res = await dispatch(createComplianceRule({ facilityId, payload: formToCreatePayload(form) })).unwrap();
      showToast(res.message || "Compliance rule added", "success");
      dispatch(fetchComplianceRules({ facilityId, limit: 200 }));
      setConfirmOpen(false);
      router.push(RULES_HREF);
    } catch (e) {
      setConfirmOpen(false);
      setLocalError(typeof e === "string" ? e : "Could not add the compliance rule");
    }
  };

  return (
    <PageFrame
      title="Add compliance rule"
      subtitle="Record a regulatory or internal rule your facility must follow."
      backHref={RULES_HREF}
      backLabel="Back to Compliance Rules"
      guideTitle="Add Rule Guide"
      guideLabel="Need help adding a rule?"
      guideItems={guideItems}
      width="3xl"
      loading={saving && !confirmOpen}
      loadingText="Saving rule..."
    >
      {!canManage ? (
        <div className="rounded-[28px] p-8 text-center space-y-2" style={{ backgroundColor: ui.card }}>
          <ShieldCheck className="mx-auto opacity-30" size={32} />
          <p className="text-sm font-medium">Only facility administrators can add compliance rules</p>
          <p className="text-xs opacity-60">Ask your CEO, admin or manager to add it for you.</p>
        </div>
      ) : (
        <>
          <ErrorBanner message={localError} />
          <RuleForm
            values={form}
            onChange={setForm}
            onSubmit={onSubmit}
            submitting={saving}
            submitLabel="Add Rule"
            submitIcon={<Sparkles size={14} />}
          />
        </>
      )}

      <Modal open={confirmOpen} title="Add this rule?" onClose={() => !saving && setConfirmOpen(false)} ui={ui} maxWidth="max-w-sm">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${PRIMARY_COLOR}1f`, color: PRIMARY_COLOR }}
          >
            <ShieldCheck size={18} />
          </div>
          <p className="text-sm leading-relaxed opacity-75">
            <span className="font-medium">{form.title.trim()}</span> ({form.code.trim().toUpperCase()}) will be added
            {form.category ? ` under ${categoryLabel(form.category)}` : ""} with {form.severity} severity.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => setConfirmOpen(false)}
            className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50"
            style={{ backgroundColor: ui.inner }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={create}
            className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Confirm & Add</span>
            )}
          </button>
        </div>
      </Modal>
    </PageFrame>
  );
}
