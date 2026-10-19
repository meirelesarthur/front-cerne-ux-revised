// src/@types/v2/DeathAnimalReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Mortes" (F-254, esteira 97-Esteiras/077,
// CONTRATOS/front/F-254-plano-front.md). Mirror ESTRUTURAL EXATO de
// `@/@types/v2/StockAbcReport` (F-322, mesma esteira) — tela de filtro +
// download binário, SEM grid/prévia, ambas as datas OBRIGATÓRIAS.
//
// `DeathAnimalReportFormat` é um enum PRÓPRIO deste módulo — NUNCA reusar
// `StockAbcReportFormat` (domínio distinto, ainda que os valores coincidam
// 'pdf'|'excel') nem `ReportFormat` de `@/@types/v2/AccountsReports`
// ('pdf'|'xlsx'). A API planejada (`F-254-plano-api.md §4.5`) espera
// EXATAMENTE `report_type: 'pdf'|'excel'`.
//
// `start_date`/`end_date` são AMBAS OBRIGATÓRIAS aqui — diferente do irmão de
// domínio `MortesSisbov`/F-253 (ambas opcionais, SÓ PDF) — fidelidade ao
// próprio legado C-005 (datas `required` no HTML5).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type DeathAnimalReportFormat = 'pdf' | 'excel'; // NUNCA reusar options de outro relatório

export interface DeathAnimalReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  format: Option<DeathAnimalReportFormat> | null;
}

export interface DeathAnimalReportParams {
  start_date: string;
  end_date: string;
  report_type: DeathAnimalReportFormat; // chave EXATA do FormRequest planejado — NUNCA 'format'/'type'
}
