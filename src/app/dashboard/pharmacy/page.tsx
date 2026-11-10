"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Pill,
  ClipboardList,
  PackageCheck,
  MessageSquareText,
  Boxes,
  BookOpen,
  CalendarClock,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Building2,
  Undo2,
  ShieldAlert,
  BarChart3,
  Settings,
  ChevronRight,
  Wallet,
  PackageX,
  Timer,
  Plus,
  ExternalLink,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { fetchPharmacyDashboard } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import {
  Alert,
  EmptyBox,
  PharmacyPage,
  PatientAvatar,
  Pill as StatusPill,
  PrimaryButton,
  StatCard,
  TableCard,
  Th,
  fmtDateTime,
  money,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

const SECTIONS = [
  {
    heading: "Dispensing",
    items: [
      {
        title: "e-Prescriptions Queue",
        href: "/dashboard/pharmacy/prescriptions",
        icon: ClipboardList,
        desc: "Verify and manage incoming prescriptions",
      },
      {
        title: "Dispensing & Refills",
        href: "/dashboard/pharmacy/dispense",
        icon: PackageCheck,
        desc: "FEFO dispensing with allergy screening",
      },
      {
        title: "Patient Counselling",
        href: "/dashboard/pharmacy/counselling",
        icon: MessageSquareText,
        desc: "Record counselling given at hand-over",
      },
    ],
  },
  {
    heading: "Stock",
    items: [
      {
        title: "Drug Inventory & Stock",
        href: "/dashboard/pharmacy/inventory",
        icon: Boxes,
        desc: "Live quantities per drug",
      },
      {
        title: "Drug Catalog & Pricing",
        href: "/dashboard/pharmacy/catalog",
        icon: BookOpen,
        desc: "Formulary, prices, reorder levels",
      },
      {
        title: "Batches & Expiry",
        href: "/dashboard/pharmacy/expiry",
        icon: CalendarClock,
        desc: "Expiry tracking and quarantine",
      },
      {
        title: "Low Stock Alerts",
        href: "/dashboard/pharmacy/low-stock",
        icon: AlertTriangle,
        desc: "Items at or below reorder level",
      },
    ],
  },
  {
    heading: "Procurement",
    items: [
      {
        title: "Purchase Orders",
        href: "/dashboard/pharmacy/purchase-orders",
        icon: ShoppingCart,
        desc: "Raise and track supplier orders",
      },
      {
        title: "Goods Received",
        href: "/dashboard/pharmacy/receiving",
        icon: Truck,
        desc: "Receive stock into batches",
      },
      {
        title: "Suppliers",
        href: "/dashboard/pharmacy/suppliers",
        icon: Building2,
        desc: "Supplier directory",
      },
    ],
  },
  {
    heading: "Compliance & Insight",
    items: [
      {
        title: "Returns & Adjustments",
        href: "/dashboard/pharmacy/adjustments",
        icon: Undo2,
        desc: "Damages, expiries, returns, corrections",
      },
      {
        title: "Controlled Substances Log",
        href: "/dashboard/pharmacy/controlled",
        icon: ShieldAlert,
        desc: "Running-balance narcotics register",
      },
      {
        title: "Pharmacy Reports",
        href: "/dashboard/pharmacy/reports",
        icon: BarChart3,
        desc: "Sales, top drugs, stock health",
      },
      {
        title: "Pharmacy Setup",
        href: "/dashboard/pharmacy/setup",
        icon: Settings,
        desc: "Licence, alerts and dispensing rules",
      },
    ],
  },
];

export default function PharmacyHomePage() {
  const { dispatch, facilityId, pharmacy } = usePharmacy();
  const { ui, softShadow } = usePharmacyUI();
  const { dashboard: d, listLoading, setup } = pharmacy;

  const load = () =>
    facilityId && dispatch(fetchPharmacyDashboard({ facilityId }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  return (
    <PharmacyPage
      routes={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Pharmacy & Dispensary" },
      ]}
      title={setup?.name || "Pharmacy & Dispensary"}
      description="Prescriptions, dispensing, stock, procurement and controlled-drug compliance in one place."
      icon={Pill}
      loading={listLoading && !d}
      loadingText="Loading pharmacy..."
      onRefresh={load}
      actions={
        <PrimaryButton
          href="/dashboard/pharmacy/prescriptions/select"
          icon={Plus}
        >
          New Prescription
        </PrimaryButton>
      }
    >
      {d && (d.expired > 0 || d.outOfStock > 0) && (
        <div className="space-y-2">
          {d.expired > 0 && (
            <Link
              href="/dashboard/pharmacy/expiry?filter=expired"
              className="block"
            >
              <Alert tone="danger">
                <strong>{d.expired}</strong> batch(es) on the shelf are past
                expiry — quarantine or write them off.
              </Alert>
            </Link>
          )}
          {d.outOfStock > 0 && (
            <Link href="/dashboard/pharmacy/low-stock" className="block">
              <Alert tone="warning">
                <strong>{d.outOfStock}</strong> drug(s) are out of stock.
              </Alert>
            </Link>
          )}
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Pending verification"
          value={d?.pendingRx ?? 0}
          color="#3b82f6"
          href="/dashboard/pharmacy/prescriptions"
        />
        <StatCard
          icon={PackageCheck}
          label="Ready to dispense"
          value={(d?.verifiedRx ?? 0) + (d?.partialRx ?? 0)}
          color={PRIMARY_COLOR}
          href="/dashboard/pharmacy/dispense"
        />
        <StatCard
          icon={Pill}
          label="Dispensed today"
          value={d?.dispensedToday ?? 0}
          color="#059669"
        />
        <StatCard
          icon={Wallet}
          label="Revenue today"
          value={money(d?.revenueToday)}
          color="#8b5cf6"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={d?.lowStock ?? 0}
          color="#d97706"
          href="/dashboard/pharmacy/low-stock"
        />
        <StatCard
          icon={PackageX}
          label="Out of stock"
          value={d?.outOfStock ?? 0}
          color="#dc2626"
          href="/dashboard/pharmacy/low-stock"
        />
        <StatCard
          icon={Timer}
          label="Expiring soon"
          value={d?.expiringSoon ?? 0}
          hint={d ? `within ${d.expiryAlertDays} days` : undefined}
          color="#ca8a04"
          href="/dashboard/pharmacy/expiry?filter=expiring"
        />
        <StatCard
          icon={Boxes}
          label="Stock value (cost)"
          value={money(d?.inventoryValue)}
          hint={`${d?.totalDrugs ?? 0} drugs in catalog`}
          color="#0ea5e9"
          href="/dashboard/pharmacy/inventory"
        />
      </div>

      {/* Module sections */}
      {SECTIONS.map((sec) => (
        <section key={sec.heading} className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">
            {sec.heading}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sec.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="group space-y-3 rounded-3xl p-5 transition-all hover:-translate-y-0.5 hover:opacity-95"
                style={{ backgroundColor: ui.card, boxShadow: softShadow }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${PRIMARY_COLOR}18`,
                    color: PRIMARY_COLOR,
                  }}
                >
                  <it.icon size={21} />
                </span>
                <div>
                  <p className="font-semibold tracking-tight">{it.title}</p>
                  <p className="mt-1 text-xs opacity-55">{it.desc}</p>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold"
                  style={{ color: PRIMARY_COLOR }}
                >
                  Open <ChevronRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Recent dispensing */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">
          Recent dispensing
        </h2>
        {!d || d.recentDispenses.length === 0 ? (
          <EmptyBox
            icon={Pill}
            title="Nothing dispensed yet."
            hint="Verified prescriptions you dispense will show up here."
          />
        ) : (
          <TableCard>
            <thead>
              <tr className="border-b" style={{ borderColor: ui.inner }}>
                <Th>Patient</Th>
                <Th>Ref</Th>
                <Th className="hidden sm:table-cell">Items</Th>
                <Th className="hidden md:table-cell">When</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {d.recentDispenses.map((x) => {
                const p: any = x.patient;
                return (
                  <tr
                    key={x._id}
                    className="border-b last:border-0"
                    style={{ borderColor: ui.inner }}
                  >
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <PatientAvatar p={p} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">
                            {p?.firstName} {p?.lastName}
                          </p>
                          {p?.mrn && (
                            <p className="text-[11px] opacity-50">
                              MRN: {p.mrn}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-block rounded-full px-2.5 py-1 font-mono text-[11px]"
                        style={{ backgroundColor: ui.inner }}
                      >
                        {x.dispenseNumber}
                      </span>{" "}
                      <StatusPill status={x.type} />
                    </td>
                    <td className="hidden px-3 py-3.5 text-xs opacity-70 sm:table-cell">
                      {x.items
                        .map((i) => `${i.drugName} ×${i.quantity}`)
                        .join(", ")}
                    </td>
                    <td className="hidden px-3 py-3.5 text-xs opacity-60 md:table-cell">
                      {fmtDateTime(x.dispensedAt)}
                    </td>
                    <td className="px-3 py-3.5 text-right text-xs font-semibold">
                      {money(x.totalAmount)}
                      {x.prescription && typeof x.prescription !== "string" && (
                        <Link
                          href={`/dashboard/pharmacy/prescriptions/${x.prescription._id}`}
                          className="ml-2 inline-flex opacity-60 hover:opacity-100"
                        >
                          <ExternalLink size={12} />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableCard>
        )}
      </section>
    </PharmacyPage>
  );
}
