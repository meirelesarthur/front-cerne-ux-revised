// src/services/v2/Bonuses/bonus-service.ts
// -----------------------------------------------------------------------------
// Bonus Service — API v1 do backend Laravel GB.Cerne (Registro de Eventos).
// Esteira 037 (registro-eventos-front-roteiro.md, TASK-FE-04). Mirror
// estrutural de `advance-service.ts` (mesmo adaptador do envelope paginado
// real `ApiResponse::paginated` → `ResponsePagination`, consumido pela grid
// via `useCustomGridQuery`) — SEM parâmetro de filtro (`BonusRepository::
// list()` não aceita nenhum, DEC-API-03) e sem soma de `per_page` custom no
// request (o servidor ignora, sempre pagina 10 — mantido no adaptador de
// resposta pois o envelope devolve `meta.per_page` mesmo fixo).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /bonuses              → data: Bonus[] + meta paginação real (sem filtro)
//   GET    /bonuses/{uuid}       → data: Bonus
//   POST   /bonuses              → payload BonusPayload (201)
//   PUT    /bonuses/{uuid}       → payload BonusPayload — FULL REPLACE (os 4
//                                   campos são `required` em AMBOS os verbos,
//                                   FE-FORM-MODE — NUNCA enviar patch parcial)
//   DELETE /bonuses/{uuid}       → 204 No Content puro (sem soft delete)
//
// Este service permanece um passthrough burro — nenhuma lógica de payload
// aqui, só o adaptador de envelope/paginação.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type { Bonus, BonusesListEnvelope, BonusPayload } from '@/@types/v2/Bonuses';

// Params aceitos pela listagem — só paginação real (`page`/`per_page`). Sem
// filtro: `BonusRepository::list()` é `Bonus::query()->paginate(10)`.
export type ListBonusesParams = PaginationQueryParams;

async function listBonuses(params: ListBonusesParams): Promise<ResponsePagination<Bonus[]>> {
  const { data } = await api.V2.get<BonusesListEnvelope>('/bonuses', {
    page: params.page,
    per_page: params.per_page,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listAdvances`.
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

async function getBonusByUuid(bonusUuid: string): Promise<Response<Bonus>> {
  const { data } = await api.V2.get<Response<Bonus>>(`/bonuses/${bonusUuid}`);
  return data;
}

async function createBonus(payload: BonusPayload): Promise<Response<Bonus>> {
  const { data } = await api.V2.post<Response<Bonus>>('/bonuses', payload);
  return data;
}

// Full-replace (FE-FORM-MODE) — os 4 campos SEMPRE completos, nunca patch
// parcial por dirtyFields (o backend valida os 4 como `required` também no
// update — `BonusRequest::rules()` não distingue store/update).
async function updateBonus(bonusUuid: string, payload: BonusPayload): Promise<Response<Bonus>> {
  const { data } = await api.V2.put<Response<Bonus>>(`/bonuses/${bonusUuid}`, payload);
  return data;
}

async function deleteBonus(bonusUuid: string) {
  const { data } = await api.V2.delete(`/bonuses/${bonusUuid}`);
  return data;
}

export { createBonus, deleteBonus, getBonusByUuid, listBonuses, updateBonus };
