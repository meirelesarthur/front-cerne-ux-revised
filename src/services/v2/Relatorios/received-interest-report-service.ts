// src/services/v2/Relatorios/received-interest-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Juros Recebidos" (esteira 97-Esteiras/014, Tarefa 49). Mirror
// ESTRUTURAL de `receipt-schedule-report-service.ts` — 1 função de download
// síncrono, resposta BINÁRIA (PDF ou Excel conforme `format`),
// `responseType: 'blob'` obrigatório — inclusive erro 422, que chega como
// `Blob` e precisa de `parseBlobError` no `catch`/`onError` da tela.
//
// Endpoint: `GET /api/v1/received-interest-report?format=pdf|xlsx`
// (`api-contract-juros-recebidos.md` §3/§4/§6, `CONTRATO_AUTOAPROVADO`).
// Envelope `{success,message,data,errors,meta}` NÃO se aplica — mesma
// exceção documentada para controllers de relatório binário
// (`get_spa_api_client_pattern §COMPONENTE-RELATORIOS`).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`). `farm_uuid` abaixo
// é um FILTRO EXPLÍCITO do relatório, distinto da fazenda ativa do header.
//
// `proprietary_uuid` (DEC-043, contrato de tela §3/§7): enviado NORMALMENTE
// como qualquer outro filtro — a API o valida mas o ignora deliberadamente
// (`api-contract-juros-recebidos.md §4.3`). Este service NÃO tem
// conhecimento nem tratamento especial desse fato — é responsabilidade
// exclusiva do backend, réplica intencional do legado.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { ReportFormat } from '@/@types/v2/AccountsReports';

export interface ReceivedInterestReportParams {
  client_uuids?: string[];
  proprietary_uuid?: string;
  start_date: string;
  end_date: string;
  farm_uuid?: string;
  format: ReportFormat;
}

async function downloadReceivedInterestReport(params: ReceivedInterestReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/received-interest-report',
    {
      client_uuids: params.client_uuids?.length ? params.client_uuids : undefined,
      proprietary_uuid: params.proprietary_uuid || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      farm_uuid: params.farm_uuid || undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadReceivedInterestReport };
