// src/@types/v2/CategoryAnimalReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Estq. Animais/Categoria" (F-242, esteira
// 97-Esteiras/077, CONTRATOS/front/F-242-plano-front.md). Mirror ESTRUTURAL
// de `@/@types/v2/StockProviderLotReport` (mesma casca de tela download-only,
// SEM grid/prévia) — 3 selects de lookup (`category_uuid`/`batch_uuid`/
// `harvest_uuid`) TODOS opcionais (fiel ao legado CL-04, nenhum filtro
// obrigatório) + `format` (SEMPRE tem valor default).
//
// `CategoryAnimalReportFormat` é um enum PRÓPRIO deste módulo — NUNCA reusar
// `ReportFormat` de `@/@types/v2/AccountsReports` (domínio 'pdf'|'xlsx'). A
// API planejada (`CategoryAnimalReportOutputType`, F-242-plano-api.md §4/§5)
// espera EXATAMENTE 'pdf'|'excel'; enviar 'xlsx' quebraria a request (risco 1
// do plano front).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type CategoryAnimalReportFormat = 'pdf' | 'excel'; // NUNCA reusar ReportFormat ('xlsx')

export interface CategoryAnimalReportFilterForm {
  category_uuid: Option<string> | null;
  batch_uuid: Option<string> | null;
  harvest_uuid: Option<string> | null;
  format: Option<CategoryAnimalReportFormat> | null;
}

export interface CategoryAnimalReportParams {
  category_uuid?: string;
  batch_uuid?: string;
  harvest_uuid?: string;
  report_type: CategoryAnimalReportFormat; // chave EXATA do FormRequest planejado — NUNCA 'format'/'type'
}
