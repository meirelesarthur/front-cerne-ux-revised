// src/@types/v2/Batches/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo LOTES ANIMAIS (Batch — Cadastros Base / Pecuária).
//
// REGENERADO (TASK-FE-1080/1081) contra `animal-batch-contrato.md` v1.1
// (APROVADO) + leitura DIRETA do `AnimalBatchResource`/`AnimalBatchRequest`
// reais (`GB.Cerne.Api/app/Http/Resources/AnimalBatchResource.php:12-49` +
// `app/Http/Requests/AnimalBatchRequest.php:24-71`) — o tipo anterior
// (`quantity_animals`, sem `specie_uuid`/`status`/`categories`/`animals`) era
// herdado do lote pré-regeneração e não refletia o contrato. Régua = Resource
// real, não a expectativa do @types anterior — 12 campos conferidos linha a
// linha no Resource (`uuid`/`description`/`date`/`employee_uuid`/
// `specie_uuid`/`status`/`code`/`employee`/`specie`/`categories`/`animals`/
// `total_animals`).
//
// `BatchOption`/`BatchOptionsListEnvelope` (options-source do Select de Lote
// no filtro de Animal/Rebanho, `GET /batches/options`, outro consumidor —
// TASK-FE-880/881) — PRESERVADOS, intocados, mesmo model mas endpoint/uso
// diferente do CRUD desta Tarefa.
//
// `status`: NUNCA um campo do formulário (contrato v1.1 §3 — removido das
// `rules()`, nasce sempre `'A'`, só muda via `archive`) — existe aqui só
// porque é um campo de LEITURA (badge da grid/detalhe).
//
// `categories`/`total_animals`: DERIVADOS na leitura a partir dos animais
// vinculados (contrato v1.1 §3, `TASK-BE-958` em andamento no momento desta
// entrega — ver pendência de integração no relatório da Tarefa). `animals`
// só vem preenchido quando a relação foi eager-loaded (detalhe/store/update
// — omitido na listagem, que usa `withCount`, Resource real linhas 32-40).
// `total_animals` está SEMPRE presente (nunca omitido, Resource linhas 41-48).
// -----------------------------------------------------------------------------

import type { BatchStatus } from '@/constants/cadastrosBase/Batches/batch-status';

export interface BatchOption {
  uuid: string;
  label: string;
}

export interface BatchOptionsListEnvelope {
  success: boolean;
  message: string;
  data: BatchOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ---- Envelope cru do backend (ApiResponse::paginated) — GET /animal-batches
// (TASK-FE-1083, correção de tipo do `batch-service.ts`: o service anotava
// `getBatches` com `ResponsePagination<BatchData>` — SINGULAR, shape já
// adaptado — quando o retorno cru de rede é `{data: BatchData[], meta}`,
// mesmo formato de `CategoryAnimalsListEnvelope`/`FunctionsListEnvelope`).
export interface BatchesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface BatchesListEnvelope {
  success: boolean;
  message: string;
  data: BatchData[];
  errors: Record<string, string[]> | null;
  meta: BatchesApiPaginationMeta | null;
}

// ---- Referências aninhadas (whenLoaded no Resource real) -------------------

export interface BatchEmployeeRef {
  uuid: string;
  name: string;
}

export interface BatchSpecieRef {
  uuid: string;
  description: string;
}

export interface BatchCategoryRef {
  uuid: string;
  description: string;
}

// TASK-FE-1090 — mesma forma de `BatchSpecieRef`/`BatchCategoryRef`
// (`AnimalBatchResource.php:74-77`, aninhado, `whenLoaded('parameterWeight')`).
export interface BatchParameterWeightRef {
  uuid: string;
  description: string;
}

export interface BatchAnimalRef {
  uuid: string;
  identification: string;
}

// ---- Leitura (AnimalBatchResource — index/show/store/update/archive) ------
//
// Único shape para listagem e detalhe (o Resource real é o mesmo nos dois
// verbos, `animals` só varia por eager-load) — `animals`/`categories`/
// `employee`/`specie` opcionais (whenLoaded pode omitir); `total_animals`
// obrigatório (sempre presente).
export interface BatchData {
  uuid: string;
  code: string;
  description: string;
  date: string;
  employee_uuid: string | null;
  specie_uuid: string;
  /** Campo "Peso", OPCIONAL (`agro365/resources/views/batches/_forms.blade.php:20`) — TASK-BE-970, acesso DIRETO (nunca `whenLoaded`), mesmo padrão de `employee_uuid`/`specie_uuid` acima. `null` quando o Lote não tem Peso associado. */
  parameter_weight_uuid: string | null;
  status: BatchStatus;
  employee?: BatchEmployeeRef;
  specie?: BatchSpecieRef;
  /** Objeto aninhado (`whenLoaded('parameterWeight')`, TASK-BE-970) — `null` quando o Lote não tem Peso, omitido quando a relação não foi eager-carregada. */
  parameter_weight?: BatchParameterWeightRef | null;
  /** Derivado na leitura a partir dos animais vinculados (contrato v1.1 §3) — nunca preservar client-side. */
  categories?: BatchCategoryRef[];
  /** Só presente quando a relação foi eager-loaded (detalhe/store/update — omitido na listagem). */
  animals?: BatchAnimalRef[];
  /** SEMPRE presente (Resource real, nunca omitido). */
  total_animals: number;
}

/** Alias semântico — mesma forma de `BatchData`, usado nas colunas da grid (TASK-FE-1080). */
export type BatchListItem = BatchData;

/** Alias semântico — mesma forma de `BatchData`, usado no detalhe/form (TASK-FE-1081). */
export type BatchDetail = BatchData;

// ---- Escrita (AnimalBatchRequest::rules(), store×update idênticas) --------
//
// `status`/`corral_uuid` FORA deste tipo de propósito — `status` não é input
// do cliente em nenhum verbo (contrato v1.1 §3); `corral_uuid` fora da tela
// por ora (`FeedlotCorral` não migrado, contrato v1.1 §5.1 — a Request aceita
// o campo, mas esta Tarefa não o expõe na UI).
export interface BatchForm {
  description: string;
  date: string;
  specie_uuid: string;
  employee_uuid?: string | null;
  /** `nullable|uuid` (TASK-FE-1090/TASK-BE-970) — campo OPCIONAL, mesmo nome do filtro irmão de candidatos (`ListBatchCandidateAnimalsParams.parameter_weight_uuid`). Sempre enviado no payload (`null` quando vazio, nunca a chave omitida). */
  parameter_weight_uuid?: string | null;
  /** `required|array|min:1` (M4/GAP-476). */
  category_uuids: string[];
  /** `nullable|array` (D4) — um Lote pode nascer sem animal. */
  animal_uuids?: string[] | null;
}

export interface BatchFilterForm {
  search?: string;
}

// ---- Candidatos de animais para vínculo (TASK-FE-1089) --------------------
//
// `GET /api/v1/animal-batches/candidate-animals` — devolve TODOS os
// candidatos SEM paginação (decisão do dev; maior grupo observado tem 5.085
// animais). Cada item já traz `ua` NÃO arredondado por animal (contrato:
// front soma, nunca replica a constante `450`) e `identification` já
// concatenada pelo backend (`"662 - Z3159"` ou `"S/ID"` — nunca remontar
// `{id} – {ident}` aqui). `quantity` pode ser > 1 (mesmo registro
// representando várias cabeças) — é o denominador real das médias do
// rodapé, não a contagem de linhas selecionadas.
export interface BatchCandidateAnimal {
  uuid: string;
  identification: string;
  weight: number;
  quantity: number;
  ua: number;
  /** Mesma forma de `BatchCategoryRef` — categoria real do animal candidato. */
  category: BatchCategoryRef;
}

export interface BatchCandidateAnimalsEnvelope {
  success: boolean;
  message: string;
  data: BatchCandidateAnimal[];
  errors: Record<string, string[]> | null;
  meta: null;
}
