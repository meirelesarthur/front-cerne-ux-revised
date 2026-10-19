// src/services/v2/WeighingHarvestReport/weighing-harvest-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Pesagens/Colheita" (F-335, execução 053, roteiro-front-F335-
// pesagens-colheita.md §4, TASK-053-335-FE-01). Mirror estrutural de
// `stock-provider-lot-report-service.ts` — 1 função de download síncrono,
// resposta BINÁRIA (PDF ou Excel conforme `format`), `responseType: 'blob'`
// obrigatório (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/weighing-harvest-report`
// (`WeighingHarvestReportController`/`WeighingHarvestReportRequest`, branch
// `feature/053-relatorios`). Envelope `{success,message,data,errors,meta}`
// NÃO se aplica (mesma exceção documentada para controllers de relatório
// binário).
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`).
//
// `getAreasOptions()` — NOVA local desta feature, mirror EXATO de
// `harvestProduct-service.ts::getAreasOptions` (`GET /areas/options`, FLAT
// `ApiResponse::success`, SEM paginação, Select LOCAL não-AJAX). NÃO cria um
// service compartilhado de Área — `areas-service.ts` existente
// (`listAreas`/`validateAreaInsert`) exige `farm_uuid` explícito e serve
// outro fluxo (mapa de piquete); esta tela usa a mesma convenção de function
// local já em produção (Lei 3/7, "nenhuma chamada Axios fora do arquivo do
// domínio"). Reusa o tipo `AreaOptionItem` já declarado em
// `@/@types/v2/HarvestProduct` (mesmo shape do endpoint `/areas/options`) —
// sem duplicar a interface.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { AreaOptionItem } from '@/@types/v2/HarvestProduct';
import type { WeighingHarvestReportParams } from '@/@types/v2/WeighingHarvestReport';

interface FlatOptionsEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
}

async function downloadWeighingHarvestReport(params: WeighingHarvestReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/weighing-harvest-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      product_uuid: params.product_uuid || undefined,
      area_uuid: params.area_uuid || undefined,
      warehouse_uuid: params.warehouse_uuid || undefined,
      client_uuid: params.client_uuid || undefined,
      type: params.type ?? undefined,
      format: params.format || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

// `areas/options` — FLAT (`ApiResponse::success`), Select LOCAL (não AJAX),
// mirror EXATO de `harvestProduct-service.ts::getAreasOptions`.
// PLANO-FIX AUDIT-FILTROS-RELATORIOS §2.6/§3 F-335 — `include_disabled=true`
// (opt-in, default OFF) espelha o `list()` paginado, que já lista áreas
// desabilitadas; o legado deste relatório lista TODAS (não só habilitadas).
async function getAreasOptions(): Promise<AreaOptionItem[]> {
  const { data } = await api.V2.get<FlatOptionsEnvelope<AreaOptionItem>>('/areas/options', {
    include_disabled: true,
  });
  return data.data;
}

export { downloadWeighingHarvestReport, getAreasOptions };
