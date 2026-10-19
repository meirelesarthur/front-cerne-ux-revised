// src/@types/v2/FiscalDifferenceReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Fiscal/Não Fiscal" (F-266, lote 076,
// `FiscalDifferenceReport-contrato.md` §4.2/§4.5, TASK-FDR-02). Mirror
// ESTRUTURAL de `@/@types/v2/CashFlowByCategoryReport` (mesma casca
// FormContainer/download-only, sem grid/prévia), MAS 2 botões PDF/Excel
// (mirror `CusteioAnimalReportParams`) em vez de campo `format` único —
// `format` some do payload interno e vira parâmetro de FUNÇÃO do service.
//
// Campos EXATOS de `FiscalDifferenceReportRequest::rules()` (API real, lida
// diretamente, `app/Http/Requests/Api/V1/FiscalDifferenceReportRequest.php`):
//   accounts[]    opcional uuid[] tenant-scoped
//   proprietary   opcional uuid (SEM `_id` no nome — divergente de outros
//                 relatórios do domínio, confirmado por leitura direta)
//   start_date    required date
//   end_date      required date (after_or_equal:start_date)
//   center_id     opcional uuid (centro GLOBAL de tenant nulo OU do tenant)
//   categories[]  opcional uuid[] tenant-scoped
//   is_fiscal     opcional 'in:0,1' — AUSENTE = Ambos (C-09 do contrato)
//   condition     opcional 'in:S,C' — default servidor 'S' (Sem Categoria)
//   format        required 'pdf' | 'xlsx' — decidido por BOTÃO, não por
//                 campo do form (mirror `CusteioAnimalReportParams`)
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** `'ambos'` é um valor SÓ DE UI (nunca vai ao servidor) — `buildParams` da
 *  tela converte para `undefined` no payload real (C-09, ausência = Ambos). */
export type FiscalDifferenceReportIsFiscal = 'ambos' | '0' | '1';

/** `'S'` Sem Categoria (default servidor) / `'C'` Com Categoria — 3 colunas
 *  extras + explosão de linha por pivot quando `'C'` (contrato §4.3). */
export type FiscalDifferenceReportCondition = 'S' | 'C';

export type FiscalDifferenceReportFormat = 'pdf' | 'xlsx';

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` na
 *  página achata para `FiscalDifferenceReportParams` antes de chamar o
 *  service. `is_fiscal`/`condition` guardam o `Option<T>` inteiro (mirror
 *  `report_type`/`last_balance` de `CashFlowByCategoryReportFilterForm`),
 *  extraídos só no `buildParams` do submit. */
export interface FiscalDifferenceReportFilterForm {
  /** Valores selecionados do `CheckboxListField` (uuid de `accounts`). */
  accounts: string[];
  proprietary: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  center_id: Option<string> | null;
  /** Valores selecionados do `CheckboxListField` (uuid de `categories`). */
  categories: string[];
  is_fiscal: Option<FiscalDifferenceReportIsFiscal> | null;
  condition: Option<FiscalDifferenceReportCondition> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `FiscalDifferenceReportRequest::rules()`. SEM `format` (parâmetro de
 *  função do service, decidido pelo botão clicado). */
export interface FiscalDifferenceReportParams {
  accounts?: string[];
  proprietary?: string;
  start_date: string;
  end_date: string;
  center_id?: string;
  categories?: string[];
  is_fiscal?: '0' | '1';
  condition: FiscalDifferenceReportCondition;
}
