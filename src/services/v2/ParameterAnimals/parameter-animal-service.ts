import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ParameterAnimalData,
  ParameterAnimalForm,
} from '@/@types/v2/ParameterAnimals/parameter-animal';

// Envelope cru do backend (ApiResponse::paginated) — GET /animal-parameters.
// TASK-FE-1083: `getParameterAnimals` anotava o retorno como
// `ResponsePagination<ParameterAnimalData>` (SINGULAR, shape já adaptado
// `{data:{items,pagination}}`) quando o retorno real de rede é
// `{data: ParameterAnimalData[], meta}` — mesmo formato de
// `CategoryAnimalsListEnvelope`/`BatchesListEnvelope`.
interface ParameterAnimalsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface ParameterAnimalsListEnvelope {
  success: boolean;
  message: string;
  data: ParameterAnimalData[];
  errors: Record<string, string[]> | null;
  meta: ParameterAnimalsApiPaginationMeta | null;
}

// Estende `PaginationQueryParams` (mesma convenção de `ListCategoryAnimalsParams`/
// `ListFunctionsParams`/`ListBatchesParams`) — `search` no TOPO do
// objeto de params, nunca aninhado sob uma chave `filter` própria (o
// `filter` de `PaginationQueryParams` já tem significado real e diferente —
// a query string de `filterQueryBuilder`).
//
// TASK-FE-1084: chave renomeada de `description` para `search` — convenção
// real da API (`PaymentTermIndexRequest`/`LowReasonRequest`/`KindIndexRequest`).
// A API ignorava `description` silenciosamente (200 OK, lista inteira sem
// filtrar) — defeito nasceu por divergência de nome de parâmetro, invisível
// para tsc/eslint/build.
export interface ListParameterAnimalsParams extends PaginationQueryParams {
  search?: string;
}

export async function getParameterAnimals(
  params: ListParameterAnimalsParams
): Promise<ResponsePagination<ParameterAnimalData[]>> {
  const { data } = await api.V2.get<ParameterAnimalsListEnvelope>('/animal-parameters', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listCategoryAnimals`/`listFunctions`/`getBatches`.
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

export async function getParameterAnimalById(uuid: string): Promise<Response<ParameterAnimalData>> {
  const { data } = await api.V2.get<Response<ParameterAnimalData>>(`/animal-parameters/${uuid}`);
  return data;
}

export async function createParameterAnimal(
  payload: ParameterAnimalForm
): Promise<Response<ParameterAnimalData>> {
  const { data } = await api.V2.post<Response<ParameterAnimalData>>('/animal-parameters', payload);
  return data;
}

export async function updateParameterAnimal(
  uuid: string,
  payload: Partial<ParameterAnimalForm>
): Promise<Response<ParameterAnimalData>> {
  const { data } = await api.V2.put<Response<ParameterAnimalData>>(
    `/animal-parameters/${uuid}`,
    payload
  );
  return data;
}

export async function deleteParameterAnimal(uuid: string): Promise<Response<void>> {
  const { data }: { data: Response<void> } = await api.V2.delete(`/animal-parameters/${uuid}`);
  return data;
}
