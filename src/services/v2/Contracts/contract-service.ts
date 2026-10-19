// src/services/v2/Contracts/contract-service.ts
// -----------------------------------------------------------------------------
// Contract Service — API v1 do backend Laravel GB.Cerne (Financeiro —
// "Gestão de Contratos", esteira 97-Esteiras/023, TASK-CTR-FE-05). Contrato:
// Contract-FrontEnd-contrato.md §3 (endpoints `/api/v1/contracts` já
// CONFIRMADOS reais/fechados).
//
// Payload é sempre JSON puro (`api.V2.post`/`api.V2.put`) — Contract NÃO tem
// upload de arquivo em nenhum campo (diferente de RequestPurchase). NÃO
// replica `buildRequestPurchaseFormData`/method-spoofing aqui — seria
// complexidade desnecessária (Riscos + solução da Tarefa).
//
//   GET    /contracts            → listContracts(params) — paginado
//                                   (search/employee_uuid/provider_uuid/
//                                   per_page/page)
//   GET    /contracts/{uuid}     → getContract(uuid)
//   POST   /contracts            → createContract(payload) — JSON puro
//   PUT    /contracts/{uuid}     → updateContract(uuid, payload) — JSON
//                                   puro, `api.V2.put` NATIVO (sem method
//                                   spoofing — Contract não tem multipart)
//   DELETE /contracts/{uuid}     → deleteContract(uuid) — hard delete,
//                                   guarda 422 de FK (DA-CT-09); a UI trata o
//                                   422 na camada de mutation (`TASK-CTR-FE-07`),
//                                   este service só propaga o erro do axios.
//
// `listContracts` ADAPTA o envelope `ApiResponse::paginated` → shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listRequestPurchases`/`listProviders` (meta REAL,
// nunca fallback fake).
//
// `X-Farm-Id` é anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` (mesmo mecanismo de todos os services do fork) — este
// service não manipula o header manualmente.
//
// ⚠️ Armadilha ERRO-FE-016 (services que enumeram parâmetros manualmente
// descartam parâmetro novo em silêncio, `tsc` não acusa): os filtros de
// `ListContractsParams` são TODOS repassados explicitamente na querystring
// abaixo — ao adicionar um filtro novo no futuro, repassar aqui também, não
// só no tipo.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ContractData,
  ContractFilterRequest,
  ContractListItem,
  ContractPayload,
  ContractsListEnvelope,
} from '@/@types/v2/Contracts';

export interface ListContractsParams extends PaginationQueryParams, ContractFilterRequest {}

async function listContracts(
  params: ListContractsParams
): Promise<ResponsePagination<ContractListItem[]>> {
  const { data } = await api.V2.get<ContractsListEnvelope>('/contracts', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    employee_uuid: params.employee_uuid || undefined,
    provider_uuid: params.provider_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listRequestPurchases`/`listProviders` (meta REAL, não
  // fallback fake).
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

async function getContract(uuid: string) {
  const { data } = await api.V2.get<Response<ContractData>>(`/contracts/${uuid}`);
  return data;
}

async function createContract(payload: ContractPayload) {
  const { data } = await api.V2.post<Response<ContractData>>('/contracts', payload);
  return data;
}

// PUT nativo (`api.V2.put`) — payload JSON puro, sem method spoofing (mirror
// `updateWarehouse`/`updateProvider`, NÃO `updateRequestPurchase`/
// `updateEquipment`, que multiplexam via multipart por causa de anexo/foto).
async function updateContract(uuid: string, payload: ContractPayload) {
  const { data } = await api.V2.put<Response<ContractData>>(`/contracts/${uuid}`, payload);
  return data;
}

// Hard delete (DA-CT-09) — guarda 422 de FK; este service só propaga o erro
// do axios, a UI decide como exibir (toast/dialog) na camada de mutation.
async function deleteContract(uuid: string) {
  const { data } = await api.V2.delete(`/contracts/${uuid}`);
  return data;
}

export { createContract, deleteContract, getContract, listContracts, updateContract };
