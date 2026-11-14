"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Info,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  ModuleShell,
  EmptyState,
  useInputStyles,
} from "@/components/dashboard/ModuleShell";
import { Can } from "@/components/access/can";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  createAccessRole,
  deleteAccessRole,
  fetchAccessCatalog,
  fetchAccessRoles,
  fetchFacilityMembers,
  resetAccessRole,
  saveMemberAccess,
  updateAccessRole,
} from "@/api/slices";
import type { AccessCatalogModule, AccessRole } from "@/api/types";
import { useAccess } from "@/hooks/useAccess";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import { compactPermissions, expandPermissions } from "@/lib/access/expand";
import { MODULE_DEFS } from "@/lib/access/permissions";

/* ─────────────────────────── small shared pieces ─────────────────────────── */

interface ToggleSwitchProps {
  title?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

function ToggleSwitch({
  title,
  checked,
  onChange,
  label,
  description,
  disabled,
}: ToggleSwitchProps) {
  return (
    <label
      title={title}
      className={`flex items-center justify-between gap-3 select-none ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {(label || description) && (
        <div className="flex min-w-0 flex-col">
          {label && (
            <span className="truncate text-sm font-semibold">{label}</span>
          )}
          {description && (
            <span className="text-[11px] opacity-55">{description}</span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          backgroundColor: checked ? PRIMARY_COLOR : "rgba(150, 150, 150, 0.3)",
        }}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: `${PRIMARY_COLOR}1f`,
        color: PRIMARY_COLOR,
      }}
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
}

function Callout({
  children,
  dismissible,
}: {
  children: React.ReactNode;
  dismissible?: boolean;
}) {
  const { ui } = useInputStyles();
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-2xl px-4 py-3 text-xs leading-relaxed"
      style={{ backgroundColor: ui.inner }}
    >
      <Info
        size={14}
        className="mt-0.5 shrink-0"
        style={{ color: PRIMARY_COLOR }}
      />
      <div className="min-w-0 flex-1 opacity-80">{children}</div>
      {dismissible && (
        <button
          type="button"
          aria-label="Hide this tip"
          onClick={() => setHidden(true)}
          className="shrink-0 rounded-full p-1 opacity-50 transition hover:opacity-100"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function MatrixLegend({ mode }: { mode: "allow" | "deny" }) {
  const { ui } = useInputStyles();
  const accent = mode === "deny" ? "#ef4444" : PRIMARY_COLOR;
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3 text-[11px]"
      style={{ backgroundColor: ui.inner }}
    >
      <span className="font-semibold">How to read this</span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="rounded-full px-2 py-0.5 font-medium text-white"
          style={{ backgroundColor: accent }}
        >
          action
        </span>
        {mode === "deny" ? "blocked" : "allowed"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="rounded-full border px-2 py-0.5 font-medium"
          style={{ borderColor: ui.border }}
        >
          action
        </span>
        {mode === "deny" ? "not blocked" : "not allowed"}
      </span>
      {mode === "allow" && (
        <span className="inline-flex items-center gap-1.5">
          <Lock size={10} /> you can’t grant it because you don’t have it
        </span>
      )}
      <span className="opacity-70">
        The switch on the left turns a whole module on or off.
      </span>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  items,
  fullWidth,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { id: T; label: string; icon?: React.ReactNode }[];
  fullWidth?: boolean;
}) {
  const { ui } = useInputStyles();
  return (
    <div
      role="tablist"
      className={`inline-flex gap-1 rounded-full p-1 ${fullWidth ? "w-full" : ""}`}
      style={{ backgroundColor: ui.inner }}
    >
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
              fullWidth ? "flex-1" : ""
            } ${active ? "" : "opacity-60 hover:opacity-100"}`}
            style={{
              backgroundColor: active ? PRIMARY_COLOR : "transparent",
              color: active ? "#fff" : undefined,
            }}
          >
            {it.icon}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── permission matrix ─────────────────────────── */

function useCatalog(): AccessCatalogModule[] {
  const live = useAppSelector((s) => s.access.catalog);
  return useMemo(
    () =>
      live.length
        ? live
        : MODULE_DEFS.map((m) => ({
            key: m.key,
            label: m.label,
            group: m.group,
            actions: m.actions.map((a) => ({
              action: a,
              permission: `${m.key}.${a}`,
              description: "",
            })),
          })),
    [live],
  );
}

function PermissionMatrix({
  mode = "allow",
  value,
  onChange,
  disabled,
  canGrant,
}: {
  value: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
  canGrant: (perm: string) => boolean;
  mode?: "allow" | "deny";
}) {
  const catalog = useCatalog();
  const accent = mode === "deny" ? "#ef4444" : PRIMARY_COLOR;
  const { ui } = useInputStyles();
  const groups = useMemo(() => {
    const g = new Map<string, AccessCatalogModule[]>();
    for (const m of catalog) g.set(m.group, [...(g.get(m.group) ?? []), m]);
    return [...g.entries()];
  }, [catalog]);

  const toggle = (perm: string) => {
    const next = new Set(value);
    next.has(perm) ? next.delete(perm) : next.add(perm);
    onChange(next);
  };

  const toggleModule = (m: AccessCatalogModule) => {
    const perms = m.actions
      .map((a) => a.permission)
      .filter((p) => canGrant(p) || value.has(p));
    const all = perms.every((p) => value.has(p));
    const next = new Set(value);
    perms.forEach((p) => (all ? next.delete(p) : next.add(p)));
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <MatrixLegend mode={mode} />
      {groups.map(([group, mods]) => {
        const total = mods.reduce((n, m) => n + m.actions.length, 0);
        const on = mods.reduce(
          (n, m) => n + m.actions.filter((a) => value.has(a.permission)).length,
          0,
        );
        return (
          <section key={group}>
            <div
              className="sticky top-0 z-[1] mb-2 flex items-baseline justify-between gap-3 py-1.5"
              style={{ backgroundColor: ui.card }}
            >
              <h3 className="text-sm font-semibold">{group}</h3>
              <span className="text-[11px] opacity-55">
                {on} of {total} {mode === "deny" ? "blocked" : "allowed"}
              </span>
            </div>

            <div
              className="divide-y overflow-hidden rounded-2xl border"
              style={{ borderColor: ui.border }}
            >
              {mods.map((m) => {
                const modOn = m.actions.filter((a) =>
                  value.has(a.permission),
                ).length;
                const allOn = modOn === m.actions.length;
                return (
                  <div
                    key={m.key}
                    className="grid gap-3 px-4 py-3 md:grid-cols-[200px_1fr] md:items-center md:gap-5"
                    style={{
                      borderColor: ui.border,
                      backgroundColor: ui.inner,
                    }}
                  >
                    <ToggleSwitch
                      checked={allOn}
                      disabled={disabled}
                      onChange={() => toggleModule(m)}
                      title={`${mode === "deny" ? "Block" : "Allow"} everything in ${m.label} at once`}
                      label={m.label}
                      description={`${modOn} of ${m.actions.length} ${mode === "deny" ? "blocked" : "on"}`}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {m.actions.map((a) => {
                        const checked = value.has(a.permission);
                        const locked =
                          !disabled && !canGrant(a.permission) && !checked;
                        const off = disabled || locked;
                        return (
                          <button
                            key={a.permission}
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            disabled={off}
                            onClick={() => toggle(a.permission)}
                            title={
                              locked
                                ? "You can’t grant a permission you don’t hold"
                                : a.description ||
                                  (mode === "deny"
                                    ? `Block “${a.action}” in ${m.label}`
                                    : `Allow “${a.action}” in ${m.label}`)
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                              off
                                ? "cursor-not-allowed"
                                : "cursor-pointer hover:opacity-90"
                            } ${locked ? "opacity-35" : disabled && !checked ? "opacity-50" : ""}`}
                            style={{
                              borderColor: checked ? PRIMARY_COLOR : ui.border,
                              backgroundColor: checked
                                ? PRIMARY_COLOR
                                : "transparent",
                              color: checked ? "#fff" : undefined,
                            }}
                          >
                            {locked && <Lock size={10} />}
                            {a.action}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────── roles tab ─────────────────────────────── */

function RolesTab() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { facilityId } = useFacilityId();
  const { can } = useAccess();
  const { roles, rolesLoading, saving } = useAppSelector((s) => s.access);
  const { ui, inputCls, inputStyle } = useInputStyles();
  const canManage = can("access.manage");

  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [perms, setPerms] = useState<Set<string>>(new Set());

  const selected = roles.find((r) => r.id === selectedId) ?? null;

  const open = (r: AccessRole | "new") => {
    if (r === "new") {
      setSelectedId("new");
      setName("");
      setDescription("");
      setPerms(new Set());
    } else {
      setSelectedId(r.id);
      setName(r.name);
      setDescription(r.description ?? "");
      setPerms(expandPermissions(r.permissions));
    }
  };

  useEffect(() => {
    if (!selectedId && roles.length) open(roles[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles.length]);

  const readOnly = !canManage || (selected?.locked ?? false);
  const dirty =
    selectedId === "new" ||
    (selected &&
      (name !== selected.name ||
        description !== (selected.description ?? "") ||
        compactPermissions(perms).join() !==
          compactPermissions(expandPermissions(selected.permissions)).join()));

  const save = async () => {
    if (!facilityId) return;
    const permissions = compactPermissions(perms);
    const res =
      selectedId === "new"
        ? await dispatch(
            createAccessRole({
              facilityId,
              name: name.trim(),
              description: description.trim() || undefined,
              permissions,
            }),
          )
        : await dispatch(
            updateAccessRole({
              facilityId,
              roleId: selectedId as string,
              name: name.trim(),
              description: description.trim(),
              permissions,
            }),
          );
    if (res.meta.requestStatus === "fulfilled") {
      showToast("Role saved", "success");
      if (selectedId === "new") setSelectedId((res.payload as AccessRole).id);
    } else
      showToast((res.payload as string) || "Could not save the role", "error");
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* role list: horizontal scroller on mobile, sticky sidebar on desktop */}
      <aside className="lg:sticky lg:top-4">
        <Can perm="access.manage">
          <button
            type="button"
            onClick={() => open("new")}
            title="Create your own role with a custom set of permissions"
            className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus size={14} /> New role
          </button>
        </Can>
        {!rolesLoading && roles.length === 0 && selectedId !== "new" && (
          <Callout>
            No roles yet. Select <b>New role</b> to create one, then give it to
            people from the People tab.
          </Callout>
        )}
        {rolesLoading && (
          <p className="py-4 text-center text-xs opacity-50">Loading roles…</p>
        )}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:max-h-[calc(100vh-12rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:px-0">
          {selectedId === "new" && (
            <div
              className="min-w-[220px] shrink-0 rounded-2xl border border-dashed px-3.5 py-3 lg:min-w-0"
              style={{ borderColor: PRIMARY_COLOR, backgroundColor: ui.card }}
            >
              <span className="text-sm font-semibold">
                {name.trim() || "Untitled role"}
              </span>
              <span className="mt-0.5 block text-[11px] opacity-55">
                Not saved yet
              </span>
            </div>
          )}
          {roles.map((r) => {
            const active = selectedId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => open(r)}
                aria-current={active}
                className="min-w-[220px] shrink-0 rounded-2xl border px-3.5 py-3 text-left transition hover:opacity-90 lg:min-w-0"
                style={{
                  borderColor: active ? PRIMARY_COLOR : ui.border,
                  backgroundColor: active ? `${PRIMARY_COLOR}0f` : ui.card,
                  boxShadow: active
                    ? `inset 3px 0 0 ${PRIMARY_COLOR}`
                    : undefined,
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                    {r.locked && (
                      <Lock size={12} className="shrink-0 opacity-50" />
                    )}
                    <span className="truncate">{r.name}</span>
                  </span>
                  <span className="shrink-0 text-[11px] opacity-55">
                    {r.memberCount ?? 0}{" "}
                    {r.memberCount === 1 ? "person" : "people"}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] opacity-55">
                  {r.description ||
                    (r.isSystem ? "Built-in role" : "Custom role")}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* editor */}
      <div
        className="min-w-0 overflow-hidden rounded-[28px] border"
        style={{ borderColor: ui.border, backgroundColor: ui.card }}
      >
        {!selectedId ? (
          <div className="p-6">
            <EmptyState text="Select a role to see what it can do." />
          </div>
        ) : (
          <>
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  {selectedId === "new" ? "New role" : selected?.name}
                </h2>
                {selected && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: ui.inner }}
                  >
                    {selected.isSystem ? "Built-in" : "Custom"}
                  </span>
                )}
              </div>

              <Callout>
                {selectedId === "new"
                  ? "Name your role and choose what it can do. Once it’s created you can give it to people from the People tab."
                  : selected?.isSystem
                    ? "Built-in role: it comes with the system. You can change what it can do (and reset it to defaults), but not rename or delete it."
                    : "Custom role: you created it. Changes you save here apply to everyone who has this role."}
              </Callout>
              {!canManage && !selected?.locked && selectedId !== null && (
                <Callout>
                  You can look at this role, but changing it needs the “Manage
                  access” permission. Ask an administrator.
                </Callout>
              )}
              {selected?.locked && (
                <p
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-xs"
                  style={{ backgroundColor: ui.inner }}
                >
                  <Lock size={13} /> This role always has full access and can’t
                  be changed.
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold opacity-70">
                    Name
                  </label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={name}
                    disabled={readOnly || !!selected?.isSystem}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Radiology Viewer"
                  />
                  <p className="mt-1 text-[11px] opacity-55">
                    {selected?.isSystem
                      ? "Built-in roles can’t be renamed."
                      : "A short name people will recognise."}
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold opacity-70">
                    Description
                  </label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={description}
                    disabled={readOnly}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this role for?"
                  />
                  <p className="mt-1 text-[11px] opacity-55">
                    Optional. Say who this role is for.
                  </p>
                </div>
              </div>

              <div
                className="h-px w-full"
                style={{ backgroundColor: ui.border }}
              />

              <PermissionMatrix
                value={perms}
                onChange={setPerms}
                disabled={readOnly}
                canGrant={can}
              />
            </div>

            {!readOnly && (
              <div
                className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t px-5 py-3 backdrop-blur sm:px-6"
                style={{ borderColor: ui.border, backgroundColor: ui.card }}
              >
                <span className="mr-auto text-xs opacity-60">
                  {selectedId === "new" && name.trim().length < 2
                    ? "Enter a role name to create it"
                    : dirty
                      ? "You have unsaved changes. They only apply once you save."
                      : `${perms.size} permissions in this role`}
                </span>
                {selected?.isSystem && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      if (!facilityId || !selected) return;
                      const res = await dispatch(
                        resetAccessRole({ facilityId, roleId: selected.id }),
                      );
                      if (res.meta.requestStatus === "fulfilled") {
                        setPerms(
                          expandPermissions(
                            (res.payload as AccessRole).permissions,
                          ),
                        );
                        showToast("Role reset to defaults", "success");
                      } else
                        showToast(
                          (res.payload as string) || "Could not reset",
                          "error",
                        );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <RotateCcw size={13} /> Reset to defaults
                  </button>
                )}
                {selected && !selected.isSystem && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      if (!facilityId || !selected) return;
                      if (
                        !window.confirm(
                          `Delete “${selected.name}”? It will be removed from everyone who has it.`,
                        )
                      )
                        return;
                      const res = await dispatch(
                        deleteAccessRole({ facilityId, roleId: selected.id }),
                      );
                      if (res.meta.requestStatus === "fulfilled") {
                        setSelectedId(null);
                        showToast("Role deleted", "success");
                      } else
                        showToast(
                          (res.payload as string) || "Could not delete",
                          "error",
                        );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-red-500 transition hover:opacity-90"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
                  >
                    <Trash2 size={13} /> Delete role
                  </button>
                )}
                <button
                  type="button"
                  disabled={
                    saving ||
                    !dirty ||
                    (selectedId === "new" && name.trim().length < 2)
                  }
                  onClick={save}
                  className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  <Save size={13} />{" "}
                  {selectedId === "new" ? "Create role" : "Save changes"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── people tab ────────────────────────────── */

function MemberModal({
  member,
  onClose,
}: {
  member: any;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { facilityId } = useFacilityId();
  const { can } = useAccess();
  const { roles, saving } = useAppSelector((s) => s.access);
  const meId = useAppSelector((s) => s.auth.user?._id || s.auth.user?.id);
  const { ui } = useInputStyles();

  const memberId = String(member.id || member._id);
  const isSelf = String(meId) === memberId;
  const [roleIds, setRoleIds] = useState<Set<string>>(
    new Set(member.roleIds ?? []),
  );
  const [direct, setDirect] = useState<Set<string>>(
    expandPermissions(member.permissions ?? []),
  );
  const [denied, setDenied] = useState<Set<string>>(
    expandPermissions(member.deniedPermissions ?? []),
  );
  const [tab, setTab] = useState<"roles" | "grant" | "deny">("roles");

  const primary = roles.find((r) => r.isSystem && r.key === member.role);
  const effective = useMemo(() => {
    const all = new Set<string>(expandPermissions(primary?.permissions ?? []));
    roles
      .filter((r) => roleIds.has(r.id))
      .forEach((r) =>
        expandPermissions(r.permissions).forEach((p) => all.add(p)),
      );
    direct.forEach((p) => all.add(p));
    denied.forEach((p) => all.delete(p));
    return all;
  }, [primary, roles, roleIds, direct, denied]);

  const save = async () => {
    if (!facilityId) return;
    const res = await dispatch(
      saveMemberAccess({
        facilityId,
        memberId,
        roleIds: [...roleIds],
        permissions: [...direct].sort(),
        deniedPermissions: [...denied].sort(),
      }),
    );
    if (res.meta.requestStatus === "fulfilled") {
      showToast("Access updated", "success");
      dispatch(fetchFacilityMembers(facilityId));
      onClose();
    } else
      showToast((res.payload as string) || "Could not save access", "error");
  };

  const name =
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    member.email;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
        style={{ backgroundColor: ui.card, color: ui.text }}
      >
        {/* header */}
        <div
          className="flex items-center gap-3 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: ui.border }}
        >
          <Avatar name={name} size={44} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {name}
            </h2>
            <p className="truncate text-xs opacity-60">
              {member.email} · <span className="capitalize">{member.role}</span>
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-lg font-semibold leading-none">
              {effective.size}
            </p>
            <p className="mt-1 text-[11px] opacity-55">permissions in effect</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 transition hover:opacity-90"
            style={{ backgroundColor: ui.inner }}
          >
            <X size={14} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          {isSelf && (
            <p
              className="flex items-center gap-2 rounded-2xl px-4 py-3 text-xs"
              style={{ backgroundColor: ui.inner }}
            >
              <Lock size={13} /> You can’t change your own access. Ask another
              administrator.
            </p>
          )}

          <Segmented
            fullWidth
            value={tab}
            onChange={setTab}
            items={[
              { id: "roles", label: `Extra roles (${roleIds.size})` },
              { id: "grant", label: `Direct (${direct.size})` },
              { id: "deny", label: `Denied (${denied.size})` },
            ]}
          />

          <Callout>
            {tab === "roles"
              ? `${name} has the main role “${member.role}”, which sets the basics. Switch on extra roles to give more access without changing that. Greyed-out roles include permissions you don’t have yourself.`
              : tab === "grant"
                ? "Give this person individual permissions on top of their roles. Good for one-off exceptions."
                : "Take specific permissions away from this person. A denial always wins, even if one of their roles allows it."}
            <span className="mt-1 block opacity-70">
              Final access = main role + extra roles + direct permissions −
              denied.
            </span>
          </Callout>

          {tab === "roles" && (
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((r) => {
                const blocked =
                  [...expandPermissions(r.permissions)].some((p) => !can(p)) &&
                  !roleIds.has(r.id);
                const isAssigned = roleIds.has(r.id);
                const isDisabled = isSelf || blocked || r.key === member.role;
                return (
                  <div
                    key={r.id}
                    title={
                      blocked
                        ? "This role includes permissions you don’t hold"
                        : r.description
                    }
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${blocked ? "opacity-40" : ""}`}
                    style={{
                      borderColor: isAssigned ? PRIMARY_COLOR : ui.border,
                      backgroundColor: ui.inner,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {r.name}
                        {r.key === member.role && (
                          <span className="ml-1.5 text-[10px] font-medium opacity-60">
                            primary
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] opacity-55">
                        {r.isSystem ? "Built-in" : "Custom"}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={isAssigned}
                      disabled={isDisabled}
                      label={undefined}
                      onChange={() => {
                        const n = new Set(roleIds);
                        n.has(r.id) ? n.delete(r.id) : n.add(r.id);
                        setRoleIds(n);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {tab === "grant" && (
            <>
              <PermissionMatrix
                value={direct}
                onChange={setDirect}
                disabled={isSelf}
                canGrant={can}
              />
            </>
          )}

          {tab === "deny" && (
            <>
              <PermissionMatrix
                value={denied}
                onChange={setDenied}
                disabled={isSelf}
                canGrant={() => true}
                mode="deny"
              />
            </>
          )}
        </div>

        {/* footer */}
        <div
          className="flex items-center justify-end gap-2 border-t px-5 py-3 sm:px-6"
          style={{ borderColor: ui.border }}
        >
          <span className="mr-auto text-xs opacity-60 sm:hidden">
            {effective.size} in effect
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-xs font-semibold transition hover:opacity-90"
            style={{ backgroundColor: ui.inner }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || isSelf}
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Save size={13} /> Save access
          </button>
        </div>
      </div>
    </div>
  );
}

function PeopleTab() {
  const dispatch = useAppDispatch();
  const { facilityId, members, membersLoading } = useFacilityId();
  const { ui } = useInputStyles();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    if (facilityId) dispatch(fetchFacilityMembers(facilityId));
  }, [facilityId, dispatch]);

  useEffect(() => {
    const id =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("member")
        : null;
    if (id && members.length) {
      const m = (members as any[]).find((x) => String(x.id || x._id) === id);
      if (m) setEditing(m);
    }
  }, [members]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (members as any[]).filter(
      (m) =>
        !t ||
        [m.firstName, m.lastName, m.email, m.role]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(t),
    );
  }, [members, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people or roles"
            className="w-full rounded-full border py-2.5 pl-9 pr-4 text-sm outline-none transition"
            style={{
              borderColor: ui.border,
              backgroundColor: ui.inner,
              color: ui.text,
            }}
          />
        </div>
        <p className="text-xs opacity-55">
          {rows.length} {rows.length === 1 ? "person" : "people"}
        </p>
      </div>

      {membersLoading && (
        <p className="py-6 text-center text-xs opacity-50">Loading people…</p>
      )}
      {!membersLoading && rows.length === 0 && (
        <EmptyState text="No people found." />
      )}

      <div
        className="divide-y overflow-hidden rounded-[24px] border"
        style={{ borderColor: ui.border, backgroundColor: ui.card }}
      >
        {rows.map((m) => {
          const refs: { name: string; primary: boolean }[] =
            m.roleDetails ?? [];
          const fullName =
            [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;
          return (
            <div
              key={m.id || m._id}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-3.5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_auto_auto] md:gap-x-5"
              style={{ borderColor: ui.border }}
            >
              <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                <Avatar name={fullName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{fullName}</p>
                  <p className="truncate text-[11px] opacity-55">{m.email}</p>
                </div>
              </div>

              <Can perm="access.manage">
                <button
                  type="button"
                  onClick={() => setEditing(m)}
                  title={`Change roles and permissions for ${fullName}`}
                  className="row-start-1 col-start-3 rounded-full px-4 py-1.5 text-xs font-semibold transition hover:opacity-90 md:order-4 md:row-auto md:col-auto"
                  style={{ backgroundColor: ui.inner }}
                >
                  Edit access
                </button>
              </Can>

              <div className="col-span-3 flex flex-wrap items-center gap-1.5 md:col-span-1 md:col-start-2 md:row-start-1">
                {refs.map((r, i) => (
                  <span
                    key={i}
                    title={r.primary ? "Main role" : "Extra role"}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      backgroundColor: r.primary
                        ? `${PRIMARY_COLOR}22`
                        : ui.inner,
                      color: r.primary ? PRIMARY_COLOR : undefined,
                    }}
                  >
                    {r.name}
                  </span>
                ))}
                {(m.permissions?.length ?? 0) > 0 && (
                  <span
                    title={`${m.permissions.length} extra permissions given directly to this person`}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: ui.inner }}
                  >
                    +{m.permissions.length} direct
                  </span>
                )}
                {(m.deniedPermissions?.length ?? 0) > 0 && (
                  <span
                    title={`${m.deniedPermissions.length} permissions taken away from this person`}
                    className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-500"
                  >
                    −{m.deniedPermissions.length} denied
                  </span>
                )}
              </div>

              <span
                title={
                  "Total permissions after combining main role, extra roles and direct permissions, minus denied ones"
                }
                className="hidden whitespace-nowrap text-[11px] opacity-55 md:block"
              >
                {m.effectivePermissions?.length ?? 0} permissions
              </span>
            </div>
          );
        })}
      </div>

      {rows.length > 0 && (
        <p className="px-1 text-[11px] leading-relaxed opacity-60">
          Coloured tag = main role. Grey tag = extra role. “+n direct” =
          permissions given to just this person. “−n denied” = permissions taken
          away from them.
        </p>
      )}

      {editing && (
        <MemberModal member={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

/* ──────────────────────────────── page ─────────────────────────────────── */

export default function RolesAccessPage() {
  const dispatch = useAppDispatch();
  const { facilityId, members } = useFacilityId();
  const roles = useAppSelector((s) => s.access.roles);
  const [tab, setTab] = useState<"roles" | "people">("roles");

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchAccessCatalog(facilityId));
    dispatch(fetchAccessRoles(facilityId));
  }, [facilityId, dispatch]);

  return (
    <ModuleShell
      title="Roles & Access"
      subtitle="Who can see and do what"
      icon={ShieldCheck}
    >
      <Segmented
        value={tab}
        onChange={setTab}
        items={[
          {
            id: "roles",
            label: `Roles${roles.length ? ` (${roles.length})` : ""}`,
            icon: <ShieldCheck size={13} />,
          },
          {
            id: "people",
            label: `People${members?.length ? ` (${members.length})` : ""}`,
            icon: <Users size={13} />,
          },
        ]}
      />
      <Callout key={tab} dismissible>
        {tab === "roles"
          ? "A role is a named bundle of permissions, like “Receptionist” or “Lab Technician”. Create or edit roles here, then give them to people in the People tab."
          : "Select Edit access on a person to change what they can see and do. Everyone has a main role; you can add extra roles, give single permissions, or block specific ones."}
      </Callout>
      {tab === "roles" ? <RolesTab /> : <PeopleTab />}
    </ModuleShell>
  );
}
