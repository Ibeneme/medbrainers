"use client";

import { ReactNode } from "react";
import {
  Btn, Card, ENUMS, GROUP_OPTS, GroupBadge, KV, KVGrid, Pill, SpecForm, clean, label, nameOf, toOpts,
  useConfirm, useForm, type SectionSpec,
} from "./bb-ui";

/**
 * Shared record + confirm grouping screen used by donations and patient requests.
 * Recording and confirming are separate steps so two people check every result.
 */
export default function GroupingEditor({
  title, subtitle, backHref, grouping, expected, expectedLabel, saving, extra, onRecord, onConfirm,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  backHref: string;
  grouping: any;
  expected?: string;
  expectedLabel?: string;
  saving?: boolean;
  extra?: ReactNode;
  onRecord: (payload: any) => Promise<unknown>;
  onConfirm: () => Promise<unknown>;
}) {
  const g = grouping || {};
  const { ask, node } = useConfirm();
  const form = useForm<any>({
    group: "", method: "gel_card", weakD: false, antibodyScreen: "negative", antibodies: "",
    acknowledge: false, notes: "",
  });
  const mismatch = !!expected && !!form.v.group && expected !== form.v.group;

  const sections: SectionSpec[] = [
    {
      title: g.status && g.status !== "pending" ? "Record a repeat result" : "Record grouping result",
      fields: [
        { key: "group", label: "ABO / Rh group", type: "select", required: true, options: GROUP_OPTS },
        { key: "method", label: "Method", type: "select", options: toOpts(ENUMS.groupingMethods) },
        { key: "antibodyScreen", label: "Antibody screen", type: "select", options: toOpts(ENUMS.antibodyScreens) },
        { key: "antibodies", label: "Antibodies identified", placeholder: "e.g. anti-K, anti-E (comma separated)", show: (v) => v.antibodyScreen === "positive" },
        { key: "weakD", type: "toggle", label: "Weak D detected", span: 2 },
        {
          key: "acknowledge", type: "toggle", span: 2, label: "Acknowledge discrepancy with the group on record",
          hint: `This result differs from ${expectedLabel || "the group on record"} (${expected}). Repeat the test first; only acknowledge if the result stands.`,
          show: () => mismatch,
        },
        {
          key: "notes", label: mismatch ? "Explain the discrepancy (min 10 characters)" : "Notes", type: "textarea", span: 2,
          required: mismatch && form.v.acknowledge,
        },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={backHref}
      title={title}
      subtitle={subtitle}
      submitLabel="Record result"
      saving={saving}
      canSubmit={!mismatch || form.v.acknowledge}
      top={
        <>
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Current status</h2>
              <Pill value={g.status || "pending"} />
            </div>
            <div className="flex items-center gap-4">
              <GroupBadge group={g.group} size="lg" />
              <KVGrid cols={2}>
                <KV label="Method">{label(g.method)}</KV>
                <KV label="Antibody screen">{label(g.antibodyScreen)}</KV>
                <KV label="Recorded by">{nameOf(g.performedBy)}</KV>
                <KV label="Confirmed by">{nameOf(g.confirmedBy)}</KV>
                {expected && <KV label={expectedLabel || "On record"}>{expected}</KV>}
              </KVGrid>
            </div>
            {g.status === "recorded" && (
              <Btn
                tone="primary"
                onClick={() =>
                  ask({
                    title: "Confirm grouping",
                    message: `Confirm ${g.group} as the verified group? A different person from whoever recorded it must confirm. This cannot be undone.`,
                    confirmLabel: "Confirm result",
                    tone: "primary",
                    onConfirm: async () => { await onConfirm(); },
                  })
                }
              >
                Confirm {g.group} (second check)
              </Btn>
            )}
          </Card>
          {extra}
          {node}
        </>
      }
      onSubmit={async (v) => {
        const payload = clean({
          group: v.group, method: v.method, weakD: v.weakD || undefined, antibodyScreen: v.antibodyScreen,
          antibodies: v.antibodyScreen === "positive" && v.antibodies ? v.antibodies.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
          acknowledgeDiscrepancy: mismatch && v.acknowledge ? true : undefined,
          notes: v.notes,
        });
        await onRecord(payload);
      }}
    />
  );
}
