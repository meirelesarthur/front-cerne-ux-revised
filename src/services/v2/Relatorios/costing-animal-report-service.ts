// src/services/v2/Relatorios/costing-animal-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Custeio/Animal" (F-248, TASK-CA-FE-01, esteira 075). Mirror
// ESTRUTURAL EXATO de `Relatorios/costing-batch-report-service.ts` (1 função
// interna + 2 wrappers) — resposta BINÁRIA (PDF ou Excel conforme `type`),
// `responseType: 'blob'` obrigatório (inclusive erro 422, que chega como
// `Blob` e precisa de `parseBlobError` no `catch` da tela).
//
// `type` vai como STRING (`'pdf'`/`'excel'`) — mirror exato do irmão
// `costing-batch-report-service.ts`, NÃO o índice posicional numérico
// legado (contrato de tela §4, "Riscos" item 3).
//
// `animal` é OBRIGATÓRIO aqui (diferente do `batches?: string[]` opcional do
// irmão) — sempre um único `uuid` de animal.
//
// Endpoint: `GET /api/v1/costing-animal-report` (contrato de tela
// `CusteioAnimal-contrato-front.md` §4, contrato de API
// `CusteioAnimal-contrato-api.md`). Envelope `{success,message,data,errors,
// meta}` NÃO se aplica — mesma exceção documentada para controllers de
// relatório binário (`get_spa_api_client_pattern`, `COMPONENTE-RELATORIOS.md
// §8`).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface CusteioAnimalReportParams {
  animal: string;
  start_date: string;
  end_date: string;
}

async function downloadCusteioAnimalReport(
  params: CusteioAnimalReportParams,
  type: 'pdf' | 'excel'
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/costing-animal-report',
    {
      animal: params.animal,
      start_date: params.start_date,
      end_date: params.end_date,
      type,
    },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadCusteioAnimalReportPdf(params: CusteioAnimalReportParams): Promise<Blob> {
  return downloadCusteioAnimalReport(params, 'pdf');
}

async function downloadCusteioAnimalReportXlsx(params: CusteioAnimalReportParams): Promise<Blob> {
  return downloadCusteioAnimalReport(params, 'excel');
}

export { downloadCusteioAnimalReportPdf, downloadCusteioAnimalReportXlsx };
