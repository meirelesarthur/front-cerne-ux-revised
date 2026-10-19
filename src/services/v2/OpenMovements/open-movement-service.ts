// src/services/v2/OpenMovements/open-movement-service.ts
// -----------------------------------------------------------------------------
// Open Movement Service — API v1 do backend Laravel GB.Cerne ("Saldo
// Inicial", execução 031, TASK-FE-031-35). Fachada dedicada
// `/api/v1/open-movements` sobre o Model genérico `Movement` — mirror
// estrutural de `cost-center-service.ts`/`account-service.ts`, adaptado: SEM
// `update` (só `index`/`show`/`store`/`destroy`, contrato de API §1/§10 — a
// tela nunca tem edição) e SEM árvore (`Movement` não tem hierarquia).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /open-movements          → data: OpenMovementListItem[], meta
//                                      paginação REAL (front controla via
//                                      `per_page` — tela usa default 10,
//                                      TASK-FE-031-36).
//   GET    /open-movements/{uuid}   → data: OpenMovementDetail (com `items[]`).
//   POST   /open-movements          → payload OpenMovementPayload.
//   DELETE /open-movements/{uuid}   → 204.
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts`; este
// service não manipula o header manualmente (mirror
// `account-service.ts`/`proprietary-service.ts`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  OpenMovementDetail,
  OpenMovementListItem,
  OpenMovementPayload,
  OpenMovementsListEnvelope,
} from '@/@types/v2/OpenMovements';

export interface ListOpenMovementsParams extends PaginationQueryParams {
  start_date?: string;
  end_date?: string;
  account_uuid?: string;
  proprietary_uuid?: string;
}

async function listOpenMovements(
  params: ListOpenMovementsParams
): Promise<ResponsePagination<OpenMovementListItem[]>> {
  const { data } = await api.V2.get<OpenMovementsListEnvelope>('/open-movements', {
    page: params.page,
    per_page: params.per_page,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    account_uuid: params.account_uuid || undefined,
    proprietary_uuid: params.proprietary_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listAccounts/listCostCenters/listFinancialCategories.
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

async function getOpenMovement(openMovementUuid: string) {
  const { data } = await api.V2.get<Response<OpenMovementDetail>>(
    `/open-movements/${openMovementUuid}`
  );
  return data;
}

async function createOpenMovement(payload: OpenMovementPayload) {
  const { data } = await api.V2.post<Response<OpenMovementDetail>>('/open-movements', payload);
  return data;
}

// 204 No Content — sem corpo de resposta.
async function deleteOpenMovement(openMovementUuid: string) {
  const { data } = await api.V2.delete(`/open-movements/${openMovementUuid}`);
  return data;
}

export { createOpenMovement, deleteOpenMovement, getOpenMovement, listOpenMovements };
