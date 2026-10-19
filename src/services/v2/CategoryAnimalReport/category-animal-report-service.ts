// src/services/v2/CategoryAnimalReport/category-animal-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Estq. Animais/Categoria" (F-242, esteira 97-Esteiras/077). Mirror
// estrutural de `stock-abc-report-service.ts` — 1 função de download
// síncrono, resposta BINÁRIA (PDF ou Excel conforme `report_type`),
// `responseType: 'blob'` obrigatório (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/category-animal-report` (`category_uuid`/
// `batch_uuid`/`harvest_uuid` TODOS opcionais, `report_type` — enum
// 'pdf'|'excel', default 'pdf'). Envelope `{success,message,data,errors,
// meta}` NÃO se aplica (mesma exceção documentada para controllers de
// relatório binário).
//
// Chave do parâmetro na API é `report_type` — NUNCA 'type'/'format' (risco 1
// do plano front). SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai
// pelo header `X-Farm-Id` automático do client (`get_spa_api_client_pattern
// §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { CategoryAnimalReportParams } from '@/@types/v2/CategoryAnimalReport';

async function downloadCategoryAnimalReport(params: CategoryAnimalReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/category-animal-report',
    {
      category_uuid: params.category_uuid || undefined,
      batch_uuid: params.batch_uuid || undefined,
      harvest_uuid: params.harvest_uuid || undefined,
      report_type: params.report_type, // chave EXATA do FormRequest planejado
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadCategoryAnimalReport };
