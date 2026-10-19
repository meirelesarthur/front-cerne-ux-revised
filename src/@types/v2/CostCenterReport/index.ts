// src/@types/v2/CostCenterReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Centro de Custo" (F-247, esteira 97-Esteiras/052,
// TASK-052-247-FE-01). Contrato de tela SELADO (DEC-225) —
// `97-Esteiras/052/ROTEIROS/roteiro-front-F247-centro-custo.md` — mirror
// ESTRUTURAL de `cost-calculation-report-service.ts` (`CostCalculationReportPreview`)
// para o wire `{title,subtitle,columns,rows,kpis,filters}`, com `kpis`/
// `filters` TIPADOS (as 2 telas-irmãs deixam `kpis: unknown` e não
// renderizam — esta é a PRIMEIRA tela do projeto cujo contrato exige
// renderizar os 2 campos, roteiro §"Contrato de tela").
//
// Campos EXATOS de `CostCenterReportRequest` (arquitetura F-247 selada):
//   group        required enum 'C' (Caixa) | 'O' (Competência)
//   start_date   required date
//   end_date     required date (>= start_date)
//   accounts[]   opcional uuid[] tenant-scoped
//   proprietary_id opcional uuid
//   center_id    opcional uuid (centro GLOBAL de tenant nulo OU do tenant)
//   farm_id      opcional uuid tenant-scoped
// `proprietary` (string) é aceito e IGNORADO pelo servidor — NUNCA
// declarado/enviado aqui (fidelidade DEC-225 §7.2).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type CostCenterReportRegime = 'C' | 'O';

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` na
 *  página achata para `CostCenterReportParams` antes de chamar o service. */
export interface CostCenterReportFilterForm {
  group: Option<CostCenterReportRegime> | null;
  start_date: string | null;
  end_date: string | null;
  /** Valores selecionados do `CheckboxListField` (uuid de `accounts`). */
  accounts: string[];
  proprietary_id: Option<string> | null;
  center_id: Option<string> | null;
  farm_id: Option<string> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `CostCenterReportRequest::rules()`. */
export interface CostCenterReportParams {
  group: CostCenterReportRegime;
  start_date: string;
  end_date: string;
  accounts?: string[];
  proprietary_id?: string;
  center_id?: string;
  farm_id?: string;
}

/** Alinhamento por coluna — 1:1 em `textAlign` do `Table.ColumnHeader`/`Table.Cell`. */
export type CostCenterReportColumnAlign = 'start' | 'end' | 'center';

export interface CostCenterReportColumn {
  key: string;
  label: string;
  align: CostCenterReportColumnAlign;
}

export interface CostCenterReportRow {
  /** Já formatadas PT-BR (Money/Percent/Number/Date/Days/Text) pelo
   *  backend — renderizar como texto puro, NUNCA reformatar no cliente. */
  cells: Record<string, string>;
  /** Chaves de `cells` cujo valor é negativo — o cliente só decide a cor. */
  negativeCells?: string[];
  variant: 'normal' | 'group' | 'total';
  /** Nível de indentação hierárquica (agrupamento por Centro de Custo) — ausente = 0. */
  level?: number;
}

export interface CostCenterReportKpi {
  label: string;
  value: string;
  note?: string;
}

export interface CostCenterReportFilterSummary {
  label: string;
  value: string;
}

export interface CostCenterReportPreview {
  title: string;
  subtitle: string;
  columns: CostCenterReportColumn[];
  rows: CostCenterReportRow[];
  kpis: CostCenterReportKpi[];
  filters: CostCenterReportFilterSummary[];
}
