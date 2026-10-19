// src/services/v2/Relatorios/animals-per-batch-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Animais por Lote" (Tarefa 51, esteira
// CORE_WORKSPACE/97-Esteiras/015) — mirror ESTRUTURAL de
// `accumulated-weighing-batch-report-service.ts` (Tarefa 49), MAS sem
// `options()` próprio (Riscos #3/#4 do contrato de tela): os 2 lookups
// (Lote/Animal) são reuso total de `listBatchOptionsForForm`
// (`@/services/v2/Batches/batch-service.ts`) e `listAnimalOptions`
// (`@/services/v2/Animals/animal-service.ts`) — nenhum service novo para
// eles.
//
//   - `GET /api/v1/animals-per-batch-report` — PDF (landscape) ou Excel
//     binário conforme `format`, SEM envelope, `responseType:'blob'`
//     obrigatório (erro 422/403 chega também como `Blob` — sempre
//     `parseBlobError`, nunca `extractApiErrorMessage` cru).
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { AnimalsPerBatchReportParams } from '@/@types/v2/Relatorios/animalsPerBatchReport';

async function downloadAnimalsPerBatchReport(params: AnimalsPerBatchReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/animals-per-batch-report',
    {
      batch_id: params.batch_id,
      view_type: params.view_type,
      animal_id: params.animal_id || undefined,
      format: params.format || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadAnimalsPerBatchReport };
