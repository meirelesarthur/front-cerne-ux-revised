// src/@types/v2/Products/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de PRODUTOS (Product — Cadastros Base / Estrutura /
// "Catálogo", execução 025, TASK-FE-500). Fundação de dados — bloco ESTÁVEL
// apenas (identificação/classificação/estoque). Os ~40 campos FISCAIS ficam
// de fora (`TASK-FE-507`, bloqueada). Contrato:
// Product-Frontend-Contrato.md (v1.1, RECONCILIADO) + Product-contrato.md
// (backend, APROVADO 2026-07-30) §2/§4/§4b/§5.
//
// ⚠️ CORREÇÃO CRÍTICA (TASK-FE-504, `ProductResource.php`/`ProductRequest.php`
// REAIS lidos diretamente em `api_root`, não mais presunção): a v1 deste
// arquivo (TASK-FE-500/503) presumia que `financial_category_uuid`/
// `default_cost_center_uuid`/`default_warehouse_uuid`/`cultivation_uuid`/
// `addressing_uuid`/`tax_rule_uuid` chegavam como STRING CRUA (não aninhada)
// no `GET /products/{product}` — **presunção ERRADA**. O `ProductResource`
// real (`TASK-BE-504/506`, já implementado) aninha TODAS essas 6 FKs
// (`whenLoaded`, mesmo padrão de `group`/`category`/`kind`/`measurement`) —
// `ProductRepository::findByUuidOrFail()`/`create()`/`update()` fazem eager
// load de `measurement, measurementSecond, category, group, kind,
// financialCategory, cultivation, addressing, defaultWarehouse,
// defaultCostCenter, taxRule, packages` SEMPRE. Corrigido abaixo — `TASK-FE-504`
// hidrata os 6 Selects da Aba 2 com o LABEL REAL do Resource, sem precisar de
// GET extra nem do padrão "tolerante a fora-do-catálogo" (que só seria
// necessário se o Resource realmente devolvesse string crua). Também
// corrigido: a chave real é `measurement_second` (não `second_measurement`,
// presunção da v1) e `factor_type` chega como objeto `{value, label}` (não
// string crua) — o `ProductPayload` (ESCRITA) continua com `factor_type` como
// STRING `'M'|'D'` (o `ProductRequest` valida `Rule::enum(FactorTypeEnum)`
// sobre o valor cru, não o objeto). Pivot `product_package_uuids`
// (`TASK-BE-506`, `GAP-BE-230`) acrescentado — `package_uuids: string[]` na
// LEITURA (sempre array, `packages` é eager-loaded incondicionalmente) e
// `product_package_uuids?: string[]` na ESCRITA (`sometimes|array` —
// presence-aware, ver `ProductRequest::rules()`).
//
// Rotas previstas (ainda sem controller real):
//   GET    /api/v1/products                → data: ProductListItem[], meta
//                                             paginação REAL, per_page
//                                             default 10, teto 100
//                                             (`ProductIndexRequest`)
//   GET    /api/v1/products/{product}       → data: ProductData
//   POST   /api/v1/products                 → payload ProductPayload (`code`
//                                             NUNCA enviado — gerado pelo
//                                             servidor)
//   PUT/PATCH /api/v1/products/{product}    → payload ProductPayload — full
//                                             payload adotado como DEFAULT DE
//                                             TRABALHO (nem o contrato de
//                                             tela nem o de API especificam
//                                             full vs. parcial
//                                             explicitamente; reconciliar no
//                                             Executor de `TASK-FE-503`
//                                             contra a API real, ver "Teste
//                                             do dev" da Tarefa)
//   — SEM DELETE. Confirmado pelo contrato backend (`->except(['destroy'])`)
//     — não existe `deleteProduct` neste service, nem condicionalmente.
//
// Campos somente-leitura (NUNCA em `ProductPayload`, só em `ProductData`):
// `code`, `average_cost`, `purchase_price`, `last_purchase_date`,
// `market_price`, `market_research_date` (contrato backend §5, "ACHADO —
// hardening consciente").
//
// `GAP-BE-660` (execução 034/035, ✅ CONCLUÍDO, destrava `TASK-FE-762`):
// `ncm_id` DEIXOU de ser exceção a "FK sempre por uuid" — o endpoint de
// Produto passa a aceitar `ncm_uuid` na ENTRADA (`ProductPayload`/
// `ProductForm`) e `ProductResource` não expõe mais `ncm_id` cru na SAÍDA
// (`ProductData`, Lei 10) — só o bloco aninhado `ncm.{uuid,code,description}`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADOS (hierarquia Grupo → Categoria → Classe + Unidades)
// ============================================
// Mirror do padrão `KindResource.category` (`{ uuid, description }`) — ver
// nota de topo do arquivo sobre a presunção documentada.

export interface ProductGroupRef {
  uuid: string;
  description: string;
}

export interface ProductCategoryRef {
  uuid: string;
  description: string;
}

/** `kind` é opcional (`kind_uuid` nullable no contrato) — ausente quando o
 *  produto não tem Classe atribuída.
 *
 *  ⚠️ CORREÇÃO (TASK-FE-502, reconciliação contra `ProductResource.php`
 *  REAL): o Resource expõe a chave `description` (não `name`), mesmo o
 *  Model `Kind` guardando o dado no atributo `name` — `ProductResource`
 *  normaliza TODOS os relacionamentos aninhados (group/category/kind/
 *  measurement/cultivation/tax_rule/...) para a mesma chave `description`,
 *  independente do atributo real do Model de origem. A presunção documentada
 *  em TASK-FE-500 (`name`, por analogia a `KindResource.category`) estava
 *  errada para ESTE Resource — corrigido aqui. */
export interface ProductKindRef {
  uuid: string;
  description: string;
}

/** ⚠️ CORREÇÃO (TASK-FE-502) — mesma nota acima: `ProductResource.measurement`
 *  expõe `description` (não `name`), embora o Model `Measurement` version
 *  anterior presumisse `name`. */
export interface ProductMeasurementRef {
  uuid: string;
  description: string;
}

/** Mirror `{uuid, description}` reaproveitado pelas 4 FKs opcionais da Aba 2
 *  que o `ProductResource` real aninha com esse mesmo shape enxuto
 *  (`financial_category`/`cultivation`/`addressing`/`default_warehouse`,
 *  TASK-FE-504 — correção contra o Resource real, ver nota de topo). */
export interface ProductRefLabel {
  uuid: string;
  description: string;
}

/** `default_cost_center` é a ÚNICA das 6 FKs de Aba 2 que o Resource aninha
 *  com `code` além de `uuid`/`description` (mirror `CostCenterRef`). */
export interface ProductCostCenterRef {
  uuid: string;
  code: string;
  description: string;
}

/** `factor_type` chega aninhado como `{value, label}` no `GET` (Resource
 *  real) — a ESCRITA (`ProductPayload`) continua com a string crua `'M'|'D'`
 *  (`ProductRequest` valida `Rule::enum(FactorTypeEnum)` sobre o valor cru). */
export interface ProductFactorTypeRef {
  value: 'M' | 'D';
  label: string;
}

// ============================================
// PRODUCT (resposta da API)
// ============================================

export interface ProductListItem {
  uuid: string;
  /** Gerado pelo servidor (`GenerateProductCodeAction`, sequencial por
   *  fazenda) — sempre presente após a criação, nunca enviado no payload. */
  code: string;
  description: string;
  group: ProductGroupRef;
  category: ProductCategoryRef;
  /** `null` quando o produto não tem Classe atribuída (`kind_uuid` nullable). */
  kind: ProductKindRef | null;
  min_stock: number | null;
  has_lot: boolean;
  is_equipment: boolean;
  is_enabled: boolean;
  /** GAP-BE-641 (execução 034, 4ª leva, DF-26) — `GET /products` (listagem,
   *  `listProducts`) usa o MESMO `ProductResource` completo do `GET /
   *  products/{uuid}` (`ProductRepository::listWithFilters()` já eager-
   *  loadava `measurement`/`measurementSecond` desde antes deste Gap) —
   *  estes 2 campos SEMPRE vinham na resposta da listagem, só não
   *  tipados aqui. Opcionais por serem adição ao tipo (aditivo, sem
   *  quebra), não porque o backend possa omiti-los na prática. */
  measurement?: ProductMeasurementRef;
  measurement_second?: ProductMeasurementRef | null;
  /** TASK-BE-1084 (GAP-BE-683, F-084 Entrada/Insumos item 4) —
   *  `ProductRepository::listWithFilters()` passou a eager-load
   *  `financialCategory`, mesmo shape `{uuid, description}` já usado pelo
   *  detalhe (`ProductData.financial_category`, `ProductRefLabel`). `null`
   *  quando o produto não tem Categoria Financeira default cadastrada —
   *  chave sempre presente (nunca omitida), mirror `whenLoaded` do
   *  Resource. Opcional aqui só por ser adição ao tipo (aditivo). */
  financial_category?: ProductRefLabel | null;
}

/** `GET /products/{product}` — shape de detalhe. Acrescenta os campos que a
 *  listagem (`ProductListItem`) não precisa exibir, mas o formulário
 *  (`TASK-FE-503`/`504`) consome. */
export interface ProductData extends ProductListItem {
  /** `TASK-BE-705` (entregue) — flag booleano resolvido pelo `CoffeeKindResolver`
   *  (id legado 81 + fallback `kinds.name = 'Café Grãos'`), servido tanto aqui
   *  (`GET /products/{uuid}`) quanto em `GET /products/options` (lookup enxuto,
   *  ainda não tipado neste arquivo — reconciliar quando `TASK-BE-705`/`GAP-BE-262`
   *  publicar o service real, ver nota de topo de `product-service.ts`). Fonte
   *  ÚNICA para condicionar a Zona 4 ("Classificação"/"Bebida") do formulário de
   *  Estoque Inicial (`TASK-FE-1044`) — NUNCA inferir de `kind.description`
   *  (identidade de Kind não é estável entre ambientes). */
  requires_coffee_fields: boolean;
  measurement: ProductMeasurementRef;
  /** ⚠️ Chave REAL é `measurement_second` (não `second_measurement` —
   *  presunção corrigida, TASK-FE-504, ver nota de topo do arquivo). */
  measurement_second: ProductMeasurementRef | null;
  /** Objeto `{value, label}` na LEITURA (Resource real) — ver
   *  `ProductFactorTypeRef`. Na ESCRITA (`ProductPayload`) é string crua. */
  factor_type: ProductFactorTypeRef | null;
  factor: number | null;
  control_stock: boolean;
  las_price: number;
  active_principle: string | null;
  /** Aninhado (Resource real, `whenLoaded('financialCategory')`) — corrige
   *  a presunção de string crua da v1 (TASK-FE-500/503). */
  financial_category: ProductRefLabel | null;
  /** Único das 6 FKs de Aba 2 com `code` (mirror `CostCenterRef`). */
  default_cost_center: ProductCostCenterRef | null;
  default_warehouse: ProductRefLabel | null;
  /** `GAP-BE-660` (✅ CONCLUÍDO): `ncm_id` cru REMOVIDO da saída do
   *  `ProductResource` (Lei 10) — o NCM do produto só chega pelo bloco
   *  aninhado `ncm` abaixo. `null` quando o produto não tem NCM vinculado. */
  ncm: { uuid: string; code: string | null; description: string } | null;
  cultivation: ProductRefLabel | null;
  /** `select2 tags:true` no legado — string livre, só aceita quando o grupo
   *  selecionado é "Produção" (contrato backend D8). */
  quality: string | null;
  addressing: ProductRefLabel | null;
  tax_rule: ProductRefLabel | null;
  /** Pivot `product_packages` (`TASK-BE-506`, `GAP-BE-230`) — `packages` é
   *  eager-loaded INCONDICIONALMENTE pelo `ProductRepository` (create/update/
   *  findByUuidOrFail), sempre array (nunca `undefined`, mesmo vazio). */
  package_uuids: string[];
  // -- somente-leitura (nunca em ProductPayload, D2/hardening consciente) --
  average_cost: number;
  purchase_price: number | null;
  last_purchase_date: string | null;
  market_price: number | null;
  market_research_date: string | null;
  created_at: string;
  updated_at: string;

  // ============================================
  // BLOCO FISCAL (~40 campos, TASK-FE-507) — `ProductResource.php` REAL
  // (lido em `api_root`, TASK-BE-504/506, ✅ CONCLUÍDO). GAP-BE-232 (escopo
  // reduzido): backend valida SÓ tipo/tamanho/precisão do schema físico —
  // ZERO regra de negócio nova (nenhum enum fechado, nenhuma obrigatoriedade
  // condicional a `is_fiscal`). Os 7 campos com `{campo}_label` tolerante
  // (`tryFrom()`, nunca cast estrito) podem vir `null` quando o valor cru do
  // banco (dado histórico das 543.983 linhas) está fora do domínio do Enum —
  // a UI DEVE mostrar o valor cru nesse caso, nunca esconder (ver
  // `ProdutoFiscalTab.tsx`, `withToleratedOption()`).
  cfop_saida_interno: string | null;
  cfop_saida_externo: string | null;
  cst_csosn: string | null;
  cst_csosn_label: string | null;
  cst_pis: string | null;
  cst_pis_label: string | null;
  cst_cofins: string | null;
  cst_cofins_label: string | null;
  cst_ipi: string | null;
  cst_ipi_label: string | null;
  cst_csosn_exp: string | null;
  cst_csosn_exp_label: string | null;
  perc_icms: number | null;
  perc_pis: number | null;
  perc_cofins: number | null;
  perc_ipi: number | null;
  /** Coluna `integer` — Enum (`OrigemMercadoriaEnum`) é backed `string` no
   *  PHP, mas o Resource expõe o valor cru como veio da coluna (`integer`) e
   *  só faz `tryFrom((string) $this->origem)` internamente para casar o
   *  Enum — o shape exposto ao front é `number`. */
  origem: number | null;
  origem_label: string | null;
  cest: string | null;
  reference: string | null;
  barcode: string | null;
  is_fiscal: boolean;
  allow_pointing: boolean;
  /** ~70 opções no legado, SEM Enum nesta migração (D9) — string livre
   *  validada só por tamanho (`max:3`). */
  cenq_ipi: string | null;
  /** Coluna física `NOT NULL`, default `0` — o Resource NUNCA expõe `null`
   *  aqui (contrato §2/§9); mantido `number` (não `number | null`) de
   *  propósito para lembrar o Executor de nunca enviar `null` de volta. */
  modality_bc: number;
  modality_bc_label: string | null;
  /** Coluna física `NOT NULL`, default `0.00` — mesma nota de `modality_bc`. */
  percent_reduction: number;
  // -- C1 (D-101-19) -- API C1 (contrato final do executor).
  // Nullable; NULL = comportamento atual. `mot_des_icms` depende do CST (dominio por grupo).
  mot_des_icms?: number | null;
  perc_dif?: number | null; // 0-100, 4 casas; so CST 51
  perc_fcp?: number | null; // 0-100, 4 casas; 0 tratado como vazio
  cbenef: string | null;
  // -- Reforma Tributária (IBS/CBS/IS) --
  c_class_trib: string | null;
  cst_ibs_cbs: string | null;
  cst_ibs_cbs_label: string | null;
  perc_ibs_uf: number | null;
  perc_ibs_mun: number | null;
  perc_reducao_aliq_ibs_uf: number | null;
  perc_reducao_aliq_ibs_mun: number | null;
  perc_dif_ibs_uf: number | null;
  perc_dif_ibs_mun: number | null;
  perc_cbs: number | null;
  perc_reducao_aliq_cbs: number | null;
  perc_dif_cbs: number | null;
  /** SEM Enum em `TaxRule` também (D9) — string livre validada por tamanho. */
  cst_is: string | null;
  perc_is: number | null;
  perc_is_espec: number | null;
  /** Texto livre — NÃO referencia `measurements` (D9). */
  u_trib_is: string | null;
  ad_rem_ibs: number | null;
  ad_rem_cbs: number | null;
  tp_cred_pres_ibs_zfm: number | null;
  tp_cred_pres_ibs_zfm_label: string | null;
  ind_doacao: boolean;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface ProductsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ProductsListEnvelope {
  success: boolean;
  message: string;
  data: ProductListItem[];
  errors: Record<string, string[]> | null;
  meta: ProductsApiPaginationMeta | null;
}

// ============================================
// GET /products/options (TASK-BE-705, GAP-BE-040 Opção B; `group_uuid[]`
// aditivo TASK-FE-612/TASK-BE-1005, GAP-BE-612) — lookup ENXUTO, SEM gate de
// `products_view`. Resource DEDICADO (`ProductOptionResource`) —
// uuid+code+description+requires_coffee_fields, NUNCA o payload completo do
// CRUD (`ProductListItem`/`ProductData`). PAGINADO de verdade (per_page
// default 10, teto 100 — `products` é tabela volumosa), mesmo shape de meta
// de `listProducts`.
// ============================================

export interface ProductOption {
  uuid: string;
  code: string;
  description: string;
  requires_coffee_fields: boolean;
  /** GAP-BE-641 (execução 034, 4ª leva, AP-18 + DF-26) — unidade primária do
   *  produto (`ProductOptionResource.measurement`, `whenLoaded`). Eager-load
   *  incondicional no Repository (`listWithFilters`) — na prática nunca
   *  ausente, mas tipado opcional por ser extensão aditiva ao Resource
   *  enxuto (consumidores que ainda não precisam dela continuam válidos). */
  measurement?: ProductMeasurementRef;
  /** Idem — `null` quando o produto não tem unidade secundária cadastrada
   *  (`measurement_second`/`second_measurement_id` ausente). */
  measurement_second?: ProductMeasurementRef | null;
  factor?: number | null;
  factor_type?: ProductFactorTypeRef | null;
}

export interface ProductOptionsListEnvelope {
  success: boolean;
  message: string;
  data: ProductOption[];
  errors: Record<string, string[]> | null;
  meta: ProductsApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (create/update) — SEM os 6 campos somente-leitura
// ============================================

export interface ProductPayload {
  description: string;
  measurement_uuid: string;
  category_uuid: string;
  group_uuid: string;
  kind_uuid?: string | null;
  second_measurement_uuid?: string | null;
  factor_type?: 'M' | 'D' | null;
  factor?: number | null;
  has_lot: boolean;
  is_equipment: boolean;
  is_enabled: boolean;
  control_stock: boolean;
  las_price: number;
  min_stock?: number | null;
  active_principle?: string | null;
  financial_category_uuid?: string | null;
  default_cost_center_uuid?: string | null;
  default_warehouse_uuid?: string | null;
  /** `GAP-BE-660` (✅ CONCLUÍDO) — string uuid (MESMO uuid que o typeahead de
   *  NCM recebe de `NcmOptionResource.uuid`), não mais o id numérico interno.
   *  `required` quando o grupo selecionado é "Produção" (D8) — validado no
   *  schema Yup, não no tipo. */
  ncm_uuid?: string | null;
  cultivation_uuid?: string | null;
  quality?: string | null;
  addressing_uuid?: string | null;
  tax_rule_uuid?: string | null;
  /** Pivot `product_packages` (`TASK-BE-506`, `GAP-BE-230`) — `sometimes|array`
   *  no `ProductRequest`: chave AUSENTE preserva o vínculo atual, `[]` limpa,
   *  array preenchido substitui. Omitir a chave inteiramente (não `undefined`
   *  no objeto) é o que preserva — ver `tryPersistProduct` em
   *  `CreateOrUpdateProduto.tsx` (TASK-FE-504). */
  product_package_uuids?: string[];

  // ============================================
  // BLOCO FISCAL (~40 campos, TASK-FE-507) — `ProductRequest::rules()` REAL
  // (GAP-BE-232, escopo reduzido): todos `nullable`, SEM Rule::enum/in
  // fechado, SEM obrigatoriedade condicional a `is_fiscal` — o front NUNCA
  // valida mais do que o backend valida aqui (zero regra de negócio nova).
  // -- Fiscal Clássico --
  cst_csosn?: string | null;
  cst_pis?: string | null;
  cst_cofins?: string | null;
  cst_ipi?: string | null;
  cst_csosn_exp?: string | null;
  cfop_saida_interno?: string | null;
  cfop_saida_externo?: string | null;
  cest?: string | null;
  reference?: string | null;
  barcode?: string | null;
  cenq_ipi?: string | null;
  cbenef?: string | null;
  perc_icms?: number | null;
  perc_pis?: number | null;
  perc_cofins?: number | null;
  perc_ipi?: number | null;
  origem?: number | null;
  is_fiscal?: boolean | null;
  allow_pointing?: boolean | null;
  /** Coluna `NOT NULL` (default `0`) — NUNCA enviar `null` (ver `ProductData`
   *  do lado da leitura, mesma nota). O componente do form garante fallback
   *  `?? 0` antes de montar o payload. */
  modality_bc?: number;
  /** Coluna `NOT NULL` (default `0.00`) — mesma nota de `modality_bc`. */
  percent_reduction?: number;
  // -- C1 (D-101-19) -- API C1 (contrato final do executor).
  // Nullable; NULL = comportamento atual. `mot_des_icms` depende do CST (dominio por grupo).
  mot_des_icms?: number | null;
  perc_dif?: number | null; // 0-100, 4 casas; so CST 51
  perc_fcp?: number | null; // 0-100, 4 casas; 0 tratado como vazio
  // -- Reforma Tributária (IBS/CBS/IS) --
  c_class_trib?: string | null;
  cst_ibs_cbs?: string | null;
  perc_ibs_uf?: number | null;
  perc_ibs_mun?: number | null;
  perc_reducao_aliq_ibs_uf?: number | null;
  perc_reducao_aliq_ibs_mun?: number | null;
  perc_dif_ibs_uf?: number | null;
  perc_dif_ibs_mun?: number | null;
  perc_cbs?: number | null;
  perc_reducao_aliq_cbs?: number | null;
  perc_dif_cbs?: number | null;
  cst_is?: string | null;
  perc_is?: number | null;
  perc_is_espec?: number | null;
  u_trib_is?: string | null;
  ad_rem_ibs?: number | null;
  ad_rem_cbs?: number | null;
  tp_cred_pres_ibs_zfm?: number | null;
  ind_doacao?: boolean | null;
}

// ============================================
// FILTRO (drawer da listagem, cascata Grupo→Categoria→Classe)
// ============================================

/** Shape efetivamente PERSISTIDO em `paginatedQuery.filter`
 *  (`userPaginatedQuery<ProductFilterForm>`, TASK-FE-502) — achatado (strings
 *  cruas), com os 3 pares `*_label` companion para re-hidratar os
 *  `SelectAsyncPaginate` do drawer sem novo fetch ao reabrir.
 *
 *  ⚠️ CORREÇÃO (TASK-FE-502): a v1.0 deste arquivo (TASK-FE-500) definia
 *  este tipo com Selects aninhados (`Option<string> | null`) — divergia do
 *  padrão real, JÁ ESTABELECIDO por 100% dos módulos irmãos desta esteira
 *  (`KindFilterForm.category_uuid`+`category_label`,
 *  `PackageFilterForm.measurement_uuid`+`measurement_label`,
 *  `CategoryAnimalFilterForm.specie_uuid`+`specie_label`) e EXPLICITAMENTE
 *  instruído pelo task-packet desta Tarefa ("reconstruir os 3 pares
 *  {label,value} com *_label companion, mesma armadilha de
 *  FilterSideClasses.tsx"). Corrigido para o shape achatado — o
 *  `Option<T>` completo só existe nos VALORES INTERNOS do
 *  `react-hook-form` de `FilterSideCatalogo.tsx` (nunca no que é persistido/
 *  serializado em `localStorage`). */
export interface ProductFilterForm {
  search?: string;
  group_uuid?: string;
  /** DISPLAY-ONLY — nunca enviado à API, só re-hidrata o label do Select. */
  group_label?: string;
  category_uuid?: string;
  /** DISPLAY-ONLY — idem acima. */
  category_label?: string;
  kind_uuid?: string;
  /** DISPLAY-ONLY — idem acima. */
  kind_label?: string;
  has_lot?: 'true' | 'false';
  is_equipment?: 'true' | 'false';
  /** TASK-FE-946 (correção pós-E2E) — filtro "É Produto Fiscal". Campo
   *  ESCALAR simples (não FK), sem `*_label` companion — mesmo shape de
   *  `has_lot`/`is_equipment`. Backend recebe em paralelo via
   *  `ProductFilterData` (TASK-BE-602). */
  is_fiscal?: 'true' | 'false';
}

/** Shape achatado efetivamente enviado à querystring de `GET /products`
 *  (`ProductFilterData`, backend). */
export interface ProductFilterRequest {
  search?: string;
  group_uuid?: string;
  category_uuid?: string;
  kind_uuid?: string;
  has_lot?: 'true' | 'false';
  is_equipment?: 'true' | 'false';
  is_fiscal?: 'true' | 'false';
}

// ============================================
// FORM (react-hook-form) — `TASK-FE-503` (Aba 1) + `TASK-FE-504` (Aba 2)
// ============================================
// `product-schema.ts` (TASK-FE-500) já validava o schema Yup COMPLETO das 2
// abas de uma vez (achado desta Tarefa — não fatiado por aba). `TASK-FE-504`
// PROMOVE os 6 campos de FK opcionais da Aba 2 (que a `503` guardava como
// passthrough cru `string|null`) para `Option<string> | null` — mesmo shape
// dos Selects da Aba 1 — porque o `Controller`+`SelectAsyncPaginate` real
// agora existe para eles (ver correção de `ProductData`, nota de topo do
// arquivo: o Resource aninha essas 6 FKs, permitindo hidratar o `label` real
// no prefill sem GET extra). `second_measurement_uuid` idem.
export interface ProductForm {
  // -- Identificação/Classificação (Aba 1, TASK-FE-503) --
  description: string;
  measurement_uuid: Option<string> | null;
  group_uuid: Option<string> | null;
  category_uuid: Option<string> | null;
  /** `nullable` no contrato de API, mas EXIGIDO pelo schema desta tela
   *  (decisão de UX documentada em `product-schema.ts`). */
  kind_uuid: Option<string> | null;
  is_enabled: boolean;
  is_equipment: boolean;
  has_lot: boolean;
  /** `Option<string>` guardando o UUID do NCM (`GAP-BE-660`, ✅ CONCLUÍDO) —
   *  `value` é o mesmo `uuid` de `NcmOptionResource`, enviado direto (sem
   *  conversão) em `ProductPayload.ncm_uuid` (`CreateOrUpdateProduto.tsx`). */
  ncm_uuid: Option<string> | null;

  // -- Estoque/Financeiro (Aba 2, TASK-FE-504) --
  control_stock: boolean;
  min_stock?: number | null;
  las_price: number;
  active_principle?: string | null;
  financial_category_uuid?: Option<string> | null;
  default_cost_center_uuid?: Option<string> | null;
  default_warehouse_uuid?: Option<string> | null;
  /** Só persiste/aceito quando `group_uuid` selecionado é "Produção" (D8) —
   *  ver `product-schema.ts`/`ProdutoEstoqueFinanceiroTab.tsx`. */
  cultivation_uuid?: Option<string> | null;
  /** Idem acima — backend limpa silenciosamente fora do grupo "Produção". */
  quality?: string | null;
  addressing_uuid?: Option<string> | null;
  tax_rule_uuid?: Option<string> | null;
  second_measurement_uuid?: Option<string> | null;
  factor_type?: 'M' | 'D' | null;
  factor?: number | null;
  /** Pivot Embalagens (`TASK-BE-506`, `GAP-BE-230`) — `CheckboxListField`,
   *  só relevante/habilitado quando o grupo é "Produção" (D8a). Presence-aware
   *  no submit via `packageUuidsTouched` (armadilha de array do RHF — ver
   *  `CreateOrUpdateProduto.tsx`), NUNCA via `dirtyFields.product_package_uuids`. */
  product_package_uuids: string[];

  // -- Aba 3 "Fiscal" (~40 campos, TASK-FE-507) --
  // Valor CRU (string/number/boolean), NUNCA `Option<T>` — diferente das FKs
  // relacionais da Aba 1/2: estes são campos escalares catalogados por Enum
  // (ou texto livre), mesma convenção já usada por `CreateOrUpdateRegraFiscal.tsx`/
  // `CreateOrUpdateEmissor.tsx` para os MESMOS 7 Enums de `TaxRule` — o Select
  // do componente deriva `value`/`options` via `.find()`/`withToleratedOption()`
  // (ver `ProdutoFiscalTab.tsx`), sem precisar guardar o par `{label,value}`
  // inteiro no form. Todos opcionais/nullable — nenhum obrigatório por
  // `is_fiscal` (GAP-BE-232, escopo reduzido, ZERO regra de negócio nova).
  cst_csosn?: string | null;
  cst_pis?: string | null;
  cst_cofins?: string | null;
  cst_ipi?: string | null;
  cst_csosn_exp?: string | null;
  cfop_saida_interno?: string | null;
  cfop_saida_externo?: string | null;
  cest?: string | null;
  reference?: string | null;
  barcode?: string | null;
  cenq_ipi?: string | null;
  cbenef?: string | null;
  perc_icms?: number | null;
  perc_pis?: number | null;
  perc_cofins?: number | null;
  perc_ipi?: number | null;
  origem?: number | null;
  is_fiscal: boolean;
  allow_pointing: boolean;
  /** Coluna `NOT NULL` (default `0`) — o form SEMPRE guarda um número (nunca
   *  `null`), pré-selecionado com `0` na criação (mesmo default do schema
   *  físico). Ver `tryPersistProduct` — fallback `?? 0` no payload de saída,
   *  redundante de propósito (defesa em profundidade). */
  modality_bc: number;
  /** Coluna `NOT NULL` (default `0.00`) — mesma nota de `modality_bc`. */
  percent_reduction: number;
  // -- C1 (D-101-19) -- API C1 (contrato final do executor).
  // Nullable; NULL = comportamento atual. `mot_des_icms` depende do CST (dominio por grupo).
  mot_des_icms?: number | null;
  perc_dif?: number | null; // 0-100, 4 casas; so CST 51
  perc_fcp?: number | null; // 0-100, 4 casas; 0 tratado como vazio
  // -- Reforma Tributária (IBS/CBS/IS) --
  c_class_trib?: string | null;
  cst_ibs_cbs?: string | null;
  perc_ibs_uf?: number | null;
  perc_ibs_mun?: number | null;
  perc_reducao_aliq_ibs_uf?: number | null;
  perc_reducao_aliq_ibs_mun?: number | null;
  perc_dif_ibs_uf?: number | null;
  perc_dif_ibs_mun?: number | null;
  perc_cbs?: number | null;
  perc_reducao_aliq_cbs?: number | null;
  perc_dif_cbs?: number | null;
  cst_is?: string | null;
  perc_is?: number | null;
  perc_is_espec?: number | null;
  u_trib_is?: string | null;
  ad_rem_ibs?: number | null;
  ad_rem_cbs?: number | null;
  tp_cred_pres_ibs_zfm?: number | null;
  ind_doacao: boolean;
}
