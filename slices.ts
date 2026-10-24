/**
 * Root reducer — combine every slice here.
 * Import this in your Redux store setup.
 */
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import usersReducer from "./slices/usersSlice";
import facilitiesReducer from "./slices/facilitiesSlice";
import staffReducer from "./slices/staffSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  facilities: facilitiesReducer,
  staff: staffReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;

/* re-export actions & thunks for convenient imports */
export {
  verifyEmail,
  signup,
  login,
  logout,
  refreshSession,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  clearAuthError,
  clearOtpState,
  setUser,
} from "./slices/authSlice";

export {
  fetchMe,
  updateMe,
  uploadProfilePicture,
  fetchUsers,
  fetchUserById,
  adminUpdateUser,
  clearUsersError,
  clearSelected,
} from "./slices/usersSlice";

export {
  fetchMyFacilities,
  fetchFacility,
  createFacility,
  updateFacility,
  uploadFacilityLogo,
  transferFacilityOwnership,
  switchFacility,
  fetchFacilityMembers,
  fetchFacilityMemberDetail,
  addFacilityMember,
  inviteToFacility,
  fetchOutgoingInvites,
  resendFacilityInvite,
  retractFacilityInvite,
  fetchPendingInvites,
  acceptInvite,
  rejectInvite,
  updateFacilityMember,
  removeFacilityMember,
  leaveFacility,
  clearFacilitiesError,
  clearCurrentMemberDetail,
  setActiveFacilityFromLogin,
} from "./slices/facilitiesSlice";

export {
  fetchStaffDirectory,
  updateStaffCredentials,
  fetchShifts,
  createShift,
  updateShift,
  deleteShift,
  fetchOnCall,
  createOnCall,
  updateOnCall,
  deleteOnCall,
  clearStaffError,
} from "./slices/staffSlice";
