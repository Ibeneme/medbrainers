import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types (aligned with backend radiology.schema)                             */
/* -------------------------------------------------------------------------- */

export type Modality =
  | "xray"
  | "ct"
  | "mri"
  | "ultrasound"
  | "mammography"
  | "fluoroscopy"
  | "nuclear"
  | "pet"
  | "dexa"
  | "other";

export type Priority = "routine" | "urgent" | "stat";
export type Laterality = "left" | "right" | "bilateral" | "na";
export type ContrastType = "none" | "oral" | "iv" | "both" | "intra_articular" | "other";

export type RequestStatus =
  | "requested"
  | "pre_auth_pending"
  | "pre_auth_approved"
  | "pre_auth_denied"
  | "scheduled"
  | "arrived"
  | "queued"
  | "in_acquisition"
  | "completed"
  | "reported"
  | "cancelled";

export type ReportStatus = "draft" | "preliminary" | "final" | "amended";

export interface PopulatedUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface PopulatedPatient {
  _id: string;
  mrn?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  allergies?: string[];
}

export interface ImagingCatalogItem {
  _id: string;
  company: string;
  code: string;
  name: string;
  modality: Modality;
  bodyPart?: string;
  lateralityDefault?: Laterality;
  description?: string;
  preparationInstructions?: string;
  durationMinutes?: number;
  requiresContrast: boolean;
  defaultContrastType?: ContrastType;
  price: number;
  cptCode?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModalityRoom {
  _id: string;
  company: string;
  name: string;
  code: string;
  modality: Modality;
  location?: string;
  isActive: boolean;
}

export interface IcdCode {
  code: string;
  description?: string;
}

export interface ContrastAllergy {
  allergen: string;
  reaction?: string;
  severity?: "mild" | "moderate" | "severe" | "unknown";
}

export interface ContrastScreening {
  contrastRequired: boolean;
  contrastType: ContrastType;
  contrastRequirementNote?: string;
  allergies?: ContrastAllergy[];
  allergyChecked: boolean;
  knownContrastAllergy: boolean;
  allergyNotes?: string;
  creatinineValue?: number;
  creatinineUnit?: string;
  egfr?: number;
  screeningPassed?: boolean;
  screenedBy?: string | PopulatedUser;
  screenedAt?: string;
}

export interface InsurancePreAuth {
  required: boolean;
  status: "not_required" | "pending" | "approved" | "denied" | "expired";
  authorizationNumber?: string;
  payerName?: string;
  submittedAt?: string;
  decidedAt?: string;
  notes?: string;
  trackedBy?: string | PopulatedUser;
}

export interface RequestNote {
  _id?: string;
  author?: string | PopulatedUser;
  text: string;
  isSystemAudit?: boolean;
  createdAt: string;
}

export interface RequestResult {
  finalResult: string;
  enteredBy?: string | PopulatedUser;
  enteredAt?: string;
  updatedAt?: string;
}

export interface StudyInstance {
  b2Key: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  sopInstanceUid?: string;
  seriesNumber?: number;
  instanceNumber?: number;
  uploadedAt: string;
  uploadedBy?: string | PopulatedUser;
}

export interface ImagingStudy {
  _id: string;
  company: string;
  patient: string | PopulatedPatient;
  imagingRequest: string;
  accessionNumber: string;
  studyInstanceUid?: string;
  studyDate?: string;
  studyDescription?: string;
  modality: Modality;
  numberOfSeries?: number;
  numberOfInstances?: number;
  instances: StudyInstance[];
  keyImageUrl?: string;
  status: "uploading" | "ready" | "archived" | "failed";
  createdAt?: string;
  updatedAt?: string;
}

export interface ImagingRequest {
  _id: string;
  company: string;
  patient: string | PopulatedPatient;
  consultation?: string;
  admission?: string;
  accessionNumber: string;
  catalogItem?: string | ImagingCatalogItem;
  modality: Modality;
  procedureCode?: string;
  procedureName: string;
  bodyPart: string;
  laterality: Laterality;
  clinicalIndication: string;
  icdCodes: IcdCode[];
  priority: Priority;
  status: RequestStatus;
  contrast: ContrastScreening;
  preAuthorization: InsurancePreAuth;
  preparationInstructions?: string;
  preparationLoggedAt?: string;
  preparationLoggedBy?: string | PopulatedUser;
  scheduledAt?: string;
  scheduledRoom?: string | ModalityRoom;
  arrivedAt?: string;
  arrivalLoggedBy?: string | PopulatedUser;
  assignedTechnologist?: string | PopulatedUser;
  assignedRadiologist?: string | PopulatedUser;
  room?: string | ModalityRoom;
  queuedAt?: string;
  acquisitionStartedAt?: string;
  acquisitionCompletedAt?: string;
  requestedBy: string | PopulatedUser;
  requestedAt: string;
  referringPhysicianName?: string;
  referringPhysicianNpi?: string;
  study?: string | ImagingStudy;
  dicomStudyUid?: string;
  result?: RequestResult;
  notes?: string;
  notesList?: RequestNote[];
  cancelledAt?: string;
  cancelledBy?: string | PopulatedUser;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UploadStudyResponse = Omit<ApiSuccess<ImagingStudy | null>, "data"> & {
  data: ImagingStudy | null;
  request?: ImagingRequest;
};

export interface ReportSection {
  key: string;
  title: string;
  content: string;
}

export interface DigitalSignature {
  signedBy: string | PopulatedUser;
  signedAt: string;
  role: string;
  signatureHash?: string;
  ipAddress?: string;
}

export interface ImagingReport {
  _id: string;
  company: string;
  patient: string | PopulatedPatient;
  imagingRequest: string;
  study?: string;
  accessionNumber: string;
  templateKey: string;
  findings: string;
  impression: string;
  sections: ReportSection[];
  status: ReportStatus;
  isAddendum: boolean;
  parentReport?: string;
  dictationRawText?: string;
  dictationSource?: "manual" | "voice" | "imported";
  authoredBy: string | PopulatedUser;
  authoredAt: string;
  preliminaryAt?: string;
  finalizedAt?: string;
  amendedAt?: string;
  signatures: DigitalSignature[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ViewerPayload {
  request: ImagingRequest;
  study: ImagingStudy | null;
  report: ImagingReport | null;
  streamingHint?: string;
}

/** Full result detail returned by GET /results/:requestId */
export interface ResultDetailPayload {
  request: ImagingRequest;
  study: ImagingStudy | null;
  report: ImagingReport | null;
}

export interface WorklistQueues {
  items: ImagingRequest[];
  queues: Record<string, ImagingRequest[]>;
}

export interface ListMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/* -------------------------------------------------------------------------- */
/*  State                                                                     */
/* -------------------------------------------------------------------------- */

export interface RadiologyState {
  catalog: ImagingCatalogItem[];
  rooms: ModalityRoom[];
  requests: ImagingRequest[];
  requestsMeta: ListMeta | null;
  /** Results list (requests that have finalResult) */
  results: ImagingRequest[];
  resultsMeta: ListMeta | null;
  worklist: ImagingRequest[];
  worklistQueues: Record<string, ImagingRequest[]>;
  currentRequest: ImagingRequest | null;
  currentStudy: ImagingStudy | null;
  currentReport: ImagingReport | null;
  /** Full result detail (request + study + report) */
  currentResultDetail: ResultDetailPayload | null;
  viewer: ViewerPayload | null;
  listLoading: boolean;
  detailLoading: boolean;
  resultsLoading: boolean;
  catalogLoading: boolean;
  roomsLoading: boolean;
  worklistLoading: boolean;
  saving: boolean;
  uploading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: RadiologyState = {
  catalog: [],
  rooms: [],
  requests: [],
  requestsMeta: null,
  results: [],
  resultsMeta: null,
  worklist: [],
  worklistQueues: {},
  currentRequest: null,
  currentStudy: null,
  currentReport: null,
  currentResultDetail: null,
  viewer: null,
  listLoading: false,
  detailLoading: false,
  resultsLoading: false,
  catalogLoading: false,
  roomsLoading: false,
  worklistLoading: false,
  saving: false,
  uploading: false,
  error: null,
  message: null,
};

/* -------------------------------------------------------------------------- */
/*  Thunks – Catalogue                                                        */
/* -------------------------------------------------------------------------- */

export const fetchImagingCatalog = createAsyncThunk(
  "radiology/fetchCatalog",
  async (
    { facilityId, modality, q }: { facilityId: string; modality?: Modality; q?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ImagingCatalogItem[]>>(
        `/companies/${facilityId}/radiology/catalog`,
        { params: { modality, q } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load imaging catalog"));
    }
  },
);

export const fetchCatalogItemById = createAsyncThunk(
  "radiology/fetchCatalogItemById",
  async (
    { facilityId, catalogId }: { facilityId: string; catalogId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ImagingCatalogItem>>(
        `/companies/${facilityId}/radiology/catalog/${catalogId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load catalog item"));
    }
  },
);

export const createCatalogItem = createAsyncThunk(
  "radiology/createCatalogItem",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        code: string;
        name: string;
        modality: Modality;
        bodyPart?: string;
        lateralityDefault?: Laterality;
        description?: string;
        preparationInstructions?: string;
        durationMinutes?: number;
        requiresContrast?: boolean;
        defaultContrastType?: ContrastType;
        price?: number;
        cptCode?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingCatalogItem>>(
        `/companies/${facilityId}/radiology/catalog`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create catalog item"));
    }
  },
);

export const updateCatalogItem = createAsyncThunk(
  "radiology/updateCatalogItem",
  async (
    {
      facilityId,
      catalogId,
      payload,
    }: { facilityId: string; catalogId: string; payload: Partial<ImagingCatalogItem> },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<ImagingCatalogItem>>(
        `/companies/${facilityId}/radiology/catalog/${catalogId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update catalog item"));
    }
  },
);

/* -------------------------------------------------------------------------- */
/*  Thunks – Rooms                                                            */
/* -------------------------------------------------------------------------- */

export const fetchModalityRooms = createAsyncThunk(
  "radiology/fetchRooms",
  async (
    { facilityId, modality }: { facilityId: string; modality?: Modality },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ModalityRoom[]>>(
        `/companies/${facilityId}/radiology/rooms`,
        { params: { modality } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load modality rooms"));
    }
  },
);

export const createModalityRoom = createAsyncThunk(
  "radiology/createRoom",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: { name: string; code: string; modality: Modality; location?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ModalityRoom>>(
        `/companies/${facilityId}/radiology/rooms`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create room"));
    }
  },
);

/* -------------------------------------------------------------------------- */
/*  Thunks – Requests                                                         */
/* -------------------------------------------------------------------------- */

export const fetchImagingRequests = createAsyncThunk(
  "radiology/fetchRequests",
  async (
    args: {
      facilityId: string;
      status?: RequestStatus;
      modality?: Modality;
      priority?: Priority;
      patientId?: string;
      technologistId?: string;
      from?: string;
      to?: string;
      q?: string;
      limit?: number;
      page?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const { facilityId, ...params } = args;
      const { data } = await api.get<ApiSuccess<ImagingRequest[]>>(
        `/companies/${facilityId}/radiology/requests`,
        { params },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load imaging requests"));
    }
  },
);

export const fetchImagingRequestDetail = createAsyncThunk(
  "radiology/fetchRequestDetail",
  async (
    { facilityId, requestId }: { facilityId: string; requestId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${requestId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load imaging request"));
    }
  },
);

export const createImagingRequest = createAsyncThunk(
  "radiology/createRequest",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        consultationId?: string;
        admissionId?: string;
        catalogItemId?: string;
        modality: Modality;
        procedureCode?: string;
        procedureName: string;
        bodyPart: string;
        laterality?: Laterality;
        clinicalIndication: string;
        icdCodes?: IcdCode[];
        priority?: Priority;
        contrastRequired?: boolean;
        contrastType?: ContrastType;
        preparationInstructions?: string;
        referringPhysicianName?: string;
        referringPhysicianNpi?: string;
        preAuthRequired?: boolean;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create imaging request"));
    }
  },
);

export const updateImagingRequestStatus = createAsyncThunk(
  "radiology/updateStatus",
  async (
    {
      facilityId,
      requestId,
      status,
      reason,
    }: {
      facilityId: string;
      requestId: string;
      status: RequestStatus;
      reason?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/status`,
        { status, reason },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update status"));
    }
  },
);

export const addImagingRequestNote = createAsyncThunk(
  "radiology/addNote",
  async (
    { facilityId, requestId, text }: { facilityId: string; requestId: string; text: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/notes`,
        { text },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add note"));
    }
  },
);

export const updateRequestResult = createAsyncThunk(
  "radiology/updateResult",
  async (
    {
      facilityId,
      requestId,
      finalResult,
    }: {
      facilityId: string;
      requestId: string;
      finalResult: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/result`,
        { finalResult },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update final result"));
    }
  },
);

/* -------------------------------------------------------------------------- */
/*  Thunks – Results (list + detail)                                          */
/* -------------------------------------------------------------------------- */

export const fetchImagingResults = createAsyncThunk(
  "radiology/fetchResults",
  async (
    args: {
      facilityId: string;
      modality?: Modality;
      patientId?: string;
      from?: string;
      to?: string;
      q?: string; // searches accession, procedureCode, procedureName, bodyPart, clinicalIndication, finalResult
      limit?: number;
      page?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const { facilityId, ...params } = args;
      const { data } = await api.get<ApiSuccess<ImagingRequest[]>>(
        `/companies/${facilityId}/radiology/results`,
        { params },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load imaging results"));
    }
  },
);

export const fetchImagingResultDetail = createAsyncThunk(
  "radiology/fetchResultDetail",
  async (
    { facilityId, requestId }: { facilityId: string; requestId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ResultDetailPayload>>(
        `/companies/${facilityId}/radiology/results/${requestId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load result detail"));
    }
  },
);

/* -------------------------------------------------------------------------- */
/*  Thunks – Worklist                                                         */
/* -------------------------------------------------------------------------- */

export const fetchRadiologyWorklist = createAsyncThunk(
  "radiology/fetchWorklist",
  async (
    {
      facilityId,
      modality,
      roomId,
      status,
    }: {
      facilityId: string;
      modality?: Modality;
      roomId?: string;
      status?: RequestStatus;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<WorklistQueues>>(
        `/companies/${facilityId}/radiology/worklist`,
        { params: { modality, roomId, status } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load worklist"));
    }
  },
);

/* -------------------------------------------------------------------------- */
/*  Thunks – Assignment / arrival / preparation                               */
/* -------------------------------------------------------------------------- */

export const assignTechnologistAndRoom = createAsyncThunk(
  "radiology/assign",
  async (
    {
      facilityId,
      requestId,
      payload,
    }: {
      facilityId: string;
      requestId: string;
      payload: {
        technologistId?: string;
        radiologistId?: string;
        roomId?: string;
        scheduledAt?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/assignment`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update assignment"));
    }
  },
);

export const logPatientArrival = createAsyncThunk(
  "radiology/logArrival",
  async (
    { facilityId, requestId }: { facilityId: string; requestId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/arrival`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not log arrival"));
    }
  },
);

export const logPreparation = createAsyncThunk(
  "radiology/logPreparation",
  async (
    {
      facilityId,
      requestId,
      instructions,
    }: { facilityId: string; requestId: string; instructions?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/preparation`,
        { instructions },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not log preparation"));
    }
  },
);

/* -------------------------------------------------------------------------- */
/*  Thunks – Contrast & pre-auth                                              */
/* -------------------------------------------------------------------------- */

export const submitContrastScreening = createAsyncThunk(
  "radiology/contrastScreening",
  async (
    {
      facilityId,
      requestId,
      payload,
    }: {
      facilityId: string;
      requestId: string;
      payload: {
        allergyChecked: boolean;
        knownContrastAllergy: boolean;
        allergyNotes?: string;
        creatinineValue?: number;
        creatinineUnit?: string;
        egfr?: number;
        screeningPassed: boolean;
        contrastType?: ContrastType;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/contrast-screening`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not save contrast screening"));
    }
  },
);

export const updatePreAuthorization = createAsyncThunk(
  "radiology/preAuth",
  async (
    {
      facilityId,
      requestId,
      payload,
    }: {
      facilityId: string;
      requestId: string;
      payload: {
        status: "pending" | "approved" | "denied" | "expired" | "not_required";
        authorizationNumber?: string;
        payerName?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/pre-auth`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update pre-authorization"));
    }
  },
);

export const updateContrastInfo = createAsyncThunk(
  "radiology/contrastInfo",
  async (
    {
      facilityId,
      requestId,
      payload,
    }: {
      facilityId: string;
      requestId: string;
      payload: {
        contrastRequired?: boolean;
        contrastType?: ContrastType;
        contrastRequirementNote?: string;
        allergies?: ContrastAllergy[];
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/contrast`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update contrast info"));
    }
  },
);

/* -------------------------------------------------------------------------- */
/*  Thunks – Study upload + final result + viewer                             */
/* -------------------------------------------------------------------------- */

export const uploadStudyInstances = createAsyncThunk(
  "radiology/uploadStudy",
  async (
    {
      facilityId,
      requestId,
      files,
      meta,
    }: {
      facilityId: string;
      requestId: string;
      files: File[];
      meta?: {
        studyInstanceUid?: string;
        studyDescription?: string;
        studyDate?: string;
        finalResult?: string;
        removeKeys?: string[];
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const form = new FormData();
      (files || []).forEach((f) => form.append("files", f));
      if (meta?.studyInstanceUid) form.append("studyInstanceUid", meta.studyInstanceUid);
      if (meta?.studyDescription) form.append("studyDescription", meta.studyDescription);
      if (meta?.studyDate) form.append("studyDate", meta.studyDate);
      if (meta?.finalResult) form.append("finalResult", meta.finalResult);
      if (meta?.removeKeys?.length) {
        form.append("removeKeys", meta.removeKeys.join(","));
      }

      const { data } = await api.post<UploadStudyResponse>(
        `/companies/${facilityId}/radiology/requests/${requestId}/study/upload`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not upload study files"));
    }
  },
);

export const fetchRadiologyViewer = createAsyncThunk(
  "radiology/fetchViewer",
  async (
    { facilityId, requestId }: { facilityId: string; requestId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ViewerPayload>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/viewer`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load viewer data"));
    }
  },
);

/* -------------------------------------------------------------------------- */
/*  Thunks – Reports                                                          */
/* -------------------------------------------------------------------------- */

export const saveImagingReport = createAsyncThunk(
  "radiology/saveReport",
  async (
    {
      facilityId,
      requestId,
      payload,
    }: {
      facilityId: string;
      requestId: string;
      payload: {
        templateKey?: string;
        findings?: string;
        impression?: string;
        sections?: ReportSection[];
        dictationRawText?: string;
        dictationSource?: "manual" | "voice" | "imported";
        status?: ReportStatus;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingReport>>(
        `/companies/${facilityId}/radiology/requests/${requestId}/reports`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not save report"));
    }
  },
);

export const signImagingReport = createAsyncThunk(
  "radiology/signReport",
  async (
    {
      facilityId,
      reportId,
      makeFinal,
    }: { facilityId: string; reportId: string; makeFinal?: boolean },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingReport>>(
        `/companies/${facilityId}/radiology/reports/${reportId}/sign`,
        { makeFinal },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not sign report"));
    }
  },
);

export const amendImagingReport = createAsyncThunk(
  "radiology/amendReport",
  async (
    {
      facilityId,
      reportId,
      payload,
    }: {
      facilityId: string;
      reportId: string;
      payload: { findings?: string; impression?: string; reason: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingReport>>(
        `/companies/${facilityId}/radiology/reports/${reportId}/amend`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not amend report"));
    }
  },
);

export const fetchImagingReport = createAsyncThunk(
  "radiology/fetchReport",
  async (
    { facilityId, reportId }: { facilityId: string; reportId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ImagingReport>>(
        `/companies/${facilityId}/radiology/reports/${reportId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load report"));
    }
  },
);

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function upsertRequest(list: ImagingRequest[], item: ImagingRequest): ImagingRequest[] {
  const idx = list.findIndex((r) => r._id === item._id);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = item;
    return next;
  }
  return [item, ...list];
}

function applyRequestUpdate(s: RadiologyState, item: ImagingRequest) {
  s.requests = upsertRequest(s.requests, item);
  s.worklist = upsertRequest(s.worklist, item);
  s.results = upsertRequest(s.results, item);
  if (s.currentRequest?._id === item._id) s.currentRequest = item;
  if (s.currentResultDetail?.request?._id === item._id) {
    s.currentResultDetail = {
      ...s.currentResultDetail,
      request: item,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const radiologySlice = createSlice({
  name: "radiology",
  initialState,
  reducers: {
    clearRadiologyError(s) {
      s.error = null;
      s.message = null;
    },
    clearCurrentRequest(s) {
      s.currentRequest = null;
      s.currentStudy = null;
      s.currentReport = null;
      s.currentResultDetail = null;
      s.viewer = null;
    },
    setCurrentRequest(s, a: PayloadAction<ImagingRequest | null>) {
      s.currentRequest = a.payload;
    },
    clearRadiologyMessage(s) {
      s.message = null;
    },
    clearCurrentResultDetail(s) {
      s.currentResultDetail = null;
    },
  },
  extraReducers: (b) => {
    const fail =
      (flags: Array<
        | "listLoading"
        | "detailLoading"
        | "resultsLoading"
        | "saving"
        | "uploading"
        | "catalogLoading"
        | "roomsLoading"
        | "worklistLoading"
      > = ["listLoading", "detailLoading", "saving", "uploading"]) =>
        (s: RadiologyState, a: { payload?: unknown }) => {
          flags.forEach((f) => {
            s[f] = false;
          });
          s.error = (a.payload as string) || "Request failed";
        };

    /* Catalog */
    b.addCase(fetchImagingCatalog.pending, (s) => {
      s.catalogLoading = true;
      s.error = null;
    })
      .addCase(fetchImagingCatalog.fulfilled, (s, a) => {
        s.catalogLoading = false;
        s.catalog = a.payload.data || [];
      })
      .addCase(fetchImagingCatalog.rejected, fail(["catalogLoading"]));

    b.addCase(fetchCatalogItemById.pending, (s) => {
      s.catalogLoading = true;
      s.error = null;
    })
      .addCase(fetchCatalogItemById.fulfilled, (s, a) => {
        s.catalogLoading = false;
        if (a.payload.data) {
          const idx = s.catalog.findIndex((c) => c._id === a.payload.data!._id);
          if (idx >= 0) s.catalog[idx] = a.payload.data;
          else s.catalog.push(a.payload.data);
        }
      })
      .addCase(fetchCatalogItemById.rejected, fail(["catalogLoading"]));

    b.addCase(createCatalogItem.pending, (s) => {
      s.saving = true;
      s.error = null;
    })
      .addCase(createCatalogItem.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Catalog item created";
        if (a.payload.data) s.catalog = [a.payload.data, ...s.catalog];
      })
      .addCase(createCatalogItem.rejected, fail(["saving"]));

    b.addCase(updateCatalogItem.fulfilled, (s, a) => {
      s.saving = false;
      s.message = a.payload.message || "Catalog item updated";
      if (a.payload.data) {
        const idx = s.catalog.findIndex((c) => c._id === a.payload.data!._id);
        if (idx >= 0) s.catalog[idx] = a.payload.data;
      }
    });

    /* Rooms */
    b.addCase(fetchModalityRooms.pending, (s) => {
      s.roomsLoading = true;
    })
      .addCase(fetchModalityRooms.fulfilled, (s, a) => {
        s.roomsLoading = false;
        s.rooms = a.payload.data || [];
      })
      .addCase(fetchModalityRooms.rejected, fail(["roomsLoading"]));

    b.addCase(createModalityRoom.fulfilled, (s, a) => {
      s.saving = false;
      s.message = a.payload.message || "Room created";
      if (a.payload.data) s.rooms = [a.payload.data, ...s.rooms];
    });

    /* Requests */
    b.addCase(fetchImagingRequests.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchImagingRequests.fulfilled, (s, a) => {
        s.listLoading = false;
        s.requests = a.payload.data || [];
        s.requestsMeta = a.payload.meta || null;
      })
      .addCase(fetchImagingRequests.rejected, fail(["listLoading"]));

    b.addCase(fetchImagingRequestDetail.pending, (s) => {
      s.detailLoading = true;
      s.error = null;
    })
      .addCase(fetchImagingRequestDetail.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.currentRequest = a.payload.data || null;
      })
      .addCase(fetchImagingRequestDetail.rejected, fail(["detailLoading"]));

    b.addCase(createImagingRequest.pending, (s) => {
      s.saving = true;
      s.error = null;
    })
      .addCase(createImagingRequest.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Imaging request created";
        if (a.payload.data) {
          s.requests = [a.payload.data, ...s.requests];
          s.worklist = [a.payload.data, ...s.worklist];
          s.currentRequest = a.payload.data;
        }
      })
      .addCase(createImagingRequest.rejected, fail(["saving"]));

    const requestMutations = [
      updateImagingRequestStatus,
      addImagingRequestNote,
      assignTechnologistAndRoom,
      logPatientArrival,
      logPreparation,
      submitContrastScreening,
      updatePreAuthorization,
      updateContrastInfo,
      updateRequestResult,
    ] as const;

    requestMutations.forEach((thunk) => {
      b.addCase(thunk.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s, a) => {
          s.saving = false;
          s.message = a.payload.message || "Updated";
          if (a.payload.data) applyRequestUpdate(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail(["saving"]));
    });

    /* Results */
    b.addCase(fetchImagingResults.pending, (s) => {
      s.resultsLoading = true;
      s.error = null;
    })
      .addCase(fetchImagingResults.fulfilled, (s, a) => {
        s.resultsLoading = false;
        s.results = a.payload.data || [];
        s.resultsMeta = a.payload.meta || null;
      })
      .addCase(fetchImagingResults.rejected, fail(["resultsLoading"]));

    b.addCase(fetchImagingResultDetail.pending, (s) => {
      s.detailLoading = true;
      s.error = null;
    })
      .addCase(fetchImagingResultDetail.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.currentResultDetail = a.payload.data || null;
        if (a.payload.data) {
          s.currentRequest = a.payload.data.request;
          s.currentStudy = a.payload.data.study;
          s.currentReport = a.payload.data.report;
        }
      })
      .addCase(fetchImagingResultDetail.rejected, fail(["detailLoading"]));

    /* Worklist */
    b.addCase(fetchRadiologyWorklist.pending, (s) => {
      s.worklistLoading = true;
      s.error = null;
    })
      .addCase(fetchRadiologyWorklist.fulfilled, (s, a) => {
        s.worklistLoading = false;
        const payload = a.payload.data;
        s.worklist = payload?.items || [];
        s.worklistQueues = payload?.queues || {};
      })
      .addCase(fetchRadiologyWorklist.rejected, fail(["worklistLoading"]));

    /* Upload (files and/or final result + optional removeKeys) */
    b.addCase(uploadStudyInstances.pending, (s) => {
      s.uploading = true;
      s.error = null;
    })
      .addCase(uploadStudyInstances.fulfilled, (s, a) => {
        s.uploading = false;
        s.message = a.payload.message || "Study uploaded";
        if (a.payload.data) s.currentStudy = a.payload.data;
        if (a.payload.request) applyRequestUpdate(s, a.payload.request);
      })
      .addCase(uploadStudyInstances.rejected, fail(["uploading"]));

    /* Viewer */
    b.addCase(fetchRadiologyViewer.pending, (s) => {
      s.detailLoading = true;
      s.error = null;
    })
      .addCase(fetchRadiologyViewer.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.viewer = a.payload.data || null;
        if (a.payload.data) {
          s.currentRequest = a.payload.data.request;
          s.currentStudy = a.payload.data.study;
          s.currentReport = a.payload.data.report;
        }
      })
      .addCase(fetchRadiologyViewer.rejected, fail(["detailLoading"]));

    /* Reports */
    b.addCase(saveImagingReport.pending, (s) => {
      s.saving = true;
      s.error = null;
    })
      .addCase(saveImagingReport.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Report saved";
        s.currentReport = a.payload.data || null;
      })
      .addCase(saveImagingReport.rejected, fail(["saving"]));

    b.addCase(signImagingReport.pending, (s) => {
      s.saving = true;
    })
      .addCase(signImagingReport.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Report signed";
        s.currentReport = a.payload.data || null;
      })
      .addCase(signImagingReport.rejected, fail(["saving"]));

    b.addCase(amendImagingReport.fulfilled, (s, a) => {
      s.saving = false;
      s.message = a.payload.message || "Addendum created";
      s.currentReport = a.payload.data || null;
    });

    b.addCase(fetchImagingReport.pending, (s) => {
      s.detailLoading = true;
    })
      .addCase(fetchImagingReport.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.currentReport = a.payload.data || null;
      })
      .addCase(fetchImagingReport.rejected, fail(["detailLoading"]));
  },
});

export const {
  clearRadiologyError,
  clearCurrentRequest,
  setCurrentRequest,
  clearRadiologyMessage,
  clearCurrentResultDetail,
} = radiologySlice.actions;

export default radiologySlice.reducer;