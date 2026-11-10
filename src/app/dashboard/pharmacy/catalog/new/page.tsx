"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, X } from "lucide-react";
import { createDrug, fetchDrugs, fetchPharmacySetup } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { PRIMARY_COLOR } from "@/constants/colors";
import DrugForm from "@/components/dashboard/pharmacy/DrugForm";
import { ConfirmModal } from "@/components/ui/items";
import {
  PharmacyPage,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

const DRAFTS_COOKIE = "emr_new_drug_drafts_v2";

type DraftTab = {
  id: string;
  name: string;
  data: any;
};

export default function NewDrugPage() {
  const router = useRouter();
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui, isDark, colors, border, softShadow } = usePharmacyUI();

  const [drafts, setDrafts] = useState<DraftTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("new-1");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [tabToDiscard, setTabToDiscard] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchPharmacySetup({ facilityId }));
    dispatch(fetchDrugs({ facilityId, includeInactive: true }));
  }, [dispatch, facilityId]);

  // Load drafts from cookies on mount
  useEffect(() => {
    try {
      const match = document.cookie.match(
        new RegExp("(^| )" + DRAFTS_COOKIE + "=([^;]+)")
      );
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[2]));
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDrafts(parsed);
          setActiveTabId(parsed[0].id);
        } else {
          setDrafts([{ id: "new-1", name: "New Drug 1", data: null }]);
          setActiveTabId("new-1");
        }
      } else {
        setDrafts([{ id: "new-1", name: "New Drug 1", data: null }]);
        setActiveTabId("new-1");
      }
    } catch {
      setDrafts([{ id: "new-1", name: "New Drug 1", data: null }]);
      setActiveTabId("new-1");
    }
    setDraftLoaded(true);
  }, []);

  const saveDraftsToCookie = (updatedDrafts: DraftTab[]) => {
    const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${DRAFTS_COOKIE}=${encodeURIComponent(
      JSON.stringify(updatedDrafts)
    )}; expires=${expires}; path=/; SameSite=Lax${secure}`;
  };

  const handleSaveCurrentDraft = (formData: any) => {
    const updated = drafts.map((d) => {
      if (d.id === activeTabId) {
        const tabName = formData.genericName
          ? `Draft: ${formData.genericName}`
          : d.name;
        return { ...d, name: tabName, data: formData };
      }
      return d;
    });
    setDrafts(updated);
    saveDraftsToCookie(updated);
  };

  const handleAddNewTab = () => {
    const newId = `new-${Date.now()}`;
    const newName = `New Drug ${drafts.length + 1}`;
    const updated = [...drafts, { id: newId, name: newName, data: null }];
    setDrafts(updated);
    setActiveTabId(newId);
    saveDraftsToCookie(updated);
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (drafts.length === 1) {
      // Don't close the last tab, just reset it
      const updated = [{ id: "new-1", name: "New Drug 1", data: null }];
      setDrafts(updated);
      setActiveTabId("new-1");
      saveDraftsToCookie(updated);
      return;
    }
    setTabToDiscard(id);
    setShowDiscardModal(true);
  };

  const confirmDiscardTab = () => {
    if (!tabToDiscard) return;
    const remaining = drafts.filter((d) => d.id !== tabToDiscard);
    setDrafts(remaining);
    if (activeTabId === tabToDiscard) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
    saveDraftsToCookie(remaining);
    setShowDiscardModal(false);
    setTabToDiscard(null);
  };

  if (!draftLoaded) return null;

  const currentDraft = drafts.find((d) => d.id === activeTabId) || drafts[0];

  return (
    <>
      <PharmacyPage
        narrow
        routes={[
          { label: "Pharmacy", href: "/dashboard/pharmacy" },
          { label: "Drug Catalog", href: "/dashboard/pharmacy/catalog" },
          { label: "Add Drug" },
        ]}
        title="Add Drug to Catalog"
        description="Create a formulary item with pricing, reorder level and regulatory flags. Stock is added later through Goods Received."
        icon={BookOpen}
      >
        {/* Draft tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto py-1.5 px-1 -mx-1 scrollbar-none">
          {drafts.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveTabId(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setActiveTabId(tab.id);
                }}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold outline-none transition-all ${
                  isActive ? "" : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: isActive ? PRIMARY_COLOR : ui.card,
                  color: isActive ? "#FFFFFF" : ui.text,
                  boxShadow: isActive
                    ? `0 4px 14px ${PRIMARY_COLOR}40`
                    : softShadow,
                }}
              >
                <span className="max-w-[140px] truncate">{tab.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  aria-label="Close tab"
                  className="flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-black/15"
                  title="Close tab"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={handleAddNewTab}
            aria-label="New draft tab"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-80"
            style={{
              backgroundColor: ui.card,
              color: PRIMARY_COLOR,
              boxShadow: softShadow,
            }}
            title="New draft tab"
          >
            <Plus size={15} />
          </button>
        </div>

        <DrugForm
          key={currentDraft.id}
          initial={currentDraft.data}
          saving={pharmacy.saving}
          submitLabel="Create Drug"
          defaultReorder={pharmacy.setup?.settings?.defaultReorderLevel ?? 20}
          categories={Array.from(
            new Set(pharmacy.drugs.map((d) => d.category))
          )}
          onSaveDraft={handleSaveCurrentDraft}
          onDiscardDraft={() => {
            setTabToDiscard(currentDraft.id);
            setShowDiscardModal(true);
          }}
          placeholders={{
            code: "e.g. AMX500",
            genericName: "e.g. Amoxicillin",
            brandName: "e.g. Amoxil",
            category: "Select or type category...",
            form: "Select form...",
            strength: "e.g. 500mg",
            route: "Select route...",
            dispensingUnit: "e.g. tablet, bottle, vial",
            manufacturer: "e.g. PharmaCorp Ltd",
            barcode: "e.g. 5012345678900",
            sellingPrice: "0.00",
            costPrice: "0.00",
            reorderLevel: "20",
            storageConditions: "e.g. Store below 25°C, protect from light",
            notes: "Add any additional formulary or regulatory notes here...",
          }}
          onSubmit={async (payload) => {
            const res = await act(createDrug({ facilityId, payload }));
            if (res) {
              // Remove successful tab from drafts
              const remaining = drafts.filter((d) => d.id !== currentDraft.id);
              if (remaining.length === 0) {
                remaining.push({ id: "new-1", name: "New Drug 1", data: null });
              }
              setDrafts(remaining);
              saveDraftsToCookie(remaining);
              router.push("/dashboard/pharmacy/catalog");
            }
          }}
        />
      </PharmacyPage>

      <ConfirmModal
        state={
          showDiscardModal
            ? {
                title: "Close draft tab?",
                message:
                  "Are you sure you want to close and discard this draft tab? Any unsaved changes will be lost.",
                confirmLabel: "Yes, discard",
                tone: "danger",
                onConfirm: async () => confirmDiscardTab(),
              }
            : null
        }
        busy={false}
        onCancel={() => {
          setShowDiscardModal(false);
          setTabToDiscard(null);
        }}
        onConfirm={confirmDiscardTab}
        ui={{
          isDark,
          page: colors.shadeBgSecond,
          card: colors.bg,
          inner: colors.shadeBgSecond,
          text: colors.text,
          border,
        }}
      />
    </>
  );
}
