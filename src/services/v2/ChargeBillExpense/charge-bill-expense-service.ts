// src/services/v2/ChargeBillExpense/charge-bill-expense-service.ts
// -----------------------------------------------------------------------------
// ChargeBillExpense Service — API v1 do backend Laravel GB.Cerne
// ("Contas a Pagar" — Operacional / Agricultura / Carregamento). TASK-CBE-04
// (fundação), esteira `97-Esteiras/062`. Mirror estrutural de
// `services/v2/ChargeBillIncome/charge-bill-income-service.ts` (mesma
// adaptação de envelope paginado plano → `ResponsePagination`, mesmo delete
// 204 sem envelope).
//
// DOMÍNIO PRÓPRIO — NÃO confundir com `services/v2/Financeiro/Expenses`
// (Financeiro → Pagar, tabela `expenses`). Este service cobre a tabela
// `charge_bills` com `type='S'`, permissões `charge_expense_*`.
//
// Envelope (`ApiResponse`): `{ success, message, data, errors, meta }`.
//   GET    /charge-bill-expenses         → data: array plano, meta paginação REAL.
//   GET    /charge-bill-expenses/{uuid}  → data: ChargeBillExpenseDetail.
//   POST   /charge-bill-expenses         → 201, data: ChargeBillExpenseDetail.
//   PUT    /charge-bill-expenses/{uuid}  → 200, data: ChargeBillExpenseDetail.
//   DELETE /charge-bill-expenses/{uuid}  → 204, SEM envelope (hard delete,
//                                         contrato de tela §2.4) — mirror
//                                         `deleteChargeBillIncome`.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
//
// DEC-FE-02 (ratificado) — escrita usa `provider_uuid`/`branch_uuid`/
// `cultivation_uuid` (uuid), NUNCA `provider_id`/`branch_id`/`cultivation_id`
// (o backend resolve uuid→id na Action).
// -----------------------------------------------------------------------------

import api from '@/services/api';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listBranchesByProvider } from '@/services/v2/Financeiro/Branches/branch-service';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ChargeBillExpenseBranchOption,
  ChargeBillExpenseDetail,
  ChargeBillExpenseEnvelope,
  ChargeBillExpenseListItem,
  ChargeBillExpensePayload,
} from '@/@types/v2/ChargeBillExpense';
import type {
  CultivationOption,
  CultivationOptionsListEnvelope,
} from '@/@types/v2/Cultivation/cultivation';

// Params aceitos por `GET /charge-bill-expenses` — só paginação (FILT-01
// fiel: index sem filtro/busca, RN-07 ordenação fixa `code DESC` server-side).
export interface ListChargeBillExpensesParams extends PaginationQueryParams {}

async function listChargeBillExpenses(
  params: ListChargeBillExpensesParams
): Promise<ResponsePagination<ChargeBillExpenseListItem[]>> {
  const { data } = await api.V2.get<ChargeBillExpenseEnvelope>('/charge-bill-expenses', {
    page: params.page,
    per_page: params.per_page,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listChargeBillIncomes`.
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

async function getChargeBillExpenseByUuid(
  chargeBillExpenseUuid: string
): Promise<Response<ChargeBillExpenseDetail>> {
  const { data } = await api.V2.get<Response<ChargeBillExpenseDetail>>(
    `/charge-bill-expenses/${chargeBillExpenseUuid}`
  );
  return data;
}

async function createChargeBillExpense(
  payload: ChargeBillExpensePayload
): Promise<Response<ChargeBillExpenseDetail>> {
  const { data } = await api.V2.post<Response<ChargeBillExpenseDetail>>(
    '/charge-bill-expenses',
    payload
  );
  return data;
}

async function updateChargeBillExpense(
  chargeBillExpenseUuid: string,
  payload: ChargeBillExpensePayload
): Promise<Response<ChargeBillExpenseDetail>> {
  const { data } = await api.V2.put<Response<ChargeBillExpenseDetail>>(
    `/charge-bill-expenses/${chargeBillExpenseUuid}`,
    payload
  );
  return data;
}

// `DELETE /charge-bill-expenses/{uuid}` — 204 SEM envelope (hard delete,
// mirror `deleteChargeBillIncome`).
async function deleteChargeBillExpense(chargeBillExpenseUuid: string): Promise<void> {
  await api.V2.delete(`/charge-bill-expenses/${chargeBillExpenseUuid}`);
}

// -----------------------------------------------------------------------------
// Carregadores de opções (lookups reusados, contrato de tela §2.2) —
// consumidos por `SelectAsyncPaginate` do form (TASK-CBE-06, fora do escopo
// desta execução; declarados aqui para o form plugar sem tocar neste arquivo).
//
// GAP-TT-01/DEC-FE-04 — `SelectAsyncPaginate` serializa `true`→'true' (string)
// e quebra validação booleana estrita no backend; os loaders abaixo SEMPRE
// enviam campos numéricos como NÚMERO (`1`), nunca boolean cru.
// -----------------------------------------------------------------------------

// `loadProviderOptions` — reusa o service COMPARTILHADO `listProviderOptions`
// (`providers/options`), fixando `type: 1` (Provider::person(), DEC-FE-04) —
// NENHUMA duplicação de chamada HTTP. Mirror EXATO do gêmeo.
async function loadProviderOptions(search: string) {
  return listProviderOptions({ search, type: 1 });
}

// `loadBranchOptions` — EXCLUSIVO desta feature. `listBranchesByProvider`
// (service COMPARTILHADO, `services/v2/Financeiro/Branches/branch-service.ts`,
// GAP-036-108) devolve `Response<BranchOption[]>` FLAT/não-paginado —
// `SelectAsyncPaginate.service` espera `(params) => Promise<ResponsePagination<T>>`,
// por isso a adaptação de envelope é FUNÇÃO PRÓPRIA local a este service
// (mirror exato da adaptação de `loadCultivationOptions`, mesma técnica,
// endpoint distinto). NÃO duplica a chamada HTTP — só adapta o shape.
async function loadBranchOptions(
  providerUuid: string
): Promise<ResponsePagination<ChargeBillExpenseBranchOption[]>> {
  const response = await listBranchesByProvider(providerUuid);

  const items: ChargeBillExpenseBranchOption[] = response.data.map((branch) => ({
    uuid: branch.uuid,
    label: branch.name,
  }));

  return {
    success: response.success,
    message: response.message,
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

// `loadCultivationOptions` — `cultivations/options` — mirror EXATO de
// `loadCultivationOptions` do gêmeo (`ChargeBillIncome`), mesma adaptação de
// envelope flat.
async function loadCultivationOptions(
  search: string
): Promise<ResponsePagination<CultivationOption[]>> {
  const { data } = await api.V2.get<CultivationOptionsListEnvelope>('/cultivations/options', {
    search: search || undefined,
    only_children: 1,
  });

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

export {
  createChargeBillExpense,
  deleteChargeBillExpense,
  getChargeBillExpenseByUuid,
  listChargeBillExpenses,
  loadBranchOptions,
  loadCultivationOptions,
  loadProviderOptions,
  updateChargeBillExpense,
};
