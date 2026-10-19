// src/services/v2/BaseRegistrations/diagnosisPregnancy-service.ts
// Diagnosis Pregnancy Service — API v1 do backend Laravel GB.Cerne. SEM
// `X-Farm-Id` (cadastro global). Envelope ApiResponse { success, message,
// data, errors, meta } — `listDiagnosisPregnancies` adapta a paginação REAL
// do backend para o shape `ResponsePagination` consumido pela grid.

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  DiagnosisPregnanciesFilterForm,
  DiagnosisPregnanciesListEnvelope,
  DiagnosisPregnancyData,
  DiagnosisPregnancyOption,
  DiagnosisPregnancyOptionsListEnvelope,
  DiagnosisPregnancyPayload,
  DiagnosisPregnancyListItem,
} from '@/@types/v2/BaseRegistrations/diagnosisPregnancy';

// Params aceitos pela listagem — paginação padrão + busca + filtro `is_enabled`.
export interface ListDiagnosisPregnanciesParams
  extends PaginationQueryParams, DiagnosisPregnanciesFilterForm {}

async function listDiagnosisPregnancies(
  params: ListDiagnosisPregnanciesParams
): Promise<ResponsePagination<DiagnosisPregnancyListItem[]>> {
  const { data } = await api.V2.get<DiagnosisPregnanciesListEnvelope>('/diagnosis-pregnancies', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // paginação REAL (meta vem do backend), diferente do adaptador de
  // página-única de `listSpecies`.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// Correção pós-Tester da Tarefa 45 (Vacas Prenhas) — bug reportado pelo
// dono: o filtro "Diagnóstico" do relatório vinha sempre vazio porque
// consumia `listDiagnosisPregnancies` (índice CRUD completo, gate
// `diagnosis_pregnancies_view` — permissão DISTINTA de `pregnancy-
// diagnosis_view`, a que dá acesso ao relatório). `GET /diagnosis-
// pregnancies/options` é um lookup enxuto SEM gate de permissão própria
// (mirror `listBatchOptionsForForm`/`GET /batches/options`) — use esta
// função em selects de FORMULÁRIO/FILTRO, nunca `listDiagnosisPregnancies`.
async function listDiagnosisPregnancyOptions(): Promise<
  ResponsePagination<DiagnosisPregnancyOption[]>
> {
  const { data } = await api.V2.get<DiagnosisPregnancyOptionsListEnvelope>(
    '/diagnosis-pregnancies/options'
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

async function getDiagnosisPregnancyByUuid(diagnosisPregnancyUuid: string) {
  const { data } = await api.V2.get<Response<DiagnosisPregnancyData>>(
    `/diagnosis-pregnancies/${diagnosisPregnancyUuid}`
  );
  return data;
}

async function createDiagnosisPregnancy(payload: DiagnosisPregnancyPayload) {
  const { data } = await api.V2.post<Response<DiagnosisPregnancyData>>(
    '/diagnosis-pregnancies',
    payload
  );
  return data;
}

// Update envia só o DELTA de `dirtyFields` (payload parcial) — mesma convenção
// de `updateCostCenter`/`updateSpecie`.
async function updateDiagnosisPregnancy(
  diagnosisPregnancyUuid: string,
  payload: Partial<DiagnosisPregnancyPayload>
) {
  const { data } = await api.V2.put<Response<DiagnosisPregnancyData>>(
    `/diagnosis-pregnancies/${diagnosisPregnancyUuid}`,
    payload
  );
  return data;
}

async function deleteDiagnosisPregnancy(diagnosisPregnancyUuid: string) {
  const { data } = await api.V2.delete(`/diagnosis-pregnancies/${diagnosisPregnancyUuid}`);
  return data;
}

export {
  createDiagnosisPregnancy,
  deleteDiagnosisPregnancy,
  getDiagnosisPregnancyByUuid,
  listDiagnosisPregnancies,
  listDiagnosisPregnancyOptions,
  updateDiagnosisPregnancy,
};
