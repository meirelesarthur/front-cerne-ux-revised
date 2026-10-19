// src/services/v2/BirthAnimalSisbovReport/birth-animal-sisbov-report-service.ts
// -----------------------------------------------------------------------------
// Relatório de Nascimentos/SISBOV (F-235, esteira 97-Esteiras/052,
// TASK-052-235-FE-01). Mirror estrutural de `dre-report-service.ts` — 1
// função de download síncrono, resposta BINÁRIA (`application/pdf`),
// `responseType: 'blob'` obrigatório (sem isso o axios corrompe o PDF).
//
// Endpoint: `GET /api/v1/birth-animals-sisbovs-report`
// (`BirthAnimalSisbovReportRequest`, roteiro-arquitetura-F235-nascimentos-
// sisbov.md). Envelope `{success,message,data,errors,meta}` NÃO se aplica
// (mesma exceção documentada para controllers de relatório binário).
//
// SÓ PDF — SEM `format`/parâmetro de formato (diferente de
// `ExpenseReportParams`/`ReceiptsReportParams`): o endpoint sempre devolve
// PDF, nunca Excel. O PDF pode vir VAZIO (200 com corpo pequeno) — isso é
// FIEL (DEC-225), o service só resolve o `Blob`, nunca interpreta corpo
// vazio como falha.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { BirthAnimalSisbovReportParams } from '@/@types/v2/BirthAnimalSisbovReport';

async function downloadBirthAnimalSisbovReport(
  params: BirthAnimalSisbovReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/birth-animals-sisbovs-report',
    {
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadBirthAnimalSisbovReport };
