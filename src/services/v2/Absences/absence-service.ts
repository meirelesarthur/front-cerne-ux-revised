// src/services/v2/Absences/absence-service.ts
// -----------------------------------------------------------------------------
// Absence Service — API v1 do backend Laravel GB.Cerne (Registro de Faltas,
// 97-Esteiras/003, Tarefas 12/13). Mirror estrutural de `advance-service.ts`
// (mesmo adaptador do envelope paginado real `ApiResponse::paginated` →
// `ResponsePagination`, consumido pela grid via `useCustomGridQuery`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /absences              → data: AbsenceListItem[] + meta paginação
//                                    real (filtros employee_uuid/event_uuid/
//                                    start_date/end_date, ordenado date DESC)
//   GET    /absences/{uuid}       → data: AbsenceDetail (Tarefa 13)
//   POST   /absences              → payload AbsencePayload (Tarefa 13)
//   PUT    /absences/{uuid}       → payload AbsencePayload — FULL REPLACE
//                                    (os 5 campos são `required` no backend,
//                                    Tarefa 13 — NUNCA enviar patch parcial)
//   DELETE /absences/{uuid}       → hard delete
//
// `getAbsence`/`createAbsence`/`updateAbsence` ficam para a Tarefa 13 — este
// arquivo já nasce com a interface `ListAbsencesParams` completa (Tarefa 12).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type { AbsenceListItem, AbsencePayload, AbsencesListEnvelope } from '@/@types/v2/Absences';

// Params aceitos pela listagem — paginação real + filtros do backend
// (`AbsenceFilterData`): `employee_uuid`/`event_uuid`/`start_date`/`end_date`.
export interface ListAbsencesParams extends PaginationQueryParams {
  employee_uuid?: string;
  event_uuid?: string;
  start_date?: string;
  end_date?: string;
}

async function listAbsences(
  params: ListAbsencesParams
): Promise<ResponsePagination<AbsenceListItem[]>> {
  const { data } = await api.V2.get<AbsencesListEnvelope>('/absences', {
    page: params.page,
    per_page: params.per_page,
    employee_uuid: params.employee_uuid || undefined,
    event_uuid: params.event_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listAdvances`/`listEvents`.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getAbsence(uuid: string): Promise<Response<AbsenceListItem>> {
  const { data } = await api.V2.get<Response<AbsenceListItem>>(`/absences/${uuid}`);
  return data;
}

async function createAbsence(payload: AbsencePayload): Promise<Response<AbsenceListItem>> {
  const { data } = await api.V2.post<Response<AbsenceListItem>>('/absences', payload);
  return data;
}

// Full-replace — os 5 campos SEMPRE completos, nunca patch parcial por
// `dirtyFields` (`AbsenceRequest` exige todos como `required` em ambos os
// verbos, contrato de tela §6).
async function updateAbsence(
  uuid: string,
  payload: AbsencePayload
): Promise<Response<AbsenceListItem>> {
  const { data } = await api.V2.put<Response<AbsenceListItem>>(`/absences/${uuid}`, payload);
  return data;
}

async function deleteAbsence(uuid: string) {
  const { data } = await api.V2.delete(`/absences/${uuid}`);
  return data;
}

export { createAbsence, deleteAbsence, getAbsence, listAbsences, updateAbsence };
