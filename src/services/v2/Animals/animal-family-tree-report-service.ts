// src/services/v2/Animals/animal-family-tree-report-service.ts
// -----------------------------------------------------------------------------
// Animal Family Tree Report Service — API v1 do backend Laravel GB.Cerne
// (esteira 055, F-222, TASK-055-F222-FE-01). Endpoint FLAT
// (`GET /animal-family-tree-report`, permissão `animal-family-tree-report_view`,
// checada de verdade no servidor) — mirror estrutural EXATO de
// `animal-record-report-service.ts::downloadAnimalRecordReport`,
// deliberadamente NÃO estendido em `animal-service.ts` (aquele arquivo tem
// `basePath` `/animals`; misturar quebraria a consistência do arquivo).
//
// Resposta SEMPRE um PDF binário (`Content-Disposition: inline`), fora do
// envelope `ApiResponse` — a árvore genealógica (pedigree) é 100% renderizada
// dentro do PDF pelo backend; este service nunca desenha árvore, apenas
// baixa o blob.
//
// Único parâmetro `animal` (uuid), OBRIGATÓRIO na tela (contrato §2/§4 do
// roteiro-front-F222) — a obrigatoriedade é imposta pelo schema Yup da
// página, não por este service. Sem `farm_id`/`tenant_id` no payload
// (`CL-10`) — `X-Farm-Id` é propagado pelo interceptor genérico do
// `api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface AnimalFamilyTreeReportFilterParams {
  animal: string;
}

async function downloadAnimalFamilyTreeReport(
  params: AnimalFamilyTreeReportFilterParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/animal-family-tree-report',
    { ...params },
    {
      responseType: 'blob',
    }
  );
  return data;
}

export { downloadAnimalFamilyTreeReport };
