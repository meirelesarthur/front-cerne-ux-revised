// src/services/v2/Relatorios/paid-interest-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Juros Pagos" (F-290, TASK-290-FE-01, esteira 073). Mirror
// ESTRUTURAL de `src/services/v2/Dre/dre-report-service.ts` — 1 função de
// download síncrono, resposta BINÁRIA (`application/pdf`),
// `responseType: 'blob'` obrigatório (sem isso o axios corrompe o PDF).
//
// Endpoint: `GET /api/v1/paid-interest-report` (contrato de tela §5.1,
// `F-290-front-contrato-tela.md`). Envelope `{success,message,data,errors,
// meta}` NÃO se aplica (mesma exceção documentada para controllers de
// relatório binário, mirror `dre-report-service.ts`).
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`);
// `farm_uuid` aqui é SÓ o filtro OPCIONAL adicional do formulário (FM-05 do
// legado), nunca um substituto do contexto de fazenda ativa.
//
// Forma interna do form (Option-based, react-select) — documentada aqui
// porque é ESTE service quem recebe a forma já achatada (`PaidInterestReportParams`),
// a extração `.value`/`.map(o=>o.value)` acontece em `buildParams` da página
// (TASK-290-FE-02), nunca dentro deste service:
//   provider_uuids: Option<string>[] | null  →  string[] | undefined
//   proprietary_uuid: Option<string> | null  →  string | undefined
//   farm_uuid: Option<string> | null         →  string | undefined
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface PaidInterestReportParams {
  provider_uuids?: string[];
  proprietary_uuid?: string;
  start_date: string;
  end_date: string;
  farm_uuid?: string;
}

async function downloadPaidInterestReportPdf(params: PaidInterestReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/paid-interest-report',
    {
      provider_uuids: params.provider_uuids?.length ? params.provider_uuids : undefined,
      proprietary_uuid: params.proprietary_uuid || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      farm_uuid: params.farm_uuid || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadPaidInterestReportPdf };
