// src/services/v2/DietBeats/diet-beat-service.ts
// -----------------------------------------------------------------------------
// DietBeat Service — API v1 do backend Laravel GB.Cerne (Batida —
// Operacional/Pecuária, TASK-FE-DIET-04). Fachada CRUD completa sobre o
// Model `DietBeat`/`ItemDietBeat` (`arquitetura-api-dieta.md`
// TASK-DIET-API-02, lido diretamente no worktree `diet-api`). Mirror
// estrutural de `diet-service.ts`/`food-beat-service.ts` (adaptador de
// envelope paginado → `ResponsePagination`).
//
// Contrato (envelope ApiResponse):
//   GET    /diet-beats                → data: DietBeatListItem[], meta
//                                        paginação REAL (filtros
//                                        equipment_uuid/date/diet_uuid).
//                                        Paginação FIXA em 10 no servidor —
//                                        `per_page` NUNCA enviado.
//   GET    /diet-beats/{uuid}         → data: DietBeatDetail (items[]).
//   POST   /diet-beats                → payload DietBeatPayload.
//   PUT    /diet-beats/{uuid}         → payload DietBeatPayload — itens
//                                        reconciliados por identidade
//                                        (AD-04).
//   DELETE /diet-beats/{uuid}         → soft delete + devolução de estoque
//                                        server-side (AD-03).
//
// `X-Farm-Id` via interceptor genérico de `@/services/api.ts` — nunca
// setado manualmente aqui, nunca em querystring. Baixa/devolução de estoque
// é SEMPRE server-side (AD-02/03/05) — este service apenas submete o
// payload, nunca calcula nem envia efeito de estoque.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  DietBeatDetail,
  DietBeatListItem,
  DietBeatPayload,
  DietBeatsListEnvelope,
} from '@/@types/v2/DietBeats';

// Params aceitos pela listagem — paginação real (só `page`, servidor fixa
// `per_page=10`) + filtros confirmados em `DietBeatFilterData.php`.
export interface ListDietBeatsParams extends Omit<PaginationQueryParams, 'per_page'> {
  equipment_uuid?: string;
  date?: string;
  diet_uuid?: string;
}

async function listDietBeats(
  params: ListDietBeatsParams
): Promise<ResponsePagination<DietBeatListItem[]>> {
  const { data } = await api.V2.get<DietBeatsListEnvelope>('/diet-beats', {
    page: params.page,
    equipment_uuid: params.equipment_uuid || undefined,
    date: params.date || undefined,
    diet_uuid: params.diet_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listDiets`/`listFoodBeats` (meta REAL, nunca fabricada).
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

// GET /diet-beats/{uuid} — detalhe + items[] (relação carregada — os 3
// totais do cabeçalho chegam populados, diferente do índice).
async function getDietBeat(dietBeatUuid: string) {
  const { data } = await api.V2.get<Response<DietBeatDetail>>(`/diet-beats/${dietBeatUuid}`);
  return data;
}

async function createDietBeat(payload: DietBeatPayload) {
  const { data } = await api.V2.post<Response<DietBeatDetail>>('/diet-beats', payload);
  return data;
}

// PUT /diet-beats/{uuid} — itens reconciliados por IDENTIDADE no servidor
// (AD-04: `uuid` quando existente, fallback `stock_uuid`) — o front só
// precisa preservar o `uuid` de cada item existente no payload; reordenar
// linhas NUNCA corrompe o casamento.
async function updateDietBeat(dietBeatUuid: string, payload: DietBeatPayload) {
  const { data } = await api.V2.put<Response<DietBeatDetail>>(
    `/diet-beats/${dietBeatUuid}`,
    payload
  );
  return data;
}

// DELETE /diet-beats/{uuid} — soft delete + devolução de estoque
// server-side (AD-03).
async function deleteDietBeat(dietBeatUuid: string) {
  const { data } = await api.V2.delete(`/diet-beats/${dietBeatUuid}`);
  return data;
}

export { createDietBeat, deleteDietBeat, getDietBeat, listDietBeats, updateDietBeat };
