// src/@types/v2/Rastreabilidade/traceability/index.d.ts
// -----------------------------------------------------------------------------
// Tipos da entidade TRACEABILITY ("Produtos" — Operacional > Agricultura >
// Rastreabilidade, F-067). TASK-TR-FE-01 (fundação) — declara os tipos
// consumidos pelas Tarefas irmãs (`TASK-TR-05..11`, form/listagem/galeria),
// mirror `@types/v2/Carregamentos/index.d.ts` (fundação análoga).
//
// Fonte de verdade: leitura DIRETA do backend REAL já implementado (`GB.Cerne.
// Api`, branch em desenvolvimento) — `app/Http/Resources/V1/{TraceabilityResource,
// TraceabilityListResource}.php`, `app/Http/Requests/Api/V1/{TraceabilityRequest,
// TraceabilityIndexRequest}.php`, `app/Models/Traceability.php` — não é resumo
// de terceiros nem transcrição cega do `field_manifest` legado. `uuid` sempre,
// `id` NUNCA aparece no envelope (contrato `## 6.5`/`get_spa_api_client_pattern`).
//
// ⚠️ DIVERGÊNCIAS DELIBERADAS do `field_manifest` legado (FD-01..FD-43,
// `LEGACY-CONTRACT-F067-produtos-rastreabilidade.md`) — precedência CÓDIGO
// REAL > ficha, mesmo racional já catalogado em `ChargeForm`/`FarmFormType`:
//   1. `farm_id` (FD-01) — NUNCA aparece no `TraceabilityRequest`/
//      `TraceabilityResource` reais: é resolvido no servidor via `FarmContext`
//      (header `X-Farm-Id`), nunca um campo do form. Ausente de TODOS os tipos
//      abaixo (não é "campo oculto do form", é inexistente no contrato novo).
//   2. `stored_areas` (FD-39) e `coordinates` (FD-43) — campos hidden do Blade
//      legado que NUNCA foram colunas físicas de `traceabilities` (confirmado
//      contra `Traceability::$fillable`/`casts()`/`TraceabilityResource`: só
//      `latlng` existe) — eram scratch client-only da versão ANTIGA do widget
//      de mapa (JS `map_traceability.js`, `IG-03`/`IG-06`). Com a decisão
//      ratificada `## 9.1` do contrato de tela (mapa READ-ONLY, sem desenho
//      manual), esses 2 campos não têm mais propósito e NÃO são recriados —
//      registrar como divergência no fechamento da Tarefa, não como omissão
//      silenciosa.
//   3. `availability` — a ficha da Tarefa descreve `string[]` ("widget custom
//      de 12 divs clicáveis"), mas `TraceabilityRequest::rules()` valida
//      `availability.* => integer, between:1,12` — é um array de NÚMEROS (mês
//      1-12), não de strings. Tipado `number[]` abaixo, fiel ao Request real.
//   4. Os 42 campos citados na ficha (`field_manifest` FD-02..FD-43) somam,
//      após remover `farm_id`(1), `stored_areas`(1) e `coordinates`(1),
//      **40 campos REAIS** cobertos pelo backend (`TraceabilityRequest` + o
//      par readonly `tracking_code`/`lot_number`, gerados no servidor).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// SATÉLITES (relações aninhadas, sempre `whenLoaded` no `TraceabilityResource`/
// `TraceabilityListResource` reais — mirror `ChargeDescriptionRef`/
// `ChargePartyRef`).
// ============================================

export interface TraceabilityProductRef {
  uuid: string;
  description: string;
}

/** `TraceabilityConfig` não tem `description` — o rótulo real é `name`
 *  (mirror `TraceabilityConfigOptionResource`, mesma decisão). */
export interface TraceabilityConfigRef {
  uuid: string;
  name: string;
}

export interface TraceabilityAreaRef {
  uuid: string;
  description: string;
}

/** Imagem da galeria clonada na criação (SE-01) — só `uuid`+`image`, já
 *  inline no `show()` principal (`TraceabilityResource::galery`, sempre
 *  eager-carregada pelo Repository). O CRUD dedicado da galeria (upload/
 *  listagem/remoção individual, RT-08..10) é escopo de `TASK-TR-04`/`10` —
 *  mesmo shape físico de `TraceabilityGaleryResource`, reaproveitado aqui
 *  para não duplicar o tipo quando aquela Tarefa chegar. */
export interface TraceabilityGaleryImage {
  uuid: string;
  image: string;
}

// ============================================
// LEITURA — LISTAGEM (`GET /traceabilities`, `TraceabilityListResource`,
// `list_manifest` LM-01..07, ordem fiel à coluna do legado).
// ============================================

export interface TraceabilityListItem {
  uuid: string;
  product: TraceabilityProductRef; // LM-01
  name_pt: string; // LM-02
  tracking_code: string; // LM-03
  /** `YYYY-MM-DD` cru — a formatação `brDate()` (LM-04) é responsabilidade
   *  do SPA na exibição, nunca do payload (mirror CV-04). */
  harvested_in: string;
  area: TraceabilityAreaRef | null; // LM-05
  traceability_config: TraceabilityConfigRef; // LM-06
  packing: string; // LM-07
  /** Checksum usado na URL pública de rastreio (mesmo campo de
   *  `TraceabilityData.hash`, `SE-08`/QR da etiqueta) — a divergência
   *  registrada em TASK-TR-FE-05 (`TraceabilityListResource` não expunha
   *  `hash`) foi FECHADA: o Resource de listagem passou a expor `hash`
   *  (FUP-TR-FE-05-01). Aditivo — não remove `tracking_code`, ainda exibido
   *  na coluna LM-03. */
  hash: string;
}

// ============================================
// LEITURA — DETALHE (`GET/POST/PUT /traceabilities/{uuid}`,
// `TraceabilityResource`, `## 6.5` do contrato). Ordem = ordem REAL de saída
// do Resource (não a ordem visual do form — ver `TraceabilityForm` abaixo
// para a ordem fiel ao `field_manifest`/seções do contrato de tela `## 4.2`).
// ============================================

export interface TraceabilityData {
  uuid: string;
  product: TraceabilityProductRef;
  traceability_config: TraceabilityConfigRef;
  area: TraceabilityAreaRef | null;
  name_pt: string;
  name_en: string | null;
  name_es: string | null;
  description_pt: string;
  description_en: string | null;
  description_es: string | null;
  /** `YYYY-MM-DD` — nunca `Date` (mesma armadilha documentada em
   *  `ChargeForm.dt_charge`/`field-validation-schema.ts::date()`). */
  harvested_in: string;
  /** SEMPRE readonly no form (gerado no servidor, imutável após a criação —
   *  round-trip `## 8` do contrato de tela). NUNCA em `dirtyFields`, NUNCA no
   *  payload de escrita. */
  tracking_code: string;
  packing: string;
  /** Checksum usado na URL pública de rastreio (`SE-08`, etiqueta PDF) —
   *  metadado de leitura, nunca editável nem enviado no payload. */
  hash: string;
  /** Meses (1-12) — array NATIVO de número (`availability.* => integer,
   *  between:1,12` no `TraceabilityRequest` real). NUNCA `JSON.stringify`
   *  manual (fecha D09 do legado por tipagem, não por regra de front). */
  availability: number[];
  // ---- 16 campos nutricionais — API SEMPRE devolve decimal cru (`(float)`
  // no Resource); formatar os 8 `_perc` SÓ na exibição (mirror CV-04,
  // `Number.prototype.toLocaleString('pt-BR')`), NUNCA no payload. ----
  energetic_value: number;
  energetic_value_perc: number;
  carbohydrates: number;
  carbohydrates_perc: number;
  proteins: number;
  proteins_perc: number;
  fat_total: number;
  fat_total_perc: number;
  fat_saturated: number;
  fat_saturated_perc: number;
  fat_trans: number;
  fat_trans_perc: number;
  dietary_fiber: number;
  dietary_fiber_perc: number;
  sodium: number;
  sodium_perc: number;
  /** Hidden — só reflexo de LEITURA do mapa (`## 9.1`: display read-only,
   *  sem desenho manual — controles Geoman mortos do legado NÃO recriados). */
  latlng: string;
  /** SEMPRE readonly no form (gerado no `store()`, `## 9.2`: sem prévia em
   *  tempo real — placeholder "gerado ao salvar" até o 1º save). */
  lot_number: string;
  barcode: string | null;
  exporter_name: string | null;
  exporter_address: string | null;
  exporter_zip_code: string | null;
  exporter_city: string | null;
  exporter_state: string | null;
  exporter_country: string | null;
  /** Round-trip corrigido (fecha D08 do legado — a API lê o atributo real do
   *  Model, nunca a variável `$imte` indefinida do Blade). Se aparecer vazio
   *  em edição com dado persistido, é REGRESSÃO, não comportamento esperado
   *  (round-trip `## 8` do contrato de tela). */
  box_quantity: number | null;
  gross_weight: string | null;
  /** Sempre presente no `show()` (Repository eager-carrega a galeria) — SE-01
   *  já clona as imagens do último registro do mesmo `product_id` na criação. */
  galery: TraceabilityGaleryImage[];
  created_at: string;
  updated_at: string;
}

// ============================================
// FILTRO (`FilterSide` da listagem, `TraceabilityIndexRequest` real —
// `filter_manifest` FM-01..03) — mirror `ChargeFilterForm`/`ChargeFilterRequest`:
// a forma "crua" (Form) carrega o companion `product_label` DISPLAY-ONLY
// (re-hidratação do `SelectAsyncPaginate` sem request extra ao reabrir o
// drawer); a forma "request" (querystring) é só os 3 campos reais.
// ============================================

export interface TraceabilityFilterForm {
  harvested_in?: string;
  product_uuid?: string;
  product_label?: string;
  tracking_code?: string;
}

export interface TraceabilityFilterRequest {
  harvested_in?: string;
  product_uuid?: string;
  tracking_code?: string;
}

// ============================================
// FORMULÁRIO (`react-hook-form`) — ordem fiel às SEÇÕES do contrato de tela
// `## 4.2`/`field_manifest` FD-02..FD-43 (Identificação → Sobre o produto →
// Informação nutricional → Exportador → Área e disponibilidade → Mapa),
// EXCETO `farm_id`/`stored_areas`/`coordinates` (ver divergências no topo do
// arquivo). Campos relacionais em `Option<T>` (`{label,value}`), nunca o
// `uuid` cru (Lei 1). Numéricos em `number | null` (mirror `numberOrNull` de
// `charge-schema.ts`) — `null` só em repouso, o Yup exige valor no submit.
// ============================================

export interface TraceabilityForm {
  // ---- 1. Identificação (FD-02..FD-08, FD-09/10) ----
  product_uuid: Option<string> | null;
  traceability_config_uuid: Option<string> | null;
  /** `YYYY-MM-DD` — NUNCA `Date` (mesmo racional de `TraceabilityData.
   *  harvested_in`). */
  harvested_in: string | null;
  packing: string;
  gross_weight: string;
  /** Readonly SEMPRE (round-trip `## 8`) — `''` + placeholder "gerado ao
   *  salvar" em modo criação, valor da API em modo edição. NUNCA no
   *  `CreateTraceabilityRequest`/`UpdateTraceabilityRequest`, NUNCA em
   *  `dirtyFields`, NUNCA no schema Yup (`traceability-schema.ts` não valida
   *  esta chave — decisão deliberada, não esquecimento). */
  tracking_code: string;
  name_pt: string;
  name_en: string;
  name_es: string;

  // ---- 2. Sobre o produto (FD-11..13) ----
  description_pt: string;
  description_en: string;
  description_es: string;

  // ---- 3. Informação nutricional (FD-14..29, 8 pares campo/`_perc`) ----
  energetic_value: number | null;
  energetic_value_perc: number | null;
  carbohydrates: number | null;
  carbohydrates_perc: number | null;
  proteins: number | null;
  proteins_perc: number | null;
  fat_total: number | null;
  fat_total_perc: number | null;
  fat_saturated: number | null;
  fat_saturated_perc: number | null;
  fat_trans: number | null;
  fat_trans_perc: number | null;
  dietary_fiber: number | null;
  dietary_fiber_perc: number | null;
  sodium: number | null;
  sodium_perc: number | null;

  // ---- 4. Exportador (FD-30..36, opcional, sem i18n no legado) ----
  barcode: string;
  exporter_name: string;
  exporter_address: string;
  exporter_zip_code: string;
  exporter_city: string;
  exporter_state: string;
  exporter_country: string;

  // ---- 5. Área e disponibilidade (FD-40..42, FD-37) ----
  area_uuid: Option<string> | null;
  /** Readonly SEMPRE (gerado no `store()`, `## 9.2`) — `''` + placeholder
   *  "gerado ao salvar" em criação, valor da API em edição. NUNCA no
   *  payload de escrita, NUNCA no schema Yup. */
  lot_number: string;
  box_quantity: number | null;
  /** Meses (1-12), `number[]` nativo — widget de 12 divs clicáveis
   *  (`SelectMonthsWidget`, Tarefa de form). Yup exige `min(1)` (fix D09,
   *  `## 9.3` do contrato de tela). */
  availability: number[];

  // ---- 6. Mapa (FD-38, display read-only — `## 9.1`) ----
  /** Hidden, só leitura (reflexo da Área/Configuração selecionada) — NUNCA
   *  editado pelo usuário (sem desenho manual, controles Geoman do legado
   *  NÃO recriados). Ausente do payload se vazio. */
  latlng: string;
}

// ============================================
// PAYLOAD DE ESCRITA (`POST`/`PUT /traceabilities`) — espelha
// `TraceabilityRequest::rules()` REAL (unificado store+update, "Update =
// representação completa/PUT replace" — os `required` permanecem `required`
// nos dois verbos, SEM PATCH parcial). `farm_id`/`tracking_code`/`hash`/
// `lot_number` NUNCA são campos aqui, em NENHUM verbo — resolvidos sempre no
// servidor (`CreateTraceabilityAction`/`UpdateTraceabilityAction`).
// ============================================

export interface CreateTraceabilityRequest {
  product_uuid: string;
  traceability_config_uuid: string;
  harvested_in: string;
  packing: string;
  gross_weight?: string | null;
  name_pt: string;
  name_en?: string | null;
  name_es?: string | null;
  description_pt: string;
  description_en?: string | null;
  description_es?: string | null;
  energetic_value: number;
  energetic_value_perc: number;
  carbohydrates: number;
  carbohydrates_perc: number;
  proteins: number;
  proteins_perc: number;
  fat_total: number;
  fat_total_perc: number;
  fat_saturated: number;
  fat_saturated_perc: number;
  fat_trans: number;
  fat_trans_perc: number;
  dietary_fiber: number;
  dietary_fiber_perc: number;
  sodium: number;
  sodium_perc: number;
  barcode?: string | null;
  exporter_name?: string | null;
  exporter_address?: string | null;
  exporter_zip_code?: string | null;
  exporter_city?: string | null;
  exporter_state?: string | null;
  exporter_country?: string | null;
  /** `required|array|min:1` no servidor (fecha D09) — meses 1-12. */
  availability: number[];
  latlng?: string | null;
  area_uuid: string;
  box_quantity: number;
}

/** `PUT` é o MESMO shape de `POST` (substituição integral, "Update =
 *  representação completa" do `TraceabilityRequest` real) — alias, não um
 *  tipo `Partial` (mirror `UpdateChargeRequest`). */
export type UpdateTraceabilityRequest = CreateTraceabilityRequest;

// ============================================
// AUTOFILL NUTRICIONAL (`GET /traceabilities/product-autofill/{productUuid}`,
// `TraceabilityController::productAutofill`/`TraceabilityProductAutofillResource`,
// contrato `## 6.4`/GAP-TR-01) — TASK-TR-FE-03.
//
// ⚠️ DIVERGÊNCIA da ficha da Tarefa (que presumia reuso do `show()` de
// `Product`, `GET /products/{uuid}`): verificação DIRETA do backend REAL
// (`routes/api.php` + `TraceabilityController`) confirma uma rota PRÓPRIA
// dentro do módulo Rastreabilidade — NÃO o `show()` de Product. Precedência
// código real > ficha (mesmo racional já documentado no topo deste arquivo,
// itens 1-4). `getProductAutofill` (`traceability-service.ts`) consome ESTA
// rota.
//
// `traceability` (último registro do mesmo `product_id`) pode não existir —
// `has_previous_traceability: false` e todos os campos nutricionais/textuais
// saem `null` (mirror exato do legado, sem `orFail`).
// ============================================

export interface TraceabilityProductAutofillProductRef {
  uuid: string;
  code: string;
  description: string;
}

export interface TraceabilityProductAutofill {
  product: TraceabilityProductAutofillProductRef;
  has_previous_traceability: boolean;
  name_pt: string | null;
  name_en: string | null;
  name_es: string | null;
  description_pt: string | null;
  description_en: string | null;
  description_es: string | null;
  packing: string | null;
  availability: number[] | null;
  energetic_value: number | null;
  energetic_value_perc: number | null;
  carbohydrates: number | null;
  carbohydrates_perc: number | null;
  proteins: number | null;
  proteins_perc: number | null;
  fat_total: number | null;
  fat_total_perc: number | null;
  fat_saturated: number | null;
  fat_saturated_perc: number | null;
  fat_trans: number | null;
  fat_trans_perc: number | null;
  dietary_fiber: number | null;
  dietary_fiber_perc: number | null;
  sodium: number | null;
  sodium_perc: number | null;
}

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`, `GET /traceabilities`,
// `TraceabilityIndexRequest`) — mesma armadilha já documentada em
// `ChargesListEnvelope`/`ProductsListEnvelope` (`@/@types/v2/Carregamentos`/
// `@/@types/v2/Products`): array PLANO em `data`, NÃO
// `{data:{items,pagination}}` — a adaptação para `ResponsePagination` é
// responsabilidade do service (`traceability-service.ts`, mirror
// `listCharges`/`listProducts`).
// ============================================

export interface TraceabilitiesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
  links?: Record<string, unknown>;
}

export interface TraceabilitiesListEnvelope {
  success: boolean;
  message: string;
  data: TraceabilityListItem[];
  errors: Record<string, string[]> | null;
  meta: TraceabilitiesApiPaginationMeta | null;
}
