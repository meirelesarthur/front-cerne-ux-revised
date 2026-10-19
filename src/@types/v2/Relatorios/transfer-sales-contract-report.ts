// src/@types/v2/Relatorios/transfer-sales-contract-report.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Romaneio/Vendas/Contrato" (F-331, 97-Esteiras/008,
// TASK-RVC-FE-01) — tela de filtro + download binário, SEM grid/prévia (as 9
// colunas e os 4 totais são renderizados no servidor, dentro do PDF/XLSX).
//
// `TransferSalesContractReportParams` espelha `TransferSalesContractReportRequest::
// rules()` (`GB.Cerne.Api`) 1:1 — os filtros `client`/`product`/`contract` são
// os nomes CURTOS reais do servidor, NÃO `client_uuid`/`product_uuid`/
// `sale_contract_uuid` (a ponte para as FKs reais é feita 100% do lado
// servidor, `TransferSalesContractReportController::buildFilters()`). Copiar
// os nomes `*_uuid` de `sale-client-report.ts` faz os filtros serem ignorados
// em silêncio pelo servidor — risco documentado na Tarefa (item 2).
//
// `format`/`type` reusam os tipos JÁ EXISTENTES do projeto — nenhum tipo novo
// declarado: `ReportFormat` (`'pdf'|'xlsx'`, `@/@types/v2/AccountsReports`) e
// `TransferType` (`'V'|'C'`, `@/@types/v2/Transfers`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';
import type { TransferType } from '@/@types/v2/Transfers';

/** Forma INTERNA do form (Option-based, react-select). */
export interface TransferSalesContractReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  client: Option<string> | null;
  type: Option<TransferType> | null;
  product: Option<string> | null;
  contract: Option<string> | null;
  format: Option<ReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `TransferSalesContractReportRequest::rules()`. NÃO são `*_uuid`. */
export interface TransferSalesContractReportParams {
  start_date: string;
  end_date: string;
  client?: string;
  type?: TransferType;
  product?: string;
  contract?: string;
  format: ReportFormat;
}
