// src/services/v2/IdentificationAnimalSisbovReport/identification-animal-sisbov-report-service.ts
// -----------------------------------------------------------------------------
// Relatório de Identificação/SISBOV (F-270, esteira 97-Esteiras/078,
// TASK-F270-F02, CONTRATOS/F-270-contrato-legado.md). Mirror estrutural de
// `birth-animal-sisbov-report-service.ts` — 1 função de download síncrono,
// resposta BINÁRIA (`application/pdf`), `responseType: 'blob'` obrigatório
// (sem isso o axios corrompe o PDF).
//
// Endpoint: `GET /api/v1/identification-animals-sisbovs-report` — path FLAT
// (mirror exato do irmão `/birth-animals-sisbovs-report`, SEM prefixo
// `reports/`). Envelope `{success,message,data,errors,meta}` NÃO se aplica
// (mesma exceção documentada para controllers de relatório binário).
//
// SÓ PDF — SEM `report_type`/`format`. `start_date`/`end_date` são AMBAS
// OBRIGATÓRIAS (contrato F-270) — diferente do irmão `BirthAnimalSisbovReport`
// (opcionais, DEC-225 §7.3).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { IdentificationAnimalSisbovReportParams } from '@/@types/v2/IdentificationAnimalSisbovReport';

async function downloadIdentificationAnimalSisbovReport(
  params: IdentificationAnimalSisbovReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/identification-animals-sisbovs-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadIdentificationAnimalSisbovReport };
