"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cropper from "react-easy-crop";
import {
  LogOut,
  User,
  Loader2,
  Save,
  ShieldAlert,
  Info,
  Stethoscope,
  KeyRound,
  Building2,
  Pencil,
  X,
  AlertTriangle,
  ShieldCheck,
  Laptop,
  Camera,
  ZoomIn,
  ChevronDown,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import type { Gender } from "@/api/types";
import {
  fetchMe,
  updateMe,
  uploadProfilePicture,
  logout,
  clearUsersError,
  clearAuthError,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";

type TabId = "personal" | "security";

// Helper function to create cropped image blob from canvas
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<File> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      const file = new File([blob], "profile-cropped.jpg", {
        type: "image/jpeg",
      });
      resolve(file);
    }, "image/jpeg");
  });
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    me,
    loading: usersLoading,
    error: usersError,
    message,
  } = useAppSelector((s) => s.users);
  const { user: authUser, loading: authLoading } = useAppSelector(
    (s) => s.auth
  );
  const profile = me || authUser;

  const tabParam = (searchParams.get("tab") as TabId) || "personal";
  const [tab, setTab] = useState<TabId>(
    tabParam === "security" ? "security" : "personal"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Custom Gender Dropdown Open State & Ref
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const genderDropdownRef = useRef<HTMLDivElement>(null);

  // Cropper states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    countryCode: "+234",
    title: "",
    specialty: "",
    license: "",
    gender: "",
    bio: "",
  });
  const [saved, setSaved] = useState(false);

  const { theme, colors } = useTheme();

  const inputCls = `h-11 w-full rounded-xl px-3.5 text-sm outline-none transition-colors disabled:opacity-50 border`;
  const labelCls =
    "mb-1.5 block text-xs font-semibold tracking-tight opacity-75";

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  // Close custom dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        genderDropdownRef.current &&
        !genderDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGenderOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      middleName: profile.middleName || "",
      phone: profile.phone || "",
      countryCode: profile.countryCode || "+234",
      title: profile.title || "",
      specialty: profile.specialty || "",
      license: profile.licenseNumber || "",
      gender: profile.gender || "",
      bio: profile.bio || "",
    });
  }, [profile]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "personal" || t === "security") setTab(t);
  }, [searchParams]);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearUsersError());
    setSaved(false);
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim() || undefined,
      phone: form.phone.trim(),
      countryCode: form.countryCode.trim(),
      title: form.title.trim() || undefined,
      specialty: form.specialty.trim() || undefined,
      licenseNumber: form.license.trim() || undefined,
      gender: (form.gender.trim() || undefined) as Gender | undefined,
      bio: form.bio.trim() || undefined,
    };
    try {
      await dispatch(updateMe(payload)).unwrap();
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("[SETTINGS] updateMe failed", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onCropComplete = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    dispatch(clearUsersError());
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      await dispatch(uploadProfilePicture(croppedFile)).unwrap();
      setSaved(true);
      setImageSrc(null);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("[SETTINGS] uploadProfilePicture failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const onLogout = async () => {
    dispatch(clearAuthError());
    try {
      await dispatch(logout()).unwrap();
      router.push("/en/login");
    } catch (err) {
      router.push("/en/login");
    }
  };

  const busy = usersLoading || authLoading || isUploading;

  return (
    <div
      className="mx-auto max-w-7xl py-6 sm:py-8 transition-colors duration-200"
      style={{ color: colors.text }}
    >
      {/* Page Header */}
      <div
        className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5"
        style={{
          borderColor:
            theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Account Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm opacity-70">
            Manage your professional profile credentials and facility session
            security.
          </p>
        </div>

        {/* Tabs switcher */}
        <div
          className="flex flex-wrap gap-1 rounded-xl border p-1 w-full sm:w-fit shadow-xs"
          style={{
            backgroundColor: colors.shadeBgSecond,
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          }}
        >
          {(
            [
              {
                id: "personal" as const,
                label: "Professional Profile",
                icon: User,
              },
              {
                id: "security" as const,
                label: "Security & Access",
                icon: KeyRound,
              },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                router.replace(`/dashboard/settings?tab=${id}`);
              }}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                tab === id
                  ? "font-semibold shadow-sm"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor:
                  tab === id
                    ? theme === "dark"
                      ? "#ffffff"
                      : "#000000"
                    : "transparent",
                color:
                  tab === id
                    ? theme === "dark"
                      ? "#000000"
                      : "#ffffff"
                    : colors.text,
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-2">
          {tab === "personal" && (
            <div
              className="rounded-2xl border p-5 sm:p-8 space-y-6"
              style={{
                backgroundColor: colors.shadeBg,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
              }}
            >
              {/* Card Header & Edit Button */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
                style={{
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative group shrink-0">
                    {profile?.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt="Profile"
                        className="flex h-14 w-14 items-center justify-center rounded-2xl object-cover border border-white/10"
                      />
                    ) : (
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white text-lg font-bold shrink-0"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      >
                        {(
                          form.firstName?.[0] ||
                          profile?.email?.[0] ||
                          "U"
                        ).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center text-white transition-opacity cursor-pointer"
                      title="Update profile picture"
                    >
                      <Camera size={18} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold truncate">
                      {form.firstName || form.lastName
                        ? `${form.firstName} ${form.lastName}`
                        : "Unnamed Practitioner"}
                    </p>
                    <p className="text-sm opacity-70 truncate">
                      {profile?.email}
                    </p>
                    <div
                      className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold opacity-90 uppercase tracking-wider"
                      style={{
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.06)",
                      }}
                    >
                      <Stethoscope size={11} />
                      <span>
                        {profile?.role?.replace(/_/g, " ") || "medical staff"}
                      </span>
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all hover:opacity-80"
                    style={{
                      borderColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <Pencil size={13} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all hover:opacity-80 opacity-70"
                    style={{
                      borderColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <X size={14} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              {/* Success / Error Messages */}
              {usersError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                  {usersError}
                </div>
              )}
              {saved && (
                <div
                  className="rounded-xl border px-4 py-3 text-sm font-medium"
                  style={{
                    backgroundColor: `${PRIMARY_COLOR}15`,
                    borderColor: `${PRIMARY_COLOR}40`,
                    color: PRIMARY_COLOR,
                  }}
                >
                  {message || "Professional profile updated successfully."}
                </div>
              )}

              {/* VIEW MODE */}
              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 py-2">
                  <div>
                    <span className="block text-xs font-medium opacity-50">
                      First name
                    </span>
                    <span className="text-sm font-medium mt-0.5 block truncate">
                      {form.firstName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium opacity-50">
                      Last name
                    </span>
                    <span className="text-sm font-medium mt-0.5 block truncate">
                      {form.lastName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium opacity-50">
                      Middle name
                    </span>
                    <span className="text-sm font-medium mt-0.5 block truncate">
                      {form.middleName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium opacity-50">
                      Professional title
                    </span>
                    <span className="text-sm font-medium mt-0.5 block truncate">
                      {form.title || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium opacity-50">
                      Specialty
                    </span>
                    <span className="text-sm font-medium mt-0.5 block truncate">
                      {form.specialty || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium opacity-50">
                      License
                    </span>
                    <span className="text-sm font-medium mt-0.5 block truncate">
                      {form.license || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium opacity-50">
                      Gender
                    </span>
                    <span className="text-sm font-medium mt-0.5 block truncate capitalize">
                      {form.gender || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium opacity-50">
                      Country code
                    </span>
                    <span className="text-sm font-medium mt-0.5 block truncate">
                      {form.countryCode || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium opacity-50">
                      Phone number
                    </span>
                    <span className="text-sm font-medium mt-0.5 block truncate">
                      {form.phone || "—"}
                    </span>
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <span className="block text-xs font-medium opacity-50">
                      Professional Bio / Summary
                    </span>
                    <p className="text-sm opacity-80 mt-1 leading-relaxed break-words">
                      {form.bio || "No professional summary provided yet."}
                    </p>
                  </div>
                </div>
              ) : (
                /* EDIT MODE FORM */
                <form onSubmit={onSaveProfile} className="space-y-5">
                  {/* Profile Picture Upload Banner on Edit */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border"
                    style={{
                      backgroundColor: colors.shadeBgSecond,
                      borderColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                        style={{
                          backgroundColor: `${PRIMARY_COLOR}15`,
                          color: PRIMARY_COLOR,
                        }}
                      >
                        <Camera size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">Profile Picture</p>
                        <p className="text-[11px] opacity-60 truncate">
                          Upload and crop official photo (PNG, JPG)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        borderColor:
                          theme === "dark"
                            ? "rgba(255,255,255,0.15)"
                            : "rgba(0,0,0,0.15)",
                        backgroundColor: colors.shadeBg,
                      }}
                    >
                      Choose Picture
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>First name *</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., Alexander"
                        value={form.firstName}
                        disabled={busy}
                        onChange={(e) => set("firstName", e.target.value)}
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.12)",
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Last name *</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., Wright"
                        value={form.lastName}
                        disabled={busy}
                        onChange={(e) => set("lastName", e.target.value)}
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.12)",
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Middle name</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., Chukwuma"
                        value={form.middleName}
                        disabled={busy}
                        onChange={(e) => set("middleName", e.target.value)}
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.12)",
                        }}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Professional title</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., Dr., Consultant, Nurse"
                        value={form.title}
                        disabled={busy}
                        onChange={(e) => set("title", e.target.value)}
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.12)",
                        }}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Specialty</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., Cardiology, Pediatrics"
                        value={form.specialty}
                        disabled={busy}
                        onChange={(e) => set("specialty", e.target.value)}
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.12)",
                        }}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>License</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., MD-123456"
                        value={form.license}
                        disabled={busy}
                        onChange={(e) => set("license", e.target.value)}
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.12)",
                        }}
                      />
                    </div>

                    {/* Custom State-Style Dropdown for Gender */}
                    <div className="relative" ref={genderDropdownRef}>
                      <label className={labelCls}>Gender</label>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setIsGenderOpen(!isGenderOpen)}
                        className={`${inputCls} flex items-center justify-between text-left cursor-pointer`}
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.12)",
                        }}
                      >
                        <span
                          className={form.gender ? "capitalize" : "opacity-40"}
                        >
                          {form.gender
                            ? form.gender.charAt(0).toUpperCase() +
                              form.gender.slice(1)
                            : "Select gender"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform opacity-60 ${
                            isGenderOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isGenderOpen && (
                        <div
                          className="absolute z-30 mt-1.5 w-full rounded-xl border shadow-lg overflow-hidden py-1"
                          style={{
                            backgroundColor: colors.shadeBg,
                            borderColor:
                              theme === "dark"
                                ? "rgba(255,255,255,0.15)"
                                : "rgba(0,0,0,0.15)",
                          }}
                        >
                          {[
                            { label: "Male", value: "male" },
                            { label: "Female", value: "female" },
                            { label: "Other", value: "other" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                set("gender", option.value);
                                setIsGenderOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-sm transition-colors hover:opacity-100 flex items-center justify-between cursor-pointer"
                              style={{
                                backgroundColor:
                                  form.gender === option.value
                                    ? `${PRIMARY_COLOR}15`
                                    : "transparent",
                                color:
                                  form.gender === option.value
                                    ? PRIMARY_COLOR
                                    : colors.text,
                              }}
                            >
                              <span className="font-medium">
                                {option.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>Country code</label>
                      <input
                        className={inputCls}
                        placeholder="+234"
                        value={form.countryCode}
                        disabled={busy}
                        onChange={(e) => set("countryCode", e.target.value)}
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.12)",
                        }}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Phone number</label>
                      <input
                        className={inputCls}
                        placeholder="e.g., 803 000 0000"
                        value={form.phone}
                        disabled={busy}
                        onChange={(e) => set("phone", e.target.value)}
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.12)",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Professional Bio / Summary
                    </label>
                    <textarea
                      className={`${inputCls} h-28 py-2.5 resize-none`}
                      placeholder="Brief professional overview, certifications, or clinical background..."
                      value={form.bio}
                      disabled={busy}
                      maxLength={500}
                      onChange={(e) => set("bio", e.target.value)}
                      style={{
                        backgroundColor: colors.shadeBgSecond,
                        borderColor:
                          theme === "dark"
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(0,0,0,0.12)",
                      }}
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-[11px] opacity-50">
                        {form.bio.length}/500 chars
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="submit"
                      disabled={busy}
                      style={{ backgroundColor: PRIMARY_COLOR }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {busy ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      {busy ? "Saving Changes…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="h-11 px-5 rounded-xl text-sm font-medium border opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                      style={{
                        borderColor:
                          theme === "dark"
                            ? "rgba(255,255,255,0.15)"
                            : "rgba(0,0,0,0.15)",
                        backgroundColor: colors.shadeBgSecond,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {tab === "security" && (
            <div
              className="rounded-2xl border p-5 sm:p-8 space-y-6"
              style={{
                backgroundColor: colors.shadeBg,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
              }}
            >
              <div>
                <h2 className="text-base font-semibold">
                  Active Session Security
                </h2>
                <p className="mt-1 text-sm opacity-70">
                  Manage your active workstation session and authentication
                  clearance.
                </p>
              </div>

              {/* Active Session Badge */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{
                  backgroundColor: colors.shadeBgSecond,
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)",
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                    style={{
                      backgroundColor: `${PRIMARY_COLOR}15`,
                      color: PRIMARY_COLOR,
                    }}
                  >
                    <Laptop size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-50">
                        Current Session
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${PRIMARY_COLOR}15`,
                          color: PRIMARY_COLOR,
                        }}
                      >
                        <ShieldCheck size={11} /> Connected
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate mt-0.5">
                      {profile?.email || "ikennaibenemee@gmail.com"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Termination Box */}
              <div className="rounded-xl bg-red-600 dark:bg-red-700 text-white p-5 space-y-4 shadow-md">
                <div className="flex items-center gap-2.5 font-semibold text-sm text-white">
                  <ShieldAlert size={18} />
                  <span>Terminate Active Session</span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  Signing out will invalidate your authentication credentials on
                  this terminal workstation immediately. You will need your
                  secure login credentials to regain access.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => setIsLogoutModalOpen(true)}
                    disabled={busy}
                    className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-red-600 px-5 text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                  >
                    <LogOut size={16} />
                    <span>Secure Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Guides & Context Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div
            className="rounded-2xl border p-5 sm:p-6 space-y-4"
            style={{
              backgroundColor: colors.shadeBg,
              borderColor:
                theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex items-center gap-2.5 font-semibold text-sm">
              <Info size={18} style={{ color: PRIMARY_COLOR }} />
              <span>Practitioner Identity Guide</span>
            </div>
            <p className="text-xs opacity-75 leading-relaxed">
              Your professional details are securely recorded across clinical
              notes, SOAP consultations, and digital e-Prescriptions generated
              within the hospital facility network.
            </p>
            <div
              className="space-y-3 pt-3 border-t text-xs opacity-80"
              style={{
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
              }}
            >
              <div>
                <strong className="block font-semibold opacity-100 mb-0.5">
                  Professional Title:
                </strong>
                <span className="opacity-75">
                  Appears alongside your name on medical chart signatures and
                  reports.
                </span>
              </div>
              <div>
                <strong className="block font-semibold opacity-100 mb-0.5">
                  Profile Picture & Cropping:
                </strong>
                <span className="opacity-75">
                  Upload any photo to crop and adjust before saving your
                  official practitioner badge.
                </span>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl border p-5 sm:p-6 space-y-3"
            style={{
              backgroundColor: colors.shadeBg,
              borderColor:
                theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex items-center gap-2.5 font-semibold text-sm">
              <Building2 size={18} className="opacity-70" />
              <span>Facility Compliance</span>
            </div>
            <p className="text-xs opacity-75 leading-relaxed">
              All profile updates comply with strict data protection standards
              and audit log requirements. Unauthorized alterations to medical
              credentials are tracked automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Image Crop & Preview Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div
            className="w-full max-w-lg rounded-2xl border p-5 sm:p-6 space-y-5 shadow-2xl flex flex-col my-auto"
            style={{
              backgroundColor: colors.shadeBg,
              borderColor:
                theme === "dark"
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Crop Profile Picture</h3>
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="flex items-center gap-3">
              <ZoomIn size={16} className="opacity-60 shrink-0" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[var(--primary)] cursor-pointer"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                disabled={isUploading}
                className="h-10 px-4 rounded-xl text-xs font-semibold border opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                style={{
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.15)",
                  backgroundColor: colors.shadeBgSecond,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={isUploading}
                style={{ backgroundColor: PRIMARY_COLOR }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving Picture…</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Crop & Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="w-full max-w-md rounded-2xl border p-5 sm:p-6 space-y-5 shadow-2xl my-auto"
            style={{
              backgroundColor: colors.shadeBg,
              borderColor:
                theme === "dark"
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold truncate">
                  Confirm Secure Logout
                </h3>
                <p className="text-xs opacity-70 truncate">
                  Are you sure you want to end your active terminal session?
                </p>
              </div>
            </div>

            <p className="text-sm opacity-80 leading-relaxed">
              You will need to re-authenticate with your secure credentials to
              access patient charts and clinical tools again.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                disabled={busy}
                className="h-10 px-4 rounded-xl text-xs font-semibold border opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                style={{
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.15)",
                  backgroundColor: colors.shadeBgSecond,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onLogout}
                disabled={busy}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 text-xs font-semibold text-white disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
              >
                {busy ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <LogOut size={15} />
                )}
                {busy ? "Signing out…" : "Yes, Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
