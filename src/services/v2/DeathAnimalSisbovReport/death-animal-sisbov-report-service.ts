// src/services/v2/DeathAnimalSisbovReport/death-animal-sisbov-report-service.ts
// -----------------------------------------------------------------------------
// Relatório de Mortes/SISBOV (F-253, esteira 97-Esteiras/054,
// TASK-054-253-FE-01). Mirror estrutural EXATO de
// `birth-animal-sisbov-report-service.ts` (irmão F-235) — 1 função de
// download síncrono, resposta BINÁRIA (`application/pdf`),
// `responseType: 'blob'` obrigatório (sem isso o axios corrompe o PDF).
//
// Endpoint: `GET /api/v1/death-animals-sisbovs-report`
// (`DeathAnimalSisbovReportRequest`, roteiro-api-F253-mortes-sisbov.md).
// Envelope `{success,message,data,errors,meta}` NÃO se aplica (mesma
// exceção documentada para controllers de relatório binário).
//
// SÓ PDF — SEM `format`/parâmetro de formato (mirror CLM-011 do backend: o
// endpoint sempre devolve PDF, nunca Excel).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { DeathAnimalSisbovReportParams } from '@/@types/v2/DeathAnimalSisbovReport';

async function downloadDeathAnimalSisbovReport(
  params: DeathAnimalSisbovReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/death-animals-sisbovs-report',
    {
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadDeathAnimalSisbovReport };
