// src/services/v2/Relatorios/herd-composition-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Composição Rebanho" (F-269, lote 079, `HerdCompositionReportController`,
// F-269-plano-frontend.md §6 TASK-F269-FE-01) — mirror ESTRUTURAL de
// `nutrition-consumption-report-service.ts` (F-288).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/HerdCompositionReportController.php`
// e `routes/api.php:1946-1949`:
//   - `GET /api/v1/herd-composition-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.batches`/`data.breeds`/
//     `data.categories` (`BatchOptionResource`/`BreedOptionResource`/
//     `CategoryAnimalOptionResource`, todos com `{uuid,label}`).
//   - `GET /api/v1/herd-composition-report` — binário (`application/pdf`
//     inline OU `.xlsx` conforme `report_type`), SEM envelope (mesma exceção
//     documentada em `death-animal-report-service.ts`), `responseType:'blob'`
//     obrigatório.
//
// Parâmetro de nome EXATO confirmado contra
// `HerdCompositionReportRequest::rules()` (NÃO os nomes assumidos no plano):
// `batch` (não `batch_id`), `breed_uuid` (não `breed_id`), `category_uuid`
// (não `category_id`), `report_type` (não `type_report`/`format`).
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  HerdCompositionReportOptionsData,
  HerdCompositionReportParams,
} from '@/@types/v2/Relatorios/herd-composition-report';

interface HerdCompositionReportOptionsResponse {
  batches: HerdCompositionReportOptionsData['batches'];
  breeds: HerdCompositionReportOptionsData['breeds'];
  categories: HerdCompositionReportOptionsData['categories'];
}

async function getHerdCompositionReportOptions(): Promise<HerdCompositionReportOptionsData> {
  const { data } = await api.V2.get<Response<HerdCompositionReportOptionsResponse>>(
    '/herd-composition-report/options'
  );
  return {
    batches: data.data.batches,
    breeds: data.data.breeds,
    categories: data.data.categories,
  };
}

async function downloadHerdCompositionReport(params: HerdCompositionReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/herd-composition-report',
    {
      batch: params.batch || undefined,
      gender: params.gender || undefined,
      breed_uuid: params.breed_uuid || undefined,
      category_uuid: params.category_uuid || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      weight_min: params.weight_min ?? undefined,
      weight_max: params.weight_max ?? undefined,
      status: params.status || undefined,
      columns: params.columns,
      order: params.order || undefined,
      order_direction: params.order_direction || undefined,
      report_type: params.report_type || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadHerdCompositionReport, getHerdCompositionReportOptions };
