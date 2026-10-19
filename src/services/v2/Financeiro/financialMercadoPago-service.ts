// src/services/v2/Financeiro/financialMercadoPago-service.ts
// Financial Mercado Pago Service — API v1 do backend Laravel GB.Cerne. SEM
// `X-Farm-Id` (endpoint SaaS-admin, is_farm:false no legado, contrato de API
// §1) — mirror `diagnosisPregnancy-service.ts` / `headband-service.ts` /
// `tiers-service.ts`: o interceptor de request de `@/services/api.ts`
// injeta o header `X-Farm-Id` INCONDICIONALMENTE sempre que há fazenda ativa
// no `localStorage`, sem saber se a rota é ou não farm-scoped; quem garante
// a irrelevância do header aqui é o backend (is_farm:false, contrato de API
// §1, já confirmado). Nenhum client HTTP novo, nenhum "adminApi" separado,
// nenhuma lógica condicional neste service por causa disso.
//
// Placeholder: o backend sempre retorna `data: []`/`meta.total: 0` até o
// domínio de billing ser migrado (contrato de API §0/§6) — não é bug, não é
// mock; é o estado real e correto do sistema hoje. `per_page` sempre
// enviado, default 10 (contrato de API §2 — diverge do legado, que usava
// 20; decisão do dono documentada no contrato, não é para "corrigir de volta").

import api from '@/services/api';

import type { ResponsePagination } from '@/@types/response-api';
import type {
  FinancialMercadoPagoFilterForm,
  FinancialMercadoPagoListEnvelope,
  FinancialMercadoPagoListItem,
} from '@/@types/v2/Financeiro/financialMercadoPago';

// Params aceitos pela listagem — paginação + filtros `status`/`date_start`/`date_end`.
export interface ListFinancialMercadoPagoParams extends FinancialMercadoPagoFilterForm {
  page?: number;
  per_page?: number;
}

async function listFinancialMercadoPago(
  params: ListFinancialMercadoPagoParams
): Promise<ResponsePagination<FinancialMercadoPagoListItem[]>> {
  const { data } = await api.V2.get<FinancialMercadoPagoListEnvelope>('/financial-mercado-pago', {
    page: params.page,
    per_page: params.per_page ?? 10,
    status: params.status || undefined,
    date_start: params.date_start || undefined,
    date_end: params.date_end || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // paginação REAL (meta vem do backend, hoje sempre zerado pelo
  // placeholder), mirror `listDiagnosisPregnancies`/`listHeadbands`.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? 10,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

export { listFinancialMercadoPago };
