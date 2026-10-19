// src/services/v2/Batches/batch-service.ts
// -----------------------------------------------------------------------------
// Batch Service — API v1 do backend Laravel GB.Cerne. Service NOVO e MÍNIMO
// (mirror `cbo-service.ts`/`species-service.ts`) — só o necessário para
// popular o `SelectAsyncPaginate` de Lote no filtro de Animal/Rebanho
// (TASK-FE-880/881). SEM tela de CRUD própria nesta execução.
//
// Reconciliação do Maestro (2026-08-02) — o backend entregou o endpoint de
// options desta rodada (123 testes verdes):
//   GET /batches/options → data: BatchOption[], FLAT (uuid+label), meta
//     SEMPRE null. Traz uma entrada SINTÉTICA "Sem lote" SEMPRE em primeiro —
//     o front NUNCA adiciona uma opção vazia própria (duplicaria).
//
// `listBatchOptions` ADAPTA o array flat para o shape `ResponsePagination`
// que `SelectAsyncPaginate`/`useCustomGridQuery` consomem — mesmo truque
// estrutural de `listSpecies` (meta sempre null, 1 única "página" com o array
// inteiro; Batch, assim como Species, não pagina de verdade neste endpoint).
//
// Catálogo tenant-scoped (Lote é `farm_id`-scoped, mesma natureza de Animal)
// — `X-Farm-Id` propagado pelo interceptor genérico do `api.ts`, nunca
// hardcode manual aqui.
//
// round-4 (PROC-R4-02) — DUAS variantes, mesma assinatura
// `(params) => Promise<ResponsePagination<BatchOption[]>>` (contrato exigido
// por `SelectAsyncPaginate`):
//   `listBatchOptions`         → USE em selects de FILTRO (ex.:
//     `FilterSideAnimal.tsx`) — mantém "Sem lote" (`uuid:'0'`), sentinela
//     LOAD-BEARING para `AnimalIndexRequest.batch==='0'`
//     (`AnimalRepository::87`, `whereNull(batch_animals.batch_id)`).
//   `listBatchOptionsForForm`  → USE em selects de FORMULÁRIO onde
//     `batch_uuid` é campo `uuid`/`exists` (nunca aceita o literal `"0"`) —
//     manda `include_empty:false` (API, opt-out) **e** filtra
//     `uuid !== '0'` no array devolvido (defesa em profundidade: a tela já
//     fica correta mesmo que a API ainda não tenha o opt-out deployado).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BatchOption,
  BatchOptionsListEnvelope,
  BatchData,
  BatchesListEnvelope,
  BatchForm,
  BatchCandidateAnimal,
  BatchCandidateAnimalsEnvelope,
} from '@/@types/v2/Batches';

// `statuses`/`includeUuids` — extensão ADITIVA (97-Esteiras/005 Tarefa 24,
// frontend-contract-apartacao.md §8, mirror `BatchRepository::listOptions()`
// do contrato de API). Ambos opcionais — o default do backend preserva o
// comportamento atual (`['A']`) quando `statuses` é omitido. NENHUM
// call-site existente muda de assinatura (params novos são opt-in, ver
// `listBatchOptions` abaixo).
export interface ListBatchOptionsParams extends PaginationQueryParams {
  search?: string;
  statuses?: string[];
  includeUuids?: string[];
}

/** Params de `listBatchOptionsForForm` — `areaUuid`/`grazingUuid` opt-in
 *  (UT-000795, Contas a Pagar Pecuária: Lote por Área ou por Módulo). */
export interface ListBatchOptionsForFormParams extends ListBatchOptionsParams {
  areaUuid?: string;
  grazingUuid?: string;
}

function toBatchOptionsPagination(
  data: BatchOptionsListEnvelope,
  items: BatchOption[]
): ResponsePagination<BatchOption[]> {
  return {
    success: data.success,
    message: data.message,
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

async function listBatchOptions(
  params: ListBatchOptionsParams
): Promise<ResponsePagination<BatchOption[]>> {
  const { data } = await api.V2.get<BatchOptionsListEnvelope>('/batches/options', {
    search: params.search || undefined,
    statuses: params.statuses && params.statuses.length > 0 ? params.statuses : undefined,
    includeUuids:
      params.includeUuids && params.includeUuids.length > 0 ? params.includeUuids : undefined,
  });

  // Adaptação envelope ApiResponse::success (flat, meta:null) →
  // ResponsePagination — 1 única página com o array inteiro (mirror
  // listSpecies). A entrada sintética "Sem lote" já vem do backend em
  // primeiro — NÃO adicionar outra aqui.
  return toBatchOptionsPagination(data, data.data);
}

// round-4 (PROC-R4-02) — variante para selects de LOTE de FORMULÁRIO
// (`batch_uuid` `required|uuid|exists`, nunca aceita `"0"`). `include_empty`
// é opt-out da API (default `true`, retrocompatível) — aqui pedimos `false`
// e AINDA filtramos `uuid !== '0'` no retorno, defesa em profundidade caso a
// API ainda não tenha o opt-out deployado.
async function listBatchOptionsForForm(
  params: ListBatchOptionsForFormParams
): Promise<ResponsePagination<BatchOption[]>> {
  const { data } = await api.V2.get<BatchOptionsListEnvelope>('/batches/options', {
    search: params.search || undefined,
    include_empty: 0,
    // UT-000795 — filtros opt-in (mutuamente exclusivos na API); omitidos = idêntico ao anterior.
    area_uuid: params.areaUuid || undefined,
    grazing_uuid: params.grazingUuid || undefined,
  });

  return toBatchOptionsPagination(
    data,
    data.data.filter((item) => item.uuid !== '0')
  );
}

// Estende `PaginationQueryParams` (mesma convenção de `ListCategoryAnimalsParams`/
// `ListFunctionsParams`) — `search` vai TOPO do objeto de params, nunca
// aninhado sob uma chave `filter` própria (TASK-FE-1083: o `filter` de
// `PaginationQueryParams` já tem um significado real e diferente — a query
// string produzida por `filterQueryBuilder`, ver `useCustomGridQuery`; um
// segundo `filter` aninhado com outro shape colidia com esse contrato).
//
// TASK-FE-1084: chave renomeada de `description` para `search` — convenção
// real da API (`PaymentTermIndexRequest`/`LowReasonRequest`/`KindIndexRequest`)
// e a mesma usada por `AnimalBatchRepository:75-78` (ENTREGUE, cobre
// `description` via ILIKE fiel ao legado `BatchController.php:46-49`). A API
// ignorava `description` silenciosamente (200 OK, lista inteira sem filtrar).
export interface ListBatchesParams extends PaginationQueryParams {
  search?: string;
}

export async function getBatches(
  params: ListBatchesParams
): Promise<ResponsePagination<BatchData[]>> {
  const { data } = await api.V2.get<BatchesListEnvelope>('/animal-batches', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listCategoryAnimals`/`listFunctions`. Antes desta
  // correção o tipo declarado (`ResponsePagination<BatchData>`, SINGULAR)
  // mentia sobre o shape real da rede (`{data: BatchData[], meta}`) — o
  // consumidor (`useBatches.tsx`) compensava com um adapter local só de
  // cast, sem esta adaptação de verdade.
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

export async function getBatchById(uuid: string): Promise<Response<BatchData>> {
  const { data } = await api.V2.get<Response<BatchData>>(`/animal-batches/${uuid}`);
  return data;
}

export async function createBatch(payload: BatchForm): Promise<Response<BatchData>> {
  const { data } = await api.V2.post<Response<BatchData>>('/animal-batches', payload);
  return data;
}

export async function updateBatch(
  uuid: string,
  payload: Partial<BatchForm>
): Promise<Response<BatchData>> {
  const { data } = await api.V2.put<Response<BatchData>>(`/animal-batches/${uuid}`, payload);
  return data;
}

export async function deleteBatch(uuid: string): Promise<Response<void>> {
  const { data }: { data: Response<void> } = await api.V2.delete(`/animal-batches/${uuid}`);
  return data;
}

// TASK-FE-1080 (GAP-FE-205, ação "Arquivar"). `POST /api/v1/animal-batches/
// {uuid}/archive` — muda `status` para `'R'` (`ArchiveAnimalBatchAction`,
// contrato v1.1 §3). Mesma assinatura de retorno de `createBatch`/
// `updateBatch` (item único, `ApiResponse::success` — TASK-FE-1083 corrigiu
// o generic de `ResponsePagination<BatchData>` para `Response<BatchData>`).
export async function archiveBatch(uuid: string): Promise<Response<BatchData>> {
  const { data } = await api.V2.post<Response<BatchData>>(`/animal-batches/${uuid}/archive`);
  return data;
}

// TASK-FE-1082 (contrato v1.1 §8, D1) — modelo XLSX em BRANCO (3 abas:
// `cabecalho`, `animais`, `Species` oculta), NUNCA export de dados reais.
// Mirror `downloadAnimalImportTemplate`/`downloadEquipmentImportTemplate`/
// `downloadPlanAccountImportTemplate` — binário fora do envelope
// `ApiResponse` (`AnimalBatchController::download()`, real, confirmado por
// leitura direta), por isso `responseType: 'blob'` e retorno cru de `Blob`
// (sem desembrulhar `data.data`). Gate `batch_create` (mesmo do `import`
// abaixo — quem pode baixar o modelo e quem pode importar são o mesmo
// público, `AnimalBatchImportRequest`/rota real).
export async function downloadBatchTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/animal-batches/download', undefined, {
    responseType: 'blob',
  });
  return data;
}

// TASK-FE-1082 (contrato v1.1 §8, D1/D2) — importa exatamente 1 Lote por
// arquivo (.xlsx), SÍNCRONO (sem Job/polling, `GAP-FE-210` fechado nesse
// sentido). Validação de arquivo real (`AnimalBatchImportRequest::rules()`,
// confirmada por leitura direta): `required|file|mimes:xlsx|max:10240`
// (10 MB) — espelhada no `FileUpload` do modal (`BatchImportModal.tsx`).
//
// ⚠️ D2 — a resposta é SEMPRE `ApiResponse::created()` (HTTP 201,
// `success: true`), MESMO quando a aba "animais" falhou e o Lote ficou
// órfão (vazio, sem `syncAnimals()`) — o `AnimalBatchController::import()`
// real (linhas 224-242) só TROCA o texto de `message` nesse caso, nunca
// retorna erro. Portanto `message` (não `data.total_animals` sozinho, que o
// Resource sempre inclui) é a única informação textual de que a importação
// pode ter sido parcial — o consumidor (`BatchImportModal.tsx`) SEMPRE
// exibe essa `message` literal, nunca um toast genérico de sucesso.
export async function importBatch(file: File): Promise<Response<BatchData>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<BatchData>>('/animal-batches/import', fd);
  return data;
}

// TASK-FE-1089 (achados 1-3 do E2E do dev) — `GET /animal-batches/
// candidate-animals`, RBAC `batch_view`. SEM paginação (decisão do dev,
// devolve TODOS os candidatos — maior grupo observado 5.085 animais) —
// portanto o retorno é o ARRAY CRU (`BatchCandidateAnimal[]`), não um
// `ResponsePagination` (não há "página" nenhuma para adaptar aqui).
//
// `category_uuid` (um) OU `category_uuids[]` (vários) — usamos sempre o
// plural (um card por categoria selecionada, contrato do form).
//
// CORREÇÃO P0 (erro do handover original, não desta implementação):
// `without_batch` e `batch_uuid` são empilhados em AND pelo backend
// (`whereHas('batches', uuid=X)` + `doesntHave('batches')` são mutuamente
// exclusivos) — mandar os DOIS juntos SEMPRE devolve conjunto VAZIO
// (confirmado pelo Tester de API). A semântica correta é if/else, fiel ao
// legado (`agro365/resources/views/batches/_forms.blade.php:122-127`,
// `weightChange()`): `batch_uuid` SOZINHO em EDIÇÃO, `without_batch: true`
// SOZINHO em CRIAÇÃO — NUNCA os dois na mesma chamada. O caller
// (`useBatchCandidateAnimals`, `useBatches.tsx`) monta o objeto de params já
// respeitando esse if/else; esta função só repassa o que recebeu, sem somar
// os dois campos por conta própria.
export interface ListBatchCandidateAnimalsParams {
  category_uuids: string[];
  without_batch?: boolean;
  batch_uuid?: string;
  parameter_weight_uuid?: string;
}

export async function listBatchCandidateAnimals(
  params: ListBatchCandidateAnimalsParams
): Promise<BatchCandidateAnimal[]> {
  const { data } = await api.V2.get<BatchCandidateAnimalsEnvelope>(
    '/animal-batches/candidate-animals',
    {
      category_uuids: params.category_uuids.length > 0 ? params.category_uuids : undefined,
      without_batch: params.without_batch,
      batch_uuid: params.batch_uuid || undefined,
      parameter_weight_uuid: params.parameter_weight_uuid || undefined,
    }
  );
  return data.data;
}

export { listBatchOptions, listBatchOptionsForForm };
