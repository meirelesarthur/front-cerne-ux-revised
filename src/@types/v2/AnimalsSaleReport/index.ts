// src/@types/v2/AnimalsSaleReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Vendas/Animais" (F-227, esteira 97-Esteiras/077,
// CONTRATOS/front/F-227-plano-front.md). Mirror ESTRUTURAL de
// `@/@types/v2/CategoryAnimalReport` (mesma casca de tela download-only, SEM
// grid/prévia) — 3 selects de lookup (`sale_id`/`batch_id`/`client_uuid`)
// TODOS opcionais e SEM cascata entre si (fiel ao legado, `cascatas:
// NAO_APLICAVEL`) + `format` (SEMPRE tem valor default).
//
// `AnimalsSaleReportFormat` é um enum PRÓPRIO deste módulo — NUNCA reusar
// `ReportFormat` de `@/@types/v2/AccountsReports` (domínio 'pdf'|'xlsx'). A
// API (`GET /api/v1/animals-sales-report`) espera EXATAMENTE 'pdf'|'excel'.
//
// `client_uuid` — o contrato do plano de API (F-227-plano-api.md) havia
// registrado `client_id` como INTEIRO (risco 2, AF bloqueante: o único lookup
// de Cliente migrado, `listClientOptions`, só expõe `uuid`). O contrato final
// consumido por este Executor reconcilia essa divergência: o parâmetro real
// é `client_uuid` (UUID), consistente com `listClientOptions`/`ClientOptionItem`
// — a Tarefa do campo `client_uuid` NÃO está mais bloqueada.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type AnimalsSaleReportFormat = 'pdf' | 'excel'; // NUNCA reusar ReportFormat ('xlsx')

export interface AnimalsSaleReportFilterForm {
  sale_id: Option<string> | null;
  batch_id: Option<string> | null;
  client_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  format: Option<AnimalsSaleReportFormat> | null;
}

export interface AnimalsSaleReportParams {
  sale_id?: string; // uuid (movement_sales.uuid)
  batch_id?: string; // uuid (batches.uuid)
  client_uuid?: string; // uuid (clients.uuid) — NUNCA 'client_id'
  start_date?: string;
  end_date?: string;
  report_type: AnimalsSaleReportFormat; // chave EXATA da API — NUNCA 'type'/'format'
}
