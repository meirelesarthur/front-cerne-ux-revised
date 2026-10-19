// src/@types/v2/RequestPurchaseForecastReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Produtos x Prev. Entrega" (F-309, esteira 97-Esteiras/058,
// TASK-058-F309-FE-01). Contrato de tela SELADO —
// `97-Esteiras/058/PLANOS/FRONT-F309-plano.md` §3/§4 — mirror ESTRUTURAL de
// `@/@types/v2/RequestPurchaseManagementReport` (F-310, pasta dedicada por
// feature, download-only PDF+Excel via 2 rotas, SEM campo "formato" único).
//
// Diferença do irmão F-310: o `/options` combinado aqui devolve `farms`/
// `users`/`authorizers` JÁ como `Option<string>[]` prontos do servidor (NÃO
// `{uuid,description}` cru) e inclui MAIS dois lookups (`users`/`priorities`)
// — mirror `ManejoLote`, sem `RequestPurchaseManagementReportFarmOption`
// intermediário. `product` NÃO faz parte deste bundle: é resolvido à parte
// via `listProductOptions` (`@/services/v2/Products/product-service`,
// endpoint `/products/options`, escopo TENANT) — mirror C3 do contrato
// legado (autocomplete quebrado por `#inp-tenant_id` ausente, corrigido por
// consumir um endpoint tenant-scoped via `X-Farm-Id`, sem input hidden).
//
// Campos EXATOS de `RequestPurchaseForecastReportParams` (plano de API F-309
// §2/§3, contrato legado `RequestPurchaseForecastReportController`):
//   start_date     required date
//   end_date       required date (>= start_date)
//   farm_id        opcional uuid
//   user_id        opcional uuid
//   status         opcional int (RequestPurchaseStatus, backed enum, 0 válido)
//   priority       opcional int (0=Alta/1=Média/2=Baixa, backed enum, 0 válido)
//   authorizer_id  opcional uuid
//   number         opcional string (dígitos, até 14)
//   product        opcional uuid (produto)
//   service        opcional string (LIKE em request_items.description)
//
// Tela DOWNLOAD-ONLY — 2 rotas dedicadas (PDF/Excel), SEM campo "formato"
// (mirror `GerencialSolicitacoes`/`CentroCusto`: 2 endpoints = 2 botões, não
// 1 select condicional).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** `ListRequestPurchaseForecastReportOptionsAction::handle()` — bundle
 *  combinado (farms+users+statuses+priorities+authorizers) já pronto como
 *  `Option<T>[]` do servidor (rótulos = `CASE`/`Enum::label()` do backend,
 *  mesma fonte que alimenta as colunas do PDF — paridade 1:1 de rótulo).
 *  `product` NÃO faz parte deste bundle — ver nota de topo do arquivo. */
export interface RequestPurchaseForecastReportOptionsData {
  farms: Option<string>[];
  users: Option<string>[];
  statuses: Option<number>[];
  priorities: Option<number>[];
  authorizers: Option<string>[];
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `RequestPurchaseForecastReportRequest::rules()`. */
export interface RequestPurchaseForecastReportParams {
  start_date: string;
  end_date: string;
  farm_id?: string;
  user_id?: string;
  status?: number;
  priority?: number;
  authorizer_id?: string;
  number?: string;
  product?: string;
  service?: string;
}

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` na
 *  página achata para `RequestPurchaseForecastReportParams` antes de chamar
 *  o service (mirror `GerencialSolicitacoes`/`ContasAPagar`). */
export interface RequestPurchaseForecastReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  farm_id: Option<string> | null;
  user_id: Option<string> | null;
  status: Option<number> | null;
  priority: Option<number> | null;
  authorizer_id: Option<string> | null;
  number: string | null;
  product: Option<string> | null;
  service: string | null;
}
