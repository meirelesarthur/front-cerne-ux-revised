// src/services/v2/Fiscal/cte-emissao-service.ts
// -----------------------------------------------------------------------------
// Emissão SEFAZ do CT-e — API v1 do backend GB.Cerne.Api (execução 045, Onda
// 2, TASK-CTE-FE-09/10/11). `BASE = '/ctes'` confirmado contra
// `routes/api.php` real (`Route::prefix('ctes/{uuid}')->group(...)`,
// `CteEmissaoController`).
//
// Envelope `ApiResponse` (Lei do SPA overlay): `{ success, message, data,
// errors, meta }`. `X-Farm-Id`/Sanctum já injetados pelo interceptor de
// `api.V2` (get_spa_api_client_pattern §1/§2) — nenhum header manual aqui.
//
// `getCteXml`/`getCteDacte`/`getCteCorrecaoImprimir`/
// `getCteCancelamentoImprimir` retornam Blob via `responseType: 'blob'`
// (axios, headers PROPAGADOS pelo interceptor) — NUNCA `window.open(url
// cru)`: as 4 rotas exigem `X-Farm-Id` (header custom, `farm.context`), que
// uma navegação direta do browser não envia (mirror `getCteReport`/
// `cte-service.ts`, já em produção neste módulo — mesmo racional aplicado
// aqui mesmo com o roteiro da Tarefa sugerindo `window.open(getCteDacteUrl(
// uuid))` cru).
//
// GAP-CTE-FE-04: `getIssueOptions` chama um endpoint AINDA NÃO wired no
// backend (`/ctes/issue-options`, mesmo formato de
// `nfes/issuer-options`/`contadores/issues-elegiveis`) — 404 honesto até o
// backend materializar; ver docblock de `@/@types/v2/Fiscal/cteEmissao` e o
// Gap registrado. Nenhum dado mockado — a chamada é real, contra o path que
// o backend deve expor.
//
// Nenhuma chamada Axios fora deste arquivo (Lei 3/7).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { CteData } from '@/@types/v2/Fiscal/cte';
import type {
  CancelarCteRequest,
  CorrigirCteRequest,
  CorrigirCteResult,
  CteEmissaoData,
  IssueOptionItem,
  TransmitirCteRequest,
} from '@/@types/v2/Fiscal/cteEmissao';

const BASE = '/ctes';

interface FlatOptionsEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
}

// E8 — GET /api/v1/ctes/{uuid}/emissao (tela agregada readonly, D01-D13).
async function getCteEmissao(uuid: string): Promise<Response<CteEmissaoData>> {
  const { data } = await api.V2.get<Response<CteEmissaoData>>(`${BASE}/${uuid}/emissao`);
  return data;
}

// GAP-CTE-FE-04 — LK19 (`is_enabled=true`, `issues_nfe=true`, farm atual ou
// sem farm). Endpoint ainda não existe no backend real — ver docblock acima.
async function getIssueOptions(): Promise<IssueOptionItem[]> {
  const { data } = await api.V2.get<FlatOptionsEnvelope<IssueOptionItem>>(`${BASE}/issue-options`);
  return data.data;
}

// E9 — GET /api/v1/ctes/{uuid}/xml (`Content-Type: application/xml`, S24).
async function getCteXml(uuid: string): Promise<Blob> {
  const response = await api.V2.get<Blob>(`${BASE}/${uuid}/xml`, undefined, {
    responseType: 'blob',
  });
  return response.data;
}

// E10 — POST /api/v1/ctes/{uuid}/transmitir (body: issue_id, S25-S26).
async function transmitirCte(
  uuid: string,
  payload: TransmitirCteRequest
): Promise<Response<CteData>> {
  const { data } = await api.V2.post<Response<CteData>>(`${BASE}/${uuid}/transmitir`, payload);
  return data;
}

// E11 — POST /api/v1/ctes/{uuid}/corrigir (body: grupo,campo,motivo min:15).
async function corrigirCte(
  uuid: string,
  payload: CorrigirCteRequest
): Promise<Response<CorrigirCteResult>> {
  const { data } = await api.V2.post<Response<CorrigirCteResult>>(
    `${BASE}/${uuid}/corrigir`,
    payload
  );
  return data;
}

// E12 — POST /api/v1/ctes/{uuid}/cancelar (body: motivo min:15).
async function cancelarCte(uuid: string, payload: CancelarCteRequest): Promise<Response<CteData>> {
  const { data } = await api.V2.post<Response<CteData>>(`${BASE}/${uuid}/cancelar`, payload);
  return data;
}

// E13 — GET /api/v1/ctes/{uuid}/dacte (`Content-Type: application/pdf`, S33).
async function getCteDacte(uuid: string): Promise<Blob> {
  const response = await api.V2.get<Blob>(`${BASE}/${uuid}/dacte`, undefined, {
    responseType: 'blob',
  });
  return response.data;
}

// E14 — GET /api/v1/ctes/{uuid}/correcao/{sequencia}/imprimir (PDF, S34).
async function getCteCorrecaoImprimir(uuid: string, sequencia: number): Promise<Blob> {
  const response = await api.V2.get<Blob>(
    `${BASE}/${uuid}/correcao/${sequencia}/imprimir`,
    undefined,
    { responseType: 'blob' }
  );
  return response.data;
}

// E15 — GET /api/v1/ctes/{uuid}/cancelamento/imprimir (PDF, S35).
async function getCteCancelamentoImprimir(uuid: string): Promise<Blob> {
  const response = await api.V2.get<Blob>(`${BASE}/${uuid}/cancelamento/imprimir`, undefined, {
    responseType: 'blob',
  });
  return response.data;
}

export {
  cancelarCte,
  corrigirCte,
  getCteCancelamentoImprimir,
  getCteCorrecaoImprimir,
  getCteDacte,
  getCteEmissao,
  getCteXml,
  getIssueOptions,
  transmitirCte,
};
