// src/services/v2/Relatorios/agriculture-application-management-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Aplicação/Manejo Talhões" (F-220, execução 059,
// `CONTRATO-F220-aplicacao-manejo-talhoes.md`, `AgricultureApplicationManagementReportController`).
// Mirror ESTRUTURAL de `production-costing-area-report-service.ts`
// (adaptação snake_case→camelCase do payload de `/options`) + `stock-abc-
// report-service.ts` (download síncrono por blob, formato PDF/Excel
// escolhido no MESMO endpoint via querystring `format`).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/AgricultureApplicationManagementReportController.php`
// e `routes/api.php:1816-1817`:
//   - `GET /api/v1/agriculture-application-management-report/options` —
//     envelope `{success,message,data,errors,meta}`, `data.production_cycles`/
//     `data.areas`/`data.groups`.
//   - `GET /api/v1/agriculture-application-management-report` — binário
//     (PDF ou Excel conforme `format`), SEM envelope (mesma exceção
//     documentada em `production-costing-area-report-service.ts`/`stock-abc-
//     report-service.ts`), `responseType:'blob'` obrigatório.
//
// Chave do parâmetro na API é `format` (EXATAMENTE 'pdf'|'xlsx', NUNCA
// 'report_type'/'excel' — domínio isolado deste módulo, ver nota de tipos).
// `production_cycle`/`production_cycle_uuid` NUNCA vai no payload (DEC-265 —
// campo morto no `AgricultureApplicationManagementReportFilterData` real,
// diferente de F-298). SEM `farm_id`/`X-Farm-Id` explícito — o client já
// injeta o header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  AgricultureApplicationManagementReportOptionsData,
  AgricultureApplicationManagementReportParams,
} from '@/@types/v2/Relatorios/agriculture-application-management-report';

interface AgricultureApplicationManagementReportOptionsResponse {
  production_cycles: AgricultureApplicationManagementReportOptionsData['productionCycles'];
  areas: AgricultureApplicationManagementReportOptionsData['areas'];
  groups: AgricultureApplicationManagementReportOptionsData['groups'];
}

async function getAgricultureApplicationManagementReportOptions(): Promise<AgricultureApplicationManagementReportOptionsData> {
  const { data } = await api.V2.get<Response<AgricultureApplicationManagementReportOptionsResponse>>(
    '/agriculture-application-management-report/options'
  );
  return {
    productionCycles: data.data.production_cycles,
    areas: data.data.areas,
    groups: data.data.groups,
  };
}

async function downloadAgricultureApplicationManagementReport(
  params: AgricultureApplicationManagementReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/agriculture-application-management-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      area_uuids: params.area_uuids?.length ? params.area_uuids : undefined,
      report_type: params.report_type || undefined,
      group_uuid: params.group_uuid || undefined,
      category_uuid: params.category_uuid || undefined,
      kind_uuid: params.kind_uuid || undefined,
      format: params.format, // chave EXATA do FormRequest da API
    },
    { responseType: 'blob' }
  );
  return data;
}

export {
  downloadAgricultureApplicationManagementReport,
  getAgricultureApplicationManagementReportOptions,
};
