// src/services/v2/MyServiceOrders/my-service-order-service.ts
// -----------------------------------------------------------------------------
// My Service Order Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL
// — Minhas OS). Casa própria (mirror `RatingServiceOrders`/`Monitoring`),
// esteira 063 (TASK-MOS-FE-02). API JÁ CONSTRUÍDA e ✅ pelo Tester
// (`MyServiceOrderController`/`MyServiceOrderResource`/
// `MyServiceOrderDetailResource`/`MyServiceOrderExecutionRequest`):
//
//   GET /my-service-orders          → paginado; listagem restrita ao
//                                      executor logado
//   GET /my-service-orders/{uuid}   → hidratação da execução
//   PUT /my-service-orders/{uuid}   → só o bloco de execução (multipart +
//                                      method-spoofing, ver abaixo)
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
//
// NOMES LITERAIS DE QUERYSTRING (mandato de fidelidade, mirror
// `monitoring-service.ts`) — `pagination_quantity` NÃO é renomeado para
// `per_page` nesta chamada.
//
// `updateMyServiceOrderExecution` — multipart + method-spoofing (mirror
// `updateEquipment`/`equipment-service.ts`, NUNCA `api.V2.put` direto): PUT
// nativo multipart não é parseado de forma confiável pelo Laravel. Os 5
// arrays `*_checked_ids` são `present,array` no backend (`required,array`
// aceitas mesmo vazias) — serializados por notação de índice
// (`campo[i]`), e SEMPRE montados (mesmo sem nenhum índice) para que a
// ausência total de itens marcados chegue como array vazio, não como campo
// ausente. PONTO DE ATENÇÃO (registrado no "Teste do dev (sugerido)" da
// Tarefa): confirmar em runtime que o Laravel interpreta a ausência total de
// índices de uma chave `campo[]` como array vazio (`present`) e não como
// 422 de campo ausente — comportamento padrão do parser multipart do
// Laravel para `FormData` sem nenhuma entrada daquele prefixo, mas não
// exercitável sem o endpoint ao vivo.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  MyServiceOrderDetail,
  MyServiceOrderExecutionPayload,
  MyServiceOrderFilterForm,
  MyServiceOrderListItem,
  MyServiceOrdersListEnvelope,
} from '@/@types/v2/MyServiceOrders';

export interface ListMyServiceOrdersParams
  extends PaginationQueryParams, MyServiceOrderFilterForm {}

async function getAllMyServiceOrders(
  params: ListMyServiceOrdersParams
): Promise<ResponsePagination<MyServiceOrderListItem[]>> {
  const { data } = await api.V2.get<MyServiceOrdersListEnvelope>('/my-service-orders', {
    page: params.page,
    code: params.code || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    pagination_quantity: params.pagination_quantity || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.pagination_quantity ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getMyServiceOrder(uuid: string) {
  const { data } = await api.V2.get<Response<MyServiceOrderDetail>>(`/my-service-orders/${uuid}`);
  return data;
}

// appendIdList — serializa uma lista de ids por notação de índice. Lista
// vazia vira `campo=""` (multipart não carrega lista vazia; a API trata
// chave ausente como "não mexe" e `""` como "limpa" — TASK-090-API-03 /
// ERRO-BE-023). Nunca envia `campo=""` junto com `campo[i]`.
function appendIdList(fd: FormData, field: string, ids: number[]): void {
  if (ids.length === 0) {
    fd.append(field, '');
    return;
  }
  ids.forEach((id, index) => {
    fd.append(`${field}[${index}]`, String(id));
  });
}

// buildMyServiceOrderExecutionFormData — monta o FormData COMPLETO
// (full-resource, nunca um delta de dirtyFields), interna/não exportada,
// mirror `buildEquipmentFormData`. Os 5 arrays `*_checked_ids` e o array
// `attachments` são serializados por notação de índice (`campo[i]`/
// `attachments[i][chave]`).
// Regra "vazio = `campo=""`": lista vazia (ou, em `attachments`, nada
// serializado) envia `campo=""` para a API limpar; a chave ausente
// preservaria o valor (TASK-090-API-03 / ERRO-BE-023). O índice dos anexos
// continua 1:1 com o `useFieldArray` (não reindexar).
function buildMyServiceOrderExecutionFormData(payload: MyServiceOrderExecutionPayload): FormData {
  const fd = new FormData();

  fd.append('status', String(payload.status));
  fd.append('execution_start_date', payload.execution_start_date);
  if (payload.execution_end_date !== undefined && payload.execution_end_date !== null) {
    fd.append('execution_end_date', payload.execution_end_date);
  }
  if (payload.execution_problems !== undefined && payload.execution_problems !== null) {
    fd.append('execution_problems', payload.execution_problems);
  }
  if (payload.corrective_actions !== undefined && payload.corrective_actions !== null) {
    fd.append('corrective_actions', payload.corrective_actions);
  }

  appendIdList(fd, 'employees_checked_ids', payload.employees_checked_ids);
  appendIdList(fd, 'equipments_checked_ids', payload.equipments_checked_ids);
  appendIdList(fd, 'products_checked_ids', payload.products_checked_ids);
  appendIdList(fd, 'productions_checked_ids', payload.productions_checked_ids);
  appendIdList(fd, 'protections_checked_ids', payload.protections_checked_ids);

  let hasAttachmentKey = false;
  payload.attachments.forEach((row, index) => {
    if (row.uuid) {
      fd.append(`attachments[${index}][uuid]`, row.uuid);
      hasAttachmentKey = true;
    }
    if (row.name) {
      fd.append(`attachments[${index}][name]`, row.name);
      hasAttachmentKey = true;
    }
    if (row.file) {
      fd.append(`attachments[${index}][file]`, row.file);
      hasAttachmentKey = true;
    }
  });
  if (!hasAttachmentKey) fd.append('attachments', '');

  return fd;
}

// ⚠️ Mirror `updateEquipment` (PUT nativo + multipart não é parseado de
// forma confiável pelo Laravel): envia como POST + `_method=PUT` dentro do
// próprio FormData (method spoofing padrão do Laravel) — NUNCA
// `api.V2.put(...)` aqui.
async function updateMyServiceOrderExecution(
  uuid: string,
  payload: MyServiceOrderExecutionPayload
) {
  const fd = buildMyServiceOrderExecutionFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<MyServiceOrderDetail>>(
    `/my-service-orders/${uuid}`,
    fd
  );
  return data;
}

export { getAllMyServiceOrders, getMyServiceOrder, updateMyServiceOrderExecution };
