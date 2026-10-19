// src/services/v2/ChargeBillIncome/charge-bill-income-service.ts
// -----------------------------------------------------------------------------
// ChargeBillIncome Service — API v1 do backend Laravel GB.Cerne
// ("Contas a Receber" — Operacional / Agricultura / Carregamento).
// TASK-CBI-FE-01 (fundação), esteira `97-Esteiras/059`. Mirror estrutural de
// `services/v2/FechamentoSemana/closing-week-service.ts` (mesma adaptação de
// envelope paginado plano → `ResponsePagination`, mesmo delete 204 sem
// envelope).
//
// DOMÍNIO PRÓPRIO — NÃO confundir com `services/v2/Incomes/income-service.ts`
// (Financeiro → Receber, tabela `incomes`). Este service cobre a tabela
// `charge_bills` com `type='E'`, permissões `charge_income_*`.
//
// Envelope (`ApiResponse`): `{ success, message, data, errors, meta }`.
//   GET    /charge-bill-incomes         → data: array plano, meta paginação REAL.
//   GET    /charge-bill-incomes/{uuid}  → data: ChargeBillIncomeDetail.
//   POST   /charge-bill-incomes         → 201, data: ChargeBillIncomeDetail.
//   PUT    /charge-bill-incomes/{uuid}  → 200, data: ChargeBillIncomeDetail.
//   DELETE /charge-bill-incomes/{uuid}  → 204, SEM envelope (hard delete,
//                                         contrato de tela §2) — mirror
//                                         `deleteClosingWeek`.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
//
// DEC-FE-02 (ratificado) — escrita usa `provider_uuid`/`cultivation_uuid`
// (uuid), NUNCA `provider_id`/`cultivation_id` (o backend FE-05 resolve
// uuid→id na Action).
// -----------------------------------------------------------------------------

import api from '@/services/api';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ChargeBillIncomeDetail,
  ChargeBillIncomeEnvelope,
  ChargeBillIncomeListItem,
  ChargeBillIncomePayload,
} from '@/@types/v2/ChargeBillIncome';
import type {
  CultivationOption,
  CultivationOptionsListEnvelope,
} from '@/@types/v2/Cultivation/cultivation';

// Params aceitos por `GET /charge-bill-incomes` — só paginação (FILT-01
// fiel: index sem filtro/busca, RN-07 ordenação fixa `code DESC` server-side).
export interface ListChargeBillIncomesParams extends PaginationQueryParams {}

async function listChargeBillIncomes(
  params: ListChargeBillIncomesParams
): Promise<ResponsePagination<ChargeBillIncomeListItem[]>> {
  const { data } = await api.V2.get<ChargeBillIncomeEnvelope>('/charge-bill-incomes', {
    page: params.page,
    per_page: params.per_page,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listClosingWeeks`/`listCharges`.
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

async function getChargeBillIncomeByUuid(
  chargeBillIncomeUuid: string
): Promise<Response<ChargeBillIncomeDetail>> {
  const { data } = await api.V2.get<Response<ChargeBillIncomeDetail>>(
    `/charge-bill-incomes/${chargeBillIncomeUuid}`
  );
  return data;
}

async function createChargeBillIncome(
  payload: ChargeBillIncomePayload
): Promise<Response<ChargeBillIncomeDetail>> {
  const { data } = await api.V2.post<Response<ChargeBillIncomeDetail>>(
    '/charge-bill-incomes',
    payload
  );
  return data;
}

async function updateChargeBillIncome(
  chargeBillIncomeUuid: string,
  payload: ChargeBillIncomePayload
): Promise<Response<ChargeBillIncomeDetail>> {
  const { data } = await api.V2.put<Response<ChargeBillIncomeDetail>>(
    `/charge-bill-incomes/${chargeBillIncomeUuid}`,
    payload
  );
  return data;
}

// `DELETE /charge-bill-incomes/{uuid}` — 204 SEM envelope (hard delete,
// SFX-03 do contrato legado; mirror `deleteClosingWeek`/`deleteAccount`).
async function deleteChargeBillIncome(chargeBillIncomeUuid: string): Promise<void> {
  await api.V2.delete(`/charge-bill-incomes/${chargeBillIncomeUuid}`);
}

// -----------------------------------------------------------------------------
// Carregadores de opções (lookups reusados, contrato de tela §2/§7 DEC-FE-04) —
// consumidos por `AsyncSearchSelect`/`SelectAsyncPaginate` do form (TASK-CBI-
// FE-03, fora do escopo desta execução; declarados aqui para o form plugar
// sem tocar neste arquivo).
//
// GAP-TT-01/DEC-FE-04 — `SelectAsyncPaginate` serializa `true`→'true' (string)
// e quebra validação booleana estrita no backend; os 2 loaders abaixo SEMPRE
// enviam `type`/`only_children` como NÚMERO (`1`), nunca boolean cru.
// -----------------------------------------------------------------------------

// `loadProviderOptions` — reusa o service COMPARTILHADO `listProviderOptions`
// (`providers/options`, já usado por `Carregamento`/`Contrato`/etc.), fixando
// `type: 1` (Provider::person(), DEC-FE-04) — NENHUMA duplicação de chamada
// HTTP. `is_enabled` NÃO é enviado (já forçado server-side, contrato §2).
async function loadProviderOptions(search: string) {
  return listProviderOptions({ search, type: 1 });
}

// `loadCultivationOptions` — `cultivations/options` com `only_children: 1`
// (DEC-FE-01/DEC-CBI-02). O service COMPARTILHADO `listCultivationOptions`
// (`services/v2/Cultivation/cultivation-service.ts`) ainda não aceita este
// param (aditivo — depende de TASK-CBI-FE-05 no backend); chamada PRÓPRIA
// aqui (mesma adaptação de envelope flat, sem tocar no service compartilhado)
// para já enviar o param opt-in — até FE-05 landar, o backend ignora o param
// extra e devolve raízes+subcultivos (fallback honesto, documentado na
// ficha/contrato, NÃO um bug desta camada).
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
  createChargeBillIncome,
  deleteChargeBillIncome,
  getChargeBillIncomeByUuid,
  listChargeBillIncomes,
  loadCultivationOptions,
  loadProviderOptions,
  updateChargeBillIncome,
};
