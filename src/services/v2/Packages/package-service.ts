// src/services/v2/Packages/package-service.ts
// -----------------------------------------------------------------------------
// Package Service — API v1 do backend Laravel GB.Cerne (Embalagens).
// Contrato: Package-contrato.md (APROVADO) + Package-Frontend-Contrato.md.
//
// Rota dentro do bloco farm.context ESTRITO — X-Farm-Id é anexado
// automaticamente pelo interceptor de src/services/api.ts (localStorage
// 'app-active-farm'). Sem fazenda ativa → 403 (ver guard hasFarm nas telas,
// TASK-FE-521/522). Dado tenant-scoped, NÃO filtrado por fazenda.
//
// `listPackages` ADAPTA o envelope { data: [], meta: {} } para o shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listKinds`/`listBreeds`. Sem parâmetro de ordenação —
// o backend já ordena `description asc` fixo (Contrato §2).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  PackageData,
  PackageFilterForm,
  PackageListItem,
  PackageOption,
  PackageOptionsListEnvelope,
  PackagePayload,
  PackagesListEnvelope,
} from '@/@types/v2/Packages';

export interface ListPackagesParams extends PaginationQueryParams, PackageFilterForm {}

async function listPackages(
  params: ListPackagesParams
): Promise<ResponsePagination<PackageListItem[]>> {
  const { data } = await api.V2.get<PackagesListEnvelope>('/product-packages', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    measurement_uuid: params.measurement_uuid || undefined,
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

async function getPackageByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<PackageData>>(`/product-packages/${uuid}`);
  return data;
}

async function createPackage(payload: PackagePayload) {
  const { data } = await api.V2.post<Response<PackageData>>('/product-packages', payload);
  return data;
}

// Payload SEMPRE completo — PackageRequest::rules() não diferencia store/update.
async function updatePackage(uuid: string, payload: PackagePayload) {
  const { data } = await api.V2.put<Response<PackageData>>(`/product-packages/${uuid}`, payload);
  return data;
}

async function deletePackage(uuid: string) {
  const { data } = await api.V2.delete(`/product-packages/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /product-packages/options (TASK-BE-508, aditivo TASK-FE-504) — lookup
// ENXUTO consumido pelo `CheckboxListField` de `product_package_uuids` do
// formulário de Produtos (Aba 2). SEM gate de `product-packages_view`. FLAT
// (`meta` sempre `null`) — devolve o array PRONTO (mirror `listFarms()`,
// consumido por `CheckboxListField` que já espera a lista completa, filtrada
// client-side pela busca do próprio componente — sem paginação real
// necessária, 161 linhas totais tenant-scoped).
// -----------------------------------------------------------------------------
async function listPackageOptions(): Promise<PackageOption[]> {
  const { data } = await api.V2.get<PackageOptionsListEnvelope>('/product-packages/options');
  return data.data ?? [];
}

export {
  createPackage,
  deletePackage,
  getPackageByUuid,
  listPackageOptions,
  listPackages,
  updatePackage,
};
