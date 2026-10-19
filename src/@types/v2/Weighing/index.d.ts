// src/@types/v2/Weighing/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do CRUD RAIZ de Pesagem (Weighing — Operacional > Pecuária > Manejo,
// F-071, TASK-PES-FE-01). Consome os 9 endpoints NOVOS `WeighingController`
// (`/weighings*`) + 4 lookups reusados de Sanitário — CTR-PES
// (`CORE_WORKSPACE/01-Arquitetura_e_Contratos/contrato-api-lane-c-pesagem.md`,
// CONTRATO_AUTOAPROVADO, Tester ✅).
//
// Diretório `Weighing` (singular, mesma convenção de `Weaning`) — SEM colisão
// de nome com `@/@types/v2/FeedlotMap/weighing.ts` (Mapa de Confinamento,
// execução 042, mesmo domínio de negócio, bounded context DIFERENTE —
// contrato-tela-lane-c-pesagem-frontend.md §4).
//
// Envelope `ApiResponse {success,message,data,errors,meta}`, `uuid` sempre,
// `id` nunca.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { SanitaryStockFieldOption } from '@/@types/v2/Sanitaries';

// ---------------------------------------------------------------------------
// Listagem (`EP-PES-01`) — `GAP-FE-PES-01` FECHADO nesta Tarefa (TASK-PES-FE-02):
// o default proposto (contrato-tela §6.1, condensação do `list_manifest` legado)
// incluía Ganho Médio/GMD, mas `WeighingListResource` (leitura direta do
// worktree da API, `app/Http/Resources/V1/WeighingListResource.php`) NÃO
// devolve esses 2 campos — a listagem só tem `withCount('animalWeighings')`/
// `withAvg('animalWeighings','weight')` (Qtd. Animais/Peso Médio); Ganho
// Médio/GMD exigiriam `last_weight`/`last_weight_date` por animal, que só
// existem no DETALHE (`EP-PES-02`), não no Resource de listagem. Colunas
// fechadas: Código/Data/Lote-Categoria/Qtd.Animais/Peso Médio/Ações (6, não
// 8) — ver Histórico da Tarefa 35 para a divergência completa, mesma técnica
// de fechamento já aplicada ao `GAP-FE-SAN-01` irmão (`@/@types/v2/Sanitaries`).
// Tipo agora espelha o Resource real 1:1 (`uuid`/`code`/`date`/`is_stock`/
// `arroba_value`/`batch`/`category`/`animals_count`/`average_weight`/`created_at`).
// ---------------------------------------------------------------------------
export interface WeighingBatchRef {
  uuid: string;
  name: string;
}

export interface WeighingCategoryRef {
  uuid: string;
  name: string;
}

export interface WeighingListItem {
  uuid: string;
  code: string;
  date: string; // YYYY-MM-DD
  is_stock: boolean;
  arroba_value: number | null;
  batch: WeighingBatchRef | null;
  category: WeighingCategoryRef | null;
  animals_count: number;
  /** `null` quando o registro ainda não tem nenhum `AnimalWeighing` (withAvg sem match). */
  average_weight: number | null;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Detalhe (`EP-PES-02`) — usado por edição e visualização. Animais já
// resolvidos (identificação/peso/último peso/data/ultrassom) e bloco
// sanitário (itens já resolvidos por Stock) quando `sanitary_id` existir
// (contrato-tela §5.3).
//
// ACHADO CONFIRMADO na TASK-PES-FE-05 (leitura direta do worktree irmão da
// API, `app/Http/Resources/V1/WeighingResource.php::toArray()`, linhas
// 39-54) — CORRIGE a divergência documentada por `CreateOrUpdateWeighing.tsx`
// (TASK-PES-FE-04): o shape real de cada linha é ANINHADO, com um `uuid`
// PRÓPRIO da linha (`AnimalWeighing`, necessário para o round-trip
// `row_uuid` do contrato-tela §6.7/matriz FID-G3F §2.2, "upsert por uuid, não
// por posição") e um objeto `animal` aninhado (`{uuid, identification}` ou
// `null` se a relação não veio carregada) — NUNCA os campos flat
// `animal_uuid`/`identification` no topo que a versão anterior deste tipo
// fingia existir. `WeighingAnimalsSection`/`WeighingAnimalRow`
// (TASK-PES-FE-05) são os primeiros consumidores reais deste tipo.
// ---------------------------------------------------------------------------
/**
 * Ultrassom da linha (correção de fidelidade, 97-Esteiras/002 execução 002
 * lane C) — leitura direta do worktree irmão da API,
 * `WeighingResource::toArray()`: `null` quando a linha não tem exame
 * vinculado (`relationLoaded('ultrasound') && ultrasound !== null`), mirror
 * `ProcessingDetailUltrasoundTable`/`ultrasounds[]`.
 */
export interface WeighingAnimalUltrasoundDetail {
  uuid: string;
  aol: number | null;
  egs: number | null;
  marm: number | null;
  classification: string | null;
}

export interface WeighingAnimalDetail {
  /** `uuid` da própria linha (`AnimalWeighing`) — mapeado para `row_uuid` do form (upsert por uuid). */
  uuid: string;
  animal: { uuid: string; identification: string } | null;
  weight: number;
  last_weight: number;
  last_weight_date: string;
  has_ultrasound: boolean;
  /** Correção de fidelidade (97-Esteiras/002 execução 002 lane C) — `null` quando a linha não tem ultrassom vinculado. */
  ultrasound: WeighingAnimalUltrasoundDetail | null;
}

/**
 * Item do bloco sanitário embutido — mirror `SanitaryItemDetail`
 * (`@/@types/v2/Sanitaries`), **sem** `cost_center` (ausente de
 * `WeighingSanitaryItemData` no `CTR-PES §4` — o sub-form de Pesagem nunca
 * teve centro de custo, mirror `_card-sanitary-item.blade.php`).
 */
export interface WeighingSanitaryItemDetail {
  uuid: string;
  product: { uuid: string; name: string } | null;
  stock: { uuid: string } | null;
  quantity: number;
  total_quantity: number;
  note: string | null;
}

/**
 * Bloco sanitário embutido do detalhe — mirror `SanitaryDetail` reduzido
 * (`@/@types/v2/Sanitaries`), **sem** `time_control`/`labor` (Pesagem nunca
 * embute mão de obra — só Sanitário CRUD raiz tem esse bloco, `CTR-PES §4`).
 */
export interface WeighingSanitaryDetail {
  uuid: string;
  date: string;
  items: WeighingSanitaryItemDetail[];
}

export interface WeighingDetail {
  uuid: string;
  code: string;
  date: string;
  is_stock: boolean;
  arroba_value: number | null;
  batch: WeighingBatchRef | null;
  category: WeighingCategoryRef | null;
  animals: WeighingAnimalDetail[];
  /** Presente só quando `sanitary_id` existir no registro (CL-024/OQ-P7, preservado). */
  sanitary?: WeighingSanitaryDetail | null;
  created_at?: string;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// Contexto de formulário — NÃO é chamada de rede, mirror
// `getSanitaryFormContext`. `code` é gerado atomicamente dentro de
// `POST /weighings` (nenhum dos 9 `EP-PES-*` devolve `next_code`) — mesma
// decisão já aplicada a `Weaning`/`Sanitary` (código em branco no create,
// hint "Gerado ao salvar"). `lookups` documenta os serviços JÁ EXISTENTES que
// a tela deve reusar (contrato-tela §5.4) — nunca chamados por
// `weighing-service.ts` diretamente (as 4 chaves de sanitário são os MESMOS
// serviços reexportados de `@/services/v2/Sanitaries/sanitaries-service`).
// ---------------------------------------------------------------------------
export interface WeighingFormContext {
  next_code: null;
  lookups: {
    animals: 'GET /animals/options?batch_uuid=|category_uuid=';
    products: 'GET /sanitaries/products-by-warehouse/{warehouseUuid}';
    warehouses: 'GET /sanitaries/warehouses-by-product/{productUuid}';
    measurements: 'GET /sanitaries/measurements/{productUuid}';
    stock: 'GET /sanitaries/warehouse-stock/{warehouseUuid}/{productUuid}';
  };
}

// ---------------------------------------------------------------------------
// Form values (react-hook-form, `Option<T>` para os Selects) — round-trip por
// `row_uuid` de linha (`useFieldArray`), mesma melhoria aceita em Sanitário
// (CTR-PES §5), NÃO por posição.
// ---------------------------------------------------------------------------

/**
 * Linha do bloco de animais no form. `gain`/`gmd` são CALCULADOS
 * client-side (mirror `calcRowMetrics` de `FeedlotWeighingRow.tsx`,
 * CV-01/CV-02) — existem SÓ no form value, para exibição; NÃO fazem parte do
 * payload de submit (`WeighingAnimalPayload` abaixo não os tem).
 */
export interface WeighingAnimalFormValue {
  /** `useFieldArray` id da linha já existente — presente = update, ausente = criação. */
  row_uuid?: string;
  animal_uuid: Option<string> | null;
  weight: number | '';
  last_weight: number | '';
  last_weight_date: string | null;
  has_ultrasound: boolean;
  /**
   * Correção de fidelidade (97-Esteiras/002 execução 002 lane C) — visíveis/
   * obrigatórios SÓ quando `has_ultrasound===true` na linha (mirror
   * `ProcessingAnimalForm.aol/egs/marm/classification`, `WeighingRequest::
   * guardUltrasoundFields()`). `null` até o usuário marcar o ultrassom da linha.
   */
  aol: number | null;
  egs: number | null;
  marm: number | null;
  /** Grava em `ultrasounds.class` — nome de propriedade evita a palavra reservada `class` (mirror `ProcessingAnimalForm`). */
  classification: string | null;
  /** Calculado client-side (`weight - last_weight`), somente exibição. */
  gain?: number;
  /** Calculado client-side (`gain / dias(date - last_weight_date)`), somente exibição. */
  gmd?: number;
}

/**
 * Payload de animal (`WeighingAnimalData` backend, `CTR-PES §5.1`).
 * `weight`/`last_weight`/`last_weight_date` são SEMPRE informados pelo
 * cliente — o servidor NUNCA recalcula (Regra 2 da Tarefa, `CTR-PES §2`).
 * `item_uuid` presente só em UPDATE (upsert por uuid explícito).
 */
export interface WeighingAnimalPayload {
  animal_uuid: string;
  weight: number;
  /** Ausente para animal S/ID sem valor gravado — a API grava 0 + hoje (legado). */
  last_weight?: number;
  /** Ausente para animal S/ID sem valor gravado. */
  last_weight_date?: string;
  has_ultrasound: boolean;
  /**
   * Correção de fidelidade (97-Esteiras/002 execução 002 lane C) — mirror
   * `WeighingAnimalItemData` (`aol|egs|marm|classification` `Optional` no
   * backend, `required` só quando `has_ultrasound=true`,
   * `WeighingRequest::guardUltrasoundFields()`). Ausentes quando a linha não
   * tem ultrassom marcado.
   */
  aol?: number;
  egs?: number;
  marm?: number;
  classification?: string;
  item_uuid?: string;
}

/**
 * Linha do bloco sanitário embutido no form — mirror `SanitaryItemFormValue`
 * (`@/@types/v2/Sanitaries`), **sem** `cost_center_uuid` (Regra 3 da Tarefa).
 * `product` reusa o MESMO shape de opção de Stock do lookup de Sanitário
 * (Armazém→Produto=Stock), nunca duplicado.
 */
export interface WeighingSanitaryItemFormValue {
  row_uuid?: string;
  warehouse_uuid: Option<string> | null;
  product: SanitaryStockFieldOption | null;
  measurement_uuid: Option<string> | null;
  quantity: number | '';
  note: string;
}

/**
 * Payload de item sanitário (`WeighingSanitaryItemData` backend, `CTR-PES
 * §4`). **NÃO tem** `cost_center_uuid` nem `total_quantity` — mirror
 * `WeighingSanitaryItemData` do `CTR-PES §4`, não do `SanitaryItemData`
 * completo de Sanitário (Regra 3 da Tarefa). `item_uuid` presente só em
 * UPDATE.
 */
export interface WeighingSanitaryItemPayload {
  warehouse_uuid: string;
  product_uuid: string;
  stock_uuid: string;
  measurement_uuid: string;
  quantity: number;
  note?: string | null;
  item_uuid?: string;
}

/**
 * Valores do `useForm<WeighingFormValues>` da casca
 * `CreateOrUpdateWeighing.tsx` (Tarefas 37-39) — `pes-form-main`. `code` NÃO é
 * campo deste tipo (sempre `InputReadOnly`, nunca no payload, nunca no
 * estado do RHF — mirror `SanitaryFormValues`).
 */
export interface WeighingFormValues {
  date: string | null;
  batch_uuid: Option<string> | null;
  category_uuid: Option<string> | null;
  is_stock: boolean;
  arroba_value: number | '';
  animals: WeighingAnimalFormValue[];
  /** `Switch` "Vincular Sanitário" — só `true` permitido quando `batch_uuid` preenchido (CL-024/OQ-P7). */
  sanitary: boolean;
  sanitary_items: WeighingSanitaryItemFormValue[];
}

/**
 * Payload de submit (`WeighingData` backend, `CTR-PES §4`, `EP-PES-03`/
 * `EP-PES-04`). `sanitary_data` é OMITIDO (chave ausente), NÃO `{}`/`undefined`
 * explícito serializado, quando `sanitary=false` — mirror `Optional` do
 * backend (Regra 4 da Tarefa). `sanitary_data.date` espelha a MESMA data da
 * Pesagem — não é campo próprio (contrato-tela §2.2).
 */
export interface SaveWeighingRequest {
  date: string;
  /** Mutuamente exclusivo de `category_uuid` — exatamente 1 preenchido. */
  batch_uuid?: string;
  category_uuid?: string;
  is_stock: boolean;
  /** Obrigatório quando `is_stock=true`. */
  arroba_value?: number;
  animals: WeighingAnimalPayload[];
  sanitary: boolean;
  sanitary_data?: {
    date: string;
    items: WeighingSanitaryItemPayload[];
  };
}

export interface WeighingFilterRequest {
  batch_uuid?: string;
  category_uuid?: string;
  user_uuid?: string;
}

/**
 * Filtro da listagem (`pes-filter-form`) — `WeighingFilterRequest` +
 * companions DISPLAY-ONLY de re-hidratação do `SelectAsyncPaginate`
 * (`batch_label`/`category_label`/`user_label`), mirror
 * `SanitaryFilterForm`/`WeaningFilterForm`. Nunca enviados ao servidor.
 */
export interface WeighingFilterForm extends WeighingFilterRequest {
  batch_label?: string;
  category_label?: string;
  user_label?: string;
}

// ---------------------------------------------------------------------------
// Check de data (`EP-PES-09`, `GET /weighings/check-date`) — aviso
// não-bloqueante, dispara ao mudar `date`+(`batch_uuid`|`category_uuid`) e ao
// selecionar animal (mirror IG legado, contrato-tela §5.4). Shape de
// resposta NÃO detalhado por nenhum contrato upstream além de "aviso
// não-bloqueante" — scaffold honesto mínimo; Executor das Tarefas 37/38
// (que efetivamente consomem este endpoint) confirma/ajusta contra a
// resposta real antes de exibir o aviso ao usuário.
// ---------------------------------------------------------------------------
export interface CheckWeighingDateRequest {
  date: string;
  batch_uuid?: string;
  category_uuid?: string;
  animal_uuid?: string;
  /** Checagem de VÁRIOS animais numa única chamada (`animal_uuids[]`). */
  animal_uuids?: string[];
  /** Edição: a API exclui a própria pesagem do cálculo da última pesagem. */
  weighing_uuid?: string;
}

/** Animal reprovado pela regra de data (`invalid_animals[]` de `check-date`). */
export interface CheckWeighingDateInvalidAnimal {
  uuid: string;
  label: string;
  /** Data (ISO) que motivou a recusa: última/próxima pesagem ou entrada do animal. */
  reference_date: string | null;
  /** CÓDIGO do motivo (nunca exibir cru): serve só a lógica/estilo. `next_weighing` só na edição. */
  reason: CheckWeighingDateReason;
  /** Mensagem pt-BR pronta da API (já inclui a data de referência) — é o que a tela exibe. */
  message: string;
}

export type CheckWeighingDateReason = 'last_weighing' | 'next_weighing' | 'entry_date';

/** Resposta de `GET /weighings/check-date`: `{valid, message}` e, quando há
 *  `animal_uuids[]`, `invalid_animals[]` com os animais reprovados. */
export interface CheckWeighingDateResponse {
  valid: boolean;
  /** Só vem com `valid=false` (motivo do lote, do animal único ou resumo de vários). */
  message?: string | null;
  invalid_animals?: CheckWeighingDateInvalidAnimal[];
}

// ---------------------------------------------------------------------------
// Import (`EP-PES-07`, `POST /weighings/import`, TASK-PES-FE-03). Shape
// CONFIRMADO por leitura direta do worktree irmão da API
// (`App\Data\Weighing\WeighingImportResultData`) — padrão ABORT-ALL
// (`ImportWeighingAction`): sucesso (200) só ocorre quando TODAS as linhas
// são válidas, `created` = nº de `AnimalWeighing` gravados (1 por linha),
// `weighings_created` = nº de cabeçalhos `Weighing` novos agrupados por
// `[farm,batch,date]`. Erro (422, `BusinessRuleException`) devolve
// `errors.rows: string[]` (1 mensagem por linha inválida) — mesmo shape do
// mirror `BirthAnimalImportResult`, sem divergência.
// ---------------------------------------------------------------------------
export interface WeighingImportResult {
  created: number;
  weighings_created: number;
}
