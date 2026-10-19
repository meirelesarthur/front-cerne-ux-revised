// src/services/v2/Relatorios/accumulated-depreciation-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Depreciação Acumulada" (Bens/Equipamentos — F-216,
// CONTRATO-F216-depreciacao-acumulada.md §6, TASK-216-API-01/02/03). Endpoint
// ÚNICO (contrato real do Controller — `AccumulatedDepreciationReportController`):
//   GET /equipments-accumulated-depreciation-report (`responseType: 'blob'`)
//
// DIVERGÊNCIA vs. a tela IRMÃ `equipment-inventory-report-service.ts`: NÃO há
// parâmetro `type` (PDF/Excel) neste contrato — o Controller usa
// `GbCerneSnappyReport::download(...)` incondicional, SEMPRE PDF (sem ramo
// Excel na Action/Request). Confirmado por leitura direta de
// `AccumulatedDepreciationReportController.php` +
// `AccumulatedDepreciationReportRequest.php` (GB.Cerne.Api) nesta Tarefa —
// NÃO É PALPITE. Divergência real do contrato, não desvio de padrão.
//
// Os 4 filtros são TODOS OBRIGATÓRIOS no backend (`AccumulatedDepreciationReportRequest::rules()`,
// SEM `nullable`/`sometimes`): `family` (uuid), `status` (1|2), `start_date`,
// `end_date` (`after_or_equal:start_date`).
//
// Envelope `{success,message,data,errors,meta}` NÃO se aplica a este binário —
// mesma exceção documentada de `equipment-inventory-report-service.ts`.
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`);
// `Depreciation`/`Equipment` já são `HasFarmTenantScope` (Controller, doc-bloco).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface AccumulatedDepreciationReportParams {
  family: string;
  status: 1 | 2;
  start_date: string;
  end_date: string;
}

function toQuery(params: AccumulatedDepreciationReportParams) {
  return {
    family: params.family,
    status: params.status,
    start_date: params.start_date,
    end_date: params.end_date,
  };
}

export async function downloadAccumulatedDepreciationReport(
  params: AccumulatedDepreciationReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/equipments-accumulated-depreciation-report',
    toQuery(params),
    { responseType: 'blob' }
  );
  return data;
}
