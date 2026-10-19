// src/services/v2/TaxRules/tax-rule-service.ts
// -----------------------------------------------------------------------------
// TaxRule Service — API v1 do backend Laravel GB.Cerne (Regras Fiscais).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /tax-rules          → data: TaxRuleListItem[], meta com paginação
//                                 real. Dentro do bloco farm.context ESTRITO
//                                 (Scope dedicado TaxRuleTenantScope).
//   GET    /tax-rules/{uuid}   → data: TaxRuleData
//   POST   /tax-rules          → payload TaxRulePayload (SEMPRE completo)
//   PUT    /tax-rules/{uuid}   → payload TaxRulePayload (SEMPRE completo)
//   DELETE /tax-rules/{uuid}   → 204; exclusão física, SEM guarda de FK
//                                 (nullOnDelete() físico confirmado)
//   GET    /tax-rules/options  → data: TaxRuleOptionsData — payload ESTÁTICO,
//                                 FORA do bloco farm.context, só auth:sanctum,
//                                 sem gate de permissão nem de farm ativa.
//   GET    /tax-rules/entity-options → data: TaxRuleEntityOption[] (TASK-BE-603,
//                                 aditivo TASK-FE-941) — lookup ENXUTO de
//                                 ENTIDADE (`{uuid,label}[]`), DENTRO do
//                                 bloco farm.context, tenancy automática via
//                                 `TaxRuleTenantScope`, SEM gate de
//                                 permissão. NÃO CONFUNDIR com `/options`
//                                 acima (catálogo estático de enums).
//
// `listTaxRules` ADAPTA o envelope { data: [], meta: {} } para o shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listVaccines`/`listGroupers` (meta REAL, não fallback
// fake).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  TaxRuleData,
  TaxRuleEntityOption,
  TaxRuleEntityOptionsListEnvelope,
  TaxRuleFilterForm,
  TaxRuleFiscalDefaultsData,
  TaxRuleListItem,
  TaxRuleOptionsData,
  TaxRulePayload,
  TaxRulesListEnvelope,
} from '@/@types/v2/TaxRules';

export interface ListTaxRulesParams extends PaginationQueryParams, TaxRuleFilterForm {}

async function listTaxRules(
  params: ListTaxRulesParams
): Promise<ResponsePagination<TaxRuleListItem[]>> {
  const { data } = await api.V2.get<TaxRulesListEnvelope>('/tax-rules', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
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

async function getTaxRuleByUuid(taxRuleUuid: string) {
  const { data } = await api.V2.get<Response<TaxRuleData>>(`/tax-rules/${taxRuleUuid}`);
  return data;
}

// GET /tax-rules/{uuid}/fiscal-defaults (TASK-BE-604) — os 35 campos fiscais
// de UMA Regra Fiscal, para o autofill do formulário de Produto
// (TASK-FE-950, `change` do Select `tax_rule_uuid`). SEM gate de permissão
// (Resource dedicado, `tax-rules_view` não se aplica) — mirror de forma de
// `getTaxRuleByUuid`, endpoint DIFERENTE (`show` completo, 40 campos,
// gateado). NÃO CONFUNDIR os dois.
async function getTaxRuleFiscalDefaults(taxRuleUuid: string) {
  const { data } = await api.V2.get<Response<TaxRuleFiscalDefaultsData>>(
    `/tax-rules/${taxRuleUuid}/fiscal-defaults`
  );
  return data;
}

// Payload SEMPRE completo (create/update, TaxRuleRequest::rules() não
// diferencia por verbo — contrato de API §9/§10).
async function createTaxRule(payload: TaxRulePayload) {
  const { data } = await api.V2.post<Response<TaxRuleData>>('/tax-rules', payload);
  return data;
}

async function updateTaxRule(taxRuleUuid: string, payload: TaxRulePayload) {
  const { data } = await api.V2.put<Response<TaxRuleData>>(`/tax-rules/${taxRuleUuid}`, payload);
  return data;
}

// 204 SEMPRE que o uuid existir — sem guarda de FK (nullOnDelete() físico
// confirmado no contrato de API §2.2).
async function deleteTaxRule(taxRuleUuid: string) {
  const { data } = await api.V2.delete(`/tax-rules/${taxRuleUuid}`);
  return data;
}

// Endpoint ESTÁTICO — fora do bloco farm.context, só auth:sanctum (contrato
// de API §8.1). Nunca depende de farm ativa nem de nenhuma permissão
// tax-rules_*.
async function getTaxRuleOptions() {
  const { data } = await api.V2.get<Response<TaxRuleOptionsData>>('/tax-rules/options');
  return data;
}

// -----------------------------------------------------------------------------
// GET /tax-rules/entity-options (TASK-BE-603, aditivo TASK-FE-941) — lookup
// ENXUTO de ENTIDADE para o `SelectAsyncPaginate` de `tax_rule_uuid`
// (`ProdutoEstoqueFinanceiroTab.tsx`). Mirror de `listCultivationOptions`
// (`cultivation-service.ts`, TASK-FE-942). NÃO CONFUNDIR com
// `getTaxRuleOptions()` acima — aquele é o catálogo ESTÁTICO de 8 enums
// fiscais consumido pelo formulário de Regra Fiscal (TASK-BE-114), este é o
// lookup de REGISTROS reais de `TaxRule` (`{uuid, label}[]`). SEM gate de
// permissão (`tax-rules_view` não se aplica) — tenancy automática via
// `TaxRuleTenantScope` (global scope do Model, isolamento confirmado pelo
// Tester de API). FLAT — `meta` sempre `null`; catálogo pequeno por fazenda
// (máx. observado em produção: 5 linhas) — sem necessidade de
// `FLAT_CATALOG_PAGE_SIZE` (diferente de `listCultivationOptions`, cujo
// catálogo chega a ~31 linhas por fazenda e ultrapassa o `pageSize` padrão
// de 10 do `SelectAsyncPaginate`). NÃO altera `listTaxRules`/
// `getTaxRuleOptions` já existentes — coexistem.
// -----------------------------------------------------------------------------
// `extends PaginationQueryParams` (mirror `ListWarehouseOptionsParams`/
// `ListMeasurementOptionsParams`/`ListAddressingOptionsParams`/
// `ListCultivationOptionsParams`) — sem essa herança, `tsc` recusa a
// atribuição ao prop `service` de `SelectAsyncPaginate` (`PaginationQueryParams`
// "has no properties in common" com um tipo só-`search`, weak-type detection
// do TS). `page`/`per_page` continuam não-lidos no corpo da função (endpoint
// FLAT, sem paginação real) — herança é só para satisfazer o contrato de
// tipo do componente, sem mudança de comportamento em runtime.
export interface ListTaxRuleEntityOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listTaxRuleEntityOptions(
  params: ListTaxRuleEntityOptionsParams
): Promise<ResponsePagination<TaxRuleEntityOption[]>> {
  const { data } = await api.V2.get<TaxRuleEntityOptionsListEnvelope>('/tax-rules/entity-options', {
    search: params.search || undefined,
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
  createTaxRule,
  deleteTaxRule,
  getTaxRuleByUuid,
  getTaxRuleFiscalDefaults,
  getTaxRuleOptions,
  listTaxRuleEntityOptions,
  listTaxRules,
  updateTaxRule,
};
