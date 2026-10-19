// src/services/v2/Relatorios/animal-movements-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Movimentação/Rebanho" (F-224, lote 076,
// `AnimalMovementReportController`) — mirror ESTRUTURAL de
// `birth-report-service.ts` (endpoint `/options` + endpoint principal
// binário) combinado com o padrão de 2 funções de download dedicadas
// (`downloadXxxPdf`/`downloadXxxXlsx`, param `format` fixo por função) já
// usado por `feedlot-weighing-performance-report-service.ts`/
// `fiscal-difference-report-service.ts` (lote 076).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/AnimalMovementReportController.php`
// e `routes/api.php` (branch
// `feature/076-relatorios-custeio-ans-fiscal-movrebanho-confinamento`):
//   - `GET /api/v1/animal-movements-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.harvests`
//     (`HarvestOptionResource[]`, `{uuid,label}`).
//   - `GET /api/v1/animal-movements-report` — binário (PDF inline `a4`/
//     paisagem ou xlsx), SEM envelope, `responseType:'blob'` obrigatório.
//
// Nomes de query string reais (wire): `harvest_uuid`, `month` (REPLICAR-
// IGNORAR — enviado quando preenchido, mas nunca lido pela Action, AF-02),
// `format` ('pdf'|'xlsx').
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  AnimalMovementsReportOptionsData,
  AnimalMovementsReportParams,
} from '@/@types/v2/Relatorios/animal-movements-report';

interface AnimalMovementsReportOptionsResponse {
  harvests: AnimalMovementsReportOptionsData['harvests'];
}

async function getAnimalMovementsReportOptions(): Promise<AnimalMovementsReportOptionsData> {
  const { data } = await api.V2.get<Response<AnimalMovementsReportOptionsResponse>>(
    '/animal-movements-report/options'
  );
  return {
    harvests: data.data.harvests,
  };
}

function buildQuery(params: AnimalMovementsReportParams) {
  return {
    harvest_uuid: params.harvest_uuid,
    month: params.month || undefined,
    format: params.format,
  };
}

async function downloadAnimalMovementsReportPdf(
  params: Omit<AnimalMovementsReportParams, 'format'>
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/animal-movements-report',
    buildQuery({ ...params, format: 'pdf' }),
    { responseType: 'blob' }
  );
  return data;
}

async function downloadAnimalMovementsReportXlsx(
  params: Omit<AnimalMovementsReportParams, 'format'>
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/animal-movements-report',
    buildQuery({ ...params, format: 'xlsx' }),
    { responseType: 'blob' }
  );
  return data;
}

export {
  downloadAnimalMovementsReportPdf,
  downloadAnimalMovementsReportXlsx,
  getAnimalMovementsReportOptions,
};
