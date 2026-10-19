// src/services/v2/ImportExport/import-export-service.ts
// -----------------------------------------------------------------------------
// Import/Export Service — API v1 do backend Laravel GB.Cerne (planilha .xlsx),
// esteira 036, Onda 3 sub-onda 3e (B-08). Módulo COMPARTILHADO entre Contas a
// Pagar (Expense, `segment: 'expenses'`) e Contas a Receber (Income, `segment:
// 'incomes'`) — mesmo racional de `services/v2/WriteOff/writeoff-service.ts`
// (parametrizado por segmento, NÃO duplicado por módulo).
//
// Contrato (envelope ApiResponse só no import; download/export são binários):
//   GET  /{segment}/download → binário .xlsx (modelo/template em branco).
//   GET  /{segment}/export   → binário .xlsx (dados reais do tenant ativo,
//        filtrados pelos MESMOS query params da listagem — `params` repassado
//        cru, mirror `listExpenses`/`listIncomes`, sem paginação).
//   POST /{segment}/import   → multipart, campo `file` → envelope
//        `Response<ImportExportResult>` (sucesso parcial: `imported` +
//        `errors[]`, nunca 422 abort-all).
//
// `responseType: 'blob'` — exceção ao envelope ApiResponse (resposta binária),
// mesmo padrão já usado por `downloadPlanAccountImportTemplate`/
// `exportPlanAccounts` (`plan-account-service.ts`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { ImportExportResult, ImportExportSegment } from '@/@types/v2/ImportExport';

async function downloadImportTemplate(segment: ImportExportSegment): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/${segment}/download`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// `filterParams` repassa os MESMOS filtros da grid atual (mirror do objeto
// já enviado por `listExpenses`/`listIncomes` — mesmos nomes de campo, sem
// `page`/`per_page`/`orderBy`); valores `null`/`undefined`/`''` são
// descartados aqui, nunca enviados como query string vazia.
async function exportData(
  segment: ImportExportSegment,
  filterParams?: Record<string, unknown>
): Promise<Blob> {
  const params = filterParams
    ? Object.keys(filterParams).reduce(
        (acc, key) => {
          const value = filterParams[key];
          if (value !== null && value !== undefined && value !== '') {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>
      )
    : undefined;

  const { data } = await api.V2.get<Blob>(`/${segment}/export`, params, {
    responseType: 'blob',
  });
  return data;
}

async function importFile(
  segment: ImportExportSegment,
  file: File
): Promise<Response<ImportExportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<ImportExportResult>>(`/${segment}/import`, fd);
  return data;
}

export { downloadImportTemplate, exportData, importFile };
