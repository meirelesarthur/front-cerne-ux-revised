// src/services/v2/BaseRegistrations/ibpt-service.ts
// -----------------------------------------------------------------------------
// Ibpt Service — API v1 do backend Laravel GB.Cerne (IBPT — Tabela Fiscal de
// Incidência Tributária). Execução 032, TASK-FE-2410. Mirror mecânico de
// `systemUpdate-service.ts` para `list`/`get`/`delete`; mirror de
// `equipment-service.ts::importEquipments` para o `import` (multipart).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /ibpts                    → data: IbptListItem[] + meta paginação (default 10, teto 100)
//   GET    /ibpts/{uuid}             → data: IbptDetail (alias estrutural do item da lista)
//   GET    /ibpts/{uuid}/items       → data: IbptItemListItem[] + meta paginação (default 10, teto 100)
//   POST   /ibpts                    → multipart (file + uf + versao) — RN-01, reimportar
//                                       uma UF substitui a tabela inteira anterior, sem
//                                       histórico de versões
//   DELETE /ibpts/{uuid}             → cascade silencioso dos itens (RN-05)
//
// Catálogo GLOBAL — SEM `update` (contrato de API §10, sem tela de Edição:
// reimportar a UF já é o mecanismo de atualização).
//
// `listIbpts`/`listIbptItems` ADAPTAM o envelope paginado do backend para o
// shape `ResponsePagination` consumido pela infra de grid do projeto
// (`useCustomGridQuery`/`useCustomGridQueryById`) — mesmo truque de
// `listSystemUpdates`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  IbptDetail,
  IbptItemListItem,
  IbptItemsListEnvelope,
  IbptListItem,
  IbptsListEnvelope,
} from '@/@types/v2/BaseRegistrations/ibpt';

export interface ListIbptsParams extends PaginationQueryParams {}

async function listIbpts(params: ListIbptsParams): Promise<ResponsePagination<IbptListItem[]>> {
  const { data } = await api.V2.get<IbptsListEnvelope>('/ibpts', {
    page: params.page,
    per_page: params.per_page,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getIbptTable(uuid: string): Promise<Response<IbptDetail>> {
  const { data } = await api.V2.get<Response<IbptDetail>>(`/ibpts/${uuid}`);
  return data;
}

// Assinatura mirror `useCustomGridQueryById.asyncFunctionById` (Modelo B do
// catálogo de composições — grade paginada de itens de 1 tabela).
async function listIbptItems(
  registrationId: string,
  params: PaginationQueryParams
): Promise<ResponsePagination<IbptItemListItem[]>> {
  const { data } = await api.V2.get<IbptItemsListEnvelope>(`/ibpts/${registrationId}/items`, {
    page: params.page,
    per_page: params.per_page,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

export interface ImportIbptTableParams {
  file: File;
  uf: string;
  versao: string;
}

async function importIbptTable({
  file,
  uf,
  versao,
}: ImportIbptTableParams): Promise<Response<IbptDetail>> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('uf', uf);
  fd.append('versao', versao);
  const { data } = await api.V2.post<Response<IbptDetail>>('/ibpts', fd);
  return data;
}

async function deleteIbptTable(uuid: string) {
  const { data } = await api.V2.delete(`/ibpts/${uuid}`);
  return data;
}

export { deleteIbptTable, getIbptTable, importIbptTable, listIbptItems, listIbpts };
