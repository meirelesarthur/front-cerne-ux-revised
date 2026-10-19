// src/@types/v2/MovementSales/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de VENDA DE ANIMAIS (MovementSale — Operacional > Pecuária).
//
// Fonte: `frontend-contract-vendas.md` §4 é a MELHOR INFERÊNCIA do Arquiteto
// (DTO real não lido na sessão dele) — este arquivo é o resultado da
// confirmação campo a campo determinada pelo contrato (§4, checklist
// obrigatório), feita contra o código REAL da API nesta Tarefa
// (`GB.Cerne.Api`, branch `feature/vendas-nascimentos-for-api`):
//   app/Http/Resources/V1/MovementSaleResource.php (leitura — list + detail)
//   app/Data/MovementSale/{MovementSaleData,MovementSaleItemData,MovementSaleFilterData}.php (escrita)
//   app/Repositories/MovementSaleRepository.php (`listWithFilters`/`findByUuidOrFail` — eager load)
//   app/Enums/MovementSale/*.php (labels)
//
// DIVERGÊNCIAS reais encontradas vs. a inferência do contrato (ajustadas
// aqui, não são Gap de arquitetura — "confirmar contra o código" é o
// comportamento esperado, contrato §4 nota de topo):
//
//   1. RESOLVIDO (VD-API-02, `GAP-API-FE-02` FECHADO) — `MovementSaleResource`
//      agora expõe `incomes_count` (via `whenCounted`, `listWithFilters()`
//      passa a `withCount('incomes')`) e `nfe` (agora eager-loaded também na
//      listagem, `with([...,'nfe'])`) em `MovementSaleListItem`. As colunas
//      "Financeiro" (LM8) e "N. NFe" (LM9) da grid (`VendaAnimais/index.tsx`)
//      passam a ter dado real — sem MOCK, dado vem do servidor.
//   2. RESOLVIDO (VD-API-01, `GAP-API-FE-01` FECHADO) — `chave`/`serie`/
//      `number`/`has_financial` agora são projetados incondicionalmente pelo
//      `MovementSaleResource::toArray()` (top-level, list E detail — read-only,
//      nunca `$fillable`). `MovementSaleDetail.incomes[]` (`whenLoaded`, só
//      no detalhe) expõe as parcelas com `allocations[]` do rateio
//      (`financial_category_uuid`/`cost_center_uuid`/`plan_account_uuid`/
//      `value`/`percent`) — fecha `RT-009`/F-014/015/016/F-047/055-059
//      (`fillMovementSaleForm`, `CreateOrUpdateMovementSale.tsx`).
//   3. `type_payment`/`note` (Tarefa 23, `GAP-VD-14` FECHADO) — expostos por
//      `MovementSaleResource::toArray()` (chaves incondicionais, sem
//      `whenLoaded`, presentes em list E detail).
//   4. `batch` (não `batches[]`) — singular, mirror docblock do
//      `MovementSaleResource` (`batch_id_sale` é FK única).
//   5. Filtro morto (`GAP-VD-02`): `MovementSaleFilterData` usa
//      `#[MapInputName(SnakeCaseMapper::class)]` com propriedade `clientId`
//      (não `clientUuid`) — o campo seria `client_id` na querystring, não
//      `client_uuid`. Como o Repository NUNCA aplica esse filtro (só
//      `type_sale` filtra de fato), o nome exato é irrelevante em
//      comportamento, mas mantido fiel ao DTO real por precisão.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS BACKED (valores físicos exatos — app/Enums/MovementSale/*.php)
// ============================================

export type MovementSaleType = 1 | 2; // 1=Recria, 2=Abate
export type MovementSaleMode = 'I' | 'D'; // I=Individual, D=Desmama
export type MovementSaleStatus = 'P' | 'F'; // P=Pendente, F=Finalizada
export type MovementSalePricingType = 1 | 2; // 1=Kg/Arroba, 2=Cabeça

// ============================================
// ENTIDADES ANINHADAS
// ============================================

export interface MovementSaleClientRef {
  uuid: string;
  name: string | null;
}

export interface MovementSaleSellerRef {
  uuid: string;
  name: string | null;
}

export interface MovementSaleBatchRef {
  uuid: string;
  description: string | null;
}

export interface MovementSaleNfeRef {
  uuid: string;
  number: string | null;
}

export interface MovementSaleAnimalRef {
  uuid: string;
  identification: string | null;
}

export interface MovementSaleCategoryRef {
  uuid: string;
  description: string | null;
}

// ============================================
// ITEM (leitura — `MovementSaleResource.items[]`, whenLoaded só no detalhe)
// `gain`/`gmd` recalculados a cada leitura pelo servidor (`GetMovementSaleAction`),
// nunca persistidos — a tela de Detalhe (§6 do contrato) OMITE as 2 colunas
// deliberadamente (mode_matrix "visualizar"), mesmo a API os devolvendo.
// ============================================

export interface MovementSaleItem {
  animal: MovementSaleAnimalRef | null;
  category: MovementSaleCategoryRef | null;
  weight_kg: number;
  performance: number | null;
  value_real: number;
  value_arroba: number;
  value_head: number;
  value_unit: number;
  amount: number;
  quantity: number;
  carcass_weight: number | null;
  note: string | null;
  /** Calculado no servidor, nunca persistido — NÃO exibido no Detalhe (§6). */
  gain: number | null;
  /** Idem `gain`. */
  gmd: number | null;
}

// ============================================
// CATEGORIA AGREGADA (leitura — `MovementSaleResource.categories[]`, pivot)
// ============================================

export interface MovementSaleCategoryAggregate {
  uuid: string;
  description: string | null;
  quantity: number;
  value_real: number;
  value_arroba: number;
  value_total: number;
  value_head: number;
}

// ============================================
// RATEIO/PARCELA DE LEITURA (VD-API-01, `MovementSaleResource.incomes[]`,
// `whenLoaded` — só no detalhe) — 1 `Income` física = 1 parcela; TODAS as
// parcelas de uma venda carregam o MESMO conjunto de `allocations[]`
// (proporcional ao valor da parcela — mirror `InsertFinancialAction`, cada
// parcela recebe `value = installmentValue * percent`, `percent` idêntico em
// todas). `percent` já vem calculado pelo servidor
// (`category.pivot.value / income.amount`).
// ============================================

export interface MovementSaleIncomeAllocationRef {
  financial_category_uuid: string;
  cost_center_uuid: string | null;
  /** VD-API-03 (`GAP-API-FE-03`) — Conta Contábil do rateio, opcional
   *  (`null` quando a linha não tem conta vinculada, comportamento
   *  preservado). */
  plan_account_uuid: string | null;
  value: number;
  percent: number;
}

export interface MovementSaleIncome {
  due_date: string | null;
  amount: number;
  fiscal_document: boolean;
  installment: number;
  allocations: MovementSaleIncomeAllocationRef[];
}

// ============================================
// LISTAGEM — `GET /movement-sales` (`MovementSaleRepository::listWithFilters()`,
// eager-load `['client.people','seller.people','farm','nfe']` +
// `withCount('incomes')`, VD-API-02 — SEM `batch`/`items`/`categories`/
// `documents`/`incomes[]` completo, só o resumo).
// ============================================

export interface MovementSaleListItem {
  uuid: string;
  code: string;
  status: MovementSaleStatus;
  status_label: string;
  type_sale: MovementSaleType;
  type_sale_label: string;
  type: MovementSaleMode;
  pricing_type: MovementSalePricingType;
  /** `GAP-VD-14` FECHADO (confirmado contra `MovementSaleResource::toArray()`
   *  real, Tarefa 23) — código livre (`Nfe::typesPayment()`,
   *  `movementSaleTypePaymentOptions`), sempre presente (nunca `whenLoaded`),
   *  em list E detail. */
  type_payment: string | null;
  dt_sale: string; // YYYY-MM-DD
  client: MovementSaleClientRef | null;
  /** Presente quando `seller_id` existir (eager-loaded na listagem). */
  seller: MovementSaleSellerRef | null;
  batch_sale: boolean;
  total_products: number;
  freight: number;
  other_values: number;
  discount: number;
  total: number;
  gtas: string | null;
  /** Idem `type_payment` — `GAP-VD-14` fechado, sempre presente. */
  note: string | null;
  /** VD-API-01 (`GAP-API-FE-01`) — projeção direta da coluna física de
   *  origem-XML, read-only, top-level incondicional (list E detail). */
  chave: string | null;
  serie: string | null;
  number: string | null;
  /** VD-API-01 — `relationLoaded('incomes') ? incomes.isNotEmpty() :
   *  (incomes_count > 0)`; nunca `whenLoaded` (sempre presente). */
  has_financial: boolean;
  /** VD-API-02 — `whenCounted('incomes', ...)`; presente na LISTAGEM
   *  (`withCount`); no detalhe o Resource não conta (carrega `incomes[]`
   *  completo em vez disso), por isso opcional aqui. */
  incomes_count?: number;
  /** VD-API-02 — agora eager-loaded também na listagem (`with([...,'nfe'])`). */
  nfe: MovementSaleNfeRef | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// DETALHE — `GET /movement-sales/{uuid}` (`findByUuidOrFail()`, eager-load
// completo: `items.animal`, `items.category`, `categories`, `documents`,
// `seller.people`, `client.people`, `farm`, `batch`, `nfe`, `incomes.categories`).
// ============================================

export interface MovementSaleDetail extends MovementSaleListItem {
  batch: MovementSaleBatchRef | null;
  items: MovementSaleItem[];
  categories: MovementSaleCategoryAggregate[];
  /** VD-API-01 (`GAP-API-FE-01`) — parcelas + rateio já gerados para esta
   *  venda (`whenLoaded`, vazio `[]` quando `has_financial===false`). Fonte
   *  de reidratação de `financial_installments`/`financial_allocations` na
   *  edição (`fillMovementSaleForm`, `movementSaleIncomesToInstallmentsForm`/
   *  `movementSaleIncomeAllocationsToForm`, `useMovementSales.tsx`). */
  incomes: MovementSaleIncome[];
  /** Anexos (`POST .../documents`, Tarefa 17) — fora do escopo desta Tarefa,
   *  tipado aqui só porque o Resource já os devolve no detalhe. */
  documents: Array<{
    uuid: string;
    description: string | null;
    date: string | null;
    anexo: string | null;
  }>;
}

// ============================================
// FILTRO (drawer da listagem) — 1 filtro efetivo (`type_sale`) + 4 mortos
// preservados (`GAP-VD-02`, decisão do dono já tomada, contrato §5.2).
// ============================================

export interface MovementSaleFilterForm {
  type_sale?: MovementSaleType; // ÚNICO filtro efetivamente aplicado no servidor
  search?: string; // preservado morto — GAP-VD-02
  client_uuid?: string; // preservado morto (companion de exibição do Select)
  client_label?: string; // companion DISPLAY-ONLY de re-hidratação, nunca vai ao service
  start_date?: string; // preservado morto
  end_date?: string; // preservado morto
}

// Forma enviada à querystring (`MovementSaleFilterData`, `MapInputName`
// snake_case) — `client_id` (nome real do DTO), não `client_uuid` (divergência #5).
export interface MovementSaleFilterRequest {
  type_sale?: MovementSaleType;
  search?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================
// ESCRITA (`MovementSaleData`/`MovementSaleItemData`, Tarefa 15) — declarados
// aqui por instrução da fundação (contrato §10), efetivamente CONSUMIDOS
// pelo formulário da Tarefa 15/16.
// ============================================

// ============================================
// SUBFLUXO FINANCEIRO (TASK-VD-FE-04, fundação compartilhada — GAP-VENDAS-FE-04/
// GAP-VENDAS-FE-05) — Rateio (Categoria/Centro de Custo/Valor) + Parcelamento
// (Data/Valor), copy-adapt de `FarmTransferAllocationRowForm`/
// `FarmTransferInstallmentForm` (`@/@types/v2/FarmTransfers`). Consumidos por
// `MovementSaleIncomeAllocation.tsx`/`MovementSaleInstallmentsSection.tsx`
// (Tarefa 21) e pelas telas de Criar/Editar/Finalizar (Tarefas 22/23) — esta
// Tarefa NÃO monta nenhum dos dois nas telas.
// ============================================

/** 1 linha do rateio de receita (`financial.income_categories`/`income_centers`/
 *  `income_category_values`/`income_plan_accounts`, GAP-VENDAS-FE-04 §D +
 *  VD-API-03/`GAP-API-FE-03`) — mirror `FarmTransferAllocationRowForm` +
 *  `plan_account_uuid` (Conta Contábil, opcional — restaurado por
 *  `GAP-API-FE-03`, `income_plan_accounts[]` aceito pelo `MovementSaleRequest`). */
export interface MovementSaleAllocationRowForm {
  category_uuid: Option | null;
  center_uuid: Option | null;
  /** Opcional — rateio sem Conta Contábil continua salvando `null` (comportamento preservado). */
  plan_account_uuid?: Option | null;
  value: number | null;
}

/** 1 parcela do parcelamento (`financial.date_installments`/`value_installments`) —
 *  mirror `FarmTransferInstallmentForm`. */
export interface MovementSaleInstallmentRowForm {
  date: string | null;
  value: number | null;
}

/**
 * Shape REAL enviado ao servidor dentro de `MovementSalePayload.financial`/
 * `MovementSaleSlaughterPayload.financial` — idêntico nos 2 endpoints
 * (confirmado contra `MovementSaleRequest.php:123-135` e
 * `MovementSaleSlaughterRequest.php:59-71`, GB.Cerne.Api). Percentuais
 * (`category_percent_values[]` do legado) são UI-only e NUNCA entram aqui —
 * mirror `CreateFarmTransfer.tsx:303-329`. `income_category_percent` (existe
 * em `CreateFarmTransferPayload`) NÃO tem equivalente aqui — não replicar.
 */
export interface MovementSaleFinancialPayload {
  date_installments: string[];
  value_installments: number[];
  vl_total: number;
  income_categories: string[];
  income_centers: string[];
  income_category_values: number[];
  /** VD-API-03 (`GAP-API-FE-03`) — uuid de `PlanAccount` por linha de rateio,
   *  `null` quando a linha não tem Conta Contábil vinculada (opcional,
   *  mirror exato de `income_centers`, aceito por
   *  `MovementSaleRequest::rules()`, `financial.income_plan_accounts.*`). */
  income_plan_accounts: Array<string | null>;
  /** UT-000719 (D-097-12) — Documento Fiscal do Income gerado. Enviado SÓ na
   *  finalização (individual/lote) com `has_financial=true`; Criar/Editar não
   *  o enviam. Ausente => API grava `false`. */
  fiscal_document?: boolean;
}

export interface MovementSaleItemPayload {
  animal_uuid: string;
  category_uuid: string;
  batch_uuid?: string;
  weight_kg: number;
  performance?: number;
  value_real: number;
  value_arroba: number;
  value_head: number;
  value_unit: number;
  amount: number;
  quantity: number;
  note?: string;
  carcass_weight?: number;
}

// VD-FE-01 (contrato §3.2 FALTA-A / SURF-EP-018) — resposta de
// `POST /movement-sales/weighing-parse` (`MovementSaleWeighingParseResource`
// real, `GB.Cerne.Api`). Confirmado contra o código: o servidor SEMPRE
// resolve a identificação da planilha para `animal_uuid` (nunca devolve só
// `identification`) — animais sem casamento (identificação inexistente,
// inativa, de outra fazenda, ou peso ≤ 0) são OMITIDOS da resposta, nunca
// sinalizados como erro. NENHUMA persistência no servidor (SE-013) — só
// hidrata `weight_kg` dos itens já selecionados no form via `setValue`.
export interface MovementSaleWeighingParseRow {
  animal_uuid: string;
  weight_kg: number;
}

export interface MovementSaleCategoryPayload {
  category_uuid: string;
  quantity: number;
  value_real: number;
  value_arroba: number;
  value_total: number;
  value_head: number;
}

export interface MovementSalePayload {
  dt_sale: string;
  client_uuid: string;
  seller_uuid?: string;
  batch_sale: boolean;
  batch_id_sale_uuid?: string;
  type_sale: MovementSaleType;
  pricing_type: MovementSalePricingType;
  type_payment: string;
  gtas?: string;
  note?: string;
  total_products: number;
  freight: number;
  other_values: number;
  discount: number;
  total: number;
  items: MovementSaleItemPayload[];
  categories: MovementSaleCategoryPayload[];
  has_financial?: boolean;
  financial?: MovementSaleFinancialPayload;
  model?: string;
  model_id?: string;
}

// Option helpers (Selects) — reexport de conveniência para as telas do módulo.
export type MovementSaleTypeOption = Option<MovementSaleType>;
export type MovementSalePricingTypeOption = Option<MovementSalePricingType>;

// ============================================
// DOCUMENTOS (escrita) — `POST /movement-sales/{uuid}/documents` (Tarefa
// 17.b, task-packet §3/matriz FID-G3F #1, confirmado contra
// `MovementSaleDocumentRequest`/`StoreMovementSaleDocumentsAction`/
// `MovementSaleDocumentData` reais, `GB.Cerne.Api`). Diff COMPLETO — o array
// enviado substitui o estado do servidor por inteiro (detach + delete físico
// de tudo que não aparecer, `StoreMovementSaleDocumentsAction:79-84`).
//
// Shape PRÓPRIO — NÃO é `DocumentManagementForm` (`{uuid,name,file}`,
// `@/@types/v2/Documentos`). Copy-adapt da MECÂNICA de
// `DocumentoAnexosSection.tsx` (useFieldArray + FileUpload por linha), nunca
// reuso direto do tipo (Tarefa §1.1/DEC-022).
// ============================================

export interface MovementSaleDocumentRow {
  /** Presente = linha já persistida (`documents[].uuid` do detalhe,
   *  `GET /movement-sales/{uuid}`); ausente/`null` = linha nova — o servidor
   *  então exige `file` (`required` quando ausente, `sometimes` quando já
   *  existe, mirror `MovementSaleDocumentRequest::rules()`). */
  old_document_uuid: string | null;
  /** `required` sempre no servidor, `max:50`. */
  description: string;
  /** `YYYY-MM-DD` ou `null` — vazio, o servidor aplica `now()` (`sometimes,nullable,date`). */
  date: string | null;
  /** `mimes:pdf`, `max:2048` (2 MB) — fidelidade ao legado (`SCR-H4`),
   *  validado no CLIENTE antes do POST (fora do Yup, mesmo racional de
   *  `equipment-schema.ts`). */
  file: File | null;
}

export interface MovementSaleDocumentsForm {
  documents: MovementSaleDocumentRow[];
}

// ============================================
// EMITIR NFE — HANDOFF (Tarefa 17.c, task-packet §3/matriz FID-G3F #3,
// confirmado contra `IssueNfeAction`/`MovementSaleController::nfeIssue()`
// reais, `GB.Cerne.Api`). `POST /movement-sales/{uuid}/nfe-issue` (SEM
// corpo, gate `movement_sales_edit`) NÃO emite NFe nem grava `nfe_id`
// (DEC-022) — devolve só este payload de HANDOFF, mirror exato do
// `session('nfe')` do legado. O destino real é a navegação para
// `/fiscal/nfe-emitidas/novo` (`location.state.movementSaleHandoff`,
// mudança ADITIVA em `CreateOrUpdateNfe.tsx`, Tarefa §2.4).
//
// `guide_number` (aqui) → `number_guide` (campo real do `NfeRequest`/
// `NfeForm` — nomes DIVERGENTES entre os dois módulos, remapeado no
// caller). `type_guide`/`uf_guide` são homônimos de `NfeForm` (ambos
// `string | null`, mesmo racional de `shipping_uf_shipping` — código CRU da
// UF, nunca `Option<string>`). `items[].{product_uuid,quantity,amount}` são
// homônimos de `NfeItemPayload`/`NfeItemForm`. `amount` (nível topo, total
// da guia) NÃO tem campo correspondente em `NfeForm` — o total da NFe lá é
// SEMPRE derivado (`nfeTotalAmount`, soma de `items[].amount` + frete +
// acréscimo − desconto); mapear os itens já basta para o total recomputar
// sozinho, sem inventar um campo de cabeçalho novo.
//
// `model`/`model_uuid`/`block_financial` NÃO existem no `NfeRequest` real —
// DECISAO_DE_ESCOPO (matriz FID-G3F #3a): trafegados neste tipo para não
// perder o dado do handoff, mas DELIBERADAMENTE não consumidos por
// `CreateOrUpdateNfe.tsx` (consumir exigiria inventar regra fiscal/
// financeira sem contrato).
// ============================================

export interface MovementSaleNfeHandoffItem {
  product_uuid: string;
  quantity: number;
  amount: number;
}

export interface MovementSaleNfeHandoffPayload {
  type_guide: string | null;
  guide_number: string | null;
  uf_guide: string | null;
  items: MovementSaleNfeHandoffItem[];
  /** Não existe no `NfeRequest` — NÃO consumido (DECISAO_DE_ESCOPO). */
  model: string | null;
  /** Idem `model`. */
  model_uuid: string | null;
  /** Idem `model`. */
  block_financial: boolean | null;
  /** Total da guia — NÃO consumido diretamente (ver nota de topo, o total
   *  do form de NFe é sempre derivado dos itens). */
  amount: number;
}

// ============================================
// FINALIZAÇÃO DE ABATE (TASK-VD-FE-03, contrato §8) — `GET/PUT
// .../{uuid}/slaughter` (individual) e `GET/PUT .../slaughter-many` (lote).
// Shape confirmado CAMPO A CAMPO contra o código real desta Tarefa
// (`GB.Cerne.Api` branch `feature/vendas-nascimentos-for-api`):
//   app/Data/MovementSale/{MovementSaleSlaughterData,MovementSaleSlaughterItemData,MovementSaleSlaughterManyData}.php
//   app/Http/Requests/Api/V1/{MovementSaleSlaughterRequest,MovementSaleSlaughterManyRequest}.php
//
// ⚠️ Achado de fidelidade (diverge da inferência do contrato de tela §8.1
// "enviar só total_carcass"): o `MovementSaleSlaughterRequest` real exige o
// payload de finalização com o MESMO formato agregado do fluxo principal —
// `items[]` (1 por animal, `animal_uuid` + `carcass_weight`/`performance`
// editáveis + `value_real`/`value_arroba` replicados da categoria, mirror
// `buildMovementSaleItemPayload`) + `categories[]` (rateio por categoria,
// MESMO shape de `MovementSaleCategoryPayload`) + totais agregados. Não há
// campo `total_carcass` no DTO real — "confirmar contra o código", não Gap
// (contrato §4, mesmo racional já aplicado nas Tarefas 14/15).
//
// Fator de conversão Kg↔Arroba de CARCAÇA (`CV3`/`GAP-VD-04`,
// `WeightConversion::KG_TO_ARROBA_SLAUGHTER_FACTOR = 15`) — DIFERENTE do
// fator 30 (`KG_TO_ARROBA_MAIN_FACTOR`) do fluxo principal (§7.3). Nunca
// reutilizar a constante do form principal aqui.
// ============================================

export interface MovementSaleSlaughterItemPayload {
  animal_uuid: string;
  carcass_weight: number;
  performance: number;
  value_real: number;
  value_arroba: number;
}

export interface MovementSaleSlaughterPayload {
  items: MovementSaleSlaughterItemPayload[];
  categories: MovementSaleCategoryPayload[];
  total_products: number;
  freight: number;
  other_values: number;
  discount: number;
  total: number;
  has_financial?: boolean;
  financial?: MovementSaleFinancialPayload;
  /**
   * TASK-VD-FE-05 / D1-a / `GAP-VD-14` — código de 2 caracteres do catálogo
   * `App\Nfe::typesPayment()` (`movementSaleTypePaymentOptions`). Enviado
   * SÓ pela Finalização INDIVIDUAL (`buildMovementSaleSlaughterPayload`,
   * `includeTypePayment` default `true`); a Finalização EM LOTE
   * (`buildMovementSaleSlaughterManyPayload`) o omite deliberadamente —
   * `updateMany()` no legado descarta o campo por construção (D-LOTE-a),
   * reproduzir um campo morto seria pior que omiti-lo. A API já
   * aceita/persiste o campo na finalização individual (`sometimes|string|
   * max:2`, `MovementSaleSlaughterRequest`); não persiste no lote.
   */
  type_payment?: string;
}

export interface MovementSaleSlaughterManyPayload extends MovementSaleSlaughterPayload {
  sale_uuids: string[];
}

// ============================================
// FORMULÁRIO (react-hook-form, TASK-VD-FE-02/`CreateOrUpdateMovementSale.tsx`)
// — shape de TELA (`Option<>` nos selects), distinto do shape de FIO
// (`MovementSale*Payload` acima). `buildMovementSalePayload`
// (`useMovementSales.tsx`) converte um para o outro no submit.
//
// ACHADO DE FIDELIDADE (confirmado contra o código real da API nesta
// Tarefa, `MovementSaleRequest::rules()`/`CreateMovementSaleItemsAction`,
// GB.Cerne.Api branch `feature/vendas-nascimentos-for-api`) — DIVERGE da
// interpretação do contrato de tela §7.3 ("no submit, cada item NÃO carrega
// preço — o preço vai só no array categories"): o `MovementSaleRequest` real
// exige `items.*.value_real/value_arroba/value_head/value_unit` como
// `required|numeric` — o servidor NÃO distribui o preço da categoria para
// cada item sozinho, é o CLIENTE quem precisa enviar os 3 campos em CADA
// item. A UX legada (preço digitado 1x por CATEGORIA) é preservada — o
// usuário só vê o input em `MovementSaleCategoriesTab`, nunca por item —
// mas o payload de cada item é montado replicando o `value_real`/
// `value_arroba`/`value_head` da SUA categoria (`buildMovementSaleItemPayload`,
// `useMovementSales.tsx`), com `value_unit` recalculado no cliente pela
// MESMA fórmula que o servidor já aplica (`CreateMovementSaleItemsAction`,
// ignorada de qualquer forma no servidor — mas precisa ser um número válido
// ≥0 para passar a validação):
//   pricing_type===1 (Kg/Arroba): value_unit = value_real * (weight_kg / 30)
//   pricing_type===2 (Cabeça):    value_unit = value_head
// `amount`/`quantity` no item (`required` no servidor, sem uso funcional
// aparente além de persistência — não somados/exibidos em nenhuma tela lida
// nesta sessão) — inferência do Executor: `quantity: 1` (1 item = 1 animal)
// e `amount` mirror de `value_unit` (mesmo valor calculado, nunca um número
// solto). Sem Gap aberto (é "confirmar contra o código", não uma decisão de
// arquitetura em aberto, contrato §4).
// ============================================

export interface MovementSaleItemForm {
  animal_uuid: Option<string> | null;
  /** Readonly — derivado do animal selecionado (`getAnimalByUuid`, ver
   *  nota de `MovementSaleItemRow.tsx`: `animal-by-batch` NÃO devolve
   *  `category_uuid`/peso/data de entrada, só `{uuid,identification,
   *  category: string}` — achado de fidelidade desta Tarefa, confirmado
   *  contra `GetAnimalsByBatchAction`/`AnimalOptionResource`). */
  category_uuid: Option<string> | null;
  /** Readonly — peso de entrada do animal (`AnimalData.weight`, hidratado
   *  junto com `category_uuid` via `getAnimalByUuid`, client-only, nunca
   *  vai ao payload do item). */
  previous_weight_kg: number | null;
  /** Client-only — `AnimalData.entry_date`, usado só para calcular `gmd`
   *  (dias desde a entrada até `dt_sale`). Nunca vai ao payload. */
  entry_date: string | null;
  weight_kg: number | null;
  performance: number | null;
  /** Readonly, calculado — `weight_kg - previous_weight_kg`. */
  gain: number | null;
  /** Readonly, calculado — `gain / dias desde entry_date`. */
  gmd: number | null;
  carcass_weight: number | null;
  note: string;
}

export interface MovementSaleCategoryAggregateForm {
  /** Chave estável da linha (uuid da categoria) — nunca editável pelo
   *  usuário; a linha nasce/morre conforme `items` muda de composição
   *  (`MovementSaleCategoriesTab.tsx`). */
  category_uuid: string;
  description: string;
  /** Readonly — contagem de `items` desta categoria. */
  quantity: number;
  /** Input do usuário quando `pricing_type===1` (Kg/Arroba). */
  value_real: number | null;
  /** Bidirecional de `value_real` pelo fator 30 (`CV2`,
   *  `WeightConversion::KG_TO_ARROBA_MAIN_FACTOR`) — `value_arroba =
   *  value_real * 30`. */
  value_arroba: number | null;
  /** Input do usuário quando `pricing_type===2` (Cabeça). */
  value_head: number | null;
  /** Readonly, calculado — Σ `value_unit` dos itens desta categoria (mesma
   *  fórmula servidor, ver nota de topo). */
  value_total: number;
}

export interface MovementSaleForm {
  /** Readonly sempre — vazio até o servidor devolver o `code` real no
   *  primeiro `POST` (create) ou o valor existente (edit). */
  code: string;
  dt_sale: string;
  seller_uuid: Option<string> | null;
  batch_sale: boolean;
  batch_uuid: Option<string> | null;
  client_uuid: Option<string> | null;
  type_sale: Option<MovementSaleType> | null;
  pricing_type: Option<MovementSalePricingType> | null;
  /** Readonly — só exibidos quando a venda veio de importação de XML. */
  chave: string | null;
  number: string | null;
  serie: string | null;
  type_payment: Option<string> | null;
  gtas: string;
  note: string;
  has_financial: boolean;
  /** UT-000719 — Documento Fiscal (Sim/Não), usado só nas telas de Finalizar. */
  fiscal_document?: boolean;
  /** Rateio (TASK-VD-FE-04, fundação) — OPCIONAL nesta Tarefa (que não monta
   *  nenhuma tela): mantém `CreateOrUpdateMovementSale.tsx`/
   *  `FinishMovementSale*.tsx` (Tarefas 15/16, já ✅) intocados. Tarefas 22/23
   *  passam a preencher via `useFieldArray({ name: 'financial_allocations' })`. */
  financial_allocations?: MovementSaleAllocationRowForm[];
  /** Parcelamento (TASK-VD-FE-04, fundação) — idem nota acima. */
  financial_installments?: MovementSaleInstallmentRowForm[];
  items: MovementSaleItemForm[];
  categories: MovementSaleCategoryAggregateForm[];
  /** Auxiliar client-only (IG7) — distribui peso entre os `items` visíveis,
   *  nunca persistido. */
  average_weight_kg: number | null;
  /** Readonly, calculado — Σ `categories[].value_total`. */
  total_products: number;
  freight: number;
  other_values: number;
  discount: number;
  /** Readonly, calculado — `total_products + freight + other_values -
   *  discount` (`CV5`). */
  total: number;
}
