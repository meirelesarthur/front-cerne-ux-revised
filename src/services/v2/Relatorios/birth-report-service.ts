// src/services/v2/Relatorios/birth-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Nascimentos" GENÉRICO (F-236, `BirthReportController`, esteira
// CORE_WORKSPACE/97-Esteiras/053, TASK-053-236-FE-01) — mirror ESTRUTURAL de
// `management-batch-report-service.ts` (mesma família de relatórios de
// Pecuária com `/options`).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/BirthReportController.php` e
// `routes/api.php:4455-4468` (branch `feature/053-relatorios`):
//   - `GET /api/v1/birth-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.categories`
//     (`CategoryAnimalOptionResource[]`, `{uuid,label,is_reproductive,
//     requires_reproductive_status}`).
//   - `GET /api/v1/birth-report` — binário (PDF inline `a4`/retrato ou xlsx),
//     SEM envelope (mesma exceção documentada em
//     `management-batch-report-service.ts`/`ExpenseReportController`),
//     `responseType:'blob'` obrigatório.
//
// Nomes de query string reais (wire): `start_date`, `end_date`,
// `category_uuid` (NÃO `category` — atenção ao risco de nomenclatura já
// visto no fan-out F-279/F-298), `format`.
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  BirthReportOptionsData,
  BirthReportParams,
} from '@/@types/v2/Relatorios/birth-report';

interface BirthReportOptionsResponse {
  categories: BirthReportOptionsData['categories'];
}

async function getBirthReportOptions(): Promise<BirthReportOptionsData> {
  const { data } = await api.V2.get<Response<BirthReportOptionsResponse>>('/birth-report/options');
  return {
    categories: data.data.categories,
  };
}

async function downloadBirthReport(params: BirthReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/birth-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      category_uuid: params.category_uuid || undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadBirthReport, getBirthReportOptions };
