// src/services/v2/Relatorios/logged-hours-report-service.ts
// -----------------------------------------------------------------------------
// Service do relatório "Horas Logadas" (F-275, esteira 97-Esteiras/012,
// Tarefa 47). Único endpoint `GET /api/v1/logged-hours-report`, 2 saídas por
// `format` (`json` prévia / `pdf` binário inline) — mirror
// `cost-calculation-report-service.ts` (1 arquivo de service por endpoint).
// A função de PDF (`downloadLoggedHoursReportPdf`) fica SEM consumidor até a
// Tarefa 48 (exportação PDF) — não é código morto, é a Tarefa irmã que ainda
// não foi executada nesta esteira.
//
// `api.V2.get(endpoint, params, config)` — query é o 2º posicional, config o
// 3º (`src/services/api.ts:197`, get_spa_api_client_pattern §3).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { LoggedHoursReportData } from '@/@types/v2/Relatorios/loggedHours';

export interface LoggedHoursReportParams {
  start_date: string; // Y-m-d
  end_date: string; // Y-m-d, >= start_date
  tenant_uuid?: string; // só Gestor_Plataf
  farm_uuid?: string; // sub-filtro opcional
}

async function getLoggedHoursReport(
  params: LoggedHoursReportParams
): Promise<LoggedHoursReportData> {
  const { data } = await api.V2.get<{ data: LoggedHoursReportData }>('/logged-hours-report', {
    ...params,
    format: 'json',
  });
  return data.data; // desempacota o envelope ApiResponse (get_spa_api_client_pattern §3)
}

// SEM consumidor nesta Tarefa (47) — a exportação PDF é a Tarefa 48. `format=pdf`
// devolve `Content-Disposition: inline` (contrato de API §6.3); o consumidor
// deve usar `URL.createObjectURL(blob)` + `window.open`, NUNCA `downloadBlob`
// (que forçaria o save) — ver contrato de tela §5.2.
async function downloadLoggedHoursReportPdf(params: LoggedHoursReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/logged-hours-report',
    { ...params, format: 'pdf' },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadLoggedHoursReportPdf, getLoggedHoursReport };
