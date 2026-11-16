"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "@/components/access/guarded-link";
import {
  ArrowLeft,
  Building2,
  Search,
  Users,
  Mail,
  Phone,
  Trash2,
  Edit3,
  UserPlus,
  UserMinus,
  AlertTriangle,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch } from "@/api/hooks";
import {
  fetchDepartments,
  fetchFacilityMembers,
  fetchMyFacilities,
  removeDepartment,
  updateDepartment,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";

import { Can } from "@/components/access/can";
export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params?.departmentId as string;

  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { facilityId, departments, departmentsLoading, members } =
    useFacilityId();

  const [searchQuery, setSearchQuery] = useState("");
  const [addStaffSearchQuery, setAddStaffSearchQuery] = useState(""); // Search query for unassigned staff
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Multiple selection and confirmation states for adding staff
  const [selectedStaffToAdd, setSelectedStaffToAdd] = useState<string[]>([]);
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);

  // Confirmation state for removing/unassigning staff
  const [staffToRemove, setStaffToRemove] = useState<any | null>(null);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [removingStaff, setRemovingStaff] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (facilityId) {
      dispatch(fetchDepartments(facilityId));
      dispatch(fetchFacilityMembers(facilityId));
    }
  }, [dispatch, facilityId]);

  const department = (departments || []).find(
    (d: any) => String(d._id || d.id) === String(departmentId)
  );

  useEffect(() => {
    if (department) {
      setEditName(department.name || "");
      setEditCode(department.code || "");
      setEditDescription(department.description || "");
    }
  }, [department]);

  const assignedStaff = (members || []).filter((m: any) => {
    const memberId = String(m.id || m.user?._id || "");
    const deptStaffList = department?.staff || [];
    return deptStaffList.some((s: any) => String(s._id || s) === memberId);
  });

  const unassignedStaff = (members || []).filter((m: any) => {
    const memberId = String(m.id || m.user?._id || "");
    const deptStaffList = department?.staff || [];
    return !deptStaffList.some((s: any) => String(s._id || s) === memberId);
  });

  const filteredStaff = assignedStaff.filter((staff: any) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${staff.firstName || staff.user?.firstName || ""} ${
      staff.lastName || staff.user?.lastName || ""
    }`.toLowerCase();
    const email = (staff.email || staff.user?.email || "").toLowerCase();
    const role = (staff.role || staff.user?.role || "").toLowerCase();
    return fullName.includes(q) || email.includes(q) || role.includes(q);
  });

  const filteredUnassignedStaff = unassignedStaff.filter((staff: any) => {
    const q = addStaffSearchQuery.toLowerCase();
    const fullName = `${staff.firstName || staff.user?.firstName || ""} ${
      staff.lastName || staff.user?.lastName || ""
    }`.toLowerCase();
    const email = (staff.email || staff.user?.email || "").toLowerCase();
    const role = (staff.role || staff.user?.role || "").toLowerCase();
    return fullName.includes(q) || email.includes(q) || role.includes(q);
  });

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || !department) return;
    setUpdating(true);
    try {
      await dispatch(
        updateDepartment({
          facilityId,
          departmentId: department._id || department.id,
          payload: {
            name: editName,
            code: editCode,
            description: editDescription,
          },
        })
      ).unwrap();
      await dispatch(fetchDepartments(facilityId));
      setShowEditModal(false);
    } catch {
      // handled
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStaffSelection = (staffId: string) => {
    if (selectedStaffToAdd.includes(staffId)) {
      setSelectedStaffToAdd(selectedStaffToAdd.filter((id) => id !== staffId));
    } else {
      if (selectedStaffToAdd.length >= 10) {
        return; // Max 10 limit reached
      }
      setSelectedStaffToAdd([...selectedStaffToAdd, staffId]);
    }
  };

  const handleConfirmAddStaff = async () => {
    if (!facilityId || !department || selectedStaffToAdd.length === 0) return;
    setAddingStaff(true);
    const currentStaffIds = (department.staff || []).map((s: any) =>
      String(s._id || s)
    );

    const updatedStaffIds = Array.from(
      new Set([...currentStaffIds, ...selectedStaffToAdd])
    );

    try {
      await dispatch(
        updateDepartment({
          facilityId,
          departmentId: department._id || department.id,
          payload: { staff: updatedStaffIds },
        })
      ).unwrap();
      await dispatch(fetchDepartments(facilityId));
      setSelectedStaffToAdd([]);
      setShowAddConfirmModal(false);
    } catch {
      // handled
    } finally {
      setAddingStaff(false);
    }
  };

  const handleConfirmRemoveStaff = async () => {
    if (!facilityId || !department || !staffToRemove) return;
    setRemovingStaff(true);
    const staffId =
      staffToRemove.id || staffToRemove._id || staffToRemove.user?._id;
    const currentStaffIds = (department.staff || []).map((s: any) =>
      String(s._id || s)
    );

    const updatedStaffIds = currentStaffIds.filter((id: any) => id !== staffId);

    try {
      await dispatch(
        updateDepartment({
          facilityId,
          departmentId: department._id || department.id,
          payload: { staff: updatedStaffIds },
        })
      ).unwrap();
      await dispatch(fetchDepartments(facilityId));
      setShowRemoveConfirmModal(false);
      setStaffToRemove(null);
    } catch {
      // handled
    } finally {
      setRemovingStaff(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!facilityId || !department) return;
    setDeleting(true);
    try {
      await dispatch(
        removeDepartment({
          facilityId,
          departmentId: department._id || department.id,
        })
      ).unwrap();
      router.push("/dashboard/workspace/departments");
    } catch {
      setDeleting(false);
    }
  };

  if (departmentsLoading && !department) {
    return <DarkBlurOverlayLoader text="Loading department details..." />;
  }

  if (!department && !departmentsLoading) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-20 text-center space-y-4"
        style={{ color: colors.text }}
      >
        <Building2 className="mx-auto opacity-30" size={40} />
        <h2 className="text-lg font-semibold">Department not found</h2>
        <p className="text-xs opacity-60">
          This department may have been deleted or doesn't exist.
        </p>
        <Link
          href="/dashboard/workspace/departments"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          <ArrowLeft size={14} /> Back to Departments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/workspace/departments"
          className="inline-flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft size={14} /> Back to Departments
        </Link>

        <div className="flex items-center gap-2">
          {/* Edit Department Button */}
          <Can perm="settings.manage"><button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition px-3 py-1.5 rounded-full border"
            style={{
              borderColor: border,
              backgroundColor: ui.inner,
              color: ui.text,
            }}
          >
            <Edit3 size={13} />
            <span>Edit Department</span>
          </button></Can>

          {/* Delete Department Button */}
          <Can perm="settings.manage"><button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:opacity-80 transition px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/10"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button></Can>
        </div>
      </div>

      {/* Department Header Card */}
      <div
        className="space-y-4 relative overflow-hidden"
        style={{
          backgroundColor: colors.shadeBgSecond,
          color: ui.text,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-block px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase"
                style={{
                  backgroundColor: `${PRIMARY_COLOR}15`,
                  color: PRIMARY_COLOR,
                }}
              >
                {department?.code}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  department?.isActive !== false
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-neutral-500/15 text-neutral-400"
                }`}
              >
                {department?.isActive !== false ? "Active" : "Inactive"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {department?.name}
            </h1>
            <p className="text-xs opacity-60 max-w-xl leading-relaxed">
              {department?.description ||
                "No description provided for this department."}
            </p>
          </div>

          {/* Assigned Staff Count Badge */}
          <div
            className="flex items-center gap-3 rounded-2xl p-4 border"
            style={{ backgroundColor: ui.card, borderColor: border }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${PRIMARY_COLOR}15`,
                color: PRIMARY_COLOR,
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <p className="text-[11px] opacity-60 font-medium">
                Assigned Staff
              </p>
              <p className="text-lg font-bold">{assignedStaff.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Section */}
      <div
        className="space-y-6"
        style={{
          backgroundColor: colors.shadeBgSecond,
          color: ui.text,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Assigned Department Staff
            </h2>
            <p className="text-xs opacity-60">
              Manage members currently assigned to {department?.name}.
            </p>
          </div>

          {/* Search Input */}
          <div
            className="flex items-center gap-2 w-full sm:w-72 rounded-2xl border px-3.5 py-2.5"
            style={{ backgroundColor: ui.inner, borderColor: border }}
          >
            <Search size={14} className="opacity-50 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assigned staff..."
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: ui.text }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="opacity-50 hover:opacity-100"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Assigned Staff Grid */}
        {filteredStaff.length === 0 ? (
          <div
            className="rounded-[24px] p-10 text-center space-y-3 border border-dashed"
            style={{ borderColor: border }}
          >
            <Users className="mx-auto opacity-30" size={32} />
            <p className="text-sm font-medium">No assigned staff found</p>
            <p className="text-xs opacity-50">
              {searchQuery
                ? "No staff match your search query."
                : "No staff members are currently assigned to this department."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredStaff.map((staff: any) => {
              const staffId = staff.id || staff._id || staff.user?._id;
              const pic = staff.profilePicture || staff.user?.profilePicture;
              const firstName = staff.firstName || staff.user?.firstName || "";
              const lastName = staff.lastName || staff.user?.lastName || "";
              const initials = `${firstName[0] || ""}${
                lastName[0] || ""
              }`.toUpperCase();
              const email = staff.email || staff.user?.email || "No email";
              const role = staff.role || staff.user?.role || "Staff";

              return (
                <div
                  key={staffId}
                  className="rounded-[24px] p-4 border flex items-center justify-between gap-4 transition hover:shadow-md"
                  style={{ backgroundColor: ui.card, borderColor: border }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center font-bold uppercase text-xs">
                      {pic ? (
                        <img
                          src={pic}
                          alt={`${firstName} ${lastName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials || "ST"
                      )}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-sm font-semibold truncate">
                        {firstName} {lastName}
                      </h4>
                      <p className="text-xs opacity-60 truncate">{email}</p>
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                        style={{
                          backgroundColor: `${PRIMARY_COLOR}15`,
                          color: PRIMARY_COLOR,
                        }}
                      >
                        {role}
                      </span>
                    </div>
                  </div>

                  <Can perm="settings.manage"><button
                    type="button"
                    onClick={() => {
                      setStaffToRemove(staff);
                      setShowRemoveConfirmModal(true);
                    }}
                    title="Remove from department"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 hover:opacity-80 transition shrink-0"
                  >
                    <UserMinus size={14} />
                  </button></Can>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Staff from Available Facility Members (Multiple Selection with Max 10 limit & Search) */}
        {unassignedStaff.length > 0 && (
          <div
            className="pt-6 border-t space-y-4"
            style={{ borderColor: border }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">
                  Add Facility Staff to Department
                </h3>
                <p className="text-[11px] opacity-60">
                  Select staff members to assign (Max 10 per batch)
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search input for unassigned staff */}
                <div
                  className="flex items-center gap-2 w-full sm:w-60 rounded-2xl border px-3 py-2"
                  style={{ backgroundColor: ui.inner, borderColor: border }}
                >
                  <Search size={13} className="opacity-50 shrink-0" />
                  <input
                    value={addStaffSearchQuery}
                    onChange={(e) => setAddStaffSearchQuery(e.target.value)}
                    placeholder="Search staff to add..."
                    className="w-full bg-transparent text-xs outline-none"
                    style={{ color: ui.text }}
                  />
                  {addStaffSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAddStaffSearchQuery("")}
                      className="opacity-50 hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {selectedStaffToAdd.length > 0 && (
                  <Can perm="settings.manage"><button
                    type="button"
                    onClick={() => setShowAddConfirmModal(true)}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 shrink-0"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    <UserPlus size={14} />
                    <span>Assign Selected ({selectedStaffToAdd.length})</span>
                  </button></Can>
                )}
              </div>
            </div>

            {filteredUnassignedStaff.length === 0 ? (
              <div
                className="rounded-[20px] p-6 text-center space-y-2 border border-dashed"
                style={{ borderColor: border }}
              >
                <p className="text-xs opacity-60">
                  No unassigned staff match your search query.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredUnassignedStaff.map((staff: any) => {
                  const staffId = staff.id || staff._id || staff.user?._id;
                  const pic =
                    staff.profilePicture || staff.user?.profilePicture;
                  const firstName =
                    staff.firstName || staff.user?.firstName || "";
                  const lastName = staff.lastName || staff.user?.lastName || "";
                  const initials = `${firstName[0] || ""}${
                    lastName[0] || ""
                  }`.toUpperCase();
                  const email = staff.email || staff.user?.email || "No email";
                  const isSelected = selectedStaffToAdd.includes(staffId);
                  const isMaxReached =
                    selectedStaffToAdd.length >= 10 && !isSelected;

                  return (
                    <div
                      key={staffId}
                      onClick={() =>
                        !isMaxReached && handleToggleStaffSelection(staffId)
                      }
                      className={`rounded-[20px] p-3 border flex items-center justify-between gap-3 transition cursor-pointer ${
                        isMaxReached
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:border-opacity-80"
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? `${PRIMARY_COLOR}10`
                          : ui.card,
                        borderColor: isSelected ? PRIMARY_COLOR : border,
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center font-bold uppercase text-[10px]">
                          {pic ? (
                            <img
                              src={pic}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials || "ST"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {firstName} {lastName}
                          </p>
                          <p className="text-[10px] opacity-60 truncate">
                            {email}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-md border transition shrink-0 ${
                          isSelected ? "text-white" : "opacity-40"
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? PRIMARY_COLOR
                            : "transparent",
                          borderColor: isSelected ? PRIMARY_COLOR : border,
                        }}
                      >
                        {isSelected && <Check size={12} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Staff Confirmation Modal */}
      {showAddConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !addingStaff)
              setShowAddConfirmModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[28px] p-6 space-y-5 shadow-xl"
            style={{ backgroundColor: ui.card, color: ui.text }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium tracking-tight">
                Confirm Staff Assignment
              </h3>
              <button
                type="button"
                onClick={() => setShowAddConfirmModal(false)}
                disabled={addingStaff}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full opacity-70 hover:opacity-100 outline-none"
                style={{ backgroundColor: ui.inner }}
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${PRIMARY_COLOR}15`,
                  color: PRIMARY_COLOR,
                }}
              >
                <Users size={18} />
              </div>
              <p className="text-sm leading-relaxed opacity-75">
                Are you sure you want to assign{" "}
                <span className="font-semibold">
                  {selectedStaffToAdd.length}
                </span>{" "}
                staff member(s) to{" "}
                <span className="font-semibold">{department?.name}</span>?
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={addingStaff}
                onClick={() => setShowAddConfirmModal(false)}
                className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50 outline-none"
                style={{ backgroundColor: ui.inner }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addingStaff}
                onClick={handleConfirmAddStaff}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none flex items-center gap-2"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {addingStaff ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <span>Confirm Assignment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Staff Confirmation Modal */}
      {showRemoveConfirmModal && staffToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !removingStaff)
              setShowRemoveConfirmModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[28px] p-6 space-y-5 shadow-xl"
            style={{ backgroundColor: ui.card, color: ui.text }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium tracking-tight">
                Remove Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setShowRemoveConfirmModal(false)}
                disabled={removingStaff}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full opacity-70 hover:opacity-100 outline-none"
                style={{ backgroundColor: ui.inner }}
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <p className="text-sm leading-relaxed opacity-75">
                Are you sure you want to remove{" "}
                <span className="font-semibold">
                  {staffToRemove.firstName ||
                    staffToRemove.user?.firstName ||
                    ""}{" "}
                  {staffToRemove.lastName || staffToRemove.user?.lastName || ""}
                </span>{" "}
                from <span className="font-semibold">{department?.name}</span>?
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={removingStaff}
                onClick={() => setShowRemoveConfirmModal(false)}
                className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50 outline-none"
                style={{ backgroundColor: ui.inner }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removingStaff}
                onClick={handleConfirmRemoveStaff}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none flex items-center gap-2"
                style={{ backgroundColor: "#ef4444" }}
              >
                {removingStaff ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Remove</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !updating)
              setShowEditModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-[28px] p-6 space-y-5"
            style={{ backgroundColor: ui.card, color: ui.text }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium tracking-tight">
                Edit Department
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={updating}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full opacity-70 hover:opacity-100 outline-none"
                style={{ backgroundColor: ui.inner }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium opacity-75">
                  Department Name
                </label>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Cardiology"
                  className="w-full rounded-2xl border px-3.5 py-2.5 text-xs outline-none"
                  style={{
                    backgroundColor: ui.inner,
                    borderColor: border,
                    color: ui.text,
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium opacity-75">
                  Code / Abbreviation
                </label>
                <input
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CARD"
                  className="w-full rounded-2xl border px-3.5 py-2.5 text-xs outline-none uppercase"
                  style={{
                    backgroundColor: ui.inner,
                    borderColor: border,
                    color: ui.text,
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium opacity-75">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Brief summary of department responsibilities..."
                  className="w-full rounded-2xl border p-3 text-xs outline-none resize-none"
                  style={{
                    backgroundColor: ui.inner,
                    borderColor: border,
                    color: ui.text,
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setShowEditModal(false)}
                  className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50 outline-none"
                  style={{ backgroundColor: ui.inner }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none flex items-center gap-2"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {updating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting)
              setShowDeleteModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[28px] p-6 space-y-5"
            style={{ backgroundColor: ui.card, color: ui.text }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium tracking-tight">
                Delete department?
              </h3>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full opacity-70 hover:opacity-100 outline-none"
                style={{ backgroundColor: ui.inner }}
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <p className="text-sm leading-relaxed opacity-75">
                Are you sure you want to delete{" "}
                <span className="font-medium">{department?.name}</span>? This
                action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50 outline-none"
                style={{ backgroundColor: ui.inner }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteDepartment}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none flex items-center gap-2"
                style={{ backgroundColor: "#ef4444" }}
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
