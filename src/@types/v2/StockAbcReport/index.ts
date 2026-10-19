// src/@types/v2/StockAbcReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Curva ABC/Estoque" (F-322, esteira 97-Esteiras/077,
// CONTRATOS/front/F-322-plano-front.md). Mirror ESTRUTURAL DUPLO de
// `@/@types/v2/StockProviderLotReport` (mesma casca de tela download-only,
// SEM grid/prévia) + `@/@types/v2/Relatorios` (`StockMovementReportParams`,
// domínio Stock) para o padrão de datas OBRIGATÓRIAS.
//
// `StockAbcReportFormat` é um enum PRÓPRIO deste módulo — NUNCA reusar
// `ReportFormat` de `@/@types/v2/AccountsReports` (domínio 'pdf'|'xlsx'). A
// API de F-322 (`StockAbcReportOutputType`) espera EXATAMENTE 'pdf'|'excel';
// enviar 'xlsx' quebraria a request (risco 1 do plano front).
//
// `start_date`/`end_date` são AMBAS OBRIGATÓRIAS aqui (diferente do mirror
// visual `StockProviderLotReportFilterForm`, que as tem decorativas/opcionais)
// — fidelidade ao legado (`00-CONSOLIDADO.md` item 2, checklist item 5).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type StockAbcReportFormat = 'pdf' | 'excel'; // NUNCA reusar ReportFormat ('xlsx')

export interface StockAbcReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  format: Option<StockAbcReportFormat> | null;
}

export interface StockAbcReportParams {
  start_date: string;
  end_date: string;
  report_type: StockAbcReportFormat; // chave EXATA do FormRequest da API — NUNCA 'format'/'type'
}
