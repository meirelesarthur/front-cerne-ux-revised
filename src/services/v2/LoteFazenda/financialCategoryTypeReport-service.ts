// src/services/v2/LoteFazenda/financialCategoryTypeReport-service.ts
// -----------------------------------------------------------------------------
// Serviço do relatório de Categorias Financeiras a receber/a pagar
// (ACT-15/16, R-29, 97-Esteiras/041, TASK-FE-041-LF-04) — mirror funcional
// de `charge-report-service.ts` (download SÍNCRONO via blob, `responseType:
// 'blob'`). Endpoint COMPARTILHADO no domínio `FinancialCategory` (já
// migrado) — `GET /api/v1/financial-categories/report?type={1|2}` — NÃO
// pertence ao domínio `TransferBatchFarm`; a tela de Lote/Fazenda só
// consome (ver `plano-api-lote-fazenda.md §2.1`).
//
// NÃO usar/tocar `src/utils/financialCategoryReport.ts` — feature DIFERENTE
// (relatório client-side do CADASTRO de categorias financeiras, TASK-MV-FE-07,
// print via `window.print()`), ver `plano-front-lote-fazenda.md §1.1.
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface FinancialCategoryTypeReportParams {
  /** `1`=Saídas (Despesas/"a pagar"), `2`=Entradas (Receitas/"a receber") — mirror `FinancialCategoryReportRequest::rules()`. */
  type: 1 | 2;
}

async function downloadFinancialCategoryTypeReport(
  params: FinancialCategoryTypeReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/financial-categories/report',
    { type: params.type },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadFinancialCategoryTypeReport };
