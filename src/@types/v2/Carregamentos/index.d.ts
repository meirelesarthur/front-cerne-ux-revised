// src/@types/v2/Carregamentos/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CARREGAMENTOS (Charge — Operacional > Agricultura).
//
// Fonte: leitura direta do backend real (`GB.Cerne.Api`, TASK-API-CG-01/02,
// `app/Http/Resources/V1/{ChargeResource,ItemChargeResource,
// ChargeExpenseAncillaryResource}.php`, `app/Http/Requests/Api/V1/
// {ChargeRequest,ChargeIndexRequest}.php`) — não é resumo de terceiros.
// `uuid` sempre, `id` NUNCA aparece no envelope.
//
// TASK-FE-CG-01 (fundação) declara TODOS os tipos consumidos pelas Tarefas
// irmãs (`TASK-FE-CG-02..07`), mirror `@types/v2/Transfers/index.d.ts` — os
// tipos de formulário/itens/despesas só são efetivamente USADOS a partir de
// `TASK-FE-CG-03/04`, mas são declarados aqui por instrução da fundação.
//
// ARMADILHA — `ChargeListItem` ≠ `ChargeDetail`: `ChargeRepository::
// EAGER_LOAD_LIST = ['client','user']`, então a LISTAGEM não tem as chaves
// `transporter`/`employee`/`items`/`expenses`/`documents` (ausentes, não
// `null`). `items_sum_quantity`/`items_sum_quantity_real` (pseudo-colunas
// `withSum`) aparecem tanto no `index` (com valor) quanto no `show` (sempre
// `null`, não consultadas ali) — por isso vivem na base `ChargeListItem`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS BACKED (valores físicos exatos, confirmados nos Enums do backend)
// ============================================

export type ChargeStatus = 'pendente' | 'finalizada';

export type ChargeItemType = 'buque' | 'penteada';

// Reusados de `App\Enums\Transfer\{ExpenseTypeEnum,ExpensePayerEnum}` — mesma
// tabela irmã de `ChargeExpenseAncillary`/`TransferExpenseAncillary`, valor
// físico idêntico confirmado pelo Arquiteto Backend (plano §Notas técnicas 3).
// ⚠️ `serviços` com cedilha e acento — valor físico do enum backed no servidor.
export type ChargeExpenseType = 'receitas' | 'insumos' | 'serviços';

export type ChargeExpensePayer = 'fornecedor' | 'empresa' | 'cliente' | 'rateio';

export type ChargeApropriation = 'S' | 'N';

// ============================================
// ENTIDADES ANINHADAS (satélites `whenLoaded`)
// ============================================

// `client`/`transporter`/`employee` (Models legados `App\Client`/
// `App\Provider`/`App\Employee`) e `provider` da despesa acessória —
// DD-078-04 (T-078-API-04): o Resource passa a devolver `{uuid, name}`
// (`people.name`). `name` é aditivo e pode vir ausente/nulo (relação não
// carregada, ex.: `employee`); a tela NUNCA cai para o uuid.
export interface ChargePartyRef {
  uuid: string;
  name?: string | null;
}

// `team`/`provider`/`seller` do ITEM (`ItemChargeResource`) — GAP FIX (#4,
// execução 045, fix de API em paralelo): diferente de `ChargePartyRef`
// genérico (`client`/`transporter`/`employee` no nível do Charge, que
// seguem só `{uuid}`), estes 3 satélites do item passam a expor também
// `label` (nome real) quando o backend resolve o eager-load. `label`
// OPCIONAL por defesa em profundidade — registro antigo/satélite não
// resolvido cai no fallback do próprio `uuid` em `chargeItemToForm`
// (`useCarregamentos.tsx`), NUNCA inventado no cliente.
export interface ChargeItemPartyRef {
  uuid: string;
  label?: string;
}

// `user` — único satélite com rótulo direto (`App\Models\User::$fillable`
// já tem `name`), mirror `TransferUserRef`.
export interface ChargeUserRef {
  uuid: string;
  label: string;
}

// `product`/`warehouse`/`area` — satélites com `description`.
export interface ChargeDescriptionRef {
  uuid: string;
  description: string;
}

// `warehouse`/`service_reversal` das despesas acessórias — o Resource
// devolve a chave `name` (mirror `TransferExpenseSatelliteRef`).
export interface ChargeExpenseSatelliteRef {
  uuid: string;
  name: string;
}

// ============================================
// ITEM DO CARREGAMENTO (`ItemChargeResource`) — consumido pelo formulário
// (TASK-FE-CG-03).
// ============================================

export interface ItemChargeDetail {
  uuid: string;
  product: ChargeDescriptionRef | null;
  warehouse: ChargeDescriptionRef | null;
  area: ChargeDescriptionRef | null;
  /** `ChargeRepository::EAGER_LOAD_DETAIL` NÃO inclui `items.team`/
   *  `items.provider`/`items.seller` — ausentes (não `null`) na resposta real
   *  até o backend eager-carregar. Tipado nullable por defesa em
   *  profundidade, mirror `TransferItem.area`. */
  team: ChargeItemPartyRef | null;
  provider: ChargeItemPartyRef | null;
  seller: ChargeItemPartyRef | null;
  quantity: number;
  /** Derivado no servidor (fator de conversão) — NUNCA vai ao payload. */
  quantity_second: number;
  /** Só preenchido após `finish` (`FinishChargeAction`) — `0` até lá. */
  quantity_real: number;
  amount: number;
  /** Derivado (`quantity * amount`) — NUNCA vai ao payload (nota técnica 2
   *  do plano de arquitetura frontend). */
  total_amount: number;
  type: ChargeItemType | null;
  type_label: string | null;
  calibre: string | null;
  note: string | null;
}

// ============================================
// DESPESA ACESSÓRIA (`ChargeExpenseAncillaryResource`) — mirror ESTRUTURAL
// EXATO `TransferExpense` (mesma tabela irmã, `ExpenseTypeEnum`/
// `ExpensePayerEnum` reusados). Consumido por `TASK-FE-CG-04`.
// ============================================

export interface ChargeExpenseAncillaryDetail {
  uuid: string;
  type: ChargeExpenseType;
  type_label: string;
  who_pay: ChargeExpensePayer;
  who_pay_label: string;
  provider: ChargePartyRef | null;
  product: ChargeDescriptionRef | null;
  warehouse: ChargeExpenseSatelliteRef | null;
  service_reversal: ChargeExpenseSatelliteRef | null;
  quantity: number;
  vl_unit: number;
  /** Derivado (`quantity * vl_unit`) — NUNCA vai ao payload. */
  value: number;
  apropriation: ChargeApropriation;
}

// ============================================
// DOCUMENTO ANEXO (`DocumentResource`, via `charges/{uuid}/documents`) —
// contrato de LEITURA compartilhado com o Resource genérico de anexos, mas
// a ESCRITA de Carregamento usa `ChargeDocumentRequest` (diff único
// `documents[]`), um contrato PRÓPRIO — por isso não importa de
// `@types/v2/Document` (aquele módulo é dedicado ao par Incomes/Expenses,
// com upload multipart por arquivo — semântica de escrita diferente).
// Consumido por `TASK-FE-CG-06`.
// ============================================

export interface ChargeDocumentItem {
  uuid: string;
  description: string | null;
  /** `YYYY-MM-DD` ou `null`. */
  date: string | null;
  /** URL pública, completa, direto utilizável em `<a href>` — ou `null`. */
  url: string | null;
  created_at: string;
}

// ============================================
// DOCUMENTOS (escrita, `POST /charges/{uuid}/documents`) — diff único por
// `document_uuid` (`ChargeDocumentRequest`/`ChargeDocumentItemData` reais,
// TASK-FE-CG-06). Contrato PRÓPRIO de Carregamento — o campo de identidade
// real é `document_uuid` (confirmado contra `ChargeDocumentItemData`), NÃO
// `old_document_uuid` (nome usado só no mirror `MovementSaleDocumentRow`).
//
// ⚠️ DIVERGÊNCIA DELIBERADA da Leitura do dev da Tarefa (`date: Date | null`)
// — mesmo racional já documentado acima para `ChargeForm.dt_charge`
// (`field-validation-schema.ts`/`v.date()`): `date` trafega como
// `string | null` (`YYYY-MM-DD`), nunca `Date`, para não quebrar o
// `DateInput` controlado (que já trabalha em string ISO) nem a serialização
// do payload. Precedência `código real > ficha`.
// ============================================

export interface ChargeDocumentForm {
  /** Presente = linha já persistida (`ChargeDocumentItem.uuid`); ausente/
   *  `null` = linha nova — o servidor exige `file` só neste caso
   *  (`ChargeDocumentItemData::file` opcional/`Optional` quando o
   *  `document_uuid` já existe). */
  document_uuid: string | null;
  description: string;
  date: string | null;
  file: File | null;
}

export interface ChargeDocumentsForm {
  documents: ChargeDocumentForm[];
}

/** Entrada do diff enviado ao servidor — `file` só viaja quando há upload
 *  novo nesta linha (ver `syncChargeDocuments`/`buildChargeDocumentsFormData`
 *  em `charge-service.ts`, decisão JSON-vs-multipart). */
export interface ChargeDocumentPayloadItem {
  document_uuid?: string | null;
  description: string;
  date?: string | null;
  file?: File | null;
}

// ============================================
// RECURSO PRINCIPAL — LISTAGEM (`ChargeResource`, `EAGER_LOAD_LIST =
// ['client','user']`). SEM as chaves `transporter`/`employee`/`items`/
// `expenses`/`documents` (ausentes, não `null`, na resposta real da
// listagem).
// ============================================

export interface ChargeListItem {
  uuid: string;
  number_charge: number;
  dt_charge: string; // YYYY-MM-DD
  status: ChargeStatus;
  status_label: string;
  /** Hex vindo do `ChargeStatusEnum::color()` (`#e74a3b`/`#4e73df`) —
   *  NUNCA usado como cor inline no componente (Lei 6); serve só para
   *  MAPEAR ao token semântico correspondente na fábrica de options. */
  status_color: string;
  driver_name: string | null;
  driver_plate: string | null;
  driver_uf: string | null;
  driver_nif: string | null;
  note: string | null;
  /** `null` até o servidor calcular (Store/UpdateChargeOrchestratorAction). */
  total: number | null;
  /** Só preenchido após `finish` — `null` até lá. */
  total_real: number | null;
  client: ChargePartyRef;
  /** `null` quando o carregamento não tem responsável definido — dado real
   *  observado em produção (fazenda 118, registros com `user_uuid` nulo no
   *  banco), NÃO ausência-por-eager-load (o `ChargeResource` sempre inclui a
   *  chave, o valor é que pode ser `null`). Todo consumo exige null-check
   *  (`?.label`/guarda explícita), nunca acesso cru — bug de runtime
   *  corrigido em `index.tsx`/`GenerateTransferDialog.tsx`. */
  user: ChargeUserRef | null;
  /** Ausente na LISTAGEM (`EAGER_LOAD_LIST` não inclui `transporter`) —
   *  `undefined` em runtime, nunca `null` explícito. `ChargeDetail` a
   *  reafirma como sempre presente (`| null`). */
  transporter?: ChargePartyRef | null;
  /** Idem `transporter` — ausente na listagem. */
  employee?: ChargePartyRef | null;
  /** Pseudo-coluna (`withSum('items','quantity')`) — só a listagem soma;
   *  no detalhe, sempre `null` (não consultada ali). */
  items_sum_quantity: number | null;
  /** Pseudo-coluna (`withSum('items','quantity_real')`) — idem. */
  items_sum_quantity_real: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// RECURSO PRINCIPAL — DETALHE (`GET/POST/PUT /charges/{uuid}`) — mesmo
// shape da listagem, ACRESCIDO dos satélites que só o `show` eager-carrega
// (`ChargeRepository::EAGER_LOAD_DETAIL`).
// ============================================

export interface ChargeDetail extends ChargeListItem {
  transporter: ChargePartyRef | null;
  employee: ChargePartyRef | null;
  items: ItemChargeDetail[];
  expenses: ChargeExpenseAncillaryDetail[];
  documents: ChargeDocumentItem[];
}

// ============================================
// FILTRO (drawer da listagem, `filter_manifest` FM-01..07, TASK-FE-CG-02) —
// mirror `TransferFilterForm`/`TransferFilterRequest`: a forma "crua" (Form)
// carrega companions `*_label` DISPLAY-ONLY (re-hidratação dos
// `SelectAsyncPaginate` sem request extra ao reabrir o drawer); a forma
// "request" (enviada à querystring) é só os 7 campos reais de
// `ChargeIndexRequest::rules()`.
// ============================================

export interface ChargeFilterForm {
  client_uuid?: string;
  client_label?: string;
  user_uuid?: string;
  user_label?: string;
  product_uuid?: string;
  product_label?: string;
  area_uuid?: string;
  area_label?: string;
  status?: ChargeStatus;
  start_date?: string;
  end_date?: string;
}

export interface ChargeFilterRequest {
  client_uuid?: string;
  user_uuid?: string;
  product_uuid?: string;
  area_uuid?: string;
  status?: ChargeStatus;
  start_date?: string;
  end_date?: string;
}

// ============================================
// FORMULÁRIO (`react-hook-form`) — TASK-FE-CG-03/04. Campos relacionais
// guardados como `Option<T>` (`{label,value}`), nunca o `uuid` cru.
//
// ⚠️ DIVERGÊNCIA DELIBERADA da Leitura do dev da Tarefa: a ficha descreve
// `dt_charge: Date`, mas `src/validations/field-validation-schema.ts` (a
// MESMA tool de padrão exigida por esta Tarefa, `get_pwa_validation_and_
// utils_pattern`) documenta uma armadilha REAL já observada em produção
// (TASK-FE-917): `yup.date()`/`Date` no form faz `yupResolver` devolver um
// objeto `Date` que quebra `<input type="date">` controlado e serializa
// errado em `FormData` (`Date.prototype.toString()`, 422 no backend). O
// mirror vivo `TransferForm.dt_sale`/`dt_shipping` (`transfer-schema.ts`)
// já usa `string | null` (`YYYY-MM-DD`) + `v.date()` por este motivo. Esta
// Tarefa segue o PRECEDENTE REAL do fork (precedência `código real > ficha`
// quando a ficha diverge de um risco técnico já documentado), não o texto
// literal — reportado como divergência no fechamento da Tarefa.
// ============================================

export interface ChargeForm {
  // ---- Cabeçalho (FD-01..04,18,19,21,23, TASK-FE-CG-03) ----
  dt_charge: string | null;
  client_uuid: Option<string> | null;
  transporter_uuid: Option<string> | null;
  /** `''`, nunca `null` no form (convenção do fork p/ campo `register()`,
   *  mirror `driver`/`nfe` de `transfer-schema.ts`); vira `null` só no
   *  payload quando vazio. */
  driver_name: string;
  driver_plate: string;
  /** Select estático de UF (FD-22) — `Option<string>`, convertido para a
   *  sigla crua só no payload. */
  driver_uf: Option<string> | null;
  /** Máscara CPF/CNPJ dinâmica por país do tenant (FD-20) — `''`, nunca
   *  `null` no form (idem `driver_name`). */
  driver_nif: string;
  note: string;

  // ---- Itens (FD-05..17, TASK-FE-CG-03) ----
  items: ChargeItemForm[];
  // ---- Despesas acessórias (TASK-FE-CG-04) ----
  expenses: ChargeExpenseForm[];
}

/** Linha do repeater de Itens (contrato §FD-05..17). `item_uuid` é a
 *  identidade do sync — presente em linha existente, ausente/`null` em
 *  linha nova. `total_amount`/`weight` são CLIENT-ONLY (nota técnica 2 do
 *  plano) — NUNCA vão ao payload, mesmo racional de `total_amount`/
 *  `factor`/`factor_type` em `TransferItemForm`. */
export interface ChargeItemForm {
  item_uuid?: string | null;
  product_uuid: Option<string> | null;
  /** Opcional — fiel ao legado (FD-06, nota técnica 1 do plano: cascata
   *  armazém→produto→estoque). */
  warehouse_uuid: Option<string> | null;
  quantity: number | null;
  amount: number | null;
  type: Option<ChargeItemType> | null;
  calibre: string;
  team_uuid: Option<string> | null;
  seller_uuid: Option<string> | null;
  area_uuid: Option<string> | null;
  provider_uuid: Option<string> | null;
  note: string;
  /** Hint client-only (`quantity * amount`) — servidor calcula de verdade
   *  (nota técnica 2). Nunca vai ao payload. */
  total_amount: number | null;
  /** Hint client-only (`quantity_second`) — servidor calcula de verdade
   *  (nota técnica 2). Nunca vai ao payload. */
  weight: number | null;
  /** FD-30 ("Estoque", CL-46) — hint CLIENT-ONLY do saldo do Produto no
   *  Armazém escolhido (`StockAvailabilityItem.quantity`, IG-02). `null`
   *  sem Armazém escolhido ou catálogo genérico (`listProductOptions`) —
   *  NUNCA vai a `ChargeItemPayload` (o legado envia mas o servidor
   *  ignora; a API nova nem expõe o campo). */
  qtd_stock: number | null;
  /** FD-31 ("Un. Medida", CL-46) — hint CLIENT-ONLY, `ProductMeasurementRef.
   *  description` do Produto selecionado (IG-02) ou resolvido via
   *  `getProduct` na hidratação de linha existente (`ItemChargeResource`
   *  não expõe `product.measurement`). NUNCA vai a `ChargeItemPayload`. */
  um: string | null;
}

/** Linha do repeater de Despesas acessórias — mirror ESTRUTURAL EXATO
 *  `TransferExpenseForm` (mesma tabela irmã). `value` é hint client-only
 *  (`quantity * vl_unit`) — nunca vai ao payload. `type` é FIXO pela aba
 *  (Estornos/Insumos/Serviços, CL-48/CL-49) — o usuário nunca o escolhe
 *  manualmente; gravado uma única vez na criação da linha
 *  (`createEmptyChargeExpense(languageGB, fixedType)`). */
export interface ChargeExpenseForm {
  expense_uuid?: string | null;
  type: Option<ChargeExpenseType> | null;
  service_reversal_uuid: Option<string> | null;
  warehouse_uuid: Option<string> | null;
  product_uuid: Option<string> | null;
  provider_uuid: Option<string> | null;
  quantity: number | null;
  vl_unit: number | null;
  who_pay: Option<ChargeExpensePayer> | null;
  apropriation: Option<ChargeApropriation> | null;
  /** Hint client-only — nunca é campo de fato persistido/enviado. */
  value?: number | null;
  /** FD-32 ("Estoque", aba Insumos) — hint CLIENT-ONLY do saldo do Produto
   *  no Armazém de despesa escolhido (`StockAvailabilityItem.quantity`,
   *  IG-10). `null` sem Produto/Armazém escolhido — NUNCA vai a
   *  `ChargeExpensePayload` (o legado envia mas o servidor ignora). */
  stock?: number | null;
}

// ============================================
// PAYLOAD DE ESCRITA (`POST`/`PUT /charges`) — espelha
// `ChargeRequest::rules()`. `PUT` é substituição INTEGRAL (mirror
// `UpdateTransferRequest = CreateTransferRequest`, confirmado: `ChargeRequest`
// é unificado store+update, sem branching de verbo nas regras).
// ============================================

export interface ChargeItemPayload {
  /** Identidade estável do sync — ausente/`null` = item novo. */
  item_uuid?: string | null;
  product_uuid: string;
  warehouse_uuid?: string | null;
  quantity: number;
  amount: number;
  type?: ChargeItemType | null;
  calibre?: string | null;
  team_uuid?: string | null;
  seller_uuid?: string | null;
  area_uuid?: string | null;
  provider_uuid?: string | null;
  note?: string | null;
}

export interface ChargeExpensePayload {
  expense_uuid?: string | null;
  type: ChargeExpenseType;
  service_reversal_uuid?: string | null;
  warehouse_uuid?: string | null;
  product_uuid?: string | null;
  provider_uuid?: string | null;
  quantity: number;
  vl_unit: number;
  who_pay: ChargeExpensePayer;
  apropriation: ChargeApropriation;
}

export interface CreateChargeRequest {
  dt_charge: string;
  client_uuid: string;
  transporter_uuid?: string | null;
  driver_name?: string | null;
  driver_plate?: string | null;
  driver_uf?: string | null;
  driver_nif?: string | null;
  note?: string | null;
  /** `required|array|min:1` no servidor — a tela nunca permite salvar com
   *  `items` vazio. */
  items: ChargeItemPayload[];
  /** `present|array` no servidor — SEMPRE presente, `[]` remove todas
   *  (mirror `TransferRequest`, D6). */
  expenses: ChargeExpensePayload[];
}

/** `PUT` é o MESMO shape de `POST` (substituição integral) — alias, não um
 *  tipo `Partial`. */
export type UpdateChargeRequest = CreateChargeRequest;

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`) — a listagem devolve um array
// PLANO em `data`, NÃO `{data:{items,pagination}}` (mesma armadilha de
// `TransfersListEnvelope`).
// ============================================

export interface ChargesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
  links?: Record<string, unknown>;
}

export interface ChargesListEnvelope {
  success: boolean;
  message: string;
  data: ChargeListItem[];
  errors: Record<string, string[]> | null;
  meta: ChargesApiPaginationMeta | null;
}

// ============================================
// FINALIZAR (`PUT /charges/{uuid}/finish`, TASK-FE-CG-05) — espelha
// `FinishChargeRequest::rules()`. Cada linha de `items[]` tem 2 formas
// mutuamente exclusivas: `item_uuid` presente → só `quantity_real` é
// relevante (linha EXISTENTE, mirror `ChargeItemForm` mas sem os campos de
// edição de itens já persistidos); ausente → mesma forma de `ChargeRequest`
// (`product_uuid`/`quantity`/`amount` obrigatórios), item NOVO lançado
// durante a finalização. A tela nunca deixa o usuário adicionar/remover
// linhas EXISTENTES (só `quantity_real` é editável ali) — só existe UM slot
// de item novo (`new_item`, opcional), mirror da Leitura do dev da Tarefa
// ("1 linha extra editável para item NOVO").
// ============================================

/** Linha EXISTENTE na tela de finalização — só `quantity_real` é editável;
 *  `product_label`/`quantity`/`amount` são hints `InputReadOnly` (mirror
 *  `_card-item-finish` do legado), nunca reenviados como se fossem editáveis. */
export interface FinishChargeExistingItemForm {
  item_uuid: string;
  product_label: string;
  quantity: number;
  amount: number;
  quantity_real: number | null;
}

/** Slot ÚNICO de item novo — `null`/`product_uuid` vazio = nenhum item novo
 *  lançado nesta finalização (caso majoritário, D2 simetria com o legado). */
export interface FinishChargeNewItemForm {
  product_uuid: Option<string> | null;
  quantity: number | null;
  amount: number | null;
}

export interface FinishChargeForm {
  driver_name: string;
  driver_plate: string;
  driver_uf: Option<string> | null;
  driver_nif: string;
  items: FinishChargeExistingItemForm[];
  new_item: FinishChargeNewItemForm;
}

/** Payload de escrita de uma linha de `finish` — forma unificada das 2
 *  variantes mutuamente exclusivas do `FinishChargeRequest` (existente vs.
 *  nova); os campos ausentes na variante em uso ficam `undefined` (nunca
 *  enviados como chave, mirror `ChargeItemPayload`). */
export interface FinishChargeItemPayload {
  item_uuid?: string | null;
  quantity_real?: number;
  product_uuid?: string;
  warehouse_uuid?: string | null;
  quantity?: number;
  amount?: number;
  type?: ChargeItemType | null;
  calibre?: string | null;
  team_uuid?: string | null;
  seller_uuid?: string | null;
  area_uuid?: string | null;
  provider_uuid?: string | null;
  note?: string | null;
}

export interface FinishChargePayload {
  driver_name?: string | null;
  driver_plate?: string | null;
  driver_uf?: string | null;
  driver_nif?: string | null;
  items: FinishChargeItemPayload[];
}

// ============================================
// GERAR ROMANEIO (`POST /charges/{uuid}/transfer`, TASK-FE-CG-05) — espelha
// `ChargeTransferDraftResource`/`ChargeTransferDraftData`. Rascunho PURO,
// nunca persistido pelo Charge (decisão d1 do dono, já fechada na api) — a
// SPA mapeia este shape para `CreateTransferRequest` (`@/@types/v2/
// Transfers`) e chama `createTransfer` (`POST /transfers`, já existente),
// mapeamento documentado campo a campo em `GenerateTransferDialog.tsx`.
// ============================================

export interface ChargeTransferDraftItem {
  /** Identidade do ITEM DO CARREGAMENTO (`ItemCharge`) — NÃO é reenviada ao
   *  criar o Transfer (tabela de itens diferente, sem relação de sync). */
  item_uuid: string;
  product_uuid: string | null;
  quantity: number;
  amount: number;
}

export interface ChargeTransferDraft {
  client_uuid: string | null;
  transporter_uuid: string | null;
  dt_sale: string;
  dt_shipping: string;
  items: ChargeTransferDraftItem[];
  total_products: number;
}

// ============================================
// RELATÓRIOS PDF (`GET /charges/report-by-product`, `GET
// /charges/week-report`, TASK-FE-CG-07) — espelha `ChargeReportRequest::
// rules()` (`start_date`/`end_date` ambos `required|date`,
// `end_date >= start_date`). Download SÍNCRONO via blob (`DomPDF::stream()`
// no servidor, sem Job/polling — decisão b do dono).
//
// ⚠️ DIVERGÊNCIA DELIBERADA da Leitura do dev da Tarefa
// (`{start_date: Date; end_date: Date}`) — mesmo racional de
// `ChargeDocumentForm.date`/`ChargeForm.dt_charge`: string ISO
// (`YYYY-MM-DD`), nunca `Date`, mirror literal `breedingSeasonSchema`
// (`start_date`/`end_date` como string ISO com `.test()` de intervalo).
// ============================================

export interface ChargeReportParams {
  start_date: string;
  end_date: string;
}
