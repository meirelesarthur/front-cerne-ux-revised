// src/@types/v2/BreedingMating/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Acasalamento" (BreedingMating — Operacional / Reprodução,
// F-016, 97-Esteiras/001, Tarefa 01). Fundamento consumido pelas Tarefas
// 02-09 (camada de dados e telas). Mirror estrutural de `@/@types/v2/BreedingBatch`
// (mesmo envelope paginado real). `uuid` sempre, `id` nunca (contrato de API
// §6.3, §8). `farm_id`/`tenant_id`/`user_id` NUNCA aparecem em Form/Request —
// nunca são decisão de UI, injetados pelo backend/header (contrato de tela §5).
//
// O envelope de `EP-BM-01` traz um campo extra de cor bruta (hex) que o
// front NUNCA tipa nem lê (GAP-FE-BM-01) — o mapa `status.value → token`
// vive em `src/constants/breedingMating/breeding-mating-status.ts`. Campo
// deliberadamente OMITIDO de `BreedingMatingListItem` (estrutural: campos
// extras do servidor não tipados não quebram o parse).
//
// Diagnóstico de Gestação (entidade aninhada) tem tipos PRÓPRIOS em
// `./pregnancyDiagnosis/index.d.ts` — não duplicados aqui.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// LOOKUPS (options planas — resposta PLANA, sem paginação/meta)
// ============================================

/** Ref genérica de lookup (`{uuid,label}`) — providers, produtos, armazéns,
 *  medidas, score corporal, estações, touros/sêmen, protocolo, lote. */
export interface EntityOptionRef {
  uuid: string;
  label: string;
}

/** Ref de animal (vaca/touro) — identificado por `código`, mirror
 *  `BatchOptionRef` de `@/@types/v2/BreedingBatch`. */
export interface AnimalOptionRef {
  uuid: string;
  code: string;
}

// ============================================
// ENUMS (mirror do par {value,label} devolvido pelo servidor)
// ============================================

/** `App\Enums\BreedingMatingType` (REUSO INTEGRAL do backend): 1=NATURAL, 2=IATF, 3=FIV. */
export type BreedingMatingTypeValue = 1 | 2 | 3;

/** `App\Enums\BreedingMatingLaunchType`: 1=Normal, 2=Simplificado. */
export type BreedingMatingLaunchTypeValue = 1 | 2;

/** `App\Enums\BreedingMatingStatus`: 0=legado (tolerado, label "—"),
 *  1=Em Andamento, 2=Finalizado (OQD-006 — nunca cast estrito no backend). */
export type BreedingMatingStatusValue = 0 | 1 | 2;

/** `ink` de `mating_protocol_animals` — 'S'-Sim, 'P'-Pouca, 'N'-Não. Só
 *  existe/visível quando `type.value === 2` (IATF), nunca em FIV. */
export type InkValue = 'S' | 'P' | 'N';

export interface EnumValueLabel<V> {
  value: V;
  label: string;
}

// ============================================
// LISTAGEM — `EP-BM-01` `GET /breeding-matings`
// ============================================

export interface BreedingMatingListItem {
  uuid: string;
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  resync: boolean;
  type: EnumValueLabel<BreedingMatingTypeValue>;
  launch_type: EnumValueLabel<BreedingMatingLaunchTypeValue>;
  status: EnumValueLabel<BreedingMatingStatusValue>;
  responsible_name: string;
  last_protocol_identification: string | null;
  can_edit: boolean;
  can_next_step: boolean;
  can_finish: boolean;
  can_delete: boolean;
  can_pregnancy_diagnosis: boolean;
}

export interface BreedingMatingApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface BreedingMatingsListEnvelope {
  success: boolean;
  message: string;
  data: BreedingMatingListItem[];
  errors: Record<string, string[]> | null;
  meta: BreedingMatingApiPaginationMeta | null;
}

// ============================================
// DETALHE — `EP-BM-02` `GET /breeding-matings/{uuid}`
// `natural`/`simplified`/`protocol` — exatamente um preenchido (contrato §5.2).
// ============================================

export interface BreedingMatingNaturalDetail {
  bull: AnimalOptionRef;
  cows: AnimalOptionRef[];
}

export interface BreedingMatingProtocolAnimalLine {
  /** uuid de `mating_protocol_animals` — presente em leitura; usado no Form
   *  para discriminar update (com uuid) de criação (sem uuid), contrato de
   *  API §7.5. */
  uuid?: string;
  animal: AnimalOptionRef;
  /** 'HH:mm' — nulo no fluxo Simplificado (não usa horário). */
  time: string | null;
  body_score: EntityOptionRef | null;
  /** Só existe/visível quando `type.value === 2` (IATF) — nunca em FIV. */
  ink: InkValue | null;
  eligible: boolean;
  /** "Funcionário/Inseminador" no formulário — `provider_id` do legado. */
  provider: EntityOptionRef | null;
  /** "Produtos" (`SelectMulti`) — obrigatório quando `eligible=true` e não
   *  há `batch` (transferência dispensa produtos, `bm-effect-batch-transfer`). */
  products: EntityOptionRef[];
  /** "Sêmen" (IATF) ou "Embrião" (FIV) — mesmo campo (`seed_id`), rótulo
   *  dinâmico por `type.value` (contrato de tela §6.3.2, regra 5 da Tarefa). */
  semen_or_embryo: EntityOptionRef | null;
  /** "Transferência/Lote" — quando preenchido, dispensa `products`. */
  batch: EntityOptionRef | null;
  /** Etapa (`DZERO`/`D8`/`D12`…) a que esta linha pertence — mirror
   *  `BreedingMatingProtocolLineResource.php:44` (`GAP-FE-BM-18`). Usado pelo front só para
   *  AGRUPAR/rotular a tabela de animais por etapa (`ProtocolDetailBlock.tsx`); o array já vem
   *  ordenado pelo servidor, nunca reordenado no front. */
  protocol_identification: string;
  /** 'YYYY-MM-DD' — data da linha, mirror `BreedingMatingProtocolLineResource.php:45`
   *  (`GAP-FE-BM-18`). Só apresentação (máscara de exibição já usada no módulo), nenhum
   *  cálculo no front. */
  date: string | null;
}

export interface BreedingMatingProtocolTimelineStep {
  protocol_identification: string;
  /** Intervalo em dias a partir da etapa anterior (`buildTimeline()`, servidor). */
  days_from_previous: number;
  /** 'YYYY-MM-DD' — mirror `BreedingMatingTimelineResource.php:28-39` (`GAP-FE-BM-18`). */
  date: string | null;
  /** 'HH:mm' — mirror wire, já pronto do servidor. */
  time: string | null;
  /** Dia da semana já em PT-BR pronto do servidor (`BreedingMatingResource::WEEKDAYS`) — o
   *  front NUNCA traduz/recalcula este campo. */
  weekday: string;
  /** Unidade de medida da etapa — campo SINGULAR (1 por nó da timeline), NÃO um array
   *  paralelo a `products`/`quantities` (mirror exato do wire, `buildTimeline()` só grava na
   *  primeira linha de cada data agrupada). Nunca pareado produto-a-produto. */
  measurement: string;
  /** Produtos da etapa — array paralelo a `quantities` (mesmo índice = mesmo produto),
   *  podendo ter mais de 1 produto simultâneo por etapa. */
  products: string[];
  /** Serviço(s) da etapa — já vêm como label PT-BR pronto do servidor
   *  (`BreedingMatingResource::SERVICE_LABELS`), nunca reformatado/traduzido no front. */
  services: string[];
  /** Paralelo a `products` (mesmo índice). `''` é a sentinela de "sem produto neste slot"
   *  (`buildTimeline()`) — o front trata como ausência, nunca como `0`. */
  quantities: Array<number | string>;
}

export interface BreedingMatingProtocolDetail {
  animals: BreedingMatingProtocolAnimalLine[];
  /** Só existe dentro do bloco `protocol` (contrato de API §6.3). */
  timeline: BreedingMatingProtocolTimelineStep[];
  /** Nome do protocolo (ex. "Protocolo Carioca") — mirror
   *  `BreedingMatingResource::buildProtocolBlock()['description']` (`GAP-FE-BM-18`). `null`
   *  quando o servidor genuinamente não resolve a descrição (não confundir com sentinela de
   *  UI). */
  description: string | null;
}

export interface BreedingMatingSimplifiedAnimalLine {
  uuid?: string;
  animal: AnimalOptionRef;
  warehouse: EntityOptionRef;
  /** `stock_uuid` = registro de estoque usado no payload de edição (EP-BM-02/04). */
  product: EntityOptionRef & { stock_uuid?: string | null };
  measurement: EntityOptionRef;
  /** Estoque disponível no momento da consulta — só apresentação (`InputReadOnly`). */
  stock: number;
  quantity: number;
  /** "Funcionário/Inseminador" da linha simplificada. */
  provider: EntityOptionRef | null;
}

export interface BreedingMatingSimplifiedDetail {
  animals: BreedingMatingSimplifiedAnimalLine[];
}

export interface BreedingMatingData {
  uuid: string;
  code: string;
  date: string;
  resync: boolean;
  type: EnumValueLabel<BreedingMatingTypeValue>;
  launch_type: EnumValueLabel<BreedingMatingLaunchTypeValue>;
  status: EnumValueLabel<BreedingMatingStatusValue>;
  responsible_name: string;
  /** Ausente (`null`) quando `launch_type=2` (Simplificado dispensa estação/lote). */
  breeding_season: EntityOptionRef | null;
  breeding_batch: EntityOptionRef | null;
  natural: BreedingMatingNaturalDetail | null;
  simplified: BreedingMatingSimplifiedDetail | null;
  protocol: BreedingMatingProtocolDetail | null;
  /** Ref selecionável de "Touro/Sêmen/Embrião" (`GAP-FE-BM-04`/`TASK-BM-FE-18`) — mirror
   *  `breeding_season`/`breeding_batch`. `null` só quando o servidor genuinamente não tem o
   *  dado (ex. registro legado sem a FK preenchida); não confundir com o sentinela de UI
   *  `LOCKED_UNKNOWN_OPTION_VALUE` (`acasalamento-form-mapper.ts`), que é aplicado só no
   *  front quando este campo vem `null`. */
  bull_seed_season: EntityOptionRef | null;
  /** Ref de NOME do protocolo escolhido (`GAP-FE-BM-04`/`TASK-BM-FE-18`) — distinto do bloco
   *  `protocol` acima (detalhe `{animals,timeline}`); mesma nota de `null` genuíno vs.
   *  sentinela de UI. */
  protocol_reference: EntityOptionRef | null;
  /** Identificação ATUAL do protocolo persistida (`GAP-FE-BM-04`/`ERRO-03`, mirror
   *  `BreedingMatingController::edit()` linha 236) — reenviada no `PUT` (payload wire-level
   *  `CreateBreedingMatingRequest.protocol_identification`). Distinta da identificação da
   *  PRÓXIMA etapa (`StoreBreedingMatingNextStepRequest`, `TASK-BM-FE-17`). */
  last_protocol_identification: string | null;
}

// ============================================
// CONTEXTO DO FORMULÁRIO — `EP-BM-03` (criação) / `EP-BM-04` (edição)
// `field_matrix`/`locked_fields` são AUTORIDADE (contrato de tela §5.3) — o
// front aplica, nunca infere.
// ============================================

export interface BreedingMatingFieldMatrixEntry {
  required: boolean;
  visible: boolean;
}

/** Chave = nome do campo do formulário (`breeding_season_uuid`, `animals`, …). */
export type BreedingMatingFieldMatrix = Record<string, BreedingMatingFieldMatrixEntry>;

/** Chave = nome do campo; `true` = travado (readonly) no modo atual. */
export type BreedingMatingLockedFields = Record<string, boolean>;

export interface BreedingMatingFormContextLookups {
  breeding_seasons: EntityOptionRef[];
  providers: EntityOptionRef[];
  body_scores: EntityOptionRef[];
  warehouses: EntityOptionRef[];
  transfer_batches: EntityOptionRef[];
}

export interface BreedingMatingFormContext {
  next_code: string;
  field_matrix: BreedingMatingFieldMatrix;
  locked_fields: BreedingMatingLockedFields;
  lookups: BreedingMatingFormContextLookups;
  /** Só presente em `EP-BM-04` (contexto de edição) — registro hidratado. */
  breeding_mating?: BreedingMatingData;
}

// ============================================
// CASCATAS — `EP-BM-11` (animais do lote) / `EP-BM-12` (contexto da estação)
// ============================================

export interface BreedingStockProductRef {
  uuid: string;
  description: string;
  code: string | null;
}

export interface BreedingStockWarehouseRef {
  uuid: string;
  name: string;
}

/** Item do protocolo com dose/armazém/saldo (`EP-BM-12` `protocols[].items[]`, `EP-BM-09` `protocol_items[]`). */
export interface BreedingProtocolStockItem {
  identification: string;
  service?: string | null;
  product: BreedingStockProductRef | null;
  product_description?: string | null;
  dose: number;
  warehouse: BreedingStockWarehouseRef | null;
  stock_balance: number | null;
  conversion_factor: number | null;
  factor_type: 'M' | 'D' | null;
  measurement: string | null;
  product_measurement: string | null;
  dose_in_stock_unit: number | null;
  has_valid_stock: boolean;
}

/** Produto de Sêmen/Embrião do Touro/Sêmen (`EP-BM-12` `bull_seed_seasons[].products[]`, `EP-BM-09` `bull_seed_season.products[]`). */
export interface BreedingSeedStockProduct {
  uuid: string;
  description: string;
  measurement_name?: string | null;
  has_valid_stock: boolean;
  product?: BreedingStockProductRef;
  dose?: number | null;
  warehouse?: BreedingStockWarehouseRef | null;
  stock_balance?: number | null;
}

export interface BreedingSeasonProtocolRef extends EntityOptionRef {
  items: BreedingProtocolStockItem[];
}

export interface BreedingSeasonBullSeedRef extends EntityOptionRef {
  products: BreedingSeedStockProduct[];
}

export interface BreedingSeasonCascadeContext {
  bull_seed_seasons: BreedingSeasonBullSeedRef[];
  protocols: BreedingSeasonProtocolRef[];
  breeding_batches: EntityOptionRef[];
}

// ============================================
// FILTRO (drawer da listagem, Tarefa 03)
// ============================================

export interface BreedingMatingFilterForm {
  responsible: Option<string> | null;
  breeding_batch: Option<string> | null;
}

export interface BreedingMatingFilterRequest {
  user_uuid?: string;
  breeding_batch_uuid?: string;
}

// ============================================
// REACT HOOK FORM (create/edit, Tarefas 04/05)
// ============================================

export interface BreedingMatingNaturalFormValue {
  bull: Option<string> | null;
  cows: Option<string>[];
}

export interface BreedingMatingProtocolAnimalFormValue {
  uuid?: string;
  animal: Option<string> | null;
  time: string | null;
  body_score: Option<string> | null;
  ink: Option<InkValue> | null;
  eligible: boolean;
  provider: Option<string> | null;
  products: Option<string>[];
  semen_or_embryo: Option<string> | null;
  batch: Option<string> | null;
}

export interface BreedingMatingSimplifiedAnimalFormValue {
  uuid?: string;
  animal: Option<string> | null;
  warehouse: Option<string> | null;
  product: (Option<string> & { stock_uuid?: string | null }) | null;
  measurement: Option<string> | null;
  stock: number;
  quantity: number | null;
  provider: Option<string> | null;
}

export interface BreedingMatingForm {
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  responsible_name: string;
  type: Option<BreedingMatingTypeValue> | null;
  launch_type: Option<BreedingMatingLaunchTypeValue> | null;
  breeding_season: Option<string> | null;
  bull_seed_season: Option<string> | null;
  protocol: Option<string> | null;
  breeding_batch: Option<string> | null;
  natural: BreedingMatingNaturalFormValue;
  protocol_animals: BreedingMatingProtocolAnimalFormValue[];
  simplified_animals: BreedingMatingSimplifiedAnimalFormValue[];
  /** Campo interno de carregamento/ressubmissão (mirror `type`/`protocol_uuid`) — NUNCA um
   *  input visível/editável na UI (`ERRO-03`). `'DZERO'` na criação; identificação ATUAL
   *  hidratada na edição. */
  protocol_identification: string;
}

// ============================================
// REQUEST TYPES (payload wire-level — POST/PUT)
// ============================================

export interface CreateOrUpdateBreedingMatingNaturalPayload {
  bull_uuid: string;
  cow_uuids: string[];
}

export interface CreateOrUpdateBreedingMatingProtocolAnimalPayload {
  /** Presente → update da linha; ausente → criação; linha existente ausente
   *  do payload → exclusão com restauração de estoque (contrato de API §7.5). */
  uuid?: string;
  animal_uuid: string;
  time: string | null;
  body_score_uuid: string | null;
  ink: InkValue | null;
  eligible: boolean;
  provider_uuid: string | null;
  product_uuids: string[];
  seed_uuid: string | null;
  batch_uuid: string | null;
}

export interface CreateOrUpdateBreedingMatingSimplifiedAnimalPayload {
  uuid?: string;
  animal_uuid: string;
  warehouse_uuid: string;
  stock_uuid: string;
  measurement_uuid: string;
  quantity: number;
  provider_uuid: string | null;
}

export interface CreateBreedingMatingRequest {
  /** 'YYYY-MM-DD'. */
  date: string;
  type: BreedingMatingTypeValue;
  launch_type: BreedingMatingLaunchTypeValue;
  /** `null` permitido só quando `launch_type=2` (CLM-004 — inversão de
   *  obrigatoriedade; autoridade real é o `field_matrix` do servidor). */
  breeding_season_uuid: string | null;
  bull_seed_season_uuid: string | null;
  protocol_uuid: string | null;
  breeding_batch_uuid: string | null;
  natural: CreateOrUpdateBreedingMatingNaturalPayload | null;
  protocol_animals: CreateOrUpdateBreedingMatingProtocolAnimalPayload[] | null;
  simplified_animals: CreateOrUpdateBreedingMatingSimplifiedAnimalPayload[] | null;
  /** `'DZERO'` sentinela na criação; identificação ATUAL na edição; `null` fora do modo
   *  Protocolo Normal (`ERRO-03`). */
  protocol_identification: string | null;
}

/** `type` e `protocol_uuid` são imutáveis após a criação (CLM-002, contrato
 *  de API §11.11) — mas o backend exige RESSUBMISSÃO do valor atual, não
 *  omissão (confirma igualdade em `withValidator`, GAP-FE-BM-15). Os dois já
 *  são sempre reenviados: `type` desde `TASK-BM-FE-20`; `protocol_uuid`
 *  desde `TASK-BM-FE-18`, que entregou `protocol_reference` real em
 *  `EP-BM-04.breeding_mating` (`GAP-FE-BM-04`) — nenhum campo precisa mais
 *  ser omitido do payload de update. */
export type UpdateBreedingMatingRequest = CreateBreedingMatingRequest;

// ============================================
// PRÓXIMA ETAPA — `EP-BM-09` (contexto) / `EP-BM-10` (salvar)
// ============================================

/** Produto do Touro/Sêmen/Embrião vinculado, com sinalização de estoque válido — mirror
 *  `BreedingMatingNextStepContextResource::mapBullSeedSeason()`. */
export type BullSeedSeasonProductWithStockRef = BreedingSeedStockProduct;

/** Mirror `BreedingMatingNextStepContextResource::mapBullSeedSeason()` — só presente quando o
 *  Acasalamento tem `bull_seed_season_id`. */
export interface BullSeedSeasonWithProductsRef {
  uuid: string;
  description: string;
  products: BullSeedSeasonProductWithStockRef[];
}

/** Contexto de leitura de `EP-BM-09` — mirror EXATO de
 *  `GetBreedingMatingNextStepContextAction`/`BreedingMatingNextStepContextResource`. Não é uma
 *  lista de linhas já prontas: `eligible_animals` é MATÉRIA-PRIMA para o front montar as linhas
 *  da PRÓXIMA identificação (mirror `_card_protocol_identification.blade.php`, branch sem
 *  linhas salvas para a identificação de destino — único caminho implementado pela Action). */
export interface BreedingMatingNextStepContext {
  /** Eco de `?mode=individual` — `GAP-BM-19`/`TASK-BM-19` corrigiram a premissa anterior (que
   *  citava CLM-022 incorretamente: aquela claim só cobre a condição de EXIBIÇÃO dos 2 botões na
   *  LISTAGEM, nunca o comportamento da tela de destino). O servidor agora RAMIFICA por este
   *  campo (`eligible_animals`/`protocol_animal_options` abaixo); a tela continua sem INFERIR
   *  diferença própria — só consome o sinal já pronto do servidor (`GAP-FE-BM-17`/`TASK-BM-FE-22`). */
  mode: 'normal' | 'individual';
  /** Próxima identificação do protocolo — se já for a última, repete a mesma (regra de
   *  fidelidade #1, não borda — contrato de tela §6.5). `null` só quando `protocol_id` é nulo. */
  identification: string | null;
  /** 'YYYY-MM-DD' — data correspondente a `identification`; mesma regra de repetição. */
  identification_date: string | null;
  /** Animais elegíveis da identificação ATUAL (`eligible=true`, categoria [1,2,3]) — 1 linha
   *  nova por animal, Animal pré-selecionado, demais campos em branco/padrão. Vazio (`[]`)
   *  quando `mode === 'individual'` (`GAP-BM-19`/`TASK-BM-19`) — sinal explícito do servidor de
   *  "não semear o lote"; a tela renderiza, nesse caso, exatamente 1 linha em branco (mirror
   *  `matingAnimal=null` do legado, `GAP-FE-BM-17`/`TASK-BM-FE-22`), usando
   *  `protocol_animal_options` (não este campo) como pool do `<select>` de Animal da linha. */
  eligible_animals: EntityOptionRef[];
  /** Pool completo do `<select>` de Animal em modo individual — TODO o histórico de
   *  `matingProtocolAnimals` deste Acasalamento, SEM recorte por elegibilidade/identificação
   *  atual (mirror `_card_animals_protocol.blade.php:9-15`). Campo NOVO (`GAP-BM-19`/`TASK-BM-19`),
   *  preenchido nos DOIS modos pelo servidor, mas só consumido pela tela quando
   *  `mode === 'individual'` (`GAP-FE-BM-17`/`TASK-BM-FE-22`) — o modo normal continua usando
   *  `eligibleAnimals` de `useBreedingBatchAnimalsCascade` para as opções do select (inalterado). */
  protocol_animal_options: EntityOptionRef[];
  /** Produtos do protocolo para a identificação atual. Tipado por fidelidade ao wire; a tela
   *  consome `protocol_items` (mesmos produtos, com dose/armazém/saldo). */
  products: EntityOptionRef[];
  /** Itens do protocolo da identificação seguinte (`identification`), com dose/armazém/saldo. */
  protocol_items: BreedingProtocolStockItem[];
  /** Sêmen/Embrião do touro vinculado — opções e totalizador de Sêmen/Embrião (UT-000705). */
  bull_seed_season: BullSeedSeasonWithProductsRef | null;
  /** Lotes candidatos a transferência. REDUNDANTE com `useTransferBatchOptions` (`EP-BM-13`),
   *  já conectado nesta tela — mesma nota acima. */
  transfer_batches: EntityOptionRef[];
}

export interface StoreBreedingMatingNextStepRequest {
  /** Mirror do hidden input `protocol_identification` do legado
   *  (`_card_protocol_identification.blade.php:3`) — sempre reenviado no submit; grava
   *  `last_protocol_identification` no servidor (`EP-BM-10`, `StoreBreedingMatingNextStepAction`).
   *  Fonte: `nextStepContext.identification` (já carregado por `EP-BM-09`, GAP-FE-BM-13). */
  protocol_identification: string;
  protocol_animals: CreateOrUpdateBreedingMatingProtocolAnimalPayload[];
}

// ============================================
// TRANSFERÊNCIA DE LOTE — `EP-BM-13` (opções)
// `EP-BM-15` (`POST /animals/batch-transfer`) é REUSO INTEGRAL — payload é
// `TransferAnimalsBatchPayload` de `@/@types/v2/Animals` (endpoint
// COMPARTILHADO com Animais/Lote, `DEC-028`). Não redeclarado aqui.
// ============================================

/** Ref de lote de destino elegível (`EP-BM-13`) — exclui os já pertencentes
 *  ao lote de reprodução atual (contrato de tela §3.6). */
export type TransferBatchOptionRef = EntityOptionRef;
