// src/@types/v2/Relatorios/total-cost-of-reproduction-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Custo Total de Reprodução" (F-328, esteira
// CORE_WORKSPACE/97-Esteiras/008, TASK-FE-CTR-01) — tela "gerar e sair", SEM
// grid on-screen (a tabela é renderizada pelo Blade do servidor, `CL-15`),
// SEM query de opções (o único select é estático, `reportFormatOptions`).
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api` @ `feature/076-custo-romaneio-livro-razao-for-api`):
//   - `TotalCostOfReproductionReportRequest.php:30-37` (`rules()`)
//   - `TotalCostOfReproductionReportFilterData.php`
//   - `TotalCostOfReproductionReportController.php:45-81`
//   - `routes/api.php:1453-1454`
//
// `format` reusa o catálogo GLOBAL `ReportFormat` de
// `@/@types/v2/AccountsReports` (mirror `NutricaoConsumoLote` — nunca índice
// de array, nunca tipo de formato próprio por domínio).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export interface TotalCostOfReproductionReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  format: Option<ReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `TotalCostOfReproductionReportRequest::rules()`. */
export interface TotalCostOfReproductionReportParams {
  start_date: string;
  end_date: string;
  format: ReportFormat;
}
