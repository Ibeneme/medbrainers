"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  clearActiveComplianceRule,
  fetchComplianceRules,
  type ComplianceRule,
} from "@/api/slices";
import { useFacilityId } from "@/hooks/useFacilityId";
import { CustomDropdown } from "@/components/ui";
import type { GuideItem } from "@/components/ui/PageGuide";
import PageFrame, { PrimaryLink, usePageUI } from "@/components/dashboard/PageFrame";
import {
  CATEGORY_OPTIONS,
  EmptyRules,
  NEW_HREF,
  RuleCard,
  RuleDetailModal,
  SEVERITY_OPTIONS,
  STATUS_OPTIONS,
  categoryLabel,
  dueState,
  useCanManageCompliance,
} from "@/components/compliance/compliance-ui";

const ALL = { label: "All", value: "" };

const guideItems: GuideItem[] = [
  {
    title: "View Rule Details",
    description:
      "Click any rule to see what is required, the evidence an auditor expects, who owns it, and its full change history.",
  },
  {
    title: "Spot What Needs Attention",
    description:
      "Rules that have expired, are overdue for review, or are due within 30 days are tagged so nothing slips past an audit.",
  },
  {
    title: "Search & Filter",
    description: "Filter by title, code, regulator, category, severity or status. Tags are searchable too.",
  },
  {
    title: "Who Can Change Rules",
    description:
      "Everyone in the facility can read the rules. Only the CEO, admins and managers can add, edit or delete them.",
  },
];

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  const { ui, border } = usePageUI();
  return (
    <div className="rounded-2xl border p-3.5 flex items-center gap-3" style={{ backgroundColor: ui.card, borderColor: border }}>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color || PRIMARY_COLOR}1f`, color: color || PRIMARY_COLOR }}
      >
        <Icon size={16} />
      </span>
      <div>
        <p className="text-xl font-semibold leading-none">{value}</p>
        <p className="text-[11px] opacity-60 mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function ComplianceRulesPage() {
  const dispatch = useAppDispatch();
  const { ui, isDark, colors, border } = usePageUI();
  const { facilityId } = useFacilityId();
  const canManage = useCanManageCompliance();

  const { rules, meta, listLoading, error } = useAppSelector((s) => s.compliance);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<ComplianceRule | null>(null);

  useEffect(() => {
    if (facilityId) dispatch(fetchComplianceRules({ facilityId, limit: 200 }));
  }, [dispatch, facilityId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rules.filter((r) => {
      if (category && r.category !== category) return false;
      if (severity && r.severity !== severity) return false;
      if (status && r.status !== status) return false;
      if (!q) return true;
      return [r.code, r.title, r.description, r.regulatoryBody, r.reference, categoryLabel(r.category), ...(r.tags || [])]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q));
    });
  }, [rules, search, category, severity, status]);

  const stats = useMemo(
    () => ({
      active: rules.filter((r) => r.status === "active").length,
      critical: rules.filter((r) => (r.severity === "critical" || r.severity === "high") && r.status === "active").length,
      attention: rules.filter((r) => dueState(r)).length,
    }),
    [rules]
  );

  const dd = { isDark, colors, border };
  const hasFilter = Boolean(search || category || severity || status);

  return (
    <PageFrame
      title="Compliance Rules"
      subtitle="Regulatory and internal rules your facility must follow, with owners and review dates."
      backHref="/dashboard/workspace"
      backLabel="Back to Workspace"
      guideTitle="Compliance Guide"
      guideItems={guideItems}
      loading={listLoading && rules.length === 0}
      loadingText="Loading compliance rules..."
      actions={
        canManage ? (
          <PrimaryLink href={NEW_HREF} icon={<Plus size={15} />}>
            Add Rule
          </PrimaryLink>
        ) : undefined
      }
    >
      {error && (
        <p className="rounded-2xl px-4 py-3 text-xs font-semibold text-red-500" style={{ backgroundColor: "rgba(239,68,68,0.1)" }} role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat icon={ShieldCheck} label="Active rules" value={stats.active} />
        <Stat icon={AlertTriangle} label="High / critical" value={stats.critical} color="#dc2626" />
        <Stat icon={CalendarClock} label="Need attention" value={stats.attention} color="#d97706" />
      </div>

      {/* Search & view mode */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div
          className="flex items-center gap-2 w-full rounded-2xl border px-3.5 py-2.5"
          style={{ backgroundColor: ui.inner, borderColor: border }}
        >
          <Search size={15} className="opacity-50 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, code, regulator or tag..."
            className="w-full bg-transparent text-xs outline-none"
            style={{ color: ui.text }}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="opacity-50 hover:opacity-100">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center rounded-2xl border p-1 shrink-0" style={{ backgroundColor: ui.inner, borderColor: border }}>
          {(
            [
              ["grid", LayoutGrid, "Grid view"],
              ["list", ListIcon, "List view"],
            ] as const
          ).map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-label={label}
              className="flex h-8 w-8 items-center justify-center rounded-xl transition"
              style={{
                backgroundColor: viewMode === mode ? PRIMARY_COLOR : "transparent",
                color: viewMode === mode ? "#fff" : ui.text,
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CustomDropdown value={category} options={[{ ...ALL, label: "All categories" }, ...CATEGORY_OPTIONS]} onChange={setCategory} placeholder="All categories" {...dd} />
        <CustomDropdown value={severity} options={[{ ...ALL, label: "All severities" }, ...SEVERITY_OPTIONS]} onChange={setSeverity} placeholder="All severities" {...dd} />
        <CustomDropdown value={status} options={[{ ...ALL, label: "All statuses" }, ...STATUS_OPTIONS]} onChange={setStatus} placeholder="All statuses" {...dd} />
      </div>

      {hasFilter && (
        <p className="text-[11px] opacity-60 -mt-2">
          Showing {filtered.length} of {rules.length} rules
        </p>
      )}
      {meta && meta.total > rules.length && (
        <p className="text-[11px] opacity-60 -mt-2">
          Showing the first {rules.length} of {meta.total} rules. Use search to narrow down.
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyRules
          text="No compliance rules found"
          hint={
            hasFilter
              ? "Try a different keyword or clear the filters."
              : canManage
              ? "Get started by adding your first compliance rule."
              : "No rules have been added to this facility yet."
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <RuleCard key={r._id} rule={r} view="grid" onClick={() => setSelected(r)} />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border overflow-hidden" style={{ backgroundColor: ui.card, borderColor: border }}>
          <div className="divide-y" style={{ borderColor: border }}>
            {filtered.map((r) => (
              <RuleCard key={r._id} rule={r} view="list" onClick={() => setSelected(r)} />
            ))}
          </div>
        </div>
      )}

      <RuleDetailModal
        rule={selected}
        canManage={canManage}
        onClose={() => {
          setSelected(null);
          dispatch(clearActiveComplianceRule());
        }}
      />
    </PageFrame>
  );
}
