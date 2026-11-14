import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import usersReducer from "./slices/usersSlice";
import facilitiesReducer from "./slices/facilitiesSlice";
import staffReducer from "./slices/staffSlice";
import tasksReducer from "./slices/tasksSlice";
import patientsReducer from "./slices/patientsSlice";
import wardsReducer from "./slices/wardsSlice";
import appointmentsReducer from "./slices/appointmentsSlice";
import clinicalReducer from "./slices/clinicalSlice";
import emergencyReducer from "./slices/emergencySlice";
import labsReducer from "./slices/labsSlice";
import pharmacyReducer from "./slices/pharmacySlice";
import radiologyReducer from "./slices/radiologySlice";
import bloodBankReducer from "./slices/bloodBankSlice";
import theaterReducer from "./slices/theaterSlice";
import maternityReducer from "./slices/maternitySlice";
import icdReducer from "./slices/Icd.slice";
import complianceReducer from "./slices/complianceSlice";
import aiReducer from "./slices/aiSlice";
import dashboardReducer from "./slices/dashboardSlice";
import telemedicineReducer from "./slices/telemedicineSlice";
import dataManagementReducer from "./slices/datamanagementSlice";
import feedbacksReducer from "./slices/feedbacksSlice"; // 1. Import your feedbacks reducer
import notificationsReducer from "./slices/notificationsSlice";
import accessReducer from "./slices/accessSlice";
import billingReducer from "./slices/billingSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  facilities: facilitiesReducer,
  staff: staffReducer,
  tasks: tasksReducer,
  patients: patientsReducer,
  wards: wardsReducer,
  appointments: appointmentsReducer,
  clinical: clinicalReducer,
  emergency: emergencyReducer,
  labs: labsReducer,
  pharmacy: pharmacyReducer,
  radiology: radiologyReducer,
  bloodBank: bloodBankReducer,
  theater: theaterReducer,
  maternity: maternityReducer,
  icd: icdReducer,
  compliance: complianceReducer,
  ai: aiReducer,
  dashboard: dashboardReducer,
  telemedicine: telemedicineReducer,
  dataManagement: dataManagementReducer,
  feedbacks: feedbacksReducer, // 2. Add feedbacks slice to the root reducer
  notifications: notificationsReducer,
  access: accessReducer,
  billing: billingReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;

export * from "./slices/authSlice";
export * from "./slices/usersSlice";
export * from "./slices/facilitiesSlice";
export * from "./slices/staffSlice";
export * from "./slices/tasksSlice";
export * from "./slices/patientsSlice";
export * from "./slices/wardsSlice";
export * from "./slices/appointmentsSlice";
export * from "./slices/clinicalSlice";
export * from "./slices/Icd.slice";
export { fetchConsultations } from "./slices/clinicalSlice";
export { fetchConsultations as fetchPatientConsultations } from "./slices/patientsSlice";
export * from "./slices/emergencySlice";
export * from "./slices/labsSlice";
export * from "./slices/pharmacySlice";
export * from "./slices/radiologySlice";
export * from "./slices/bloodBankSlice";
export * from "./slices/theaterSlice";
export * from "./slices/maternitySlice";
export * from "./slices/complianceSlice";
export * from "./slices/aiSlice";
export * from "./slices/dashboardSlice";
export * from "./slices/telemedicineSlice";
export * from "./slices/datamanagementSlice";
export * from "./slices/feedbacksSlice"; // 3. Export feedbacks actions/thunks
export * from "./slices/notificationsSlice";
export * from "./slices/accessSlice";
export * from "./slices/billingSlice";
