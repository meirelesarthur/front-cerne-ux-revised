// src/@types/v2/NfeProductReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Faturamento" (F-286, esteira 97-Esteiras/054,
// TASK-054-286-FE-01). Mirror estrutural de `@/@types/v2/MachinesReport` —
// tela de filtro + download binário (PDF+Excel), SEM grid/prévia.
//
// Contrato servidor (`NfeProductReportRequest`, roteiro-api-F286-faturamento
// §3/§4):
//   start_date / end_date   required, date; end_date >= start_date (ÚNICOS
//                           2 campos obrigatórios)
//   client_ids[]            sometimes, array (uuid)
//   farm_ids[]              sometimes, array (uuid) — filtro de ESTREITAMENTO
//   product_ids[]           sometimes, array (uuid)
//   issuer_id               sometimes, uuid
//   type                    nullable int 0|1 (default servidor 0=PDF)
//
// D-FE-01 (roteiro-front-F286 §2) — SEM `columns[]`: as 16 colunas do
// relatório são fixas no ViewModel bespoke do backend
// (`NfeProductReportRowData`), nunca configuráveis pelo front.
// D-FE-02 (roteiro-front-F286 §2) — `NfeProductReportType` é um domínio
// PRÓPRIO (`0 | 1`), NUNCA reusar `ReportFormat` (`'pdf' | 'xlsx'`, domínio
// de string dos relatórios de Contas/Máquinas) — os dois domínios são
// incompatíveis.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Domínio PRÓPRIO (D-FE-02) — NUNCA reusar `ReportFormat` ('pdf'|'xlsx').
 *  Mirror `NfeProductReportRequest.type` (Rule::in([0,1]), default 0). */
export type NfeProductReportType = 0 | 1; // 0=PDF, 1=Excel

export interface NfeProductReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  client_ids: string[];
  farm_ids: string[];
  product_ids: string[];
  issuer_id: Option<string> | null;
  type: Option<NfeProductReportType> | null;
}

export interface NfeProductReportParams {
  start_date: string;
  end_date: string;
  client_ids?: string[];
  farm_ids?: string[];
  product_ids?: string[];
  issuer_id?: string;
  type?: NfeProductReportType;
}
