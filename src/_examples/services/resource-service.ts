// src/_examples/services/resource-service.ts
// -----------------------------------------------------------------------------
// CAMADA DE EXEMPLO — service (referência de padrão de chamada HTTP).
//
// Preserva o padrão do projeto: usa a instância `api.V2` de `@/services/api`,
// tipa a resposta com `Response` / `ResponsePagination` e expõe o CRUD completo
// (lista paginada, detalhe, create, update, delete). Endpoint genérico
// `/resources` — não existe de verdade na API; é só a forma canônica.
//
// O ID do recurso é um GUID/UUID (string) — padrão da empresa para projetos
// novos. `createResource` gera um GUID de exemplo via `crypto.randomUUID()`
// caso o backend não devolva um.
// -----------------------------------------------------------------------------

import type {
  CreateResourceRequest,
  ResourceData,
  UpdateResourceRequest,
} from "@/_examples/types/resource";
import type { PaginationQueryParams } from "@/@types/pagination";
import type { Response, ResponsePagination } from "@/@types/response-api";
import api from "@/services/api";

async function getResources(params: PaginationQueryParams) {
  const { data } = await api.V2.get<ResponsePagination<ResourceData[]>>(
    "/resources",
    { ...params }
  );
  return data;
}

async function getResourceById(resourceId: string) {
  const { data } = await api.V2.get<Response<ResourceData>>(
    `/resources/${resourceId}`
  );
  return data;
}

async function createResource(payload: CreateResourceRequest) {
  const { data } = await api.V2.post<Response<ResourceData>>("/resources", {
    // GUID de exemplo — o padrão da empresa é o cliente/servidor emitir UUIDs.
    id: crypto.randomUUID(),
    ...payload,
  });
  return data;
}

async function updateResource(
  resourceId: string,
  payload: UpdateResourceRequest
) {
  const { data } = await api.V2.patch<Response<ResourceData>>(
    `/resources/${resourceId}`,
    payload
  );
  return data;
}

async function deleteResource(resourceId: string) {
  const { data } = await api.V2.delete(`/resources/${resourceId}`);
  return data;
}

export {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
};
