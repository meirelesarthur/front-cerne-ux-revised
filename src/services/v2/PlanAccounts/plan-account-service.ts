// src/services/v2/PlanAccounts/plan-account-service.ts
// -----------------------------------------------------------------------------
// Plan Account Service — API v1 do backend Laravel GB.Cerne (Plano de Contas).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /plan-accounts            → data: PlanAccountListItem[] + meta de paginação (default 15/max 100 — Seção 3.1)
//   GET    /plan-accounts/{uuid}     → data: PlanAccountDetail (inclui parent/categories)
//   POST   /plan-accounts            → payload PlanAccountPayload (parent_uuid aceito só aqui)
//   PUT    /plan-accounts/{uuid}     → payload PlanAccountPayload (parent_uuid PROIBIDO — imutável após criar)
//   DELETE /plan-accounts/{uuid}     → 204; erro de negócio (message ÚNICA, não array) se houver dependentes (DA-PA-05)
//
// `listPlanAccounts` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` ({ data: { items, pagination } }) que a
// infra de grid do projeto (useCustomGridQuery/TableProvider/SelectAsyncPaginate)
// consome — idêntico ao mesmo truque de `listCostCenters`.
//
// TASK-PA-03a cobriu LISTAGEM + exclusão. Esta Tarefa (TASK-PA-03b) adiciona
// `getPlanAccount`/`createPlanAccount`/`updatePlanAccount` (detalhe/formulário).
//
// TASK-FE-036-103 (esteira 036, Contas a Pagar) adiciona 2 funções de
// cascata para o rateio de Expense (GAP-FE-036-102):
//   GET /plan-accounts/options              → data: PlanAccountRef[] + meta
//                                              REAL (mirror `listCostCenterOptions`)
//                                              — Select manual de "Conta Contábil".
//   GET /plan-accounts/by-category/{uuid}   → data: PlanAccountResource | null
//                                              (SINGULAR, não array) — auto-fill
//                                              da MESMA linha do rateio quando a
//                                              Categoria Financeira muda
//                                              (`PlanAccountController::byCategory`,
//                                              `null` sem vínculo, SEM 404).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  PlanAccountCodePreview,
  PlanAccountDetail,
  PlanAccountImportResult,
  PlanAccountListItem,
  PlanAccountPayload,
  PlanAccountRef,
  PlanAccountsListEnvelope,
} from '@/@types/v2/PlanAccounts';

// Params aceitos pela listagem — paginação padrão + busca + filtros reais do
// backend (Seção 3.1 do contrato). `class`/`type` são enum int-backed no
// backend (class: SYNTHETIC=1/ANALYTICAL=2; type: CAPEX=1/OPEX=2) — enviar
// string ('synthetic'/'capex') faz `Enum::from()` lançar → HTTP 500
// (TASK-PA-FIX-02). Os RÓTULOS de UI continuam Sintético/Analítico/CAPEX/OPEX;
// só o valor de rede muda para o backing numérico.
export interface ListPlanAccountsParams extends PaginationQueryParams {
  search?: string;
  condition?: '1' | '2' | '3';
  class?: 1 | 2;
  type?: 1 | 2;
  is_enabled?: 'true' | 'false';
  parent_uuid?: string;
  financial_category_uuid?: string;
}

async function listPlanAccounts(
  params: ListPlanAccountsParams
): Promise<ResponsePagination<PlanAccountListItem[]>> {
  const { data } = await api.V2.get<PlanAccountsListEnvelope>('/plan-accounts', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    condition: params.condition || undefined,
    class: params.class || undefined,
    type: params.type || undefined,
    is_enabled: params.is_enabled || undefined,
    parent_uuid: params.parent_uuid || undefined,
    financial_category_uuid: params.financial_category_uuid || undefined,
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
  };
}

async function deletePlanAccount(planAccountUuid: string) {
  const { data } = await api.V2.delete(`/plan-accounts/${planAccountUuid}`);
  return data;
}

// ---- TASK-PA-03b: detalhe (form) + create/update -----------------------

async function getPlanAccount(planAccountUuid: string) {
  const { data } = await api.V2.get<Response<PlanAccountDetail>>(
    `/plan-accounts/${planAccountUuid}`
  );
  return data;
}

async function getPlanAccountCodePreview(parentUuid?: string) {
  const { data } = await api.V2.get<Response<PlanAccountCodePreview>>(
    '/plan-accounts/code-preview',
    { parent_uuid: parentUuid || undefined }
  );
  return data;
}

async function createPlanAccount(payload: PlanAccountPayload) {
  const { data } = await api.V2.post<Response<PlanAccountDetail>>('/plan-accounts', payload);
  return data;
}

// `payload` aqui já chega como o DELTA a enviar (montado em
// `CreateOrUpdatePlanAccount.tsx` — description/condition/is_enabled/type
// SEMPRE presentes, `category_uuids` só quando o usuário mexeu na seção de
// categorias nesta sessão; `parent_uuid` nunca, `prohibited` no backend).
async function updatePlanAccount(planAccountUuid: string, payload: PlanAccountPayload) {
  const { data } = await api.V2.put<Response<PlanAccountDetail>>(
    `/plan-accounts/${planAccountUuid}`,
    payload
  );
  return data;
}

// ---- TASK-PA-07: download de modelo (branco) + exportação (dados reais) ----
// Exceção ao envelope ApiResponse (contrato Seção 11.5) — resposta binária
// (.xlsx), não JSON — por isso `responseType: 'blob'` e retorno `Blob` puro,
// sem passar pelo shape `Response<T>` usado nos demais endpoints deste
// serviço. Download síncrono direto (sem TanStack mutation/query) — padrão
// V3 canônico de `get_pwa_file_upload_and_export_pattern`.

async function downloadPlanAccountImportTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/plan-accounts/import/template', undefined, {
    responseType: 'blob',
  });
  return data;
}

async function exportPlanAccounts(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/plan-accounts/export', undefined, {
    responseType: 'blob',
  });
  return data;
}

// ---- TASK-PA-08: import de planilha (.xlsx) --------------------------------
// `POST /plan-accounts/import` — multipart, campo `file` (contrato Seção
// 11.4/11.9.1). Sucesso (200): envelope `Response<PlanAccountImportResult>`
// normal. Erro (422): `errors.rows: string[]` quando a planilha tem linhas
// inválidas (abort-all, nada gravado) OU `message` ÚNICA para os demais casos
// (sem contexto de fazenda, sem permissão, arquivo inválido) — tratamento
// diferenciado fica na mutation do `PlanAccountImportModal.tsx` (Achado 3 da
// Tarefa, NÃO usa `useRequest` genérico).
async function importPlanAccounts(file: File): Promise<Response<PlanAccountImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<PlanAccountImportResult>>(
    '/plan-accounts/import',
    fd
  );
  return data;
}

// ---- TASK-PA-12: agregação client-side p/ o relatório de impressão --------
// Busca TODAS as páginas do tenant ativo, ignorando qualquer filtro da grid —
// decisão registrada em ROTEIRO-03/Achado 2 (fiel ao comportamento do UX, que
// itera o array completo de contas sem respeitar filtro). `per_page=100` é o
// MÁXIMO aceito pelo contrato (Seção 3.1) — minimiza o nº de requisições.
// Laço SEQUENCIAL (não paralelo) — a 1ª resposta é quem informa
// `meta.last_page`; erro em qualquer página propaga e aborta o laço (o
// chamador, em `HeaderTable.tsx`, trata isso como falha total — nunca abre
// relatório parcial).
async function listAllPlanAccountsForReport(): Promise<PlanAccountListItem[]> {
  const perPage = 100;
  const items: PlanAccountListItem[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const { data } = await api.V2.get<PlanAccountsListEnvelope>('/plan-accounts', {
      page,
      per_page: perPage,
    });
    items.push(...data.data);
    lastPage = data.meta?.last_page ?? 1;
    page += 1;
  } while (page <= lastPage);

  return items;
}

// ---- TASK-FE-036-310 (Contas a Receber, GAP-FE-036-301) -------------------
// GET /plan-accounts/by-category/{category_uuid} — autofill de "Conta
// Contábil" ao escolher a Categoria Financeira na aba de Rateio de Income.
// Devolve 200 sempre (nunca 404) — `null` quando não há vínculo
// categoria→conta (contrato de tela §3.7/GAP-FE-036-301). Endpoint DISTINTO
// de `listPlanAccountOptions` abaixo (TASK-MV-FE-02) — este resolve a conta
// vinculada a UMA categoria específica; aquele é um lookup livre por busca.
async function getPlanAccountByCategory(
  categoryUuid: string
): Promise<Response<PlanAccountRef | null>> {
  const { data } = await api.V2.get<Response<PlanAccountRef | null>>(
    `/plan-accounts/by-category/${categoryUuid}`
  );
  return data;
}

// ---- TASK-MV-FE-02: lookup enxuto para o Select "Conta Contábil" ----------
// GET /plan-accounts/options (`PlanAccountController::options`,
// `ListPlanAccountOptionsAction`, TASK-BE-606/GAP-BE-040 Opção B) — já
// existe no backend, mas o service do front não tinha o wrapper (achado do
// Arquiteto, TASK-MV-FE-02). Consumido por `MovementAllocationEditor`
// (TASK-MV-FE-03) e, nesta esteira 036, pela aba Rateio de Expense
// (`ExpenseApportionmentTab.tsx`, GAP-FE-036-102) — mirror de
// `listCostCenterOptions`/`listHarvestOptions` (mesma FAMÍLIA de lookup,
// mesmo `Resource` enxuto uuid+code+description).
//
// Divergência real vs. o mirror pedido pelo task-packet ("mesma assinatura
// de parâmetros/paginação de listHarvestOptions"): confirmado por leitura
// direta de `PlanAccountOptionsRequest`/`ListPlanAccountOptionsAction`/
// `PlanAccountRepository::listOptions()` (api_root) que este endpoint é
// FLAT — só aceita `search`, sem `page`/`per_page`, e devolve TODAS as
// contas via `ApiResponse::success` (nunca `::paginated`), diferente de
// `/cost-centers/options`/`/harvests` (pagina de verdade no servidor). Para
// caber no contrato `ResponsePagination` que `SelectAsyncPaginate` exige
// (e não repetir a MESMA lista completa a cada scroll — o que faria
// `hasMore` nunca zerar e duplicar opções), a paginação aqui é aplicada
// CLIENT-SIDE sobre o array já filtrado por `search` no servidor: uma única
// chamada de rede busca a lista inteira (mirror `listActivePlanAccounts`
// implícito, sem endpoint próprio), e o slice por página evita round-trip
// desnecessário e o bug de duplicação.
//
// NOTA (esteira 036, recuperação pós-merge): a versão original desta
// Tarefa (TASK-FE-036-103) tinha assumido este endpoint como PAGINADO no
// servidor (mirror `listCostCenterOptions`) — achado ERRADO, sem
// confirmação contra `PlanAccountOptionsRequest`/Action real. Substituída
// pela implementação REAL já validada em `develop` (TASK-MV-FE-02).
// Homologação 036fix3 (item "Conta Contábil do rateio lista itens
// errados/inativos") — `PlanAccountRepository::listOptions()` (backend)
// só aceitava `search`/`category_uuid` (este último nem repassado por este
// service, ver `getPlanAccountByCategory` acima), SEM `is_enabled`/`class`/
// `condition` — diferente do legado (`PlanAccountController::filter()` do
// `agro365`, `is_enabled=1`+`class=2` FIXOS no servidor +
// `condition IN [$type, 3]`) e diferente do irmão paginado `/plan-accounts`
// (`ListPlanAccountsParams` acima, que já suporta os 3). Extensão ADITIVA
// — mesmos nomes/tipos de `ListPlanAccountsParams` (`condition` como STRING
// enum, `class`/`is_enabled` idem, TASK-PA-FIX-02: enum int-backed no
// backend, string solta vira 500). Consumido por `ExpenseApportionmentTab.
// tsx` (rateio de Contas a Pagar) para replicar o recorte do legado:
// `is_enabled='true'` + `class=2` (Analítica) + `condition='1'` (Débito —
// backend aplica `condition IN [1,3]`, incluindo sempre "Ambos").
export interface ListPlanAccountOptionsParams {
  search?: string;
  page?: number;
  per_page?: number;
  is_enabled?: 'true' | 'false';
  class?: 1 | 2;
  condition?: '1' | '2' | '3';
  // 088 D3-T1 (API) — filtro IN por condição (`conditions[]=1&conditions[]=3`),
  // aditivo ao `condition` escalar. O axios serializa o array como
  // `conditions[]=1&conditions[]=3` (mesmo formato de `type_ids[]`). Consumidores
  // atuais não enviam e ficam inalterados.
  conditions?: number[];
  // 088 D3-T1 (API) — conta contábil padrão da categoria (cascata IG-06): a API
  // devolve ordenado por `code`; o chamador usa o 1º item.
  category_uuid?: string;
}

async function listPlanAccountOptions(
  params: ListPlanAccountOptionsParams
): Promise<ResponsePagination<PlanAccountRef[]>> {
  const { data } = await api.V2.get<Response<PlanAccountRef[]>>('/plan-accounts/options', {
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    class: params.class ?? undefined,
    condition: params.condition || undefined,
    conditions: params.conditions && params.conditions.length > 0 ? params.conditions : undefined,
    category_uuid: params.category_uuid || undefined,
  });

  const perPage = params.per_page ?? data.data.length;
  const page = params.page ?? 1;
  const start = (page - 1) * perPage;
  const items = perPage > 0 ? data.data.slice(start, start + perPage) : data.data;

  return {
    success: data.success,
    message: data.message,
    data: {
      items,
      pagination: {
        total: data.data.length,
        count: items.length,
        per_page: perPage,
        current_page: page,
        total_pages: perPage > 0 ? Math.ceil(data.data.length / perPage) : 1,
      },
    },
  };
}

export {
  createPlanAccount,
  deletePlanAccount,
  downloadPlanAccountImportTemplate,
  exportPlanAccounts,
  getPlanAccount,
  getPlanAccountByCategory,
  getPlanAccountCodePreview,
  importPlanAccounts,
  listAllPlanAccountsForReport,
  listPlanAccountOptions,
  listPlanAccounts,
  updatePlanAccount,
};
