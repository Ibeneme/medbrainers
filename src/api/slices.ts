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
import maternalReducer from "./slices/maternalSlice";

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
  maternal: maternalReducer,
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
export * from "./slices/emergencySlice";
export * from "./slices/labsSlice";
export * from "./slices/pharmacySlice";
export * from "./slices/radiologySlice";
export * from "./slices/bloodBankSlice";
export * from "./slices/theaterSlice";
export * from "./slices/maternalSlice";
