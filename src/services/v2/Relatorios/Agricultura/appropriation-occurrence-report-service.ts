// src/services/v2/Relatorios/Agricultura/appropriation-occurrence-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Ocorrências Talhões" (F-232, Tarefa 50, esteira
// CORE_WORKSPACE/97-Esteiras/015) — mirror ESTRUTURAL de
// `accumulated-weighing-batch-report-service.ts` (endpoint `options` PRÓPRIO +
// endpoint de download `responseType:'blob'`), com 2 divergências
// (frontend-contract-ocorrencias-talhoes.md §5):
//
//   - `GET /api/v1/appropriation-occurrences-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.areas`/
//     `data.production_cycles` (`AreaOptionResource`/
//     `ProductionCycleOptionResource`, este último já com `areas[]`
//     aninhado — SEM query extra para a cascata).
//   - `GET /api/v1/appropriation-occurrences-report` — SEMPRE
//     `application/pdf` (SEM campo `format`/branch Excel), `responseType:
//     'blob'` obrigatório (inclusive erro 422/403).
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  AppropriationOccurrenceReportOptionsData,
  AppropriationOccurrenceReportParams,
} from '@/@types/v2/Relatorios/Agricultura/appropriationOccurrenceReport';

interface AppropriationOccurrenceReportOptionsResponse {
  areas: AppropriationOccurrenceReportOptionsData['areas'];
  production_cycles: AppropriationOccurrenceReportOptionsData['productionCycles'];
}

async function getAppropriationOccurrenceReportOptions(): Promise<AppropriationOccurrenceReportOptionsData> {
  const { data } = await api.V2.get<Response<AppropriationOccurrenceReportOptionsResponse>>(
    '/appropriation-occurrences-report/options'
  );
  return { areas: data.data.areas, productionCycles: data.data.production_cycles };
}

async function downloadAppropriationOccurrenceReport(
  params: AppropriationOccurrenceReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/appropriation-occurrences-report',
    {
      // Enviado NORMALMENTE (risco 3, DEC-043-style) — aceito e ignorado
      // server-side, NUNCA omitido do payload.
      production_cycle_uuid: params.production_cycle_uuid || undefined,
      area_uuids: params.area_uuids?.length ? params.area_uuids : undefined,
      start_date: params.start_date,
      end_date: params.end_date,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadAppropriationOccurrenceReport, getAppropriationOccurrenceReportOptions };
