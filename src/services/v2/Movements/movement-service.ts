// src/services/v2/Movements/movement-service.ts
// -----------------------------------------------------------------------------
// Movement Service — API v1 do backend Laravel GB.Cerne ("Mov.
// Caixa/Bancário", TASK-MV-FE-02). Fachada CRUD completa sobre o Model
// `Movement` — mirror estrutural de `open-movement-service.ts` (mesmo
// Model), acrescida de `update` (estratégia "apagar e recriar", Decisão #6)
// e `updateMovementAllocation` (rateio isolado, sem reabrir o cabeçalho).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /movements                    → data: MovementListItem[], meta
//                                           paginação REAL (`paginate()` no
//                                           Repository, default 10/página).
//   GET    /movements/{uuid}              → data: MovementDetail (COM
//                                           allocations[]).
//   POST   /movements                     → payload MovementPayload.
//   PUT    /movements/{uuid}               → payload MovementPayload —
//                                           deleta e recria (Decisão #6); a
//                                           resposta devolve um `uuid`
//                                           DIFERENTE do usado na URL. O
//                                           chamador NUNCA reusa o uuid
//                                           antigo pós-update (invalidar
//                                           lista + navegar para longe,
//                                           Movement-contrato-tela.md §2.6).
//   PATCH  /movements/{uuid}/allocation    → payload
//                                           MovementAllocationRequestPayload
//                                           (só `allocations[]`, recalcula
//                                           sobre o `value` ATUAL do
//                                           movimento).
//   PUT    /movements/{uuid}/toggle-fiscal-document → sem payload, devolve
//                                           o MovementResource atualizado
//                                           (esteira 117, UT-000746).
//   DELETE /movements/{uuid}               → 204.
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts`; este
// service não manipula o header manualmente (mirror
// `open-movement-service.ts`/`account-service.ts`).
//
// `listMovements` ADAPTA o envelope paginado do backend ({ data: [], meta:
// {} }) para o shape `ResponsePagination` ({ data: { items, pagination } })
// que a infra de grid do projeto (useCustomGridQuery/TableProvider) consome
// — idêntico ao truque de `listOpenMovements`/`listCostCenters`.
//
// Nomes de querystring de `ListMovementsParams` CONFIRMADOS por leitura
// direta de `MovementFilterData` (`api_root`,
// `#[MapInputName(SnakeCaseMapper::class)]`) + `MovementRepository::
// paginateWithFilters()` — não por analogia com `OpenMovementFilterData`
// (que só tem 4 filtros). Divergência real vs. a prosa do task-packet: os
// nomes reais são `min_value`/`max_value` (não `value_min`/`value_max`
// como o task-packet especulava) — confirmado (`minValue`/`maxValue` na
// Data class, mapeados snake_case).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  MovementAllocationRequestPayload,
  MovementDetail,
  MovementListItem,
  MovementPayload,
  MovementsListEnvelope,
  MovementsPageTotals,
  MovementTypeCategoryCode,
  MovementTypeCode,
} from '@/@types/v2/Movements';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// `MovementFilterData` (api_root, TASK-MV-03/07): data (De/Até), conta,
// proprietário, tipo, type_category, categoria (rateio), faixa de valor,
// safra (rateio) — Movement-contrato-tela.md §5.
export interface ListMovementsParams extends PaginationQueryParams {
  start_date?: string;
  end_date?: string;
  account_uuid?: string;
  proprietary_uuid?: string;
  type?: MovementTypeCode;
  type_category?: MovementTypeCategoryCode;
  category_uuid?: string;
  min_value?: number;
  max_value?: number;
  harvest_uuid?: string;
}

/** `ResponsePagination` + `pageTotals` (API r2: `meta.page_totals`, totais SÓ
 *  da página devolvida; `null` quando a API ainda não os expõe). */
export type MovementListResponse = ResponsePagination<MovementListItem[]> & {
  pageTotals: MovementsPageTotals | null;
};

async function listMovements(params: ListMovementsParams): Promise<MovementListResponse> {
  const { data } = await api.V2.get<MovementsListEnvelope>('/movements', {
    page: params.page,
    per_page: params.per_page,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    account_uuid: params.account_uuid || undefined,
    proprietary_uuid: params.proprietary_uuid || undefined,
    type: params.type || undefined,
    type_category: params.type_category || undefined,
    category_uuid: params.category_uuid || undefined,
    min_value: params.min_value ?? undefined,
    max_value: params.max_value ?? undefined,
    harvest_uuid: params.harvest_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
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
    pageTotals: data.meta?.page_totals ?? null,
  };
}

async function getMovement(movementUuid: string) {
  const { data } = await api.V2.get<Response<MovementDetail>>(`/movements/${movementUuid}`);
  return data;
}

async function createMovement(payload: MovementPayload) {
  const { data } = await api.V2.post<Response<MovementDetail>>('/movements', payload);
  return data;
}

// Estratégia "apagar e recriar" (Decisão #6, Movement-contrato-tela.md §2.6)
// — a resposta devolve um `uuid` DIFERENTE do usado na URL. O chamador
// (`CreateOrUpdateMovimento.tsx`, TASK-MV-FE-04/05) nunca deve continuar
// editando com o uuid antigo nem fazer optimistic update pontual na cache
// por esse uuid; invalidar a lista e navegar para longe é responsabilidade
// da mutation, não deste service.
async function updateMovement(movementUuid: string, payload: MovementPayload) {
  const { data } = await api.V2.put<Response<MovementDetail>>(
    `/movements/${movementUuid}`,
    payload
  );
  return data;
}

// PATCH /movements/{uuid}/allocation — só `allocations[]`, nenhum campo de
// cabeçalho (Movement-contrato-tela.md §2.2). Recalcula sobre o `value`
// ATUAL do movimento, não reabre o cabeçalho.
async function updateMovementAllocation(
  movementUuid: string,
  payload: MovementAllocationRequestPayload
) {
  const { data } = await api.V2.patch<Response<MovementDetail>>(
    `/movements/${movementUuid}/allocation`,
    payload
  );
  return data;
}

// 204 No Content — sem corpo de resposta.
async function deleteMovement(movementUuid: string) {
  const { data } = await api.V2.delete(`/movements/${movementUuid}`);
  return data;
}

// PUT /movements/{uuid}/toggle-fiscal-document (esteira 117, UT-000746,
// F-113) — sem payload; mirror EXATO do legado
// (`agro365/resources/views/movements/index.blade.php:169-171` + JS
// `:266-282`, `PUT .../toggle-fiscal-document` sem corpo) e da mecânica já
// consolidada em `toggleFiscalDocumentIncome` (`income-service.ts`).
// Funciona inclusive para movimento gerado por baixa de título (a edição
// pelo form completo desse movimento continua bloqueada no backend — a
// mensagem de erro do form passa a orientar o uso deste interruptor).
// Resposta: MovementResource atualizado (mesmo shape de `getMovement`),
// campo `fiscal_document` boolean.
async function toggleMovementFiscalDocument(movementUuid: string) {
  const { data } = await api.V2.put<Response<MovementDetail>>(
    `/movements/${movementUuid}/toggle-fiscal-document`
  );
  return data;
}

// PATCH /movements/{uuid}/unreconcile (TASK-064-OFX-FE-02, SURF-069,
// Decisão 7 da arquitetura de API) — reverte SÓ `is_reconciled=false`, SEM
// apagar o Movement (opção mais segura/reversível, mirror da decisão do
// Maestro). SEM corpo de requisição — toda a entrada vem do `{uuid}` da
// rota. Reusa a permissão `movements_create` (Decisão 7, mirror
// `allocation`, DEC-006 — nenhum slug novo).
async function unreconcileMovement(movementUuid: string) {
  const { data } = await api.V2.patch<Response<MovementDetail>>(
    `/movements/${movementUuid}/unreconcile`
  );
  return data;
}

export {
  createMovement,
  deleteMovement,
  getMovement,
  listMovements,
  toggleMovementFiscalDocument,
  unreconcileMovement,
  updateMovement,
  updateMovementAllocation,
};
