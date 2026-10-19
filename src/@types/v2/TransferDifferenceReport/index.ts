// src/@types/v2/TransferDifferenceReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Romaneio/Diferença" (Tarefa 49, esteira 97-Esteiras/014,
// feature_id c0b2369d-44ed-4018-bbeb-38b1f7d7c650). Mirror ESTRUTURAL de
// `@/@types/v2/AccountsPayableReceivableReport` (tela de filtro + download
// binário, SEM grid/prévia) — download-only PDF+Excel via campo `format`
// único, `client` SINGLE-select (uuid, opcional, confirmado pelo dono
// `front-architecture-romaneio-diferenca.md` §1.4 — "multiselect" do
// task-packet original foi engano do dono, não do contrato real).
//
// Campos EXATOS de `TransferDifferenceReportRequest` (contrato de API §3):
//   client      opcional uuid (Rule::exists('clients','uuid'))
//   start_date  required date (`dt_shipping >=`)
//   end_date    required date (`dt_shipping <=`, `after_or_equal:start_date`)
//   format      required 'pdf'|'xlsx' (default 'pdf' no form)
//
// `TransferDifferenceReportFormat` reusa o union `ReportFormat` ('pdf'|'xlsx')
// já compartilhado por `@/@types/v2/AccountsReports` — mesmo domínio de
// valores, mesma fábrica de opções `reportFormatOptions` (já reusada fora do
// domínio Financeiro por `Relatorios/Agricultura/PesagensColheita`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export type TransferDifferenceReportFormat = ReportFormat;

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` no
 *  submit achata para `TransferDifferenceReportParams` antes de chamar o
 *  service. `client`/`format` guardam o `Option<T>` inteiro (mirror
 *  `Consolidado`/`ContasAPagar`), extraído só no `buildParams`. */
export interface TransferDifferenceReportFilterForm {
  client: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  format: Option<TransferDifferenceReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `TransferDifferenceReportRequest::rules()`. */
export interface TransferDifferenceReportParams {
  client?: string;
  start_date: string;
  end_date: string;
  format: TransferDifferenceReportFormat;
}
