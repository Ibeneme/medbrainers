"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Pencil, Save, Search, ShieldCheck, X } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  clearActiveComplianceRule,
  fetchComplianceRule,
  fetchComplianceRules,
  fetchFacilityMembers,
  updateComplianceRule,
} from "@/api/slices";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import { Modal } from "@/components/ui/items";
import type { GuideItem } from "@/components/ui/PageGuide";
import PageFrame, { ErrorBanner, usePageUI } from "@/components/dashboard/PageFrame";
import {
  EmptyRules,
  RULES_HREF,
  RuleCard,
  RuleForm,
  editHref,
  formToUpdatePayload,
  ruleToForm,
  validateRuleForm,
  useCanManageCompliance,
  type RuleFormValues,
} from "@/components/compliance/compliance-ui";

const guideItems: GuideItem[] = [
  {
    title: "Pick a Rule",
    description: "Choose the rule you want to change from the list, or open it straight from the rules page.",
  },
  {
    title: "Only Changes Are Saved",
    description: "Edit any field. Only what you changed is sent, and every edit is kept in the rule's change history.",
  },
  {
    title: "Clearing a Field",
    description: "Empty a text box, date or owner to remove it. A new version number is created each time you save.",
  },
];

function EditInner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id") || "";
  const { showToast } = useToast();
  const { ui, border } = usePageUI();
  const { facilityId } = useFacilityId();
  const canManage = useCanManageCompliance();
  const { rules, active, listLoading, detailLoading, saving, error } = useAppSelector((s) => s.compliance);

  const [form, setForm] = useState<RuleFormValues | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!facilityId) return;
    if (id) {
      dispatch(fetchComplianceRule({ facilityId, ruleId: id }));
      dispatch(fetchFacilityMembers(facilityId));
    } else {
      dispatch(fetchComplianceRules({ facilityId, limit: 200 }));
    }
    return () => {
      dispatch(clearActiveComplianceRule());
    };
  }, [dispatch, facilityId, id]);

  // Load the saved rule into the form once it arrives (and reset if the id changes)
  useEffect(() => {
    if (id && active && active._id === id) setForm(ruleToForm(active));
    if (!id) setForm(null);
  }, [id, active?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const changes = useMemo(
    () => (form && active && active._id === id ? formToUpdatePayload(form, active) : {}),
    [form, active, id]
  );

  const onSubmit = () => {
    if (!form) return;
    const err = validateRuleForm(form);
    setLocalError(err);
    if (err) return;
    if (Object.keys(changes).length === 0) {
      showToast("You haven't changed anything yet", "error");
      return;
    }
    setConfirmOpen(true);
  };

  const save = async () => {
    if (!facilityId || !id) return;
    try {
      const res = await dispatch(updateComplianceRule({ facilityId, ruleId: id, payload: changes })).unwrap();
      showToast(res.unchanged ? "No changes to save" : res.message || "Compliance rule updated", "success");
      setConfirmOpen(false);
      router.push(RULES_HREF);
    } catch (e) {
      setConfirmOpen(false);
      setLocalError(typeof e === "string" ? e : "Could not update the compliance rule");
    }
  };

  const picker = rules.filter((r) => {
    const q = search.trim().toLowerCase();
    return !q || [r.code, r.title, r.regulatoryBody].filter(Boolean).some((x) => String(x).toLowerCase().includes(q));
  });

  const notFound = Boolean(id) && !detailLoading && !active && Boolean(error);

  return (
    <PageFrame
      title={id ? "Edit compliance rule" : "Choose a rule to edit"}
      subtitle={
        id ? "Update the rule's details. Changes are tracked in its history." : "Select the rule you want to change."
      }
      backHref={RULES_HREF}
      backLabel="Back to Compliance Rules"
      guideTitle="Edit Rule Guide"
      guideItems={guideItems}
      width={id ? "3xl" : "5xl"}
      loading={(id ? detailLoading && !form : listLoading && rules.length === 0) || (saving && !confirmOpen)}
      loadingText={saving ? "Saving rule..." : "Loading..."}
    >
      {!canManage ? (
        <div className="rounded-[28px] p-8 text-center space-y-2" style={{ backgroundColor: ui.card }}>
          <ShieldCheck className="mx-auto opacity-30" size={32} />
          <p className="text-sm font-medium">Only facility administrators can edit compliance rules</p>
        </div>
      ) : !id ? (
        <>
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
          {picker.length === 0 ? (
            <EmptyRules
              text="No compliance rules found"
              hint={search ? "Try a different keyword." : "Add a rule first, then you can edit it here."}
            />
          ) : (
            <div className="rounded-[28px] border overflow-hidden" style={{ backgroundColor: ui.card, borderColor: border }}>
              <div className="divide-y" style={{ borderColor: border }}>
                {picker.map((r) => (
                  <RuleCard
                    key={r._id}
                    rule={r}
                    view="list"
                    onClick={() => router.push(editHref(r._id))}
                    trailing={
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: PRIMARY_COLOR }}>
                        <Pencil size={13} /> Edit
                      </span>
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : notFound ? (
        <EmptyRules text="Rule not found" hint={error || "It may have been deleted."} />
      ) : form ? (
        <>
          <ErrorBanner message={localError || error} />
          {active && (
            <p className="text-xs opacity-60">
              Editing <span className="font-semibold">{active.code}</span> · version {active.version}
              {Object.keys(changes).length > 0 && ` · ${Object.keys(changes).length} unsaved change(s)`}
            </p>
          )}
          <RuleForm
            values={form}
            onChange={setForm}
            onSubmit={onSubmit}
            submitting={saving}
            submitLabel="Save Changes"
            submitIcon={<Save size={14} />}
          />
        </>
      ) : null}

      <Modal open={confirmOpen} title="Save changes?" onClose={() => !saving && setConfirmOpen(false)} ui={ui} maxWidth="max-w-sm">
        <p className="text-sm leading-relaxed opacity-75">
          You are updating <span className="font-medium">{active?.title}</span>. These fields will change:{" "}
          <span className="font-medium">{Object.keys(changes).join(", ")}</span>. The previous values stay in the change history.
        </p>
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
            onClick={save}
            className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Confirm & Save</span>
            )}
          </button>
        </div>
      </Modal>
    </PageFrame>
  );
}

export default function EditComplianceRulePage() {
  return (
    <Suspense fallback={null}>
      <EditInner />
    </Suspense>
  );
}
