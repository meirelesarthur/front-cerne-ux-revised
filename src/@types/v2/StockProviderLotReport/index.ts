// src/@types/v2/StockProviderLotReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Lote/Fornecedor" (F-324, esteira 97-Esteiras/052,
// TASK-052-324-FE-01). Mirror estrutural de `@/@types/v2/BirthAnimalSisbovReport`
// — tela de filtro + download binário, SEM grid/prévia. Diferente da
// irmã Nascimentos/SISBOV, esta tela TEM `format` (PDF+Excel, DEC-225,
// `ReportFormat` REUSADO de `@/@types/v2/AccountsReports` — nenhum tipo
// próprio de formato, mirror `Vendas`/`Vendas/index.tsx` mas aqui o domínio
// É `'pdf'|'xlsx'`, então o reuso é literal).
//
// `provider_uuid` é o ÚNICO campo obrigatório (`StockProviderLotReportRequest`,
// tenant via pivot `provider_tenant`, fidelidade adjudicada DEC-225).
// `start_date`/`end_date` são DECORATIVOS — só rotulam o cabeçalho do PDF,
// NÃO filtram linhas (CLM-010/DIV-001) — mas continuam validados
// `end_date >= start_date` quando ambas preenchidas (contrato de tela,
// coluna "Regra servidor" de `end_date`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export interface StockProviderLotReportFilterForm {
  provider_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  format: Option<ReportFormat> | null;
}

export interface StockProviderLotReportParams {
  provider_uuid: string;
  start_date?: string;
  end_date?: string;
  format: ReportFormat;
}
