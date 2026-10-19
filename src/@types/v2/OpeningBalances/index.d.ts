// src/@types/v2/OpeningBalances/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de ESTOQUE INICIAL (OpeningBalance) — API v1 do backend
// Laravel GB.Cerne. Fundação de dados (TASK-FE-1040, execução 026).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /opening-balances            → data: OpeningBalanceListItem[] + meta (paginação, per_page default 10 — fiel ao legado, NÃO 15)
//   GET    /opening-balances/{uuid}     → data: OpeningBalanceDetail (alias estrutural, mirror Warehouse — show não agrega nada além do index)
//   POST   /opening-balances            → payload OpeningBalancePayload
//   PUT    /opening-balances/{uuid}     → payload OpeningBalancePayload
//   DELETE /opening-balances/{uuid}     → 204; 422 (BusinessRuleException) se estoque atual < quantidade do saldo (RN-8)
//
// PREMISSA DE ENDPOINT (contrato paralelo do gb-cerne-api-architect-v2 ainda
// em fatiamento no momento desta Tarefa): path `/opening-balances`
// (kebab-case, mirror `plan-accounts`/`product-groups`), confirmado contra
// OpeningBalance-contrato.md §3 (APROVADO, ciclo 1) — sem divergência
// pendente. Se o Resource publicado divergir dos campos abaixo, só o
// `service`/estes tipos mudam — nenhuma tela ainda consome (fundação pura).
//
// `date` (sempre NULL, Doc Bruta §6 regra 0) e `lot` (detalhe interno de
// match com `Stock`) NUNCA expostos pelo `OpeningBalanceResource` (contrato
// §9) — NÃO fazem parte destes tipos.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADAS (mirror shape enxuto de outros módulos — uuid+poucos campos)
// ============================================

/** Correção de fidelidade (Maestro, 2026-07-31, pós-`TASK-BE-742`) —
 *  `OpeningBalanceResource.php` real NÃO aninha `code` dentro de `product`
 *  (só `uuid`/`description`/`measurement`) — divergência PRÉ-EXISTENTE desta
 *  Tarefa (fora do escopo de `TASK-FE-1044`, não corrigida aqui: exigiria
 *  mudança no Resource do backend). O campo `code` abaixo permanece
 *  DECLARADO por compatibilidade com o consumo já feito por
 *  `index.tsx` (coluna 1), mas o dev deve confirmar se o backend passa a
 *  emiti-lo ou se a coluna precisa cair para só `description` — sinalizar
 *  como Gap. */
export interface OpeningBalanceProductRef {
  uuid: string;
  code: string;
  description: string;
  /** `TASK-BE-742` (entregue) — unidade de medida aninhada aqui (o Resource
   *  NUNCA teve um campo achatado `measurement_description` na raiz do item;
   *  o tipo anterior estava incorreto). `null` só se a relação
   *  `product.measurement` estiver ausente (defesa do Resource via
   *  ternário — na prática `measurement_uuid` é obrigatório em `Product`). */
  measurement: OpeningBalanceProductMeasurementRef | null;
}

export interface OpeningBalanceProductMeasurementRef {
  uuid: string;
  description: string;
}

export interface OpeningBalanceWarehouseRef {
  uuid: string;
  initials: string;
  description: string;
}

/** ⚠️ CORREÇÃO (Maestro, 2026-07-31): `OpeningBalanceResource.php` real expõe
 *  `cultivation.name` (não `description` — presunção anterior errada, mesma
 *  classe de bug de `measurement_description`). NÃO confundir com
 *  `ProductRefLabel`/`cultivation.description` do módulo de PRODUTOS
 *  (`ProductResource`, endpoint/Resource diferente — aquele está correto). */
export interface OpeningBalanceCultivationRef {
  uuid: string;
  name: string;
}

// ============================================
// OPENING BALANCE (resposta da API)
// ============================================

export interface OpeningBalanceListItem {
  uuid: string;
  /** `TASK-BE-742` (entregue) — gerado via `uniqid()` no
   *  `CreateOpeningBalanceAction`, imutável, chave de correlação com
   *  `Stock`. READ-ONLY — nunca existe input para ele (nem no legado). */
  lot: string;
  product: OpeningBalanceProductRef;
  warehouse: OpeningBalanceWarehouseRef;
  quantity: number;
  amount: number;
  total_amount: number;
  average_cost: number;
  provider_lot: string | null;
  expiration_date: string | null;
  cultivation: OpeningBalanceCultivationRef | null;
  drink: number | null;
  created_at: string;
  updated_at: string;
}

// show === index no shape — alias estrutural, NÃO supertipo com campos extras
// (mirror Warehouse — contrato §1 confirma que `show` do backend não agrega
// nada além do que `index` já retorna).
export type OpeningBalanceDetail = OpeningBalanceListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated) — mirror WarehousesApiPaginationMeta/PlanAccountsApiPaginationMeta
// ============================================

export interface OpeningBalancesApiPaginationMeta {
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

export interface OpeningBalancesListEnvelope {
  success: boolean;
  message: string;
  data: OpeningBalanceListItem[];
  errors: Record<string, string[]> | null;
  meta: OpeningBalancesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

// `farm_id`/`date`/`lot`/`total_amount`/`average_cost` NUNCA no payload —
// calculados/resolvidos no servidor (contrato §1/§6 RN-3).
export interface OpeningBalancePayload {
  product_uuid: string;
  warehouse_uuid: string;
  quantity: number;
  amount: number;
  provider_lot?: string;
  expiration_date?: string;
  cultivation_uuid?: string;
  drink?: number;
}

// ============================================
// FILTRO (drawer da listagem, §5 do contrato de tela — par uuid+label, mirror ProductFilterForm)
// ============================================

export interface OpeningBalanceFilterForm {
  search?: string;
  product_uuid?: string;
  product_label?: string;
  warehouse_uuid?: string;
  warehouse_label?: string;
}

// ============================================
// IMPORT (Excel, §7.2 do contrato de API — mirror EXATO de
// `OpeningBalanceImportResultData.php`, TASK-BE-743. Correção do Executor
// (2026-07-31, TASK-FE-1047): a implementação real emite `{ imported,
// errors }`, NUNCA `created`/`updated` (presunção anterior baseada em
// `PlanAccountImportResult`, que tem shape diferente — import NÃO-atômico
// próprio de OpeningBalance, `errors` embutido no payload de SUCESSO).
// ============================================

export interface OpeningBalanceImportRowError {
  row: number;
  message: string;
}

export interface OpeningBalanceImportResult {
  imported: number;
  errors: OpeningBalanceImportRowError[];
}

// ============================================
// REACT HOOK FORM (TASK-FE-1043, Zonas 1-3 — Identificação / Quantidades &
// Valores / Informações Adicionais + TASK-FE-1044, Zona 4 — Classificação/
// Bebida, condicional a `ProductData.requires_coffee_fields`, TASK-BE-705).
// ============================================

export interface OpeningBalanceForm {
  product_uuid: Option<string> | null;
  warehouse_uuid: Option<string> | null;
  quantity: number | null;
  amount: number | null;
  provider_lot?: string | null;
  expiration_date?: string | null;
  /** Zona 4 (TASK-FE-1044), OPCIONAL — só exibido/enviado quando o produto
   *  selecionado tem `requires_coffee_fields: true`. */
  cultivation_uuid?: Option<string> | null;
  /** Índice persistido (1-21, `drinkIndex`), NUNCA o texto — ver
   *  `constants/cadastrosBase/openingBalance/options/drink-options.ts`. */
  drink?: Option<number> | null;
}
