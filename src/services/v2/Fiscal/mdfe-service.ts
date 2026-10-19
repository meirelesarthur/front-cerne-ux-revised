// src/services/v2/Fiscal/mdfe-service.ts
// -----------------------------------------------------------------------------
// Mdfe Service — API v1 do backend Laravel GB.Cerne (MDFe — Manifesto de
// Documentos Fiscais Eletrônicos, domínio Fiscal-Transporte). TASK-MDFE-FE-01
// (`CONTRATO-API-MDFE.md §5`, `CONTRATO-FRONT-MDFE.md §2`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /mdfes             → paginado; filtros: estado/encerrado/
//                                emissorId/dataInicioViagemDe/
//                                dataInicioViagemAte/veiculoId (chaves
//                                CAMEL-CASE — `MdfeFilterData` real NÃO tem
//                                mapeamento snake_case→camelCase automático,
//                                confirmado por leitura direta: sem
//                                `#[MapInputName]`/`name_mapping_strategy`
//                                em `config/data.php`).
//   GET    /mdfes/quota       → { used, limit, blocked } — gate mensal do
//                                tenant (GAP-MDFE-06 backend).
//   POST   /mdfes             → agregado completo (cabeçalho + 6 arrays).
//   GET    /mdfes/{uuid}      → eager load completo do agregado.
//   PUT    /mdfes/{uuid}      → payload SEMPRE completo (delete+recreate das
//                                6 coleções filhas, SE002).
//   DELETE /mdfes/{uuid}      → 204.
//   GET    /mdfes/{uuid}/report → `responseType: 'blob'`, síncrono.
//
// ⚠️ GAP-MDFE-FE-05 (P0) — `emissorId`/`veiculoId` (filtro) e
// `veiculo_tracao_id`/`veiculo_reboque_id`/`_2`/`_3` (payload) são validados
// pelo backend como `id` bigint, mas o front só tem `uuid` disponível (ver
// docblock de `@/@types/v2/Fiscal/Mdfe`). Os valores abaixo são enviados tal
// como o form produz — 422 esperado até o Gap resolver.
//
// `listMdfes` ADAPTA o envelope `ApiResponse::paginated` (meta REAL) para o
// shape `ResponsePagination` que `useCustomGridQuery`/`TableProvider`
// consomem — mesmo adaptador de `listNfes`/`listEquipments`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  MdfeData,
  MdfeEmitPayload,
  MdfeIssuerOption,
  MdfeListItem,
  MdfePayload,
  MdfeQuota,
  MdfesListEnvelope,
} from '@/@types/v2/Fiscal/Mdfe';

export interface ListMdfesParams extends PaginationQueryParams {
  estado?: string;
  encerrado?: boolean;
  emissorId?: string;
  dataInicioViagemDe?: string;
  dataInicioViagemAte?: string;
  veiculoId?: string;
}

async function listMdfes(params: ListMdfesParams): Promise<ResponsePagination<MdfeListItem[]>> {
  const { data } = await api.V2.get<MdfesListEnvelope>('/mdfes', {
    page: params.page,
    per_page: params.per_page,
    estado: params.estado || undefined,
    encerrado: params.encerrado ?? undefined,
    emissorId: params.emissorId || undefined,
    dataInicioViagemDe: params.dataInicioViagemDe || undefined,
    dataInicioViagemAte: params.dataInicioViagemAte || undefined,
    veiculoId: params.veiculoId || undefined,
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

async function getMdfeQuota(): Promise<Response<MdfeQuota>> {
  const { data } = await api.V2.get<Response<MdfeQuota>>('/mdfes/quota');
  return data;
}

async function getMdfe(mdfeUuid: string) {
  const { data } = await api.V2.get<Response<MdfeData>>(`/mdfes/${mdfeUuid}`);
  return data;
}

async function createMdfe(payload: MdfePayload) {
  const { data } = await api.V2.post<Response<MdfeData>>('/mdfes', payload);
  return data;
}

// PUT — payload SEMPRE completo (o backend apaga e recria as 6 coleções
// filhas a cada update, CONTRATO-API-MDFE.md §4.6).
async function updateMdfe(mdfeUuid: string, payload: MdfePayload) {
  const { data } = await api.V2.put<Response<MdfeData>>(`/mdfes/${mdfeUuid}`, payload);
  return data;
}

async function deleteMdfe(mdfeUuid: string) {
  const { data } = await api.V2.delete(`/mdfes/${mdfeUuid}`);
  return data;
}

async function downloadMdfeReport(mdfeUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/mdfes/${mdfeUuid}/report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// -----------------------------------------------------------------------------
// Onda 2 (SEFAZ) — escritas aqui (TASK-MDFE-FE-01) mas só CHAMADAS por
// `TASK-MDFE-FE-09` (Detalhe/Emissão), mirror `nfe-service.ts`. PARTIAL —
// dependem de infraestrutura externa (certificado do Emissor + webservice
// SEFAZ), mesma classificação já usada pelo Arquiteto de API.
// -----------------------------------------------------------------------------

async function downloadMdfeXml(mdfeUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/mdfes/${mdfeUuid}/xml`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// `emit` recebe `{ issuer_uuid }` (D3 / T-DEF02-API-03): o emissor é ESCOLHIDO na
// emissão (legado `MdfeController` / `MdfeEmiteController`, obrigatório). A API usa o
// informado; sem ele, o emissor já gravado no MDF-e; sem nenhum, 422 "Informe o emissor
// do MDF-e.". O emissor escolhido é gravado em `emissor_id` (cancel/close o reutilizam,
// por isso continuam bodyless). `tpAmb` vem de `$issuer->ambiente`.
async function emitMdfe(mdfeUuid: string, payload: MdfeEmitPayload) {
  const { data } = await api.V2.post<Response<MdfeData>>(`/mdfes/${mdfeUuid}/emit`, payload);
  return data;
}

// `GET /mdfes/issuer-options` (permission `mdfe_view`) — emissores elegíveis para emitir
// MDF-e (lista plana, sem paginação), mirror `getNfeIssuerOptions`.
async function listMdfeIssuerOptions(): Promise<Response<MdfeIssuerOption[]>> {
  const { data } = await api.V2.get<Response<MdfeIssuerOption[]>>('/mdfes/issuer-options');
  return data;
}

async function cancelMdfe(mdfeUuid: string, payload: Record<string, unknown>) {
  const { data } = await api.V2.post<Response<MdfeData>>(`/mdfes/${mdfeUuid}/cancel`, payload);
  return data;
}

async function closeMdfe(mdfeUuid: string) {
  const { data } = await api.V2.post<Response<MdfeData>>(`/mdfes/${mdfeUuid}/close`);
  return data;
}

export {
  cancelMdfe,
  closeMdfe,
  createMdfe,
  deleteMdfe,
  downloadMdfeReport,
  downloadMdfeXml,
  emitMdfe,
  getMdfe,
  getMdfeQuota,
  listMdfeIssuerOptions,
  listMdfes,
  updateMdfe,
};
