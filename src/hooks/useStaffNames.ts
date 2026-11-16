"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/api/services";
import { useAppSelector } from "@/api/hooks";
import { useFacilityId } from "@/hooks/useFacilityId";
import type { FacilityMember } from "@/api/types";

/**
 * Resolve user ids (cashiers, actors in the audit log) to names.
 * Uses the members already in the store when present; otherwise asks the members endpoint once.
 * That endpoint needs a permission a read-only Financial Manager may not have — a refusal is expected and
 * silently ignored, in which case people are shown as "Staff member" instead of a raw id.
 */
export function useStaffNames() {
  const { facilityId } = useFacilityId();
  const stored = useAppSelector((s) => s.facilities.members);
  const [fetched, setFetched] = useState<Record<string, FacilityMember[]>>({});

  useEffect(() => {
    if (!facilityId || stored.length > 0 || fetched[facilityId]) return;
    let live = true;
    api
      .get(`/companies/${facilityId}/members`)
      .then((r) => live && setFetched((f) => ({ ...f, [facilityId]: (r.data?.data ?? []) as FacilityMember[] })))
      .catch(() => live && setFetched((f) => ({ ...f, [facilityId]: [] })));
    return () => {
      live = false;
    };
  }, [facilityId, stored.length, fetched]);

  const members = stored.length > 0 ? stored : (fetched[facilityId] ?? []);
  return useCallback(
    (id?: string | null) => {
      if (!id) return "—";
      const m = members.find((x) => x.id === id);
      return m ? `${m.firstName} ${m.lastName}`.trim() || m.email : "Staff member";
    },
    [members],
  );
}

export default useStaffNames;
