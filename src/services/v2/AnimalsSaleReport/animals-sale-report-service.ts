// src/services/v2/AnimalsSaleReport/animals-sale-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Vendas/Animais" (F-227, esteira 97-Esteiras/077). Mirror
// estrutural de `category-animal-report-service.ts` — 1 função de download
// síncrono, resposta BINÁRIA (PDF ou Excel conforme `report_type`),
// `responseType: 'blob'` obrigatório (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/animals-sales-report` (`sale_id`/`batch_id`/
// `client_uuid` TODOS opcionais, `start_date`/`end_date` OPCIONAIS,
// `report_type` — enum 'pdf'|'excel', default 'pdf'). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica (mesma exceção
// documentada para controllers de relatório binário).
//
// Chave do parâmetro de Cliente na API é `client_uuid` — NUNCA 'client_id'
// (o select de Cliente envia o `uuid` do cliente, reusando `listClientOptions`
// já migrado). Chave do formato é `report_type` — NUNCA 'type'/'format'. SEM
// `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { AnimalsSaleReportParams } from '@/@types/v2/AnimalsSaleReport';

async function downloadAnimalsSaleReport(params: AnimalsSaleReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/animals-sales-report',
    {
      sale_id: params.sale_id || undefined,
      batch_id: params.batch_id || undefined,
      client_uuid: params.client_uuid || undefined, // NUNCA 'client_id'
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      report_type: params.report_type, // chave EXATA da API
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadAnimalsSaleReport };
