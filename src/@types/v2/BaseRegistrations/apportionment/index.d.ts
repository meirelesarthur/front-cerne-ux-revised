// src/@types/v2/BaseRegistrations/apportionment/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo APPORTIONMENT ("Rateio - Categoria Financeira") — API v1 do
// backend Laravel GB.Cerne. TASK-AP-FE-01 (fundação — contrato `APROVADO`
// v1.1, camada `api` ainda não implementada/homologada, ver ficha).
//
// Fonte: `01-Arquitetura_e_Contratos/Apportionment-contrato.md ## 4.2/4.3/4.7`.
//
// [RISCO 1 — payload] O DTO (`## 4.2`, `ApportionmentData`) usa
// `financial_category_uuid`/`activity_uuid`/`center_uuid`; o Form Request
// (`## 4.3`, `rules()`) valida literalmente `financial_category_id`/
// `items.*.activity_id`/`items.*.centers.*.center_id` (mesmo sendo
// semanticamente UUID — a Action resolve `uuid→id` internamente). Quem manda
// no formato do PAYLOAD que sai da SPA é o Form Request (é o que o servidor
// de fato valida e o que gera 422 por campo) — não o DTO (detalhe interno do
// backend). Por isso `ApportionmentPayload`/`ApportionmentItemPayload`/
// `ApportionmentItemCenterPayload` usam os nomes literais do Form Request.
// Reconfirmar contra o 422 real do backend quando a camada `api` estiver
// `done` (TASK-AP-FE-05/Tarefa pós-API).
//
// [RISCO 2 — CONFIRMADO, TASK-AP-FE-15] `items[].centers[]` — shape real
// lido diretamente de `ApportionmentItemResource::toArray()`
// (`GB.Cerne.Api/app/Http/Resources/V1/ApportionmentItemResource.php:32-37`):
// cada centro vem FLAT (`{ uuid, description, ha, ha_percentage }`), SEM a
// chave `center` aninhada e SEM `code` (diferente de `financial_category`,
// que É aninhado e TEM `code`, e de `eligible-cost-centers`, que também
// devolve `code`). A suposição anterior de shape aninhado com `code`
// causava o crash `Cannot read properties of undefined (reading 'code')`
// em EDIT — corrigido nesta Tarefa.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// LEITURA (Resource, Apportionment-contrato.md ## 4.7)
// ============================================

export interface ApportionmentFinancialCategoryRef {
  uuid: string;
  code: string;
  description: string;
}

export interface ApportionmentActivityRef {
  uuid: string; // Marker.uuid (atividade produtiva)
  description: string;
}

// Shape FLAT confirmado (ver Risco 2 no cabeçalho) — sem chave `center`
// aninhada, sem `code`.
export interface ApportionmentItemCenterResource {
  uuid: string;
  description: string;
  ha: number;
  ha_percentage: number | null;
}

export interface ApportionmentItemResource {
  activity: ApportionmentActivityRef;
  ha: number;
  percentage: number;
  centers: ApportionmentItemCenterResource[];
}

export interface ApportionmentData {
  uuid: string;
  financial_category: ApportionmentFinancialCategoryRef;
  items: ApportionmentItemResource[];
  total_ha: number;
  total_percentage: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// ESCRITA (Payload, nomes do Form Request — ver Risco 1 no cabeçalho)
// ============================================

export interface ApportionmentItemCenterPayload {
  center_id: string; // uuid — nome literal do Form Request, NÃO center_uuid
  ha: number;
  ha_percentage?: number | null;
}

export interface ApportionmentItemPayload {
  activity_id: string; // uuid — nome literal do Form Request, NÃO activity_uuid
  ha: number;
  percentage: number;
  centers: ApportionmentItemCenterPayload[];
}

export interface ApportionmentPayload {
  financial_category_id: string; // uuid — nome literal do Form Request, NÃO financial_category_uuid
  items: ApportionmentItemPayload[];
}

// ============================================
// FORMULÁRIO (React Hook Form)
// ============================================
// Selects sempre Option<T> (get_pwa_constants_and_mappers_pattern §3), nunca string direta.

export interface ApportionmentItemCenterForm {
  center_uuid: Option<string> | null;
  ha: number | null;
  ha_percentage: number | null;
}

export interface ApportionmentItemForm {
  // activity_uuid NÃO é Option — é lista fixa vinda do servidor
  // (eligible-activities), renderizada como card read-only (mirror Doc Bruta
  // §9, campos #2-5: hidden/readonly).
  activity_uuid: string;
  activity_description: string;
  ha: number; // readonly no form, calculado pelo servidor (Doc Bruta §9 #4)
  percentage: number; // readonly no form, calculado pelo servidor (Doc Bruta §9 #5)
  centers: ApportionmentItemCenterForm[];
}

export interface ApportionmentForm {
  financial_category_uuid: Option<string> | null;
  items: ApportionmentItemForm[];
}

// ============================================
// FILTRO (listagem)
// ============================================

export interface ApportionmentFilterForm {
  search?: string;
}

export interface ApportionmentFilterRequest {
  search?: string;
}

// ============================================
// LEITURAS AUXILIARES (## 3, DA-AP-04/05/06/07 — TASK-AP-FE-05)
// ============================================

/**
 * `GET /apportionments/eligible-activities` (DA-AP-05) — espelho de `Area`
 * agrupado por `activity_id` da fazenda ativa; `ha`/`percentage` calculados
 * sobre o total produtivo da fazenda, idênticos para qualquer `Apportionment`
 * da mesma fazenda (Doc Bruta §6 regra 2).
 */
export interface EligibleActivity {
  activity_uuid: string;
  description: string;
  ha: number;
  percentage: number;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /api/v1/apportionments)
// TASK-AP-FE-05 (service layer) — mirror `CostCentersApiPaginationMeta`/
// `CostCentersListEnvelope` (mesmo grupo de rota `farm.context`, mesma forma
// de paginação padrão Laravel do projeto). SEM MOCK — a forma exata da `meta`
// real só é confirmada quando a camada `api` estiver `done` (ver Risco 2 da
// ficha TASK-AP-FE-05).
// ============================================

export interface ApportionmentsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface ApportionmentsListEnvelope {
  success: boolean;
  message: string;
  data: ApportionmentData[];
  errors: Record<string, string[]> | null;
  meta: ApportionmentsApiPaginationMeta | null;
}
