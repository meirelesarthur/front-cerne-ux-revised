// src/@types/v2/LedgerReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Livro Razão" (F-274, 97-Esteiras/008, TASK-FE-LR-01).
// Contrato de tela `contrato-tela-livro-razao-frontend.md` §2.3/§5.3, matriz
// FID-G3F §7. Mirror ESTRUTURAL de `@/@types/v2/CostCenterReport` para o wire
// `{title,subtitle,columns,rows,kpis,filters}` — o tipo de prévia é PRÓPRIO
// desta tela, NÃO reaproveita `CostCenterReportPreview`.
//
// As 4 diferenças frente a `CostCenterReportPreview` — por isso o tipo é
// PRÓPRIO: `emittedAt` existe aqui e não lá · `subtitle` é `string | null`
// (lá é `string`) · `negativeCells` NÃO existe (`LedgerReportResource` não
// emite) · `level` é obrigatório (lá é opcional).
//
// `negativeCells` não existe → NENHUMA célula é colorida nesta tela, e isso é
// fidelidade (o PDF legado também não colore; o sinal vem no sufixo
// `(D)`/`(C)` já embutido no valor formatado pelo servidor).
//
// Campos EXATOS de `LedgerReportRequest` (contrato de wire, seção 1 da
// Tarefa) — nunca enviar `farm_id`/`tenant_id`/`type`/`id` sequencial.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type LedgerReportCondition = 'S' | 'C';
export type LedgerReportColumnAlign = 'start' | 'end' | 'center';
export type LedgerReportRowVariant = 'normal' | 'group' | 'total';

/** Forma INTERNA do form (react-hook-form / react-select). */
export interface LedgerReportFilterForm {
  account_uuid: Option<string> | null;
  start_date: string | null; // YYYY-MM-DD (DateInput)
  end_date: string | null; // YYYY-MM-DD (DateInput)
  condition: Option<LedgerReportCondition> | null;
  proprietary_uuid: Option<string> | null;
  cost_center_uuid: Option<string> | null;
  plan_account_uuid: Option<string> | null;
  category_uuids: string[]; // uuids do CheckboxListField
}

/** Payload REAL — nomes 1:1 com `LedgerReportRequest::rules()`. */
export interface LedgerReportParams {
  account_uuid: string;
  start_date: string;
  end_date: string;
  condition?: LedgerReportCondition;
  proprietary_uuid?: string;
  cost_center_uuid?: string;
  plan_account_uuid?: string;
  category_uuids?: string[];
}

export interface LedgerReportColumn {
  key: string;
  label: string;
  align: LedgerReportColumnAlign;
}

export interface LedgerReportRow {
  /** JÁ formatadas PT-BR pelo backend — renderizar como texto puro, NUNCA reformatar. */
  cells: Record<string, string>;
  variant: LedgerReportRowVariant;
  /** Nível de indentação hierárquica — servidor SEMPRE emite (default 0) nesta feature. */
  level: number;
}

export interface LedgerReportKpi {
  label: string;
  value: string;
  note: string | null;
}

export interface LedgerReportFilterChip {
  label: string;
  value: string;
}

export interface LedgerReportPreview {
  title: string;
  subtitle: string | null; // SEMPRE null nesta feature
  emittedAt: string; // "d/m/Y - H:i" já formatado pelo servidor
  columns: LedgerReportColumn[];
  rows: LedgerReportRow[];
  kpis: LedgerReportKpi[];
  filters: LedgerReportFilterChip[];
}
