"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  UserPlus,
  Mail,
  Shield,
  RefreshCw,
  Loader2,
  Check,
  X,
  LogOut,
  Globe,
  Briefcase,
  Crown,
  UserCheck,
  AlertTriangle,
  UserMinus,
  Phone,
  MapPin,
  Upload,
  Crop,
  Trash2,
  Info,
  Send,
  Edit2,
  Save,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchFacility,
  fetchFacilityMembers,
  fetchFacilityMemberDetail,
  inviteToFacility,
  fetchOutgoingInvites,
  resendFacilityInvite,
  retractFacilityInvite,
  updateFacility,
  uploadFacilityLogo,
  updateFacilityMember,
  removeFacilityMember,
  leaveFacility,
  transferFacilityOwnership,
  clearFacilitiesError,
  clearCurrentMemberDetail,
} from "@/api/slices";
import {
  FACILITY_ADMIN_ROLES,
  FACILITY_ROLES,
  facilityIdOf,
  formatRole,
  type UserRole,
  type FacilityType,
  type FacilityMember,
  type OutgoingInvite,
} from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { CustomDropdown } from "@/components/ui/items";

const MEDICAL_DEPARTMENTS = [
  "Cardiology",
  "Emergency Medicine",
  "Pediatrics",
  "Radiology",
  "Surgery",
  "Intensive Care Unit (ICU)",
  "Neurology",
  "Orthopedics",
  "Obstetrics & Gynecology",
  "Internal Medicine",
  "Pathology",
  "Pharmacy",
  "Nursing Services",
  "Laboratory",
  "Other",
];

const FACILITY_TYPES: { value: FacilityType; label: string }[] = [
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic" },
  { value: "diagnostic_lab", label: "Diagnostic Lab" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "dental", label: "Dental" },
  { value: "eye_care", label: "Eye Care" },
  { value: "maternity", label: "Maternity" },
  { value: "specialist", label: "Specialist" },
  { value: "primary_care", label: "Primary Care" },
  { value: "telemedicine", label: "Telemedicine" },
  { value: "other", label: "Other" },
];

function sanitizeWebsite(urlStr: string): string {
  const trimmed = urlStr.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function LogoCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isDark,
  colors,
}: {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  isDark: boolean;
  colors: any;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isOpen || !imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.clearRect(0, 0, 300, 300);

      const size = Math.min(img.width, img.height);
      const sourceX = (img.width - size) / 2;
      const sourceY = (img.height - size) / 2;

      ctx.save();
      ctx.translate(150, 150);
      ctx.scale(zoom, zoom);
      ctx.translate(-150, -150);
      ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, 300, 300);
      ctx.restore();
    };
  }, [isOpen, imageSrc, zoom]);

  if (!isOpen) return null;

  const handleDone = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "facility-logo.png", {
          type: "image/png",
        });
        onCropComplete(file);
      }
      onClose();
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
          isDark ? "border-white/[0.15]" : "border-black/[0.15]"
        }`}
        style={{
          backgroundColor: colors.shadeBg,
          color: colors.text,
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Crop className="h-4 w-4" style={{ color: colors.primaryShade }} />{" "}
            Crop & Preview Logo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="opacity-60 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-black/40 h-56 border ${
            isDark ? "border-white/[0.1]" : "border-black/[0.1]"
          }`}
        >
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full object-contain block"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-60">Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full cursor-pointer"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl border px-4 py-2 text-xs font-semibold ${
              isDark ? "border-white/[0.15]" : "border-black/[0.15]"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: colors.primary }}
          >
            Apply & Save Logo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActiveFacilityPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";

  const { user } = useAppSelector((s) => s.auth);
  const {
    list,
    outgoingInvites,
    activeFacilityId,
    activeFacility,
    current,
    members,
    currentMemberDetail,
    memberDetailLoading,
    outgoingInvitesLoading,
    switching,
    membersLoading,
    saving,
    error,
    message,
  } = useAppSelector((s) => s.facilities);

  const [initialLoading, setInitialLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "staff" as UserRole,
    department: "",
    countryCode: "+234",
    phone: "",
  });
  const [selectedDeptDropdown, setSelectedDeptDropdown] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const [localMsgIsError, setLocalMsgIsError] = useState(false);

  const [isEditingFacility, setIsEditingFacility] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    website: "",
    email: "",
    phone: "",
    description: "",
    facilityType: "clinic" as FacilityType,
    licenseNumber: "",
    city: "",
    state: "",
    country: "",
  });
  const [customFacilityType, setCustomFacilityType] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>("");

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FacilityMember | null>(
    null
  );
  const [memberRole, setMemberRole] = useState<UserRole>("staff");
  const [memberDept, setMemberDept] = useState("");
  const [memberBusy, setMemberBusy] = useState(false);

  const facilityId = activeFacilityId || activeFacility?.id || null;

  const myRole = useMemo(() => {
    if (activeFacility?.role) return activeFacility.role;
    const m = list.find((x) => facilityIdOf(x.company as any) === facilityId);
    return m?.role || user?.role;
  }, [activeFacility, list, facilityId, user?.role]);

  const canManage =
    !!myRole && FACILITY_ADMIN_ROLES.includes(myRole as UserRole);

  const activeFacOwner = current?.owner || activeFacility?.owner;
  const isOwner =
    (activeFacOwner &&
      user?._id &&
      String(
        typeof activeFacOwner === "object"
          ? (activeFacOwner as any)._id || (activeFacOwner as any).id
          : activeFacOwner
      ) === String(user._id)) ||
    myRole === "owner" ||
    myRole === "ceo" ||
    myRole === "super_admin";

  const isLoading =
    initialLoading ||
    switching ||
    membersLoading ||
    inviteBusy ||
    editBusy ||
    saving ||
    leaveBusy ||
    memberBusy;

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        await dispatch(fetchMyFacilities()).unwrap();
      } catch {
        /* ignore */
      }
      setInitialLoading(false);
    };
    loadData();
  }, [dispatch]);

  useEffect(() => {
    if (facilityId) {
      dispatch(fetchFacility(facilityId));
      dispatch(fetchFacilityMembers(facilityId));
      dispatch(fetchOutgoingInvites(facilityId));
    }
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (!current && !activeFacility) return;
    const fType = (current?.facilityType ||
      activeFacility?.facilityType ||
      "clinic") as FacilityType;
    const isStandardType = FACILITY_TYPES.some((t) => t.value === fType);

    setEditForm({
      name: current?.name || activeFacility?.name || "",
      website: current?.website || "",
      email: current?.email || "",
      phone: current?.phone || "",
      description: current?.description || activeFacility?.description || "",
      facilityType: isStandardType ? fType : "other",
      licenseNumber: current?.licenseNumber || "",
      city: current?.address?.city || "",
      state: current?.address?.state || "",
      country: current?.address?.country || "",
    });
    if (!isStandardType) {
      setCustomFacilityType(fType);
    }

    if (current?.logo || activeFacility?.logo) {
      setLogoPreview(current?.logo || activeFacility?.logo || null);
    }
  }, [current, activeFacility]);

  useEffect(() => {
    if (selectedMember) {
      setMemberRole((selectedMember.role as UserRole) || "staff");
      setMemberDept(selectedMember.department || "");
    }
  }, [selectedMember]);

  const toast = (msg: string, isError = false) => {
    setLocalMsgIsError(isError);
    setLocalMsg(msg);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast("Image size must not exceed 10MB", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) return;
    setInviteBusy(true);
    setLocalMsg(null);
    const finalDepartment =
      selectedDeptDropdown === "Other"
        ? customDepartment.trim()
        : selectedDeptDropdown;
    try {
      await dispatch(
        inviteToFacility({
          facilityId,
          payload: {
            email: inviteForm.email.trim().toLowerCase(),
            role: inviteForm.role,
            department: finalDepartment || undefined,
            countryCode: inviteForm.countryCode.trim(),
            phone: inviteForm.phone.replace(/[\s\-()]/g, "").trim(),
          },
        })
      ).unwrap();
      toast("Invitation sent successfully");
      setInviteForm({
        email: "",
        role: "staff",
        department: "",
        countryCode: "+234",
        phone: "",
      });
      if (facilityId) dispatch(fetchOutgoingInvites(facilityId));
      setSelectedDeptDropdown("");
      setCustomDepartment("");
      setInviteOpen(false);
      dispatch(fetchMyFacilities());
    } catch (err: unknown) {
      toast(typeof err === "string" ? err : "Invite failed", true);
    } finally {
      setInviteBusy(false);
    }
  };

  const handleResendInvite = async (inv: { id?: string; email: string }) => {
    if (!facilityId) return;
    setInviteBusy(true);
    try {
      await dispatch(
        resendFacilityInvite({
          facilityId,
          inviteId: inv.id,
          email: inv.email,
        })
      ).unwrap();
      toast(`Invitation resent to ${inv.email}`);
      dispatch(fetchOutgoingInvites(facilityId));
    } catch (err: unknown) {
      toast(
        typeof err === "string" ? err : "Failed to resend invitation",
        true
      );
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRetractInvite = async (inv: { id?: string; email: string }) => {
    if (!facilityId) return;
    setInviteBusy(true);
    try {
      await dispatch(
        retractFacilityInvite({
          facilityId,
          inviteId: inv.id,
          email: inv.email,
        })
      ).unwrap();
      toast(`Invitation to ${inv.email} retracted`);
      dispatch(fetchOutgoingInvites(facilityId));
    } catch (err: unknown) {
      toast(
        typeof err === "string" ? err : "Failed to retract invitation",
        true
      );
    } finally {
      setInviteBusy(false);
    }
  };

  const openMemberDetail = async (m: FacilityMember) => {
    if (!facilityId) return;
    setSelectedMember(m);
    dispatch(clearCurrentMemberDetail());
    try {
      await dispatch(
        fetchFacilityMemberDetail({ facilityId, memberId: m.id })
      ).unwrap();
    } catch {
      // modal still shows list-level fields if detail fails
    }
  };

  const handleUpdateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) return;
    setEditBusy(true);
    setLocalMsg(null);
    try {
      const sanitizedWebsite = sanitizeWebsite(editForm.website);
      const finalFacilityType =
        editForm.facilityType === "other" && customFacilityType.trim()
          ? (customFacilityType.trim() as FacilityType)
          : editForm.facilityType;

      await dispatch(
        updateFacility({
          facilityId,
          payload: {
            name: editForm.name.trim(),
            website: sanitizedWebsite || undefined,
            email: editForm.email.trim() || undefined,
            phone: editForm.phone.trim() || undefined,
            description: editForm.description.trim() || undefined,
            facilityType: finalFacilityType,
            licenseNumber: editForm.licenseNumber.trim() || undefined,
            address: {
              city: editForm.city.trim() || undefined,
              state: editForm.state.trim() || undefined,
              country: editForm.country.trim() || undefined,
            },
          },
        })
      ).unwrap();
      if (logoFile) {
        await dispatch(
          uploadFacilityLogo({ facilityId, file: logoFile })
        ).unwrap();
        setLogoFile(null);
      }
      await dispatch(fetchFacility(facilityId));
      await dispatch(fetchMyFacilities());
      toast("Facility details updated");
      setIsEditingFacility(false);
    } catch (err: unknown) {
      toast(typeof err === "string" ? err : "Failed to update facility", true);
    } finally {
      setEditBusy(false);
    }
  };

  const handleLeaveOrDelete = async () => {
    if (!facilityId) return;
    setLeaveBusy(true);
    try {
      await dispatch(leaveFacility(facilityId)).unwrap();
      await dispatch(fetchMyFacilities());
      setLeaveModalOpen(false);
      toast("You left the facility");
    } catch (err: unknown) {
      toast(typeof err === "string" ? err : "Could not leave facility", true);
    } finally {
      setLeaveBusy(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!facilityId) return;
    setMemberBusy(true);
    try {
      await dispatch(removeFacilityMember({ facilityId, memberId })).unwrap();
      await dispatch(fetchFacilityMembers(facilityId));
      setSelectedMember(null);
      toast("Member removed");
    } catch (err: unknown) {
      toast(typeof err === "string" ? err : "Could not remove member", true);
    } finally {
      setMemberBusy(false);
    }
  };

  const handleSaveMemberRole = async () => {
    if (!facilityId || !selectedMember) return;
    setMemberBusy(true);
    try {
      await dispatch(
        updateFacilityMember({
          facilityId,
          memberId: selectedMember.id,
          payload: {
            role: memberRole,
            department: memberDept.trim() || undefined,
          },
        })
      ).unwrap();
      await dispatch(fetchFacilityMembers(facilityId));
      setSelectedMember(null);
      toast("Member role updated");
    } catch (err: unknown) {
      toast(typeof err === "string" ? err : "Could not update role", true);
    } finally {
      setMemberBusy(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!facilityId || !selectedMember) return;
    setMemberBusy(true);
    try {
      await dispatch(
        transferFacilityOwnership({ facilityId, newOwnerId: selectedMember.id })
      ).unwrap();
      await dispatch(fetchFacility(facilityId));
      await dispatch(fetchFacilityMembers(facilityId));
      setSelectedMember(null);
      toast("Ownership transferred");
    } catch (err: unknown) {
      toast(
        typeof err === "string" ? err : "Could not transfer ownership",
        true
      );
    } finally {
      setMemberBusy(false);
    }
  };

  const currentFacilityPendingInvites: OutgoingInvite[] = useMemo(() => {
    return outgoingInvites || [];
  }, [outgoingInvites]);

  if (initialLoading) {
    return (
      <div
        className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center p-6 relative"
        style={{ color: colors.text }}
      >
        <DarkBlurOverlayLoader />
      </div>
    );
  }

  if (!facilityId) {
    return (
      <div
        className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center p-6 relative"
        style={{ color: colors.text }}
      >
        {isLoading && <DarkBlurOverlayLoader />}
        <div
          className={`flex w-full max-w-md flex-col items-center justify-center rounded-2xl border p-8 text-center ${
            isDark ? "border-white/[0.08]" : "border-black/[0.08]"
          }`}
          style={{
            backgroundColor: colors.shadeBg,
          }}
        >
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `color-mix(in srgb, ${colors.primary} 15%, transparent)`,
              color: colors.primaryShade,
            }}
          >
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            No active facility
          </h1>
          <p className="mt-2 text-sm opacity-60 max-w-xs">
            Create a facility or accept an invitation to get started.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard/workspace/create"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              <Building2 className="h-4 w-4" /> Create facility
            </Link>
            <Link
              href="/dashboard/workspace/invitations"
              className={`inline-flex items-center gap-2 rounded-xl border bg-transparent px-4 py-2.5 text-xs font-semibold transition ${
                isDark ? "border-white/[0.15]" : "border-black/[0.15]"
              }`}
              style={{
                color: colors.text,
              }}
            >
              <Mail className="h-4 w-4" /> View invitations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name = current?.name || activeFacility?.name || "Facility";
  const logo = current?.logo || activeFacility?.logo;
  const description = current?.description || activeFacility?.description;
  const banner = error || message || localMsg;
  const bannerIsError = !!error || (!!localMsg && localMsgIsError);
  const isOnlyMember = members.length <= 1;
  const resolvedOwnerId = current?.owner
    ? typeof current.owner === "object"
      ? (current.owner as any)._id || (current.owner as any).id
      : current.owner
    : activeFacility?.owner
    ? typeof activeFacility.owner === "object"
      ? (activeFacility.owner as any)._id || (activeFacility.owner as any).id
      : activeFacility.owner
    : null;

  const roleOptions = FACILITY_ROLES.filter((r) => r !== "ceo").map((r) => ({
    label: formatRole(r).toUpperCase(),
    value: r,
  }));
  const departmentOptions = MEDICAL_DEPARTMENTS.map((dept) => ({
    label: dept,
    value: dept,
  }));
  const facilityTypeOptions = FACILITY_TYPES.map((t) => ({
    label: t.label,
    value: t.value,
  }));

  const inputStyle = {
    backgroundColor: colors.shadeBgSecond || "transparent",
    color: colors.text,
  };

  const borderCls = isDark ? "border-white/[0.08]" : "border-black/[0.08]";

  return (
    <div
      className="mx-auto flex max-w-5xl flex-col gap-6 p-6 transition-colors duration-200 relative"
      style={{ color: colors.text }}
    >
      {isLoading && <DarkBlurOverlayLoader />}

      <LogoCropModal
        isOpen={cropModalOpen}
        imageSrc={rawImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={(file) => {
          setLogoFile(file);
          setLogoPreview(URL.createObjectURL(file));
        }}
        isDark={isDark}
        colors={colors}
      />

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Active Facility</h1>
          <p className="text-sm opacity-60">
            Profile, members, and roles for your health facility.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {(canManage || isOwner) && (
            <button
              type="button"
              onClick={() => setIsEditingFacility((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition hover:opacity-80 ${borderCls}`}
              style={{
                backgroundColor: colors.shadeBg,
                color: colors.text,
              }}
            >
              <Edit2 className="h-3.5 w-3.5 opacity-60" />
              <span>{isEditingFacility ? "Cancel" : "Edit facility"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              dispatch(clearFacilitiesError());
              setLocalMsg(null);
              dispatch(fetchFacilityMembers(facilityId));
              dispatch(fetchFacility(facilityId));
              dispatch(fetchMyFacilities());
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition hover:opacity-80 ${borderCls}`}
            style={{
              backgroundColor: colors.shadeBg,
              color: colors.text,
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 opacity-60" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {banner && (
        <div
          role={bannerIsError ? "alert" : "status"}
          className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-sm font-medium ${
            bannerIsError
              ? isDark
                ? "border-red-500/30 bg-red-500/12 text-[#f87171]"
                : "border-red-600/20 bg-red-600/[0.07] text-[#dc2626]"
              : isDark
              ? "border-white/[0.15]"
              : "border-black/[0.1]"
          }`}
          style={{
            ...(!bannerIsError && {
              backgroundColor: `color-mix(in srgb, ${colors.primary} 12%, transparent)`,
              borderColor: `color-mix(in srgb, ${colors.primary} 30%, transparent)`,
              color: colors.primaryShade,
            }),
          }}
        >
          {bannerIsError ? (
            <X className="h-4 w-4 shrink-0" />
          ) : (
            <Check className="h-4 w-4 shrink-0" />
          )}
          <span>{banner}</span>
        </div>
      )}

      {/* Header card */}
      <div
        className={`flex flex-col gap-5 rounded-2xl border p-6 ${borderCls}`}
        style={{
          backgroundColor: colors.shadeBg,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl font-extrabold text-2xl border ${borderCls}`}
            style={{
              backgroundColor: colors.shadeBgSecond,
              color: colors.primaryShade,
            }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-8 w-8" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight">{name}</h2>
              <span
                className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `color-mix(in srgb, ${colors.primary} 15%, transparent)`,
                  color: colors.primaryShade,
                }}
              >
                ACTIVE
              </span>
            </div>
            <p className="mt-1 text-sm font-medium opacity-60">
              {members.length} members · Your role:{" "}
              {formatRole(String(myRole || "staff")).toUpperCase()}
            </p>
          </div>
        </div>

        {description && (
          <div
            className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs sm:text-sm ${borderCls}`}
            style={{
              backgroundColor: colors.shadeBgSecond,
            }}
          >
            <Info
              size={16}
              style={{ color: colors.primaryShade }}
              className="shrink-0 mt-0.5"
            />
            <p className="opacity-80 leading-relaxed">{description}</p>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setLeaveModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition hover:opacity-80"
            style={{
              backgroundColor: colors.shadeBg,
              borderColor: isDark
                ? "rgba(248,113,113,0.3)"
                : "rgba(220,38,38,0.2)",
              color: isDark ? "#f87171" : "#dc2626",
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Edit form */}
      {isEditingFacility && (canManage || isOwner) ? (
        <form
          onSubmit={handleUpdateFacility}
          className={`flex flex-col gap-5 rounded-2xl border p-6 ${
            isDark ? "border-white/[0.12]" : "border-black/[0.15]"
          }`}
          style={{
            backgroundColor: colors.shadeBg,
          }}
        >
          <h3 className="text-base font-bold">Edit facility profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                Name *
              </label>
              <input
                required
                value={editForm.name}
                placeholder="e.g. Sunrise Medical Centre"
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none ${borderCls}`}
                style={inputStyle}
              />
            </div>
            <CustomDropdown
              label="Type"
              value={editForm.facilityType}
              options={facilityTypeOptions}
              onChange={(val) => {
                setEditForm((f) => ({
                  ...f,
                  facilityType: val as FacilityType,
                }));
                if (val !== "other") setCustomFacilityType("");
              }}
              placeholder="Select facility type..."
              isDark={isDark}
              colors={colors}
            />
            {editForm.facilityType === "other" && (
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold opacity-60">
                  Custom Facility Type *
                </label>
                <input
                  required
                  value={customFacilityType}
                  placeholder="Enter custom facility type"
                  onChange={(e) => setCustomFacilityType(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none ${borderCls}`}
                  style={inputStyle}
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                Website
              </label>
              <input
                type="text"
                value={editForm.website}
                placeholder="www.example.com"
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, website: e.target.value }))
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${borderCls}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                placeholder="contact@facility.com"
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${borderCls}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                Phone
              </label>
              <input
                type="tel"
                value={editForm.phone}
                placeholder="+1 (555) 000-0000"
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${borderCls}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                License number
              </label>
              <input
                value={editForm.licenseNumber}
                placeholder="LIC-12345678"
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, licenseNumber: e.target.value }))
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${borderCls}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                City
              </label>
              <input
                value={editForm.city}
                placeholder="e.g. New York"
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, city: e.target.value }))
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${borderCls}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                State
              </label>
              <input
                value={editForm.state}
                placeholder="e.g. NY"
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, state: e.target.value }))
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${borderCls}`}
                style={inputStyle}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                Facility Logo (Max 10MB)
              </label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div
                    className={`relative h-16 w-16 overflow-hidden rounded-xl border ${borderCls}`}
                  >
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-xl border border-dashed opacity-40 ${borderCls}`}
                  >
                    <Building2 className="h-6 w-6" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition hover:opacity-80 ${borderCls}`}
                    style={{
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload & Crop Image</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Remove logo
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                Description
              </label>
              <textarea
                value={editForm.description}
                placeholder="Briefly describe your healthcare facility..."
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm resize-none ${borderCls}`}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={editBusy}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              {editBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditingFacility(false)}
              className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
                isDark ? "border-white/[0.15]" : "border-black/[0.15]"
              }`}
              style={{
                color: colors.text,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl border p-6 ${borderCls}`}
          style={{
            backgroundColor: colors.shadeBg,
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs opacity-50">
              <Briefcase className="h-3.5 w-3.5" /> Type
            </div>
            <p className="text-sm font-bold capitalize">
              {(current?.facilityType || "clinic").replace(/_/g, " ")}
            </p>
            <div className="flex items-center gap-1.5 text-xs opacity-50">
              <Globe className="h-3.5 w-3.5" /> Website
            </div>
            <p className="text-sm font-bold break-all">
              {current?.website || "—"}
            </p>
            <div className="flex items-center gap-1.5 text-xs opacity-50">
              <Mail className="h-3.5 w-3.5" /> Email
            </div>
            <p className="text-sm font-bold">{current?.email || "—"}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs opacity-50">
              <Phone className="h-3.5 w-3.5" /> Phone
            </div>
            <p className="text-sm font-bold">{current?.phone || "—"}</p>
            <div className="flex items-center gap-1.5 text-xs opacity-50">
              <MapPin className="h-3.5 w-3.5" /> Address
            </div>
            <p className="text-sm font-bold">
              {[
                current?.address?.city,
                current?.address?.state,
                current?.address?.country,
              ]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
            <div className="flex items-center gap-1.5 text-xs opacity-50">
              <Shield className="h-3.5 w-3.5" /> License
            </div>
            <p className="text-sm font-bold">{current?.licenseNumber || "—"}</p>
          </div>
        </div>
      )}

      {/* Invite */}
      {inviteOpen && (canManage || isOwner) && (
        <form
          onSubmit={onInvite}
          className={`flex flex-col gap-4 rounded-2xl border p-6 ${borderCls}`}
          style={{
            backgroundColor: colors.shadeBg,
          }}
        >
          <h3 className="flex items-center gap-2 text-base font-bold">
            <UserPlus
              className="h-4 w-4"
              style={{ color: colors.primaryShade }}
            />{" "}
            Invite a member
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                Email *
              </label>
              <input
                required
                type="email"
                value={inviteForm.email}
                placeholder="colleague@clinic.com"
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, email: e.target.value }))
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${borderCls}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                Country code *
              </label>
              <input
                required
                value={inviteForm.countryCode}
                placeholder="+234"
                pattern="\+[1-9]\d{0,3}"
                title="e.g. +234"
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, countryCode: e.target.value }))
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${borderCls}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-60">
                Phone *
              </label>
              <input
                required
                inputMode="numeric"
                value={inviteForm.phone}
                placeholder="8012345678"
                minLength={7}
                maxLength={15}
                onChange={(e) =>
                  setInviteForm((f) => ({
                    ...f,
                    phone: e.target.value.replace(/[^\d]/g, ""),
                  }))
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${borderCls}`}
                style={inputStyle}
              />
            </div>
            <CustomDropdown
              label="Role"
              value={inviteForm.role}
              options={roleOptions}
              onChange={(val) =>
                setInviteForm((f) => ({ ...f, role: val as UserRole }))
              }
              placeholder="Select role..."
              isDark={isDark}
              colors={colors}
            />
            <CustomDropdown
              label="Department"
              value={selectedDeptDropdown}
              options={departmentOptions}
              onChange={(val) => {
                setSelectedDeptDropdown(val);
                if (val !== "Other") setCustomDepartment("");
              }}
              placeholder="Select department..."
              isDark={isDark}
              colors={colors}
            />
          </div>
          {selectedDeptDropdown === "Other" && (
            <input
              required
              value={customDepartment}
              placeholder="Enter custom department name"
              onChange={(e) => setCustomDepartment(e.target.value)}
              className={`w-full max-w-xs rounded-xl border px-3.5 py-2.5 text-sm ${borderCls}`}
              style={inputStyle}
            />
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={inviteBusy}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              {inviteBusy ? "Sending…" : "Send invite"}
            </button>
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
                isDark ? "border-white/[0.15]" : "border-black/[0.15]"
              }`}
              style={{
                color: colors.text,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Pending Invitations Section */}
      {(canManage || isOwner) &&
        (outgoingInvitesLoading ||
          currentFacilityPendingInvites.length > 0) && (
          <div className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Mail className="h-4 w-4 opacity-80" />
              Pending Invitations{" "}
              <span className="font-normal opacity-50">
                ({currentFacilityPendingInvites.length})
              </span>
            </h3>
            <div className="flex flex-col gap-2.5">
              {outgoingInvitesLoading ? (
                <div
                  className={`flex justify-center gap-2 rounded-2xl border p-6 text-xs opacity-60 ${borderCls}`}
                  style={{ backgroundColor: colors.shadeBg }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading invites…
                </div>
              ) : null}
              {currentFacilityPendingInvites.map((inv) => {
                const invEmail = inv.email || "Unknown";
                const invRole = inv.role || "staff";
                const invDept = inv.department;
                const invId = inv.id;

                return (
                  <div
                    key={invId || invEmail}
                    className={`flex items-center justify-between rounded-2xl border p-4 transition ${borderCls}`}
                    style={{ backgroundColor: colors.shadeBg }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold border ${borderCls}`}
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          color: colors.primaryShade,
                        }}
                      >
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">
                          {invEmail}
                        </span>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase border ${borderCls}`}
                            style={{
                              backgroundColor: colors.shadeBgSecond,
                              color: colors.text,
                            }}
                          >
                            {formatRole(invRole as UserRole).toUpperCase()}
                          </span>
                          {invDept && (
                            <span className="text-[10px] opacity-50">
                              {invDept}
                            </span>
                          )}
                          <span className="text-[10px] text-amber-500 font-medium">
                            Pending Acceptance
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={inviteBusy}
                        onClick={() =>
                          handleResendInvite({ id: invId, email: invEmail })
                        }
                        className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                        style={{
                          borderColor: isDark
                            ? "rgba(255,255,255,0.15)"
                            : "rgba(0,0,0,0.15)",
                          backgroundColor: colors.shadeBgSecond,
                        }}
                        title="Resend Invitation"
                      >
                        <Send className="h-3 w-3" />
                        <span className="hidden sm:inline">Resend</span>
                      </button>
                      <button
                        type="button"
                        disabled={inviteBusy}
                        onClick={() =>
                          handleRetractInvite({ id: invId, email: invEmail })
                        }
                        className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:opacity-80"
                        style={{
                          borderColor: isDark
                            ? "rgba(239,68,68,0.35)"
                            : "rgba(220,38,38,0.25)",
                        }}
                        title="Retract Invitation"
                      >
                        <X className="h-3 w-3" />
                        <span className="hidden sm:inline">Retract</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Members */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Users className="h-4 w-4 opacity-80" />
            Team Members{" "}
            <span className="font-normal opacity-50">({members.length})</span>
          </h3>
          {(canManage || isOwner) && !inviteOpen && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: colors.primary }}
            >
              <UserPlus className="h-3.5 w-3.5" /> Invite
            </button>
          )}
        </div>

        {membersLoading ? (
          <div
            className={`flex justify-center gap-2 rounded-2xl border p-8 text-xs opacity-60 ${borderCls}`}
            style={{ backgroundColor: colors.shadeBg }}
          >
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {members.map((m) => {
              const fullName = `${m.firstName || ""} ${
                m.lastName || ""
              }`.trim();
              const isMemberOwner =
                resolvedOwnerId && String(m.id) === String(resolvedOwnerId);
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    if (canManage || isOwner) openMemberDetail(m);
                  }}
                  className={`flex items-center justify-between rounded-2xl border p-4 transition ${borderCls} ${
                    canManage || isOwner
                      ? "cursor-pointer hover:opacity-80"
                      : ""
                  }`}
                  style={{
                    backgroundColor: colors.shadeBg,
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs font-bold border ${borderCls}`}
                      style={{
                        backgroundColor: colors.shadeBgSecond,
                        color: colors.text,
                      }}
                    >
                      {m.profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.profilePicture}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (
                          (m.firstName?.[0] || "") + (m.lastName?.[0] || "")
                        ).toUpperCase() || "?"
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">
                        {fullName || m.email}
                      </span>
                      <span className="text-[10px] opacity-50 block truncate">
                        {m.email}
                      </span>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase border ${
                            isMemberOwner ? "border-amber-500/30" : borderCls
                          }`}
                          style={{
                            backgroundColor: isMemberOwner
                              ? isDark
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(245, 158, 11, 0.1)"
                              : colors.shadeBgSecond,
                            color: isMemberOwner
                              ? isDark
                                ? "#fbbf24"
                                : "#d97706"
                              : colors.text,
                          }}
                        >
                          {isMemberOwner ? (
                            <>
                              <Crown className="h-2.5 w-2.5" /> OWNER
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-2.5 w-2.5" />{" "}
                              {formatRole(m.role || "staff").toUpperCase()}
                            </>
                          )}
                        </span>
                        {m.department && (
                          <span className="text-[10px] opacity-50">
                            {m.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!canManage && !isOwner && (
          <p className="text-xs opacity-40 flex items-center gap-1">
            <Shield className="h-3 w-3" /> Only Owner, CEO, Admin, or Manager
            can invite or change roles.
          </p>
        )}
      </div>

      {/* Leave modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 flex flex-col gap-4 ${
              isDark ? "border-white/[0.15]" : "border-black/[0.15]"
            }`}
            style={{
              backgroundColor: colors.shadeBg,
            }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="text-base font-bold">Leave facility?</h3>
                <p className="text-xs opacity-60 mt-0.5">
                  {isOnlyMember
                    ? "You may be the only member. Confirm you want to leave."
                    : `Leave ${name}?`}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
                  isDark ? "border-white/[0.15]" : "border-black/[0.15]"
                }`}
                style={{
                  color: colors.text,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={leaveBusy}
                onClick={handleLeaveOrDelete}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#b91c1c" }}
              >
                {leaveBusy ? "Leaving…" : "Confirm leave"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member detail + manage modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-6 flex flex-col gap-5 ${
              isDark ? "border-white/[0.15]" : "border-black/[0.15]"
            }`}
            style={{
              backgroundColor: colors.shadeBg,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-bold border ${borderCls}`}
                  style={{
                    backgroundColor: colors.shadeBgSecond,
                    color: colors.text,
                  }}
                >
                  {currentMemberDetail?.profilePicture ||
                  selectedMember.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        currentMemberDetail?.profilePicture ||
                        selectedMember.profilePicture
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (
                      (selectedMember.firstName?.[0] || "") +
                      (selectedMember.lastName?.[0] || "")
                    ).toUpperCase() || "?"
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold truncate">
                    {(currentMemberDetail?.firstName ||
                      selectedMember.firstName) +
                      " " +
                      (currentMemberDetail?.lastName ||
                        selectedMember.lastName)}
                  </h3>
                  <p className="text-xs opacity-60 truncate">
                    {currentMemberDetail?.email || selectedMember.email}
                  </p>
                  {(currentMemberDetail?.isOwner ||
                    (resolvedOwnerId &&
                      String(selectedMember.id) ===
                        String(resolvedOwnerId))) && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                      <Crown className="h-3 w-3" /> Facility owner
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  dispatch(clearCurrentMemberDetail());
                }}
                className="opacity-60 hover:opacity-100 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {memberDetailLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs opacity-60">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading details…
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border p-4 text-xs ${borderCls}`}
                style={{ backgroundColor: colors.shadeBgSecond }}
              >
                <div>
                  <p className="opacity-50 mb-0.5">Phone</p>
                  <p className="font-medium">
                    {currentMemberDetail?.phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="opacity-50 mb-0.5">Title</p>
                  <p className="font-medium">
                    {currentMemberDetail?.title || selectedMember.title || "—"}
                  </p>
                </div>
                <div>
                  <p className="opacity-50 mb-0.5">Specialty</p>
                  <p className="font-medium">
                    {currentMemberDetail?.specialty ||
                      selectedMember.specialty ||
                      "—"}
                  </p>
                </div>
                <div>
                  <p className="opacity-50 mb-0.5">License</p>
                  <p className="font-medium">
                    {currentMemberDetail?.licenseNumber || "—"}
                  </p>
                </div>
                <div>
                  <p className="opacity-50 mb-0.5">Gender</p>
                  <p className="font-medium capitalize">
                    {currentMemberDetail?.gender?.replace(/_/g, " ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="opacity-50 mb-0.5">Joined</p>
                  <p className="font-medium">
                    {currentMemberDetail?.joinedAt || selectedMember.joinedAt
                      ? new Date(
                          currentMemberDetail?.joinedAt ||
                            selectedMember.joinedAt ||
                            ""
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                {(currentMemberDetail?.address?.city ||
                  currentMemberDetail?.address?.country) && (
                  <div className="sm:col-span-2">
                    <p className="opacity-50 mb-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Location
                    </p>
                    <p className="font-medium">
                      {[
                        currentMemberDetail?.address?.city,
                        currentMemberDetail?.address?.state,
                        currentMemberDetail?.address?.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>
                )}
                {currentMemberDetail?.bio && (
                  <div className="sm:col-span-2">
                    <p className="opacity-50 mb-0.5">Bio</p>
                    <p className="font-medium leading-relaxed">
                      {currentMemberDetail.bio}
                    </p>
                  </div>
                )}
              </div>
            )}

            <CustomDropdown
              label="Role"
              value={memberRole}
              options={roleOptions}
              onChange={(v) => setMemberRole(v as UserRole)}
              isDark={isDark}
              colors={colors}
            />
       

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={memberBusy}
                onClick={handleSaveMemberRole}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {memberBusy ? "Saving…" : "Save role"}
              </button>
              {isOwner &&
                resolvedOwnerId &&
                String(selectedMember.id) !== String(resolvedOwnerId) && (
                  <button
                    type="button"
                    disabled={memberBusy}
                    onClick={handleTransferOwnership}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${borderCls}`}
                  >
                    <Crown className="h-4 w-4" /> Transfer ownership to this
                    member
                  </button>
                )}
              {resolvedOwnerId &&
                String(selectedMember.id) !== String(resolvedOwnerId) && (
                  <button
                    type="button"
                    disabled={memberBusy}
                    onClick={() => handleRemoveMember(selectedMember.id)}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold text-red-500 ${
                      isDark ? "border-red-500/30" : "border-red-600/20"
                    }`}
                  >
                    <UserMinus className="h-4 w-4" /> Remove from facility
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
