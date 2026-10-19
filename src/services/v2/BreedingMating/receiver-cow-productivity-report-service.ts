// src/services/v2/BreedingMating/receiver-cow-productivity-report-service.ts
// -----------------------------------------------------------------------------
// Receiver Cow Productivity Report Service — API v1 do backend Laravel
// GB.Cerne (lote 079, F-307-plano-frontend.md §5 TASK-F307-FE-01). Mirror
// EXATO `reproductive-history-report-service.ts` (mesma pasta de domínio —
// reprodução, mesmo backend-mirror family `BreedingMatingRepositoryInterface`).
//
// `report_type` decide o FORMATO da mesma resposta binária (0/ausente=PDF
// inline, 1=Excel download) — não é filtro de dado (mirror CV-01 do
// contrato legado). Nome do parâmetro PRESERVADO `report_type` (não
// renomeado para `type` como os 2 irmãos mais antigos) — fiel ao contrato
// da API real (`ReceiverCowProductivityReportRequest::rules()`). Resposta
// binária, fora do envelope `ApiResponse` (exceção documentada, mirror
// `dfe-service.ts`).
//
// NOTA DE FIDELIDADE: o param do animal é `animal_id` (não `animal_uuid`) —
// conferido diretamente contra `ReceiverCowProductivityReportRequest::rules()`
// no `api_root` (GB.Cerne.Api), fonte de verdade sobre o roteiro de
// planejamento desta Tarefa, que citava `animal_uuid` (typo/desvio do
// plano — a API real já está ✅ CONCLUÍDA e espera `animal_id`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface ReceiverCowProductivityReportFilterParams {
  animal_id: string;
  start_date: string;
  end_date: string;
  report_type?: 0 | 1; // 0/ausente=PDF inline, 1=Excel download
}

async function downloadReceiverCowProductivityReport(
  params: ReceiverCowProductivityReportFilterParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/receiver-cow-productivity-report',
    { ...params },
    {
      responseType: 'blob',
    }
  );
  return data;
}

export { downloadReceiverCowProductivityReport };
