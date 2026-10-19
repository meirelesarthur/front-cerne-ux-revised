// src/@types/v2/NfeReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "NFe/Emitidas" (F-287, esteira 97-Esteiras/079,
// TASK-F287-FE-01). Mirror ESTRUTURAL de `@/@types/v2/NfeProductReport` —
// tela de filtro + download binário (PDF+Excel), SEM grid/prévia.
//
// Contrato servidor (`NfeReportRequest`, F-287-plano-api-database §3):
//   start_date / end_date   required, date; end_date >= start_date (ÚNICOS
//                           2 campos obrigatórios, C13/FLD-01/FLD-02)
//   status                  sometimes, in(novo|aprovado|cancelado|rejeitado)
//   client_ids[]            sometimes, array (uuid)
//   farm_ids[]              sometimes, array (uuid)
//   center_ids[]            sometimes, array (uuid)
//   issuer_id               sometimes, uuid
//   provider_id             sometimes, uuid
//   format                  nullable 'pdf'|'xlsx' (default servidor 'pdf')
//
// D-FE-02 (F-287-plano-frontend §5) — domínio `format` é STRING PRÓPRIO
// ('pdf'|'xlsx', fábrica `nfeReportFormatOptions`), NUNCA reusar
// `NfeProductReportType` (domínio `0|1` de F-286, D-FE-02 do próprio F-286
// já proíbe o inverso).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { NfeEstado } from '@/@types/v2/Nfes';

/** Domínio PRÓPRIO do módulo (mirror `report-format-options.ts` — 'pdf'|'xlsx'
 *  string, NUNCA `NfeProductReportType` 0|1 de F-286). */
export type NfeReportFormat = 'pdf' | 'xlsx';

export interface NfeReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  status: Option<NfeEstado> | null;
  client_ids: string[];
  farm_ids: string[];
  center_ids: string[];
  issuer_id: Option<string> | null;
  provider_id: Option<string> | null;
  format: Option<NfeReportFormat> | null;
}

export interface NfeReportParams {
  start_date: string;
  end_date: string;
  status?: NfeEstado;
  client_ids?: string[];
  farm_ids?: string[];
  center_ids?: string[];
  issuer_id?: string;
  provider_id?: string;
  format?: NfeReportFormat;
}
