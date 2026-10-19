// src/services/v2/Relatorios/sale-general-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Vendas/Cliente" (F-317, esteira CORE_WORKSPACE/97-Esteiras/077,
// endpoint-alvo `GET /api/v1/sales-report`) — mirror EXATO de
// `sale-client-report-service.ts` (F-313): 1 função de download síncrono,
// resposta BINÁRIA (PDF ou Excel conforme `report_type`), `responseType:
// 'blob'` obrigatório (sem isso o axios corrompe o binário).
//
// Contrato-alvo confirmado por `F-317-plano-CIRURGICO.md` — SEM envelope
// `{success,message,data,errors,meta}` (mesma exceção documentada nos irmãos
// de relatório binário). Câmera de migração cirúrgica AINDA NÃO executada no
// motor da API (risco 1 do plano de front) — até lá, o endpoint responde no
// motor antigo com `type` (não `report_type`); o service já é materializado
// contra o CONTRATO-ALVO.
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
//
// Nenhuma função de options — `listClientOptions`/`listProductOptions` são
// IMPORTADAS pela TELA, não reescritas aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { SaleGeneralReportParams } from '@/@types/v2/Relatorios/sale-general-report';

async function downloadSaleGeneralReport(params: SaleGeneralReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/sales-report',
    {
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      client_uuid: params.client_uuid || undefined,
      product_uuid: params.product_uuid || undefined,
      report_type: params.report_type,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadSaleGeneralReport };
