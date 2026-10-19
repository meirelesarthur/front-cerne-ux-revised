// src/services/v2/Fiscal/cte-manifestacao-service.ts
// -----------------------------------------------------------------------------
// Manifestação de CT-e Service — API v1 do backend GB.Cerne.Api
// (CteManifestacao — domínio Fiscal, execução 045, Onda 2, TASK-CTE-FE-12/13).
// `BASE = '/cte-manifestacoes'` confirmado contra `routes/api.php` real
// (`CteManifestacaoController` — `CONTRATO-API-CTE-ONDA2.md §2`, E16-E20).
//
// Envelope `ApiResponse` (Lei do SPA overlay): `{ success, message, data,
// errors, meta }`. `X-Farm-Id`/Sanctum já injetados pelo interceptor de
// `api.V2` (get_spa_api_client_pattern §1/§2) — nenhum header manual aqui.
//
// GAP-CTE-FE-04 (ver `@/@types/v2/Fiscal/cteManifestacao`): `issue_id` é
// enviado aqui como veio do call site (uuid — única fonte real disponível no
// SPA), embora `SyncCteManifestacoesRequest`/`ManifestaCteFilterData`/
// `CteManifestacaoController::index()` exijam `integer, exists:issues,id`
// (PK numérica interna). Documentado, não mascarado — nenhum valor
// fabricado é inserido aqui.
//
// `getManifestacaoDanfe`/`getManifestacaoXml` retornam Blob via
// `responseType: 'blob'` (axios, headers PROPAGADOS pelo interceptor) —
// NUNCA `window.open(url cru)`: a rota exige `X-Farm-Id` (header custom,
// `farm.context`), que uma navegação direta do browser não envia (mirror
// `Fiscal/Dfe/dfe-service.ts::downloadDfeXml/generateDfeDanfe`, já em
// produção neste repositório — mesmo AJUSTE-TÉCNICO já aplicado em
// `Fiscal/Cte/cte-service.ts::getCteReport`; diverge do roteiro literal de
// `TASK-CTE-FE-13`, que sugeria `getManifestacaoDanfeUrl`/`window.open` cru
// — devolvido no recibo).
//
// Nenhuma chamada Axios fora deste arquivo (Lei 3/7).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ConsultarManifestacoesRequest,
  CteManifestacaoFilterRequest,
  CteManifestacaoListItem,
  ManifestarDesacordoRequest,
} from '@/@types/v2/Fiscal/cteManifestacao';

const BASE = '/cte-manifestacoes';

export interface ListCteManifestacoesParams
  extends PaginationQueryParams, CteManifestacaoFilterRequest {}

interface CteManifestacoesListEnvelope {
  success: boolean;
  message: string;
  data: CteManifestacaoListItem[];
  meta?: { total?: number; per_page?: number; current_page?: number; last_page?: number };
}

// E16 — GET /api/v1/cte-manifestacoes (grid, LS10-LS16). `issue_id` sempre
// enviado (ver GAP-CTE-FE-04 acima) — `start_date`/`end_date` preservados e
// enviados como recebidos (DV13, ignorados pelo backend, fidelidade visual).
async function getAllManifestacoes(
  params: ListCteManifestacoesParams
): Promise<ResponsePagination<CteManifestacaoListItem[]>> {
  const { data } = await api.V2.get<CteManifestacoesListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
    issue_id: params.issue_id || undefined,
    search: params.search || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// E17 — POST /api/v1/cte-manifestacoes/consultar. Resposta `data: null`,
// contagem embutida em `message` ("N documento(s) sincronizado(s).") — o
// call site exibe o `message` do próprio backend, não recompõe o texto.
async function consultarManifestacoes(
  payload: ConsultarManifestacoesRequest
): Promise<Response<null>> {
  const { data } = await api.V2.post<Response<null>>(`${BASE}/consultar`, payload);
  return data;
}

// E18 — POST /api/v1/cte-manifestacoes/{uuid}/manifestar. `evento` sempre
// `1` (único evento suportado, LK22) — enviado explicitamente pelo call site.
async function manifestarDesacordo(
  uuid: string,
  payload: ManifestarDesacordoRequest
): Promise<Response<unknown>> {
  const { data } = await api.V2.post<Response<unknown>>(`${BASE}/${uuid}/manifestar`, payload);
  return data;
}

// E19 — GET /api/v1/cte-manifestacoes/{uuid}/danfe (binário, ver nota no
// topo do arquivo sobre `responseType: 'blob'`).
async function getManifestacaoDanfe(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`${BASE}/${uuid}/danfe`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// E20 — GET /api/v1/cte-manifestacoes/{uuid}/xml (binário, idem).
async function getManifestacaoXml(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`${BASE}/${uuid}/xml`, undefined, {
    responseType: 'blob',
  });
  return data;
}

export {
  consultarManifestacoes,
  getAllManifestacoes,
  getManifestacaoDanfe,
  getManifestacaoXml,
  manifestarDesacordo,
};
