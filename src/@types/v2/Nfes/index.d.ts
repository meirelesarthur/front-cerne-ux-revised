// src/@types/v2/Nfes/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "NFe Emitidas" (Nfe — domínio Fiscal) — API v1 do backend
// Laravel GB.Cerne. Casa própria (mirror `Warehouses`/`Issuers`), dentro do
// domínio "Fiscal" (mirror `app/Actions/{Invoice,Issuer,Nfse}` do backend).
// TASK-FE-036-401 (contrato-frontend-nfe-emitidas.md §2).
//
// ⚠️ CONTRATO REAL (backend JÁ CONSTRUÍDO, TASK-BE-036-401/402/403) — este
// arquivo foi modelado por LEITURA DIRETA de `NfeController.php`/
// `NfeRequest.php`/`NfeIndexRequest.php`/`{Nfe,NfeList,ItemNfe}Resource.php`/
// `app/Data/Nfe/*`/`NfeEstadoEnum.php`, NÃO a partir só do contrato de tela
// (documento anterior ao backend real). Divergências reais confirmadas e
// respeitadas aqui, frente ao que o contrato de tela §4.2 havia planejado:
//   - Todas as FKs de escrita usam sufixo `_uuid` (`client_uuid`,
//     `natureza_uuid`, `provider_uuid`, `emissor_uuid`, `harvest_uuid`,
//     `transp_city_uuid`, `items.*.product_uuid/package_uuid/area_uuid/
//     warehouse_uuid`), NUNCA `_id` — o contrato de tela citava `client_id`
//     etc. por ter sido escrito ANTES do backend existir.
//   - `type_emission` (E2E do dono, esteira 036fix5 — REWORK DE FIDELIDADE):
//     ausente antes (Lacuna declarada, contrato de tela §4.2), backend
//     habilitando a persistência em paralelo a esta fatia — modelado aqui
//     como `number | null` (`Select` catalogado, mirror `App\Nfe::
//     emissions()`, `nfe-fiscal-catalogs.ts`). `additional_info` continua
//     NÃO existindo no `$fillable`/`NfeData` real — OMITIDO (nenhum campo
//     fora do contrato real é inventado); o Select "Info. Complementares" é
//     só um AUXILIAR client-side que preenche Observações, nunca persistido.
//   - `type_payment`/`type_debt`/`type_credit`/`type_guide` são STRING de
//     tamanho fixo (`max:2`/`max:1`, sem `Rule::in()` no backend) — o campo
//     em si permanece string livre no contrato de API, mas o FRONT agora
//     renderiza `Select` catalogado (mirror `App\Nfe::typesPayment()/
//     typeDebts()/typeCredits()/typeGuides()`, `nfe-fiscal-catalogs.ts`,
//     rework de fidelidade pós-homologação `audit-nfe-emitidas.md`) — não
//     mais `Input` de texto livre.
//   - **Correção pós-auditoria de fidelidade (audit-nfe-emitidas.md A-01/
//     E-02/E-03):** `NfeResource`/`NfeListResource` PASSARAM a expor
//     `client`/`provider` com `{ uuid, name }`, `issuer` (emissor) com
//     `{ uuid, razao_social, nome_fantasia }`, `harvest` com
//     `{ uuid, descricao }` (mesmo shape de `nature`) e `transp_city` com
//     `{ uuid, name }` (ausente antes — causa raiz de E-02, cidade do
//     transportador apagada na edição). O formulário de edição reidrata os
//     Selects usando esses nomes reais (não mais o uuid como label).
//   - `transp_city_uuid` é aceito em `NfeData`/`NfeRequest` e agora também
//     devolvido pelo `NfeResource` (`transp_city`) — o backend
//     (`UpdateNfeAction`) preserva o valor já persistido quando o campo não
//     é reenviado no PUT (`Optional`), mas o front sempre reidrata e
//     reenvia a FK resolvida para permitir also TROCAR a cidade em edição.
//   - `NfeListResource` NÃO expõe `departure_date`/`delivery_date` (só no
//     `show`) — a coluna "Data" da listagem usa `created_at` (mirror a
//     própria decisão do backend em `NfeFilterData`, que mapeia "período de
//     emissão" para `created_at` por não existir `dt_emissao` física).
//   - `has_financial` (E2E do dono, esteira 036fix5 — REWORK DE FIDELIDADE):
//     GAP-FE-036-401 (Opção A) fechado PARCIALMENTE — o backend habilita a
//     persistência da flag em paralelo a esta fatia; o campo "Gerar
//     financeiro?" (Sim/Não) agora é modelado/enviado no payload, mas a
//     GERAÇÃO financeira em si (side-effect no backend) permanece fase
//     posterior, fora desta fatia (só o campo/valor).
//   - **GAP-API RESOLVIDO (esteira 036fix2, REAUDITORIA-036-2a-rodada.md
//     NFE-R2-001/002):** `NfeListResource` (API real, branch
//     `feature/036-financeiro-fiscal`) passou a expor `issuer`
//     (`{uuid, razao_social, nome_fantasia}`), `numero_nfe` e `items_count`
//     na listagem; `NfeIndexRequest::rules()` passou a aceitar os filtros
//     `numero_nfe`/`product_id`/`issuer_id`/`amount`/`harvest_id`. Modelados
//     aqui e consumidos por `index.tsx`/`FilterSideNfe.tsx` (2ª correção de
//     fidelidade — a 1ª leva só fechou o backend).
//   - **GAP-API (audit-nfe-emitidas.md A-03, ainda ABERTO):** indicador de
//     integração Domínio (`integration_status`) NÃO é exposto por
//     `NfeListResource` — depende de integração Domínio não migrada
//     (NFE-R2-003/028, Group B) — não modelado (SEM MOCK).
//
// `discount` do cabeçalho é DERIVADO no front (soma dos `discount` dos itens,
// decisão do dono, contrato de tela §4.3) — mantido no `NfeForm` só para
// exibição em `InputReadOnly` (nunca editado pelo usuário), mas SEMPRE
// enviado no payload (o backend aceita `discount` solto, sem recalcular a
// soma sozinho — a Action confia no valor recebido, mirror `shipping_value`/
// `added_value`).
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// TASK-FE-036-D2-2 — bloco Financeiro real (parcelamento + rateio). Forma
// FECHADA por `TASK-BE-036-D2A` como mirror EXATO de `IncomeInstallmentData`/
// `IncomeCategoryData` (`financial_installments[].due_date/value`,
// `financial_categories[].category_uuid/percentage/center_uuid/
// plan_account_uuid?`) — reaproveitados aqui via `import type`, NUNCA
// reescritos (Regra de ouro da Tarefa: reuso, não reinvenção). Os tipos de
// `Expense` (`@/@types/v2/Financeiro/expense`) NÃO se aplicam ao payload —
// aquele domínio persiste `value`/`percent` (rateio em REAIS, tolerância 0
// contra `amount`), forma DIVERGENTE do que `NfeFinancialCategoryData` exige
// (`percentage`, 0-100, mirror Income) — achado confirmado por leitura direta
// do DTO real, não suposição.
import type {
  IncomeApportionmentForm,
  IncomeCategoryPayload,
  IncomeInstallmentForm,
  IncomeInstallmentPayload,
} from '@/@types/v2/Incomes';

// ============================================
// ENUM — `NfeEstadoEnum` (contrato de tela §2, API §3). Labels/cores vêm do
// Enum do backend (`estado_label`/`estado_color`, já em `NfeListItem`/
// `NfeDetail`), mas o front também fixa cores próprias no Badge
// (`nfe-estado-options.ts`, TASK-FE-036-402) — decisão do dono, ajustável sem
// reabrir contrato.
// ============================================

export type NfeEstado = 'novo' | 'aprovado' | 'rejeitado' | 'cancelado';

// ============================================
// SUB-OBJETOS COMPARTILHADOS (Resource real)
// ============================================

/** Ref só com `uuid` — usado por relacionamentos do item
 *  (`package`/`area`) que o `ItemNfeResource` real ainda não enriquece com
 *  descrição (SEM MOCK). */
export interface NfeUuidRef {
  uuid: string;
}

/** Ref com nome — `client`/`provider` do `NfeResource`/`NfeListResource`
 *  real (correção pós-auditoria de fidelidade, audit-nfe-emitidas.md A-01/
 *  E-03: ganharam `name` via `people.name`). `name` pode vir `null` se a
 *  relação `people` não estiver carregada no servidor (SEM MOCK — fallback
 *  honesto para o uuid é feito no front, nunca inventado aqui). */
export interface NfeNamedRef {
  uuid: string;
  name: string | null;
}

/** Ref com descrição — `nature` (Natureza de Operação) e `harvest` (Safra,
 *  correção pós-auditoria E-03: ganhou `descricao`) expõem esse shape. */
export interface NfeDescribedRef {
  uuid: string;
  descricao: string;
}

/** Ref do Emissor (`issuer`) — `NfeResource` real (correção pós-auditoria
 *  E-03) expõe razão social + nome fantasia, nunca só o uuid. */
export interface NfeIssuerRef {
  uuid: string;
  razao_social: string | null;
  nome_fantasia: string | null;
}

/** Ref da cidade de transporte (`transp_city`) — ausente antes da correção
 *  pós-auditoria (E-02: causa raiz da cidade apagada na edição, o
 *  `NfeResource` não devolvia essa chave). */
export interface NfeCityRef {
  uuid: string;
  name: string;
}

// ============================================
// LISTAGEM (`GET /nfes` — `NfeListResource`, SEM `items[]`/`departure_date`/
// `delivery_date`, mirror `mode_matrix.index` da Doc Bruta)
// ============================================

export interface NfeListItem {
  uuid: string;
  code: string | null;
  estado: NfeEstado;
  estado_label: string;
  estado_color: string;
  client?: NfeNamedRef | null;
  nature?: NfeDescribedRef | null;
  /** Correção NFE-R2-001 (REAUDITORIA-036-2a-rodada.md) — `NfeListResource`
   *  real passou a expor o Emissor na listagem, mirror `issue_name` do
   *  legado (`NfeController.php:133,adm`, `index.blade.php:105,125`). */
  issuer?: NfeIssuerRef | null;
  /** Correção NFE-R2-001 — número fiscal da NFe (`nves.numero_nfe`), coluna
   *  própria do legado (`index.blade.php:111,132`). */
  numero_nfe: string | null;
  /** Correção NFE-R2-001 — contagem de itens (`withCount('items')`, mirror
   *  a subquery `items_count` do legado, `NfeController.php:135-140`,
   *  `index.blade.php:109,129`). */
  items_count: number;
  state_registration_client: string;
  type_payment: string;
  total_products: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// ITEM (ItemNfeResource real, dentro de NfeDetail.items[]) — bloco fiscal
// completo (CFOP/CST/PIS/COFINS/IPI/CEST + Reforma Tributária IBS/CBS/IS),
// nomes de coluna 1:1 confirmados por leitura direta (Lacuna do contrato de
// tela §16 do contrato de API FECHADA por esta Tarefa).
// ============================================

/** `measurement` (Unidade) — TASK-BE-036-B17, aditivo de `ItemNfeResource`
 *  (`product.measurement {uuid, description}`), mirror `ProductMeasurementRef`
 *  (`@/@types/v2/Products`, não reimportado aqui para não acoplar os 2
 *  domínios — mesmo shape, `whenLoaded`). */
export interface ItemNfeProductMeasurementRef {
  uuid: string;
  description: string;
}

export interface ItemNfeProductRef {
  uuid: string;
  description: string;
  /** TASK-BE-036-B17 Entrega 2 — unidade do Produto, só para hidratar o
   *  campo display-only `NfeItemForm.product_measurement_label` na edição
   *  (`CreateOrUpdateNfe.tsx#fillNfeForm`). NUNCA reenviada no payload. */
  measurement?: ItemNfeProductMeasurementRef | null;
}

export interface ItemNfeDetail {
  uuid: string;
  product?: ItemNfeProductRef | null;
  /** TASK-BE-036-B17 Entrega 2 — `package.description`/`.size` aditivos
   *  (sem remover `uuid`), fecham a reidratação do rótulo de Embalagem em
   *  edição (GAP 9 — antes mostrava o uuid cru como texto). */
  package?: (NfeUuidRef & { description: string; size: number }) | null;
  area?: NfeUuidRef | null;
  warehouse?: (NfeUuidRef & { description: string }) | null;
  quantity: number;
  amount: number;
  discount: number;
  order_item: string | null;
  cfop: string | null;
  cfop_saida_interno: string | null;
  cfop_saida_externo: string | null;
  cst_csosn: string | null;
  cst_csosn_exp: string | null;
  cst_pis: string | null;
  cst_cofins: string | null;
  cst_ipi: string | null;
  cenq_ipi: string | null;
  perc_icms: number | null;
  perc_pis: number | null;
  perc_cofins: number | null;
  perc_ipi: number | null;
  cest: string | null;
  barcode: string | null;
  percent_reduction: number | null;
  // -- C1 (D-101-19) -- - contrato API C1 confirmado.
  // Nullable; NULL = comportamento atual. `mot_des_icms` depende do CST (dominio por grupo).
  mot_des_icms?: number | null;
  perc_dif?: number | null;
  perc_fcp?: number | null;
  perc_ipi_devol?: number | null;
  modality_bc: number | null;
  origem: string | null;
  reference: string | null;
  cbenef: string | null;
  c_class_trib: string | null;
  cst_ibs_cbs: string | null;
  perc_ibs_uf: number | null;
  perc_ibs_mun: number | null;
  perc_reducao_aliq_ibs_uf: number | null;
  perc_reducao_aliq_ibs_mun: number | null;
  perc_dif_ibs_uf: number | null;
  perc_dif_ibs_mun: number | null;
  perc_cbs: number | null;
  perc_reducao_aliq_cbs: number | null;
  perc_dif_cbs: number | null;
  cst_is: string | null;
  perc_is: number | null;
  perc_is_espec: number | null;
  u_trib_is: string | null;
  ad_rem_ibs: number | null;
  ad_rem_cbs: number | null;
  tp_cred_pres_ibs_zfm: number | null;
  ind_doacao: string | null;
  /** UT-000776 — referência por item (NF-e de devolução, finnfe=4). */
  ref_access_key?: string | null;
  ref_item_number?: number | null;
}

// ============================================
// DETALHE (`GET/POST/PUT /nfes/{uuid}` — `NfeResource` completo)
// ============================================

/** UT-000776 / T-776-FE-05 — linha de defensivo agrícola (grupo `agro` da NF-e, mutuamente exclusivo com a guia). */
export interface NfeAgroDefensivo {
  n_receituario: string;
  cpf_resp_tec: string;
}

/** Linha de defensivo agrícola vinda do GET (`uuid` por linha). */
export interface NfeAgroDefensivoDetail extends NfeAgroDefensivo {
  uuid: string;
}

export interface NfeDetail {
  uuid: string;
  code: string | null;
  estado: NfeEstado;
  estado_label: string;
  estado_color: string;
  client?: NfeNamedRef | null;
  nature?: NfeDescribedRef | null;
  issuer?: NfeIssuerRef | null;
  provider?: NfeNamedRef | null;
  harvest?: NfeDescribedRef | null;
  /** Correção pós-auditoria de fidelidade (E-02) — ausente antes; sem essa
   *  chave o front nunca conseguia reidratar a cidade do transportador na
   *  edição, o que levava a apagá-la no PUT (backend agora também preserva
   *  o valor já persistido quando o campo não é reenviado, ver
   *  `UpdateNfeAction`). */
  transp_city?: NfeCityRef | null;
  state_registration_client: string;
  type_payment: string;
  type_debt: string | null;
  type_credit: string | null;
  transp_name: string | null;
  transp_cnpj: string | null;
  transp_address: string | null;
  shipping_type: number | null;
  shipping_board_vehicle: string | null;
  shipping_uf_shipping: string | null;
  shipping_value: number | null;
  specie: string | null;
  number_volumes: number | null;
  quantity_volumes: number | null;
  gross_weight: number | null;
  net_weight: number | null;
  departure_date: string | null;
  delivery_date: string | null;
  discount: number | null;
  added_value: number | null;
  percent_icms: number | null;
  icms_base: number | null;
  gta: string | null;
  type_guide: string | null;
  uf_guide: string | null;
  number_guide: string | null;
  serie_guide: string | null;
  /** UT-000776 / T-776-FE-05 — vazio quando não houver. */
  agro_defensivos?: NfeAgroDefensivoDetail[];
  order_number: string | null;
  ref_nfe: string | null;
  note: string | null;
  antt: string | null;
  tipo: number | null;
  finnfe: number | null;
  /** Tipo Emissão — mirror `App\Nfe::emissions()` (E2E do dono, esteira
   *  036fix5). PERSISTIDO e reidratado por `NfeResource`
   *  (`type_emission`/`type_emission_label`, confirmado pelo backend). */
  type_emission: number | null;
  /** `type_emission_label` — rótulo pronto que o `NfeResource` já resolve
   *  (mirror `App\Nfe::emissions($option)`), útil pra tela de detalhe. */
  type_emission_label?: string | null;
  // NOTA (ajuste do coordenador, esteira 036fix5): `has_financial` NÃO tem
  // coluna em `nves` — nem no legado é persistido (gatilho em memória; o
  // efeito real, gerar contas/parcelas, é o B-04, deferido).
  /**
   * `has_financial` (read-side) — TASK-FE-036-D2D/GAP-036-404: o
   * `NfeResource` passa a DERIVAR e devolver esta chave no
   * `GET /nfes/{uuid}` (reflexo de leitura calculado a partir da
   * existência de títulos gerados; segue SEM coluna física em `nves`).
   * Nunca é reenviada como fonte de verdade no payload de escrita — quem
   * controla o toggle "Gerar financeiro?" no formulário continua sendo
   * `NfeForm.has_financial` (ver `CreateOrUpdateNfe.tsx`, fallback
   * `data.has_financial ?? true` só para reidratar a exibição inicial).
   */
  has_financial?: boolean;
  total_products: number;
  amount: number;
  /** UT-000776 (T-776-API-03) — totais da Reforma Tributária (IBS/CBS/IS) persistidos
   *  no snapshot da NF-e. `null` = nota sem snapshot / não emitida (exibe `--`). */
  v_bc_ibs_cbs?: number | null;
  v_ibs_uf?: number | null;
  v_ibs_mun?: number | null;
  v_ibs?: number | null;
  v_cbs?: number | null;
  v_is?: number | null;
  items?: ItemNfeDetail[];
  /**
   * Bloco Financeiro (TASK-FE-036-D2-2) — envio DEFENSIVO/forward-compatible
   * (mirror `IncomePayload.xml_key`): `NfeResource` HOJE (`TASK-BE-036-D2A`/
   * `TASK-BE-036-D2B`, docblock explícito "response inalterado nesta
   * Tarefa") NÃO devolve estas chaves no `GET /nfes/{uuid}` — os títulos
   * gerados (`Income`/`Expense`) existem no backend, mas o `show()` desta
   * fatia não os expõe de volta. Modelado aqui como `Optional`/`undefined`
   * só para a reidratação em edição (`NfeFinancialTab.tsx`) ativar sozinha,
   * sem reabrir este arquivo, se/quando uma fatia futura do backend passar
   * a expor o bloco. LACUNA DECLARADA (SEM MOCK): até lá, editar uma NFe com
   * financeiro já gerado reabre o bloco VAZIO — o usuário precisa
   * reinformar parcelamento/rateio a cada PUT (o backend sempre apaga e
   * recria os títulos, `DeleteOldNfeFinancialTitlesAction`).
   */
  financial_installments?: IncomeInstallmentPayload[];
  financial_categories?: IncomeCategoryPayload[];
  financial_type_title_uuid?: string | null;
  financial_proprietary_uuid?: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface NfesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface NfesListEnvelope {
  success: boolean;
  message: string;
  data: NfeListItem[];
  errors: Record<string, string[]> | null;
  meta: NfesApiPaginationMeta | null;
}

// ============================================
// PAYLOAD DE ESCRITA — espelha `NfeRequest::rules()`/`NfeData` 1:1. SEM
// `farm_id`/`user_id`/`estado`/`code`/`total_products`/`amount` (sempre
// calculados/fixados no servidor) e SEM `has_financial` (GAP-FE-036-401,
// bloco Financeiro fora desta fatia — nunca enviado).
// ============================================

export interface NfeItemPayload {
  product_uuid: string;
  quantity: number;
  amount: number;
  package_uuid?: string | null;
  area_uuid?: string | null;
  warehouse_uuid?: string | null;
  discount?: number;
  order_item?: string | null;
  cfop?: string | null;
  cfop_saida_interno?: string | null;
  cfop_saida_externo?: string | null;
  cst_csosn?: string | null;
  cst_csosn_exp?: string | null;
  cst_pis?: string | null;
  cst_cofins?: string | null;
  cst_ipi?: string | null;
  cenq_ipi?: string | null;
  perc_icms?: number | null;
  perc_pis?: number | null;
  perc_cofins?: number | null;
  perc_ipi?: number | null;
  cest?: string | null;
  barcode?: string | null;
  percent_reduction?: number | null;
  // -- C1 (D-101-19) -- - contrato API C1 confirmado.
  // Nullable; NULL = comportamento atual. `mot_des_icms` depende do CST (dominio por grupo).
  mot_des_icms?: number | null;
  perc_dif?: number | null;
  perc_fcp?: number | null;
  perc_ipi_devol?: number | null;
  modality_bc?: number | null;
  origem?: string | null;
  reference?: string | null;
  cbenef?: string | null;
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
  ind_doacao?: string | null;
  /** Só enviados quando finalidade = devolução (finnfe=4). */
  ref_access_key?: string;
  ref_item_number?: number;
}

export interface NfePayload {
  client_uuid: string;
  natureza_uuid: string;
  state_registration_client: string;
  type_payment: string;
  /** `provider_uuid` continua um FK real de `NfeRequest::rules()` (mirror
   *  1:1 do contrato de API), mas o E2E do dono (esteira 036fix5) confirmou
   *  que "Fornecedor" NÃO existe no cabeçalho do legado (`_forms.blade.php`
   *  só tem Cliente) — `CreateOrUpdateNfe.tsx` não renderiza mais o select
   *  e NUNCA popula esta chave no payload (campo mantido aqui só para não
   *  divergir do contrato real de escrita da API). */
  provider_uuid?: string | null;
  emissor_uuid?: string | null;
  harvest_uuid?: string | null;
  type_debt?: string | null;
  type_credit?: string | null;
  transp_name?: string | null;
  transp_cnpj?: string | null;
  transp_address?: string | null;
  transp_city_uuid?: string | null;
  shipping_type?: number | null;
  shipping_board_vehicle?: string | null;
  shipping_uf_shipping?: string | null;
  shipping_value?: number;
  specie?: string | null;
  number_volumes?: number | null;
  quantity_volumes?: number | null;
  gross_weight?: number | null;
  net_weight?: number | null;
  departure_date?: string | null;
  delivery_date?: string | null;
  discount?: number;
  added_value?: number;
  percent_icms?: number | null;
  icms_base?: number | null;
  gta?: string | null;
  type_guide?: string | null;
  uf_guide?: string | null;
  number_guide?: string | null;
  serie_guide?: string | null;
  /** UT-000776 / T-776-FE-05 — lista completa substitui; omitido preserva. */
  agro_defensivos?: NfeAgroDefensivo[];
  order_number?: string | null;
  ref_nfe?: string | null;
  note?: string | null;
  antt?: string | null;
  tipo?: number | null;
  finnfe?: number | null;
  /** Tipo Emissão — mirror `App\Nfe::emissions()` (E2E do dono, esteira
   *  036fix5). PERSISTIDO pelo backend (`nves.type_emission`) e reidratado
   *  por `NfeResource`. */
  type_emission?: number | null;
  /** "Gerar financeiro?" — E2E do dono, esteira 036fix5 (ajuste do
   *  coordenador). `nves` NÃO tem coluna própria para esta flag — nem o
   *  legado a persiste (lá é só um gatilho em memória; o efeito real,
   *  gerar contas/parcelas, é o B-04, deferido). O backend ACEITA/VALIDA
   *  esta chave no payload, mas NÃO grava nem devolve de volta — enviar é
   *  inofensivo (equivalente a omitir), nunca reidratado em edição. */
  has_financial?: boolean;
  /**
   * Bloco Financeiro real (TASK-FE-036-D2-2, supera `TASK-FE-036-D2`) —
   * `financial_installments`/`financial_categories`/`financial_type_title_uuid`
   * `required_if has_financial=true` (`NfeRequest::rules()`,
   * `TASK-BE-036-D2A`, contract_id `1feb6555`). SEMPRE omitidos (nunca
   * enviados como array vazio/uuid vazio) quando `has_financial=false` —
   * `CreateOrUpdateNfe.tsx::tryPersistNfe` só popula estas 4 chaves quando o
   * bloco está visível.
   */
  financial_installments?: IncomeInstallmentPayload[];
  financial_categories?: IncomeCategoryPayload[];
  financial_type_title_uuid?: string;
  financial_proprietary_uuid?: string | null;
  items: NfeItemPayload[];
}

// ============================================
// REACT HOOK FORM (`useForm<NfeForm>`) — relacionamentos como `Option<string>`
// (exceto `shipping_uf_shipping`/`uf_guide`, que guardam o CÓDIGO CRU da UF,
// mirror `EquipmentForm.uf` do módulo Invoice/Equipment — NUNCA
// `Option<string>`), itens como `useFieldArray`.
// ============================================

export interface NfeItemForm {
  product_uuid: Option<string> | null;
  quantity: number | null;
  amount: number | null;
  /** Unidade do Produto (TASK-FE-036-B17-2) — DISPLAY-ONLY, mirror legado
   *  `.um[]` readonly. Hidratada pela MESMA cascata do D6
   *  (`NfeItemsTab.tsx`, `previousProductUuidRef`) e por `fillNfeForm` em
   *  edição/duplicação. `item_nves` NÃO tem coluna correspondente (Doc
   *  Bruta B-17 §D.4) — NUNCA incluído em `NfeItemPayload`/no builder de
   *  submit (`CreateOrUpdateNfe.tsx#tryPersistNfe`). */
  product_measurement_label?: string | null;
  package_uuid: Option<string> | null;
  area_uuid: Option<string> | null;
  warehouse_uuid: Option<string> | null;
  discount: number | null;
  order_item: string | null;
  cfop: string | null;
  cfop_saida_interno: string | null;
  cfop_saida_externo: string | null;
  cst_csosn: string | null;
  cst_csosn_exp: string | null;
  cst_pis: string | null;
  cst_cofins: string | null;
  cst_ipi: string | null;
  cenq_ipi: string | null;
  perc_icms: number | null;
  perc_pis: number | null;
  perc_cofins: number | null;
  perc_ipi: number | null;
  cest: string | null;
  barcode: string | null;
  percent_reduction: number | null;
  // -- C1 (D-101-19) -- - contrato API C1 confirmado.
  // Nullable; NULL = comportamento atual. `mot_des_icms` depende do CST (dominio por grupo).
  mot_des_icms?: number | null;
  perc_dif?: number | null;
  perc_fcp?: number | null;
  perc_ipi_devol?: number | null;
  modality_bc: number | null;
  origem: string | null;
  reference: string | null;
  cbenef: string | null;
  c_class_trib: string | null;
  cst_ibs_cbs: string | null;
  perc_ibs_uf: number | null;
  perc_ibs_mun: number | null;
  perc_reducao_aliq_ibs_uf: number | null;
  perc_reducao_aliq_ibs_mun: number | null;
  perc_dif_ibs_uf: number | null;
  perc_dif_ibs_mun: number | null;
  perc_cbs: number | null;
  perc_reducao_aliq_cbs: number | null;
  perc_dif_cbs: number | null;
  cst_is: string | null;
  perc_is: number | null;
  perc_is_espec: number | null;
  u_trib_is: string | null;
  ad_rem_ibs: number | null;
  ad_rem_cbs: number | null;
  tp_cred_pres_ibs_zfm: number | null;
  ind_doacao: string | null;
  ref_access_key: string | null;
  ref_item_number: number | null;
}

export interface NfeForm {
  client_uuid: Option<string> | null;
  natureza_uuid: Option<string> | null;
  state_registration_client: string | null;
  type_payment: string | null;
  emissor_uuid: Option<string> | null;
  harvest_uuid: Option<string> | null;
  /** REWORK DE FIDELIDADE (correcoes-e2e-rodada-1, D4/§D4 do MAPA
   *  `nfe-form-behavior.md`) — "Prestador de Serviço" do bloco
   *  Transportadora (`provider_id` no legado, `_forms.blade.php:172-209`).
   *  Reaproveita o FK real `provider_uuid` de `NfeRequest::rules()` (já
   *  modelado em `NfePayload`/`NfeDetail.provider`), nunca antes renderizado
   *  no formulário de criação/edição — só na Visualização
   *  (`NfeDetalhe.tsx`, rótulo "Fornecedor"). */
  provider_uuid: Option<string> | null;
  type_debt: string | null;
  type_credit: string | null;
  transp_name: string | null;
  transp_cnpj: string | null;
  transp_address: string | null;
  transp_city_uuid: Option<string> | null;
  shipping_type: number | null;
  shipping_board_vehicle: string | null;
  /** Código CRU da UF (`AL`/`RS`/...) — NUNCA `Option<string>`, mirror
   *  `EquipmentForm.uf`. */
  shipping_uf_shipping: string | null;
  shipping_value: number | null;
  specie: string | null;
  number_volumes: number | null;
  quantity_volumes: number | null;
  gross_weight: number | null;
  net_weight: number | null;
  departure_date: string | null;
  delivery_date: string | null;
  /** DERIVADO — soma de `items[].discount`, `InputReadOnly` (contrato de
   *  tela §4.3). Nunca editado diretamente pelo usuário; mantido no form
   *  para ir no payload junto do resto do cabeçalho. */
  discount: number | null;
  added_value: number | null;
  percent_icms: number | null;
  icms_base: number | null;
  gta: string | null;
  type_guide: string | null;
  /** Código CRU da UF — NUNCA `Option<string>`, mesmo racional de
   *  `shipping_uf_shipping`. */
  uf_guide: string | null;
  number_guide: string | null;
  serie_guide: string | null;
  /** UT-000776 / T-776-FE-05 — defensivos agrícolas (máx. 20); exclusivo com a guia. */
  agro_defensivos: NfeAgroDefensivo[];
  order_number: string | null;
  ref_nfe: string | null;
  note: string | null;
  antt: string | null;
  tipo: number | null;
  finnfe: number | null;
  /** Tipo Emissão — mirror `App\Nfe::emissions()` (E2E do dono, esteira
   *  036fix5), `Select` catalogado (`nfeTypeEmissionOptions`). Default
   *  legado `1` (Emissão normal). PERSISTIDO — reidratado em edição a
   *  partir de `NfeDetail.type_emission`. */
  type_emission: number | null;
  /** "Gerar financeiro?" (Sim/Não) — E2E do dono, esteira 036fix5 (ajuste
   *  do coordenador). NÃO é persistido pelo backend (`nves` sem coluna
   *  própria, mirror o legado que também só usa um gatilho em memória) —
   *  SEMPRE default `true` ("Sim"), inclusive em edição (nunca reidratado
   *  de `NfeDetail`, que não expõe esta chave). */
  has_financial: boolean;
  /**
   * Bloco Financeiro real (TASK-FE-036-D2-2) — só existe/valida quando
   * `has_financial===true` (`NfeFinancialTab.tsx`, aba condicional). Linhas
   * reaproveitam LITERALMENTE `IncomeInstallmentForm`/`IncomeApportionmentForm`
   * (mesma forma de campo `due_date`/`value` e `category_uuid`/
   * `plan_account_uuid`/`center_uuid`/`percentage` exigida pelo payload) —
   * NÃO duplicadas aqui (Regra de ouro da Tarefa).
   */
  financial_type_title_uuid: Option<string> | null;
  financial_proprietary_uuid: Option<string> | null;
  financial_installments: IncomeInstallmentForm[];
  financial_categories: IncomeApportionmentForm[];
  items: NfeItemForm[];
}

// ============================================
// FILTRO (drawer da listagem — `NfeIndexRequest::rules()`)
// ============================================

export interface NfeFilterForm {
  client_id?: string;
  estado?: NfeEstado;
  emission_from?: string;
  emission_to?: string;
  /** Correção NFE-R2-002 — `NfeIndexRequest::rules()` real (branch
   *  `feature/036-financeiro-fiscal`) já aceita estes 5 filtros extras,
   *  mirror legado (`index.blade.php:41-76`). Existence-only (mesmo padrão
   *  de `client_id`) — uuid/valor que não resolve nenhuma linha só devolve
   *  lista vazia, sem 422. */
  numero_nfe?: string;
  product_id?: string;
  issuer_id?: string;
  amount?: number;
  harvest_id?: string;
}

// ============================================
// EMISSÃO/EVENTOS SEFAZ (Área A, esteira 036 — TASK-FE-036-510). Consome
// `NfeEmissionController`/`NfeDocumentController`, Controllers NOVOS e
// DISTINTOS do cadastro acima (`NfeController`, contract_id `dcfa26ba`,
// NÃO tocado por esta fatia). Modelado por LEITURA DIRETA de
// `NfeEmissionController.php`/`NfeEmissionRequest.php`/`NfeEventRequest.php`/
// `NfeEmissionResource.php`/`NfeDocumentController.php` (branch
// `feature/036-fe-financeiro-fiscal` do backend, contract_id `5ecda570`).
//
// ⚠️ `NfeEmissionResult` **NUNCA** é a mesma entidade de leitura que
// `NfeDetail` — mesmo `uuid`/`estado` em comum, mas `NfeDetail` (cadastro,
// `GET /nfes/{uuid}`) deliberadamente NUNCA expõe `numero_nfe`/`chave`/
// `receipt`/`date_send_sefaz`/`sequencia_evento` (docblock de
// `NfeEmissionResource.php`, GAP-FE-036-402) — só os 4 endpoints abaixo
// (`emit`/`cancel`/`correct`/`emission-status`) os expõem. Nunca importar
// campos de `NfeEmissionResult` dentro de `NfeForm`/`NfePayload`.
// ============================================

/** `POST /nfes/{uuid}/emit|cancel|correct` e `GET /nfes/{uuid}/emission-status`
 *  — mirror 1:1 de `NfeEmissionResource::toArray()` (leitura direta,
 *  `app/Http/Resources/NfeEmission/NfeEmissionResource.php`). Resource NOVO,
 *  não estende `NfeResource` de cadastro (evita reabrir/arriscar regressão
 *  no Resource já testado). */
export interface NfeEmissionResult {
  uuid: string;
  estado: NfeEstado;
  estado_label: string;
  estado_color: string;
  numero_nfe: string | null;
  /** Série usada na emissão (UT-000780). */
  serie?: number | null;
  chave: string | null;
  receipt: string | null;
  date_send_sefaz: string | null;
  sequencia_evento: number;
}

/** `POST /nfes/{uuid}/emit` — mirror 1:1 de `NfeEmissionRequest::rules()`
 *  (leitura direta). `issuer_uuid` é FK tenant-scoped (`issues.uuid`,
 *  catálogo de tenant — não farm-scoped); `state_registration` é o número
 *  (texto livre) validado pela Action contra
 *  `Issuer::stateRegistrations()`, nunca aqui no front. */
export interface NfeEmitPayload {
  issuer_uuid: string;
  state_registration: string;
  /** Série escolhida na emissão (UT-000780, D-101-02) — `uuid` de uma série
   *  ativa do emissor; a API devolve `serie`/`numero_nfe` na resposta. */
  series_uuid: string;
}

/** `GET /nfes/issuer-options` — GAP-FE-036-516 (correção de fidelidade da
 *  Onda 4): emissores ELEGÍVEIS para emissão (gate `nfe_view`, farm-scoped),
 *  JÁ COM as IEs cadastradas do próprio emissor embutidas
 *  (`state_registrations[]`) — dispensa uma 2ª chamada por emissor, mirror
 *  `listBranchesByProvider` (lista plana, SEM paginação, endpoint dedicado
 *  SEM o gate do CRUD `issue_view` de `GET /issuers`). Consumido pelo select
 *  de Emissor do `NfeEmitModal` — a cascata Emissor→IE deriva
 *  `state_registrations` do próprio item selecionado desta lista, nunca de
 *  `state_registration_client` (IE do CLIENTE, campo ERRADO usado antes
 *  desta correção). */
export interface NfeIssuerOption {
  uuid: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  state_registrations: string[];
  /** D4 (T-DEF02-API-02): o emissor exige IBS/CBS no item (flag, ou homologação + CRT 3). */
  requires_ibscbs?: boolean;
  /** D2: CNPJ/CPF do emissor normalizado (só dígitos), exposto por `GET /nfes/issuer-options`. Base do aviso 1194. */
  document: string | null;
  /** Séries ATIVAS do emissor (UT-000780); a padrão vem com `is_default`. */
  series: NfeIssuerSeriesOption[];
}

export interface NfeIssuerSeriesOption {
  uuid: string;
  serie: number;
  is_default: boolean;
}

/** `POST /nfes/{uuid}/cancel` e `POST /nfes/{uuid}/correct` — mirror 1:1 de
 *  `NfeEventRequest::rules()` (leitura direta). `nfe_id` vira o `{uuid}` da
 *  URL (route-model binding), nunca vai no corpo — só `motivo` (texto
 *  livre, justificativa do cancelamento/CC-e) chega aqui. */
export interface NfeEventPayload {
  motivo: string;
}

/** `situacao` devolvida pela consulta SEFAZ (UT-000748, D-API-04). */
export type NfeConsultSituacao = 'autorizado' | 'cancelado' | 'processando';

/** `POST /nfes/{uuid}/consult` — **shape DISTINTO** de `NfeEmissionResult`,
 *  confirmado por leitura direta de `NfeEmissionController::consult()`:
 *  devolve o resultado CRU da consulta SEFAZ (`SefazConsultResultData`),
 *  não o `NfeEmissionResource`. Divergência real do backend frente ao
 *  presumido no plano de arquitetura (que assumia o mesmo shape para os 4
 *  endpoints de `NfeEmissionController`) — registrada aqui por fidelidade
 *  (SEM MOCK), não inventada. Consumo de `consultNfe` fica para
 *  TASK-FE-036-514 (fora desta onda); o tipo já é modelado aqui (mesma
 *  Tarefa de fundação, TASK-FE-036-510) para não reabrir o service depois.
 *  UT-000748: `situacao ∈ {autorizado, cancelado, processando}` + `estado`
 *  (a API marca a nota como `cancelado` quando a SEFAZ já a cancelou). */
export interface NfeSefazConsultResult {
  situacao: NfeConsultSituacao;
  protocol_number: string | null;
  protocol_status: string | null;
  protocol_motivo: string | null;
  chave: string;
  /** Estado da NF-e já sincronizado pela API (D-API-04, UT-000748). */
  estado: NfeEstado;
}
