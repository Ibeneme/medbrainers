"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { useFacilityId } from "@/hooks/useFacilityId";
import {
  fetchImagingCatalog,
  fetchCatalogItemById,
  createCatalogItem,
  updateCatalogItem,
  fetchModalityRooms,
  createModalityRoom,
  fetchImagingRequests,
  fetchImagingRequestDetail,
  createImagingRequest,
  updateImagingRequestStatus,
  addImagingRequestNote,
  updateRequestResult,
  fetchImagingResults,
  fetchImagingResultDetail,
  fetchRadiologyWorklist,
  assignTechnologistAndRoom,
  logPatientArrival,
  logPreparation,
  submitContrastScreening,
  updatePreAuthorization,
  updateContrastInfo as updateContrastInfoThunk,
  uploadStudyInstances,
  fetchRadiologyViewer,
  saveImagingReport,
  signImagingReport,
  amendImagingReport,
  fetchImagingReport,
  clearRadiologyError,
  clearCurrentRequest,
  clearRadiologyMessage,
  clearCurrentResultDetail,
  type Modality,
  type Priority,
  type RequestStatus,
  type ContrastType,
  type ContrastAllergy,
  type ReportStatus,
  type IcdCode,
  type ReportSection,
  type ImagingRequest,
} from "@/api/slices/radiologySlice";

export interface UseRadiologyOptions {
  facilityId?: string | null;
  autoWorklist?: boolean;
  autoRequests?: boolean;
  autoCatalog?: boolean;
  autoRooms?: boolean;
  autoResults?: boolean;
  modality?: Modality;
  status?: RequestStatus;
  priority?: Priority;
  patientId?: string;
  q?: string;
}

export function useRadiology(options: UseRadiologyOptions = {}) {
  const {
    facilityId: facilityIdOverride,
    autoWorklist = false,
    autoRequests = false,
    autoCatalog = false,
    autoRooms = false,
    autoResults = false,
    modality,
    status,
    priority,
    patientId,
    q,
  } = options;

  const dispatch = useAppDispatch();
  const { facilityId: activeFacilityId, hasFacility } = useFacilityId();
  const facilityId = facilityIdOverride || activeFacilityId || "";

  const {
    catalog,
    rooms,
    requests,
    requestsMeta,
    results,
    resultsMeta,
    worklist,
    worklistQueues,
    currentRequest,
    currentStudy,
    currentReport,
    currentResultDetail,
    viewer,
    listLoading,
    detailLoading,
    resultsLoading,
    catalogLoading,
    roomsLoading,
    worklistLoading,
    saving,
    uploading,
    error,
    message,
  } = useAppSelector((s) => s.radiology);

  const loadCatalog = useCallback(
    (opts?: { modality?: Modality; q?: string }) => {
      if (!facilityId) return;
      dispatch(
        fetchImagingCatalog({
          facilityId,
          modality: opts?.modality ?? modality,
          q: opts?.q,
        })
      );
    },
    [dispatch, facilityId, modality]
  );

  const loadCatalogItemById = useCallback(
    (catalogId: string) => {
      if (!facilityId || !catalogId) return;
      dispatch(fetchCatalogItemById({ facilityId, catalogId }));
    },
    [dispatch, facilityId]
  );

  const loadRooms = useCallback(
    (opts?: { modality?: Modality }) => {
      if (!facilityId) return;
      dispatch(
        fetchModalityRooms({
          facilityId,
          modality: opts?.modality ?? modality,
        })
      );
    },
    [dispatch, facilityId, modality]
  );

  const loadRequests = useCallback(
    (opts?: {
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
    }) => {
      if (!facilityId) return;
      dispatch(
        fetchImagingRequests({
          facilityId,
          status: opts?.status ?? status,
          modality: opts?.modality ?? modality,
          priority: opts?.priority ?? priority,
          patientId: opts?.patientId ?? patientId,
          technologistId: opts?.technologistId,
          from: opts?.from,
          to: opts?.to,
          q: opts?.q ?? q,
          limit: opts?.limit,
          page: opts?.page,
        })
      );
    },
    [dispatch, facilityId, status, modality, priority, patientId, q]
  );

  /** Load results list (requests that have finalResult). Search by code / name / accession. */
  const loadResults = useCallback(
    (opts?: {
      modality?: Modality;
      patientId?: string;
      from?: string;
      to?: string;
      q?: string;
      limit?: number;
      page?: number;
    }) => {
      if (!facilityId) return;
      dispatch(
        fetchImagingResults({
          facilityId,
          modality: opts?.modality ?? modality,
          patientId: opts?.patientId ?? patientId,
          from: opts?.from,
          to: opts?.to,
          q: opts?.q ?? q,
          limit: opts?.limit,
          page: opts?.page,
        })
      );
    },
    [dispatch, facilityId, modality, patientId, q]
  );

  const loadWorklist = useCallback(
    (opts?: {
      modality?: Modality;
      roomId?: string;
      status?: RequestStatus;
    }) => {
      if (!facilityId) return;
      dispatch(
        fetchRadiologyWorklist({
          facilityId,
          modality: opts?.modality ?? modality,
          roomId: opts?.roomId,
          status: opts?.status ?? status,
        })
      );
    },
    [dispatch, facilityId, modality, status]
  );

  const loadRequestDetail = useCallback(
    (requestId: string) => {
      if (!facilityId || !requestId) return;
      dispatch(fetchImagingRequestDetail({ facilityId, requestId }));
    },
    [dispatch, facilityId]
  );

  /** Load full result detail (request + study + report) */
  const loadResultDetail = useCallback(
    (requestId: string) => {
      if (!facilityId || !requestId) return;
      dispatch(fetchImagingResultDetail({ facilityId, requestId }));
    },
    [dispatch, facilityId]
  );

  const loadViewer = useCallback(
    (requestId: string) => {
      if (!facilityId || !requestId) return;
      dispatch(fetchRadiologyViewer({ facilityId, requestId }));
    },
    [dispatch, facilityId]
  );

  const loadReport = useCallback(
    (reportId: string) => {
      if (!facilityId || !reportId) return;
      dispatch(fetchImagingReport({ facilityId, reportId }));
    },
    [dispatch, facilityId]
  );

  useEffect(() => {
    if (!facilityId) return;
    if (autoCatalog) loadCatalog();
    if (autoRooms) loadRooms();
    if (autoRequests) loadRequests();
    if (autoWorklist) loadWorklist();
    if (autoResults) loadResults();
  }, [
    facilityId,
    autoCatalog,
    autoRooms,
    autoRequests,
    autoWorklist,
    autoResults,
    loadCatalog,
    loadRooms,
    loadRequests,
    loadWorklist,
    loadResults,
  ]);

  const createRequest = useCallback(
    (payload: {
      patientId: string;
      consultationId?: string;
      admissionId?: string;
      catalogItemId?: string;
      modality: Modality;
      procedureCode?: string;
      procedureName: string;
      bodyPart: string;
      laterality?: "left" | "right" | "bilateral" | "na";
      clinicalIndication: string;
      icdCodes?: IcdCode[];
      priority?: Priority;
      contrastRequired?: boolean;
      contrastType?: ContrastType;
      contrastRequirementNote?: string;
      allergies?: ContrastAllergy[];
      preparationInstructions?: string;
      referringPhysicianName?: string;
      referringPhysicianNpi?: string;
      preAuthRequired?: boolean;
      notes?: string;
    }) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(createImagingRequest({ facilityId, payload }));
    },
    [dispatch, facilityId]
  );

  const updateStatus = useCallback(
    (requestId: string, nextStatus: RequestStatus, reason?: string) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(
        updateImagingRequestStatus({
          facilityId,
          requestId,
          status: nextStatus,
          reason,
        })
      );
    },
    [dispatch, facilityId]
  );

  const addNote = useCallback(
    (requestId: string, text: string) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(addImagingRequestNote({ facilityId, requestId, text }));
    },
    [dispatch, facilityId]
  );

  const updateResult = useCallback(
    (requestId: string, finalResult: string) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(
        updateRequestResult({ facilityId, requestId, finalResult })
      );
    },
    [dispatch, facilityId]
  );

  const assign = useCallback(
    (
      requestId: string,
      payload: {
        technologistId?: string;
        radiologistId?: string;
        roomId?: string;
        scheduledAt?: string;
      }
    ) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(
        assignTechnologistAndRoom({ facilityId, requestId, payload })
      );
    },
    [dispatch, facilityId]
  );

  const markArrived = useCallback(
    (requestId: string) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(logPatientArrival({ facilityId, requestId }));
    },
    [dispatch, facilityId]
  );

  const markPrepared = useCallback(
    (requestId: string, instructions?: string) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(logPreparation({ facilityId, requestId, instructions }));
    },
    [dispatch, facilityId]
  );

  const screenContrast = useCallback(
    (
      requestId: string,
      payload: {
        allergyChecked: boolean;
        knownContrastAllergy: boolean;
        allergyNotes?: string;
        creatinineValue?: number;
        creatinineUnit?: string;
        egfr?: number;
        screeningPassed: boolean;
        contrastType?: ContrastType;
      }
    ) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(
        submitContrastScreening({ facilityId, requestId, payload })
      );
    },
    [dispatch, facilityId]
  );

  const updateContrastInfo = useCallback(
    (
      requestId: string,
      payload: {
        contrastRequired?: boolean;
        contrastType?: ContrastType;
        contrastRequirementNote?: string;
        allergies?: ContrastAllergy[];
      }
    ) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(
        updateContrastInfoThunk({ facilityId, requestId, payload })
      );
    },
    [dispatch, facilityId]
  );

  const setPreAuth = useCallback(
    (
      requestId: string,
      payload: {
        status: "pending" | "approved" | "denied" | "expired" | "not_required";
        authorizationNumber?: string;
        payerName?: string;
        notes?: string;
      }
    ) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(
        updatePreAuthorization({ facilityId, requestId, payload })
      );
    },
    [dispatch, facilityId]
  );

  const uploadStudy = useCallback(
    (
      requestId: string,
      files: File[],
      meta?: {
        studyInstanceUid?: string;
        studyDescription?: string;
        studyDate?: string;
        finalResult?: string;
        removeKeys?: string[];
      }
    ) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(
        uploadStudyInstances({ facilityId, requestId, files, meta })
      );
    },
    [dispatch, facilityId]
  );

  const saveReport = useCallback(
    (
      requestId: string,
      payload: {
        templateKey?: string;
        findings?: string;
        impression?: string;
        sections?: ReportSection[];
        dictationRawText?: string;
        dictationSource?: "manual" | "voice" | "imported";
        status?: ReportStatus;
      }
    ) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(saveImagingReport({ facilityId, requestId, payload }));
    },
    [dispatch, facilityId]
  );

  const signReport = useCallback(
    (reportId: string, makeFinal?: boolean) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(signImagingReport({ facilityId, reportId, makeFinal }));
    },
    [dispatch, facilityId]
  );

  const amendReport = useCallback(
    (
      reportId: string,
      payload: { findings?: string; impression?: string; reason: string }
    ) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(amendImagingReport({ facilityId, reportId, payload }));
    },
    [dispatch, facilityId]
  );

  const addCatalogItem = useCallback(
    (payload: Parameters<typeof createCatalogItem>[0]["payload"]) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(createCatalogItem({ facilityId, payload }));
    },
    [dispatch, facilityId]
  );

  const editCatalogItem = useCallback(
    (
      catalogId: string,
      payload: Partial<Parameters<typeof createCatalogItem>[0]["payload"]>
    ) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(updateCatalogItem({ facilityId, catalogId, payload }));
    },
    [dispatch, facilityId]
  );

  const addRoom = useCallback(
    (payload: {
      name: string;
      code: string;
      modality: Modality;
      location?: string;
    }) => {
      if (!facilityId) return Promise.reject(new Error("No facility selected"));
      return dispatch(createModalityRoom({ facilityId, payload }));
    },
    [dispatch, facilityId]
  );

  const clearError = useCallback(
    () => dispatch(clearRadiologyError()),
    [dispatch]
  );
  const clearMessage = useCallback(
    () => dispatch(clearRadiologyMessage()),
    [dispatch]
  );
  const clearCurrent = useCallback(
    () => dispatch(clearCurrentRequest()),
    [dispatch]
  );
  const clearResultDetail = useCallback(
    () => dispatch(clearCurrentResultDetail()),
    [dispatch]
  );

  const requestsByModality = useMemo(() => {
    const map: Partial<Record<Modality, ImagingRequest[]>> = {};
    for (const r of requests) {
      const m = r.modality;
      if (!map[m]) map[m] = [];
      map[m]!.push(r);
    }
    return map;
  }, [requests]);

  const triageStats = useMemo(() => {
    const counts = { routine: 0, urgent: 0, stat: 0 };
    for (const r of requests) {
      if (r.priority && counts[r.priority] !== undefined) counts[r.priority]++;
    }
    return counts;
  }, [requests]);

  const preAuthPending = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.preAuthorization?.status === "pending" ||
          r.status === "pre_auth_pending"
      ),
    [requests]
  );

  const needsContrastScreening = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.contrast?.contrastRequired &&
          !r.contrast?.allergyChecked &&
          !["cancelled", "reported"].includes(r.status)
      ),
    [requests]
  );

  return {
    facilityId,
    hasFacility: hasFacility || Boolean(facilityId),

    // data
    catalog,
    rooms,
    requests,
    requestsMeta,
    results,
    resultsMeta,
    requestsByModality,
    worklist,
    worklistQueues,
    currentRequest,
    currentStudy,
    currentReport,
    currentResultDetail,
    viewer,
    triageStats,
    preAuthPending,
    needsContrastScreening,

    // loading flags
    listLoading,
    detailLoading,
    resultsLoading,
    catalogLoading,
    roomsLoading,
    worklistLoading,
    saving,
    uploading,
    loading:
      listLoading ||
      detailLoading ||
      resultsLoading ||
      catalogLoading ||
      roomsLoading ||
      worklistLoading ||
      saving ||
      uploading,

    error,
    message,

    // loaders
    loadCatalog,
    loadCatalogItemById,
    loadRooms,
    loadRequests,
    loadResults,
    loadWorklist,
    loadRequestDetail,
    fetchRequestById: loadRequestDetail,
    loadResultDetail,
    loadViewer,
    loadReport,

    // mutations
    createRequest,
    updateStatus,
    addNote,
    updateResult,
    assign,
    markArrived,
    markPrepared,
    screenContrast,
    updateContrastInfo,
    setPreAuth,
    uploadStudy,
    saveReport,
    signReport,
    amendReport,
    addCatalogItem,
    editCatalogItem,
    addRoom,

    // clear helpers
    clearError,
    clearMessage,
    clearCurrent,
    clearResultDetail,
  };
}

export default useRadiology;