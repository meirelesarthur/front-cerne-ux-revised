// src/services/v2/BreedingMating/pregnant-cows-report-service.ts
// -----------------------------------------------------------------------------
// Pregnant Cows Report Service — API v1 do backend Laravel GB.Cerne (Tarefa 46,
// frontend-contract-vacas-prenhas.md §5). Endpoint FLAT
// (`GET /pregnant-cows-report`, permissão `pregnancy-diagnosis_view`,
// `GAP-VACAS-01`) — deliberadamente NÃO estendido em
// `pregnancy-diagnosis-service.ts` (todas as funções daquele arquivo são
// ANINHADAS sob `/breeding-matings/{uuid}/pregnancy-diagnoses`, `basePath`
// próprio; misturar quebraria a consistência do arquivo).
//
// `type` decide o FORMATO da mesma resposta binária (0=PDF inline,
// 1=Excel download) — não é filtro de dado. Mirror estrutural
// `dfe-service.ts::listDfesForReport` (`responseType: 'blob'`, retorno cru de
// `Blob`, fora do envelope `ApiResponse`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface PregnantCowsReportFilterParams {
  start_date: string;
  end_date: string;
  insemination_type?: number; // BreedingMatingTypeValue (1|2|3)
  batch_uuid?: string;
  animal_uuid?: string;
  diagnosis_pregnancy_uuid?: string;
  type: 0 | 1; // 0=PDF inline, 1=Excel download
}

async function downloadPregnantCowsReport(params: PregnantCowsReportFilterParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/pregnant-cows-report',
    { ...params },
    {
      responseType: 'blob',
    }
  );
  return data;
}

export { downloadPregnantCowsReport };
