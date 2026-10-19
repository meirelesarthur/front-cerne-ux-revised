// src/@types/v2/TransferClienteReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Romaneio Cliente" (F-332, esteira 97-Esteiras/058,
// TASK-058-F332-FE-01, FRONT-F332-plano.md §3). Mirror estrutural de
// `@/@types/v2/Dre` / `@/@types/v2/AccountsReports` (tela de filtro + download
// binário, SEM grid/prévia) — a MENOR superfície das 6 telas desta esteira (3
// campos), PDF-ONLY (contrato legado §1/§9 CL-11/FID-13 do plano de API —
// NÃO inventar `format`/Excel aqui).
//
// `clients` é SINGLE-select (legado usa 1 cliente por vez, "Todos" = valor
// vazio/omitido) — reuso do MESMO lookup `listClientOptions`
// (`@/services/v2/CadastrosBase/Client/client-service`) já usado em
// `Adiantamento`/`ContasAReceber`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Query params reais enviados a `GET /transfer-cliente-report` — `format` é
 *  sempre o literal `'pdf'` (fixo no service, nunca exposto no form/schema). */
export interface TransferClienteReportParams {
  clients?: string;
  start_date: string;
  end_date: string;
  format: 'pdf';
}

/** Shape RHF — `clients` guarda o `Option<T>` inteiro (mirror
 *  `AdvanceReportFilterForm`), extraído só no `buildParams` do submit. */
export interface TransferClienteReportFilterForm {
  clients: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}
