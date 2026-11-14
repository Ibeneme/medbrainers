"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { fetchTeleIceServers } from "@/api/slices/telemedicineSlice";
import { useTelemedicine } from "@/hooks/useTelemedicine";
import { TelehealthRoom } from "@/components/telemedicine/TelehealthRoom";
import { TM } from "@/components/telemedicine/tm-ui";
import { SITE } from "@/constants/site";

function PoweredBy() {
  return (
    <div className="flex flex-col items-center gap-1.5 py-4">
      <p className="text-[10px] uppercase tracking-[0.14em] opacity-30">
        Powered by
      </p>
      <div className="flex items-center gap-2">
        {SITE.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={SITE.logo}
            alt={SITE.name}
            width={80}
            height={16}
            className="h-3.5 w-auto object-contain opacity-50"
          />
        )}
        <span className="text-xs font-semibold tracking-tight opacity-45">
          {SITE.name}
        </span>
      </div>
    </div>
  );
}

export default function StaffRoomPage() {
  const { roomCode } = useParams() as { roomCode: string };
  const { facilityId, dispatch, telemedicine, activeFacility } =
    useTelemedicine();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!facilityId) return;
    let on = true;
    dispatch(fetchTeleIceServers({ facilityId })).finally(() => {
      if (on) setReady(true);
    });
    return () => {
      on = false;
    };
  }, [dispatch, facilityId]);

  if (!facilityId) {
    return (
      <p className="p-8 text-sm">Select a facility before joining a visit.</p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-3 py-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs opacity-50">{activeFacility?.name}</p>
          <h1 className="text-2xl font-medium">Video visit</h1>
        </div>
        <Link href={TM} className="text-xs font-semibold">
          Back to consultations
        </Link>
      </div>

      {ready ? (
        <TelehealthRoom
          roomCode={decodeURIComponent(roomCode)}
          iceServers={telemedicine.iceServers}
        />
      ) : (
        <p className="text-sm opacity-60">Preparing the room…</p>
      )}

      <PoweredBy />
    </div>
  );
}
