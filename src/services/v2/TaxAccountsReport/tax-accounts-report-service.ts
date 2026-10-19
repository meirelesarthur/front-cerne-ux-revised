// src/services/v2/TaxAccountsReport/tax-accounts-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Contas Tributárias" (F-327, esteira 060, ROTEIRO-F327-FRONT.md
// §3.F). Mirror estrutural de `weighing-stock-client-report-service.ts` — 1
// função de download síncrono, resposta BINÁRIA (PDF ou XLSX conforme
// `format`), `responseType: 'blob'` OBRIGATÓRIO (sem isso o axios corrompe
// o binário).
//
// Endpoint: `GET /api/v1/tax-accounts-report` (`TaxAccountsReportRequest::
// rules()`). Envelope `{success,message,data,errors,meta}` NÃO se aplica
// (mesma exceção documentada para controllers de relatório binário,
// `get_laravel_response_exception_pattern §5`).
//
// Chaves EXATAS do FormRequest: `start_date`/`end_date`/`is_taxation`/
// `cost_center`/`provider`/`format` — `cost_center`/`provider` SEM sufixo
// `_uuid` (o VALOR é o uuid, resolvido no backend). `is_taxation` é
// boolean — `undefined` é descartado pelo client (axios/qs), mas `true` E
// `false` são enviados normalmente. SEM `farm_id`/`X-Farm-Id` no payload —
// a fazenda ativa vai pelo header `X-Farm-Id` automático do client
// (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { TaxAccountsReportParams } from '@/@types/v2/TaxAccountsReport';

async function downloadTaxAccountsReport(params: TaxAccountsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/tax-accounts-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      is_taxation: params.is_taxation, // undefined é descartado pelo client; true E false vão
      cost_center: params.cost_center, // uuid ou undefined — chave EXATA do FormRequest (NUNCA cost_center_uuid)
      provider: params.provider, // uuid ou undefined — chave EXATA do FormRequest (NUNCA provider_uuid)
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadTaxAccountsReport };
