import { useAppSelector } from "@/api/hooks";

export function useFacilityId() {
    const facilitiesState = useAppSelector((s) => s.facilities);

    const {
        activeFacilityId,
        activeFacility,
        list,
        pendingInvites,
        outgoingInvites,
        departments,
        initialized,
        current,
        currentTheme,
        members,
        currentMemberDetail,
        loading,
        departmentsLoading,
        membersLoading,
        memberDetailLoading,
        outgoingInvitesLoading,
        switching,
        saving,
        error,
        message,
    } = facilitiesState;

    const facilityId = activeFacilityId || activeFacility?.id || activeFacility?._id || "";

    return {
        facilityId,
        facilityList: list || [],
        pendingInvites: pendingInvites || [],
        outgoingInvites: outgoingInvites || [],
        departments: departments || [],
        initialized,
        currentFacility: current,
        currentTheme: currentTheme || null,
        activeFacility,
        members: members || [],
        currentMemberDetail,
        facilitiesLoading: loading,
        departmentsLoading,
        membersLoading,
        memberDetailLoading,
        outgoingInvitesLoading,
        switching,
        saving,
        error,
        message,
        hasFacility: Boolean(facilityId),
    };
}