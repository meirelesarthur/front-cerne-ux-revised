// src/services/v2/DeathAnimalReport/death-animal-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Mortes" (F-254, esteira 97-Esteiras/077). Mirror estrutural de
// `stock-abc-report-service.ts` (F-322, mesma esteira) — 1 função de download
// síncrono, resposta BINÁRIA (PDF ou Excel conforme `report_type`),
// `responseType: 'blob'` obrigatório (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/death-animals-report` (start_date, end_date,
// report_type — enum 'pdf'|'excel', default 'pdf'). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica (mesma exceção
// documentada para controllers de relatório binário).
//
// Chave do parâmetro na API é `report_type` — NUNCA 'type'/'format' (risco 1
// do plano front). SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai
// pelo header `X-Farm-Id` automático do client (`get_spa_api_client_pattern
// §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { DeathAnimalReportParams } from '@/@types/v2/DeathAnimalReport';

async function downloadDeathAnimalReport(params: DeathAnimalReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/death-animals-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      report_type: params.report_type, // chave EXATA do FormRequest planejado
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadDeathAnimalReport };
