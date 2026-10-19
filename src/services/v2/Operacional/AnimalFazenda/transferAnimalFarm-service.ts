// src/services/v2/Operacional/AnimalFazenda/transferAnimalFarm-service.ts
// -----------------------------------------------------------------------------
// TransferAnimalFarm Service — API v1 do backend Laravel GB.Cerne
// (Transferência de Animal entre Fazendas — Operacional > Pecuária >
// Transferências, 97-Esteiras/042, TASK-FE-042-101). Mirror ESTRUTURAL de
// `transferBatchFarm-service.ts` (Lote/Fazenda, 97-Esteiras/041) MENOS
// `download`/`import`/`module-area`/`getBatch`/`createBatch` (fora de
// escopo desta feature, §3.6 do contrato-frontend — sem planilha/lote novo
// no legado de Animal/Fazenda).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /transfer-animal-farms                       → data: TransferAnimalFarmListItem[], meta paginação REAL
//   POST   /transfer-animal-farms                        → payload CreateTransferAnimalFarmRequest → data: TransferAnimalFarmDetail
//   GET    /transfer-animal-farms/{uuid}                 → data: TransferAnimalFarmDetail (com `animals[]`, SURF-006)
//   DELETE /transfer-animal-farms/{uuid}                 → 204, sem body (cancelamento, DIV-011 — INCONDICIONAL)
//   GET    /transfer-animal-farms/check-date              → data: TransferAnimalFarmDateCheckResult
//   GET    /transfer-animal-farms/eligible-animals         → data: TransferAnimalFarmEligibleAnimalsByCategory (batch_uuid? OU categories[]?)
//   POST   /transfer-animal-farms/{uuid}/receive           → data: ProcessingResource (uuid do Processing criado)
//   GET    /transfer-animal-farms/{uuid}/financial          → data: TransferAnimalFarmDetail
//   POST   /transfer-animal-farms/{uuid}/financial           → payload CreateTransferAnimalFarmFinancialRequest → data: TransferAnimalFarmDetail
//   GET    /animal-batches/aggregates                    → data: AnimalBatchAggregates (animal_uuids[], CALC-002)
//
// `api.V2` já injeta Sanctum (cookie) + `X-Farm-Id` pelo interceptor genérico
// (`@/services/api.ts`) — nunca manipulado aqui.
//
// `downloadFinancialCategoryTypeReport` (ACT-015/016) NÃO é reexportado aqui
// — reuso LITERAL do endpoint genérico do domínio `FinancialCategory`, os
// consumidores (TASK-104/105) importam direto de
// `@/services/v2/LoteFazenda/financialCategoryTypeReport-service` (§5 do
// contrato-frontend — não duplicar o arquivo apesar do path `LoteFazenda`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AnimalBatchAggregates,
  CreateTransferAnimalFarmFinancialRequest,
  CreateTransferAnimalFarmRequest,
  TransferAnimalFarmDateCheckResult,
  TransferAnimalFarmDetail,
  TransferAnimalFarmEligibleAnimalsByCategory,
  TransferAnimalFarmListItem,
  TransferAnimalFarmsListEnvelope,
} from '@/@types/v2/Operacional/AnimalFazenda/transferAnimalFarm';

// ---- CRUD central -----------------------------------------------------------

// Sem filtros de campo reais — mirror `TransferBatchFarmIndexRequest::rules()`
// (só `status`/`per_page`, sem `FilterSide`, ver §3.1/FILTER-001 do
// contrato-frontend).
export interface ListTransferAnimalFarmsParams extends PaginationQueryParams {}

async function listTransferAnimalFarms(
  params: ListTransferAnimalFarmsParams
): Promise<ResponsePagination<TransferAnimalFarmListItem[]>> {
  const { data } = await api.V2.get<TransferAnimalFarmsListEnvelope>('/transfer-animal-farms', {
    page: params.page,
    per_page: params.per_page,
  });

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

async function createTransferAnimalFarm(payload: CreateTransferAnimalFarmRequest) {
  const { data } = await api.V2.post<Response<TransferAnimalFarmDetail>>(
    '/transfer-animal-farms',
    payload
  );
  return data;
}

// GET /transfer-animal-farms/{uuid} — consumido pela tela Visualizar
// (TASK-106, SURF-005/006); `data.animals[]` só vem populado aqui (não no
// index).
async function getTransferAnimalFarm(uuid: string) {
  const { data } = await api.V2.get<Response<TransferAnimalFarmDetail>>(
    `/transfer-animal-farms/${uuid}`
  );
  return data;
}

// DELETE /transfer-animal-farms/{uuid} — 204, sem body. Cancelamento
// INCONDICIONAL (DIV-011, decisão do dono §Animal/Fazenda de
// `exec-decisoes-dono.md`): a API aceita cancelar de QUALQUER status, cascata
// completa de incomes/expenses/Processing — o front só dispara, a UI só
// OFERECE o botão sob a condição de exibição do legado (§7.2 do
// contrato-frontend, ver `index.tsx`).
async function cancelTransferAnimalFarm(transferAnimalFarmUuid: string) {
  await api.V2.delete(`/transfer-animal-farms/${transferAnimalFarmUuid}`);
}

// ---- Recebimento → Processing + Financeiro morph -----------------------------

// `POST .../receive` devolve o `Processing` recém-criado — o caller navega
// para `/operacional/processamentos/{uuid}` (rota já existente, Exec 039).
async function receiveTransferAnimalFarm(transferAnimalFarmUuid: string) {
  const { data } = await api.V2.post<Response<{ uuid: string }>>(
    `/transfer-animal-farms/${transferAnimalFarmUuid}/receive`
  );
  return data;
}

async function getTransferAnimalFarmFinancial(transferAnimalFarmUuid: string) {
  const { data } = await api.V2.get<Response<TransferAnimalFarmDetail>>(
    `/transfer-animal-farms/${transferAnimalFarmUuid}/financial`
  );
  return data;
}

async function saveTransferAnimalFarmFinancial(
  transferAnimalFarmUuid: string,
  payload: CreateTransferAnimalFarmFinancialRequest
) {
  const { data } = await api.V2.post<Response<TransferAnimalFarmDetail>>(
    `/transfer-animal-farms/${transferAnimalFarmUuid}/financial`,
    payload
  );
  return data;
}

// ---- Lookups de fechamento ---------------------------------------------------

export interface CheckTransferAnimalFarmDateParams {
  date: string;
  farm_uuid?: string | null;
}

async function checkTransferAnimalFarmDate(params: CheckTransferAnimalFarmDateParams) {
  const { data } = await api.V2.get<Response<TransferAnimalFarmDateCheckResult>>(
    '/transfer-animal-farms/check-date',
    params
  );
  return data;
}

// `eligible-animals` — NOVO, sem precedente FE (§2.4 do contrato-frontend):
// fonte REAL da seleção de animais desta feature. Envie SOMENTE `batch_uuid`
// OU SOMENTE `categories`, nunca os dois juntos (filtros alternativos, mirror
// da lição já registrada em `listBatchCandidateAnimals` — não cumulativos).
export interface ListEligibleAnimalsForTransferAnimalFarmParams {
  batch_uuid?: string | null;
  categories?: string[];
}

async function listEligibleAnimalsForTransferAnimalFarm(
  params: ListEligibleAnimalsForTransferAnimalFarmParams
) {
  const { data } = await api.V2.get<Response<TransferAnimalFarmEligibleAnimalsByCategory>>(
    '/transfer-animal-farms/eligible-animals',
    {
      batch_uuid: params.batch_uuid || undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
    }
  );
  return data;
}

// `animal-batches/aggregates` — Action já existe no backend
// (`GetBatchAnimalAggregatesAction`, TASK-BE-968), service FE NOVO (confirmado
// ausente por grep). Mirror do padrão de array-em-query-param de
// `batch-service.ts::listBatchOptions` (`includeUuids`).
async function getAnimalBatchAggregates(animalUuids: string[]) {
  const { data } = await api.V2.get<Response<AnimalBatchAggregates>>('/animal-batches/aggregates', {
    animal_uuids: animalUuids.length > 0 ? animalUuids : undefined,
  });
  return data;
}

export {
  cancelTransferAnimalFarm,
  checkTransferAnimalFarmDate,
  createTransferAnimalFarm,
  getAnimalBatchAggregates,
  getTransferAnimalFarm,
  getTransferAnimalFarmFinancial,
  listEligibleAnimalsForTransferAnimalFarm,
  listTransferAnimalFarms,
  receiveTransferAnimalFarm,
  saveTransferAnimalFarmFinancial,
};
