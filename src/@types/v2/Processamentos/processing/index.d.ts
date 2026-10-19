// src/@types/v2/Processamentos/processing/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Processamentos" (Processing — Operacional > Pecuária,
// 97-Esteiras/039, TASK-FE-039-PROC-01). Confirmado campo a campo contra o
// código REAL da API (`GB.Cerne.Api`), lido pelo Arquiteto Frontend
// (front-plan-proc.md §1):
//   app/Http/Resources/V1/ProcessingResource.php        (leitura — show)
//   app/Http/Resources/V1/ProcessingListResource.php     (leitura — index)
//   app/Http/Requests/Api/V1/ProcessingRequest.php       (escrita — finish)
//   app/Http/Requests/Api/V1/ProcessingIndexRequest.php  (filtro — só `status`)
//   app/Enums/ProcessingStatus.php                       (1=PENDING, 2=FINISHED)
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /processings              → data: ProcessingListItem[], meta paginação REAL
//   GET  /processings/{uuid}       → data: ProcessingDetail (eager parcial)
//   POST /processings/{uuid}/finish → payload FinishProcessingRequest → data: ProcessingDetail
//
// SEM `store`/`update`/`destroy`/`download`/`import` — ciclo vivo (criar
// pendência), cancelamento, download de modelo e importação de planilha são
// OUT_OF_SCOPE (039) por decisão do dono (front-plan-proc.md §1.1/§7 FD3).
//
// FD2 (front-plan-proc.md §3.2/§7) — a listagem NÃO filtra por
// `batch_id`/`area_id`/`grazing_id`: a API filtra por ID INTERNO inteiro,
// mas os catálogos do front só devolvem `{uuid,label}` — sem caminho de
// resolução. Esses 3 campos NÃO entram em `ProcessingFilterForm`/
// `ProcessingFilterRequest` (omitidos por ausência de contrato utilizável,
// não "campo desabilitado").
//
// FD4 (front-plan-proc.md §3.3/§7, REVISTO no round-6/round6-fix-plan.md §3.1) —
// `batch_id` (topo) e `animals_snapshot[]` continuam OPACOS (IDs INTERNOS sem
// label, `@deprecated`) e NUNCA são renderizados. A premissa original — "sem
// caminho de resolução para o Detalhe" — deixou de valer: o `ProcessingResource`
// (round-6, TASK-BE-039-R6-02) passou a expor `animals[]` DISPLAY-READY
// (`{uuid,label}` em cada dimensão relacional), que É a fonte usada pela UI.
//
// Nenhum `id` sequencial exposto como identificador de navegação — sempre
// `uuid` (Lei 1/Lei 10, get_spa_api_client_pattern).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUM BACKED (valor físico exato — app/Enums/ProcessingStatus.php)
// ============================================

export type ProcessingStatusValue = 1 | 2; // 1 = PENDING, 2 = FINISHED

// ============================================
// REF ANINHADA (shape 1:1 com ProcessingResource.php, `whenLoaded`)
// ============================================

export interface ProcessingFarmRef {
  uuid: string;
  description: string | null;
}

// ============================================
// LISTAGEM — `GET /processings` (index).
// ============================================

export interface ProcessingListItem {
  uuid: string;
  code: string;
  date: string; // YYYY-MM-DD
  status: ProcessingStatusValue;
  status_label: string;
  /** FQCN do morph do tipo de origem (`App\Models\X`; linhas legadas `App\X`) — normalizado por `isMovementPurchaseOrigin` (Compra/Transferência de Lote/Desmama/Apartação/Transferência de Animais). */
  type: string;
  type_label: string;
  /** Contagem de animais — origem via morph quando `PENDING`, `jsonb_array_length` quando `FINISHED`. */
  quantity: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// DETALHE — `GET /processings/{uuid}` (show).
// ============================================

export interface ProcessingDetail extends ProcessingListItem {
  is_stock: boolean;
  arroba_value: number | null;
  farm: ProcessingFarmRef | null;
  /**
   * @deprecated FD4 — id interno (inteiro) da tabela `batches`, SEM label
   * resolvível pelo front (o catálogo `batches/options` só devolve
   * `{uuid,label}`). Valor OPACO — NUNCA renderizado, NUNCA tratado como
   * `Option<T>`/entidade navegável. Ver front-plan-proc.md §3.3/§7 FD4.
   */
  batch_id: number | null;
  /**
   * @deprecated FD4 — snapshot dos animais do processamento finalizado, com
   * IDs INTERNOS (`category_id`/`breed_id`/`specie_id`/`batch_id`) sem label
   * resolvível pelo front. Valor OPACO (`Record<string, unknown>[]`) — NUNCA
   * consumido pela UI. Use `animals[]` (round-6, display-ready).
   */
  animals_snapshot: Record<string, unknown>[] | null;
  /**
   * round-6 (TASK-BE-039-R6-02/db-api-plan §2.3) — animais do processamento
   * FINALIZADO, DISPLAY-READY (cada dimensão relacional já resolvida a
   * `{uuid,label}` pelo servidor). SEMPRE array — `[]` em `PENDING` ou
   * snapshot vazio, NUNCA `null`. Tolerante a snapshot incompleto: qualquer
   * dimensão não resolvida vem `null`, nunca omitida.
   */
  animals: ProcessingDetailAnimal[];
  /** ONDA 1 (PROCFID-03) — round-trip do cabeçalho de Pesagem gerado pelo `finish`. `null` antes do `finish` ou sem `Weighing` correlato. */
  weighing: ProcessingWeighingBlock | null;
  /** ONDA 1 (PROCFID-03) — round-trip dos Ultrassons lançados no `finish`. `[]` quando nenhum animal teve `has_ultrasound=true`. */
  ultrasounds: ProcessingUltrasoundRow[];
  /** ONDA 2 (PROCFID-07) — round-trip do bloco sanitário. `null` quando "Fazer Sanitário" não foi usado neste `finish`. */
  sanitary: ProcessingSanitaryBlock | null;
}

// ============================================
// ROUND-6 — blocos DISPLAY-READY do Detalhe (`GET /processings/{uuid}`),
// round6-fix-plan.md §2.3 (animals) e §0.1 (weighing/ultrasounds/sanitary,
// já existentes desde PROCFID-03/07 — só tipados agora).
// ============================================

/** Mirror `ProcessingPrepareOption` (`{uuid,label}`) — reusado para não duplicar shape (round6-fix-plan.md §3.1). */
export type ProcessingRefOption = ProcessingPrepareOption;

export interface ProcessingDetailIdentification {
  id_animal: ProcessingPrepareOption;
  identification: string;
}

export interface ProcessingDetailUltrasoundRef {
  uuid: string;
  date: string;
  aol: number | null;
  egs: number | null;
  marm: number | null;
  classification: string | null;
}

export interface ProcessingDetailAnimal {
  /** `null` quando o `id` congelado no snapshot não resolve mais para um `Animal` existente. */
  uuid: string | null;
  identification: string;
  category: ProcessingRefOption | null;
  breed: ProcessingRefOption | null;
  specie: ProcessingRefOption | null;
  batch: ProcessingRefOption | null;
  /** "Estágio Reprodutivo" (`category_matrice_id`). */
  category_matrice: ProcessingRefOption | null;
  /** Valor cru do snapshot (`App\Enums\ReproductiveStatus`, `0` legado possível). */
  reproductive_status: number | null;
  /** `ReproductiveStatus::description()` — `null` para `0`/`null`/fora do domínio. */
  reproductive_status_label: string | null;
  birth_date: string | null;
  weight: number | null;
  last_weight: number | null;
  last_weight_date: string | null;
  price_kilo_alive: number | null;
  price_arroba_alive: number | null;
  unity_animal_ua: number | null;
  value_unitary: number | null;
  identifications: ProcessingDetailIdentification[];
  has_ultrasound: boolean;
  ultrasound: ProcessingDetailUltrasoundRef | null;
}

export interface ProcessingWeighingAnimal {
  uuid: string;
  animal: ProcessingRefOption | null;
  weight: number;
  last_weight: number;
  last_weight_date: string;
  date: string;
  has_ultrasound: boolean;
}

export interface ProcessingWeighingBlock {
  uuid: string;
  code: string;
  date: string;
  is_stock: boolean;
  arroba_value: number;
  animals: ProcessingWeighingAnimal[];
}

export interface ProcessingUltrasoundRow {
  uuid: string;
  animal: ProcessingRefOption | null;
  date: string;
  aol: number | null;
  egs: number | null;
  marm: number | null;
  classification: string | null;
}

export interface ProcessingSanitaryItem {
  uuid: string;
  product: ProcessingFarmRef;
  warehouse: ProcessingFarmRef;
  measurement: ProcessingFarmRef | null;
  quantity: number;
  total_quantity: number;
  observation: string | null;
}

export interface ProcessingSanitaryBlock {
  uuid: string;
  code: string;
  date: string;
  items: ProcessingSanitaryItem[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /processings)
// ============================================

export interface ProcessingsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ProcessingsListEnvelope {
  success: boolean;
  message: string;
  data: ProcessingListItem[];
  errors: Record<string, string[]> | null;
  meta: ProcessingsApiPaginationMeta | null;
}

// ============================================
// FILTRO — a listagem só filtra por `status` (FD2, `ProcessingIndexRequest`
// real). `batch_id`/`area_id`/`grazing_id` NÃO entram no tipo — omitidos por
// ausência de contrato utilizável (front-plan-proc.md §3.2/§7 FD2), não
// "campo desabilitado".
// ============================================

export interface ProcessingFilterForm {
  status: Option<ProcessingStatusValue> | null;
  /** REWORK (039, FD-R2 desbloqueada) — uuid resolvido server-side, nunca id interno. */
  batch_uuid?: Option<string> | null;
  area_uuid?: Option<string> | null;
  grazing_uuid?: Option<string> | null;
}

export interface ProcessingFilterRequest {
  status?: ProcessingStatusValue;
  /**
   * REWORK (039, FD-R2 desbloqueada) — `index` agora aceita uuid e resolve
   * para id interno server-side (`ProcessingRepository::resolveBatchId()` e
   * equivalentes de Área/Módulo). `area_uuid`⊕`grazing_uuid` exclusivos
   * (`prohibits`, mirror do backend) — nunca enviar os dois juntos.
   */
  batch_uuid?: string;
  area_uuid?: string;
  grazing_uuid?: string;
}

// ============================================
// PREPARE — `GET /processings/{uuid}/prepare` (REWORK 039, PROC-04).
// Resolve o bug de duplicação #2: hidrata `animal_uuid` (presente = roteia o
// `finish` para UPDATE do Animal existente; ausente = cria). Todo campo
// relacional (`category`/`breed`/`specie`/`identifications[].id_animal`) já
// chega como par `{uuid,label}` montado pelo servidor (FD-R1, mirror
// `AnimalResource.php:66-78`) — NUNCA uuid solto. `batch_uuid` nunca é
// hidratado (nenhuma origem prefila lote, mirror exato do legado) — o
// usuário sempre escolhe.
// ============================================

export interface ProcessingPrepareOption {
  uuid: string;
  label: string;
}

/**
 * round-5 (correção do dono) — shape de `category` do `prepare`, DISTINTO de
 * `ProcessingPrepareOption` (`breed`/`specie`/`category_matrice` seguem o
 * genérico). `requires_reproductive_status` (RN-6, round-4) REMOVIDO —
 * gateava o campo "Status Reprodutivo" (`reproductive_status`), extinto do
 * card. Ganha `is_reproductive` (bool, `gender === Gender::FEMALE`), que
 * governa a obrigatoriedade de "Estágio Reprodutivo"
 * (`category_matrice_uuid`) quando a categoria travada (`category_locked`
 * desabilita o select, o `onChange` nunca dispara, então o flag PRECISA vir
 * já pronto do `prepare`).
 */
export interface ProcessingPrepareCategoryOption extends ProcessingPrepareOption {
  is_reproductive: boolean;
}

export interface ProcessingPrepareIdentificationItem {
  id_animal: ProcessingPrepareOption;
  identification: string;
}

export interface ProcessingPrepareAnimalItem {
  /** Presente = UPDATE do Animal existente (fecha o bug #2); ausente = CREATE. */
  animal_uuid: string | null;
  category: ProcessingPrepareCategoryOption | null;
  /** Informativo (badge/hint de UI) — o servidor NUNCA valida "categoria não pode mudar" no `finish`. */
  category_locked: boolean;
  /** `null` só para origem Compra (legado nunca prefila raça de item de Compra). */
  breed: ProcessingPrepareOption | null;
  /** `null` só para origem Compra (legado nunca prefila espécie de item de Compra). */
  specie: ProcessingPrepareOption | null;
  /** REWORK (039, round-3) — "Estágio Reprodutivo" (`category_matrice_id`), hidratação do `prepare`. */
  category_matrice: ProcessingPrepareOption | null;
  weight: number | null;
  value: number | null;
  /** Só presente para origem Desmama — sugestão inicial de `birth_date` no card do animal (Onda 1, PROCFID-02). */
  birth_date: string | null;
  /** Onda 1 (PROCFID-03 API) — `Animal::lastWeighing()->weight`, `null` se o animal nunca foi pesado. */
  last_weight: number | null;
  last_weight_date: string | null;
  identifications: ProcessingPrepareIdentificationItem[];
}

export interface ProcessingPrepareData {
  origin_type: string;
  origin_label: string;
  animals: ProcessingPrepareAnimalItem[];
}

// ============================================
// REACT HOOK FORM — formulário de FINALIZAÇÃO (TASK-FE-039-PROC-03)
// ============================================

/** 1 linha de identificação do sub-repeater `identifications[]` (mirror `BirthAnimalIdentificationForm`). */
export interface ProcessingAnimalIdentificationForm {
  id_animal_uuid: Option<string> | null;
  identification: string;
}

/** 1 linha do repeater `animals[]` — editor manual, SEM pré-preenchimento da origem (FD3). */
export interface ProcessingAnimalForm {
  /** Presente = atualiza Animal existente; ausente/null = cria (mirror payload real, §1.3 do plano). */
  animal_uuid?: string | null;
  category_uuid: Option<string> | null;
  breed_uuid: Option<string> | null;
  /** Tenant-scoped via `X-Farm-Id` — catálogo `batches/options`. */
  batch_uuid: Option<string> | null;
  weight: number | null;
  /** "Valor unitário informado" — base de CV-001/003, NUNCA a fórmula pronta (o servidor recalcula). */
  value: number | null;
  /**
   * CAMPO DE UI (round-5, correção do dono) — `is_reproductive` da categoria
   * selecionada (opção/`prepare.category`), NUNCA no payload
   * (`buildFinishProcessingPayload` monta o item chave por chave — não faz
   * spread, então este campo já não vaza sozinho). Vive no RHF (não
   * `useState`) para sobreviver às DUAS hidratações (`prepare` e rascunho
   * do `localStorage`) — um flag fora do formulário não sobrevive a nenhuma
   * delas quando `category_locked` trava o `onChange`. Substitui
   * `requires_reproductive_status` (round-4) — o campo "Status Reprodutivo"
   * que ele gateava foi extinto; agora governa a obrigatoriedade de
   * "Estágio Reprodutivo" abaixo.
   */
  is_reproductive: boolean;
  /**
   * REWORK (039, round-3, PROC-R3-02) — "Estágio Reprodutivo" (ALVO A:
   * `category_matrice_id`) — lista dinâmica de `category_matrices`.
   * round-5 (correção do dono) — `.required()` CONDICIONAL no client
   * (`processing-schema.ts`, `.when('is_reproductive', ...)`) quando a
   * categoria é FÊMEA; o 422 do servidor continua a autoridade final.
   */
  category_matrice_uuid: Option<string> | null;
  /** Onda 1 (PROCFID-02) — editável, hidratado do `prepare` como sugestão inicial (Optional no servidor). */
  birth_date: string | null;
  /** Onda 1 (PROCFID-02) — controla a visibilidade de `aol`/`egs`/`marm`/`classification`. Default `false`. */
  has_ultrasound: boolean;
  aol: number | null;
  egs: number | null;
  marm: number | null;
  /** Grava em `ultrasounds.class` — nome de propriedade evita a palavra reservada `class`. */
  classification: string | null;
  identifications: ProcessingAnimalIdentificationForm[];
}

export interface FinishProcessingForm {
  date: string | null;
  is_stock: boolean;
  /** Obrigatório SOMENTE quando `is_stock===true` (mirror `Rule::requiredIf` real do backend). */
  arroba_value: number | null;
  /** Onda 1 (PROCFID-01) — flag que controla o bloco "Item Sanitário" (Onda 2, PROCFID-04). */
  sanitary: boolean;
  /** Onda 2 (PROCFID-04) — bloco "Item Sanitário", header-level (não por animal, mirror `_forms.blade.php:45-72`). `[]` quando `sanitary===false` — ao desligar a flag, `FinishProcessing.tsx` zera o array. */
  sanitary_items: SanitaryItemForm[];
  animals: ProcessingAnimalForm[];
}

// ============================================
// SANITÁRIO — ONDA 2 (PROCFID-03/04). Bloco "Item Sanitário", header-level
// (mirror `_card-sanitary-item.blade.php`, confirmado em
// front-plan-proc-fidelidade-sanitaria-rework.md §4.2/§4.3). Reutiliza os
// tipos de opção JÁ EXISTENTES de Produtos/Armazéns/Un. de Medida
// (`ProductOption`/`WarehouseOption`/`MeasurementOption`) — os 4 endpoints
// AJAX de `SanitaryController` (`db-api-plan-proc-fidelidade-sanitaria-
// rework.md §3.6`) reusam os MESMOS Resources já publicados por
// Produtos/Armazéns/Un. de Medida, sem Resource dedicado — não duplicar tipo
// de opção só porque o endpoint é novo.
// ============================================

export interface SanitaryItemForm {
  product_uuid: Option<string> | null;
  warehouse_uuid: Option<string> | null;
  measurement_uuid: Option<string> | null;
  /** "Dose Animal" — o servidor multiplica por nº de animais do `finish` (CV-006). */
  quantity: number | null;
  observation: string | null;
}

export interface SanitaryItemPayload {
  product_uuid: string;
  warehouse_uuid: string;
  measurement_uuid: string;
  quantity: number;
  observation?: string;
}

// ============================================
// REQUEST TYPES (uuid-first, mirror EXATO de `ProcessingRequest::rules()`
// lido no código real — nenhum campo inventado). `farm_id` NUNCA aparece —
// o servidor resolve via `FarmContext`/`X-Farm-Id` (front-plan-proc.md §1.3/§5).
// Campos de efeito diferido (`ultrasound`/`warehouse`/`products`/
// `measurements`/`sanitary_dose`) e os campos recalculados pelo servidor
// (`price_kilo_alive`/`price_arroba_alive`/`value_unitary`/`unity_animal_ua`)
// NUNCA são enviados — o front pode EXIBIR preview read-only, nunca envia.
// ============================================

export interface ProcessingAnimalIdentificationPayload {
  id_animal_uuid: string;
  identification: string;
}

export interface ProcessingAnimalPayload {
  animal_uuid?: string;
  category_uuid: string;
  breed_uuid: string;
  batch_uuid: string;
  weight: number;
  value: number;
  /** PROC-R3-02 (Rota B) — Optional real no servidor (`sometimes|nullable`). */
  category_matrice_uuid?: string;
  /** Onda 1 (PROCFID-02) — Optional real no servidor, omitidos quando ausentes/não preenchidos. */
  birth_date?: string;
  has_ultrasound?: boolean;
  aol?: number;
  egs?: number;
  marm?: number;
  classification?: string;
  identifications: ProcessingAnimalIdentificationPayload[];
}

export interface FinishProcessingRequest {
  date: string;
  is_stock: boolean;
  /** Obrigatório SOMENTE quando `is_stock===true` no servidor (`Rule::requiredIf`). */
  arroba_value?: number;
  /** Onda 1 (PROCFID-01) — flag; Onda 2 (PROCFID-04) — `sanitary_items[]` abaixo. */
  sanitary: boolean;
  /** `[]` quando `sanitary===false` — `ProcessingRequest` valida `required_if:sanitary,true`. */
  sanitary_items: SanitaryItemPayload[];
  animals: ProcessingAnimalPayload[];
}
