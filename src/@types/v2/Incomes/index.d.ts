// src/@types/v2/Incomes/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Contas a Receber" (Income — Financeiro), TASK-FE-036-310.
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /incomes                              → data: IncomeListItem[] + meta paginação
//   GET    /incomes/{uuid}                       → data: IncomeDetail (categories/proprietary/harvest)
//   POST   /incomes                               → payload IncomePayload (installments[] com N entradas)
//   PUT    /incomes/{uuid}                        → payload Partial<IncomePayload> (installments[] ignorado
//                                                    pelo backend; due_date/amount de TOPO editam A PARCELA)
//   DELETE /incomes/{uuid}                        → 204
//   DELETE /incomes/multiple-destroy              → body { uuids: string[] }
//   PUT    /incomes/{uuid}/toggle-fiscal-document  → sem payload
//
// Fonte: `CONTRATOS/frontend/contas-a-receber/contrato.md` §3 (leitura direta
// do backend real — Controller/Resource/Requests/Actions/Model). NÃO usar
// `InvoicePayload`/`Invoice*` como fonte de tipo — os shapes de parcelamento/
// rateio DIVERGEM deliberadamente (ver GAP-FE-036-300/301/302, contrato §3.4).
//
// Cada LINHA de `IncomeListItem` é UMA PARCELA (uma linha física `incomes`),
// não um "título" agregando N parcelas — ver contrato §3.2.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFERÊNCIAS ANINHADAS (mirror 1:1 do eager-load real)
// ============================================

export interface IncomeTypeRef {
  uuid: string;
  description: string;
}

// `name` — auditoria de fidelidade 2026-08 (achados B-06/L-06/D-3/D-4):
// `IncomeResource` passou a eager-carregar `client.people`/`proprietary.people`
// (satélites `App\Client`/`App\Proprietary`, `people.name`) e devolver o
// nome, não só o `uuid` cru. Opcional/nullable porque o Resource só popula
// quando a relação existe (`proprietary`/`harvest` são opcionais no título).
export interface IncomeClientRef {
  uuid: string;
  name?: string | null;
}

export interface IncomeProprietaryRef {
  uuid: string;
  name?: string | null;
}

/** `name` = `Harvest.description` (mirror uso legado `Harvest::get(['id','description'])`). */
export interface IncomeHarvestRef {
  uuid: string;
  name?: string | null;
}

/** 1=UNICA · 2=PARCELADA · 4=ADIANTAMENTO (contrato §3.2). */
export type IncomePaymentType = 1 | 2 | 4;

// ============================================
// LISTAGEM — GET /incomes (eager-load real: type, client, proprietary, harvest —
// `IncomeRepository::listWithFilters()` carrega os 4, auditoria de fidelidade
// 2026-08, achado B-06/L-05/L-06)
// ============================================

export interface IncomeListItem {
  uuid: string;
  number: string;
  code: string | null;
  type?: IncomeTypeRef;
  client?: IncomeClientRef;
  /** DEC-115/TASK-BE-036-318 (`34c1f305e`) — `IncomeResource::farm`
   *  (`whenLoaded('farm')`) identifica a fazenda de CADA parcela na
   *  listagem, presente tanto no modo fazenda-ativa quanto em
   *  `?all_farms=1` (`IncomeRepository::applyFilters` eager-carrega `farm`
   *  sempre — o backend não condiciona a presença ao modo de visão). `null`
   *  só no caso de a parcela não ter fazenda resolvível; front só
   *  renderiza, nunca filtra/valida cross-tenant (responsabilidade do
   *  backend). */
  farm?: { uuid: string; description: string } | null;
  proprietary?: IncomeProprietaryRef | null;
  harvest?: IncomeHarvestRef | null;
  payment_type: IncomePaymentType;
  payment_type_label: string;
  fiscal_document: boolean;
  qtd_installments: number;
  installment: number;
  dt_emission: string;
  due_date: string;
  amount: number;
  discount: number;
  penalty: number;
  interest: number;
  perc_interest: number;
  increase: number;
  balance: number;
  note: string;
  /** `balance !== amount` — já calculado pelo backend (`IncomeResource`), NUNCA recalcular no cliente (GAP-FE-036-300). */
  is_locked: boolean;
  /** LM01 (TASK-FE-036-339) — contagem de documentos anexados (`withCount('documents')`), sempre `number` (fallback `0`, nunca `null`). */
  documents_count: number;
  /**
   * B-05 (TASK-FE-036-340/342, Onda 3 sub-onda 3f) — campo já existente na
   * API (`incomes.xml_key`), só faltava declarar. Presente SÓ quando o
   * título foi criado a partir de um XML importado E o backend já persiste
   * o vínculo (Achado crítico 1, TASK-FE-036-340 — Gap de API pendente,
   * `xml_key` HOJE é ignorado pelo `store()`; até o Gap fechar, `null` para
   * qualquer título criado pelo fluxo real). Gate do link "Baixar XML" no
   * Detalhe.
   */
  xml_key: string | null;
}

// ============================================
// DETALHE — GET /incomes/{uuid} (eager-load completo)
// ============================================

/**
 * Linha de rateio do `show`. `plan_account`/`center_description` — GAP-API
 * 036fix (INC-R17, REAUDITORIA-036-2a-rodada): `IncomeResource` passou a
 * resolver os dois em lote (`centersById()`/`planAccountsById()`); ambos
 * `null` só quando a linha realmente não tem conta/centro vinculado.
 */
export interface IncomeCategoryDetail {
  category_uuid: string;
  description: string;
  center_uuid: string | null;
  center_description?: string;
  plan_account?: { uuid: string; name: string } | null;
  value: number;
  interest: number;
}

export interface IncomeDetail extends IncomeListItem {
  writeoffs_count: number;
  /** Presente só quando eager-loaded (show) — ausente na listagem. */
  categories?: IncomeCategoryDetail[];
}

// ============================================
// PAYLOAD DE ESCRITA — POST/PUT (mirror `IncomeRequest::rules()`)
// ============================================

export interface IncomeInstallmentPayload {
  due_date: string;
  value: number;
}

export interface IncomeCategoryPayload {
  category_uuid: string;
  percentage: number;
  /** OBRIGATÓRIO — constraint física NOT NULL do pivot (contrato §3.4). */
  center_uuid: string;
  plan_account_uuid?: string | null;
}

export interface IncomePayload {
  /** UT-000796 r2 — vínculo com o movimento Financiamento (Gera Obrigação).
   *  SÓ no POST (ignorado no PUT); a CHAVE é omitida quando não há. */
  movement_uuid?: string;
  number: string;
  type_title_uuid: string;
  client_uuid: string;
  /**
   * Opcional (achado B-02, auditoria de fidelidade 2026-08) — o legado não
   * exige proprietário; `IncomeRequest::proprietary_uuid` é `nullable`, sem
   * `$sometimesOrRequired`. NUNCA enviar `''` quando ausente — o backend
   * valida `uuid` de verdade, string vazia falha a regra (`null`, sim).
   */
  proprietary_uuid?: string | null;
  payment_type: IncomePaymentType;
  dt_emission: string;
  due_date: string;
  amount: number;
  note: string;
  fiscal_document?: boolean;
  harvest_uuid?: string | null;
  discount?: number;
  penalty?: number;
  interest?: number;
  perc_interest?: number;
  increase?: number;
  /**
   * SÓ no `store()` — o backend NÃO USA este campo no PUT (a edição opera
   * sobre 1 parcela via os campos de TOPO `due_date`/`amount`). O client
   * NUNCA envia `installments` populado no PUT (contrato §3.4/§4.3).
   */
  installments: IncomeInstallmentPayload[];
  /**
   * Rateio da parcela sendo criada/editada. No update, SÓ enviado quando
   * `is_locked === false` — quando bloqueado, o backend ignora mesmo que
   * enviado, mas o client não deve nem tentar (campo desabilitado na UI,
   * GAP-FE-036-300).
   */
  categories: IncomeCategoryPayload[];
  /** SÓ relevante no `store()`, 1 parcela, `payment_type=UNICA` (GAP-FE-036-303). */
  automatic_writeoff?: boolean;
  account_uuid?: string | null;
  movement_date?: string | null;
  /**
   * B-05 (TASK-FE-036-340/342) — envio DEFENSIVO/forward-compatible: o
   * backend HOJE ignora este campo no `store()` (Achado crítico 1,
   * TASK-FE-036-340 — nenhum dos 2 Form Requests tem `xml_key` em
   * `rules()`), Gap de API já registrado para fechar essa lacuna (mirror do
   * padrão `chave`/`InvoiceRequest`, que já persiste corretamente). Custo
   * zero enviar mesmo assim — ativa sozinho quando o Gap fechar. Só
   * populado quando o título foi criado a partir de um XML importado
   * (`handleXmlImported`, `CreateOrUpdateIncome.tsx`).
   */
  xml_key?: string | null;
  /**
   * DEC-115 (TASK-FE-036-344, §6, mirror `ExpensePayload.farm_uuid`
   * TASK-FE-036-125) — só em criação, só quando
   * `tenant.list_all_farms===true` (`StoreIncomeAction`,
   * `context.tenant()?.list_all_farms`, MESMO flag do backend). Enviado
   * SEMPRE que o Select "Fazenda de destino" está visível (podendo ser a
   * própria fazenda ativa, no-op idêntico ao caminho sem `farm_uuid`) —
   * nunca `null`/`''` quando ausente, a CHAVE é omitida (mesma disciplina
   * já documentada para uuids opcionais, `proprietary_uuid` acima).
   */
  farm_uuid?: string;
}

// ============================================
// DRAFT DE DUPLICAÇÃO (`GET /incomes/{uuid}/duplicate`, B-11,
// TASK-FE-036-320) — leitura pura, NUNCA persiste. Mirror 1:1 de
// `App\Data\Income\IncomeDuplicateDraftData` (fonte de verdade lida direto
// do backend, `GB.Cerne.Api`), espelho estrutural de
// `ExpenseDuplicateDraft` trocando `provider_uuid`→`client_uuid` e SEM
// `recurrence_type`/`branch_uuid`/`type_note`/`classification`/
// `is_taxation`/`card_bill_financing`/`appropriation*` (campos que não
// existem em `Income`).
//
// `*_uuid` vêm PLANOS (string), NUNCA objeto `{uuid, name}` — mesma
// divergência de `ExpenseDuplicateDraft` vs. `ExpenseDetail`. O front
// resolve o label via os MESMOS serviços já usados na edição
// (`getClientByUuid`, etc.), fallback honesto ao uuid truncado em caso de
// falha (mirror `handleXmlImported`), NUNCA inventado.
//
// `payment_type`/`dt_emission`/`due_date` SEMPRE `null` (zerados pelo
// backend). SEM `categories`/`installments`/`automatic_writeoff`/
// `account_uuid`/`movement_date`/`xml_key`/`uuid`/`code` — nenhuma dessas
// chaves existe no draft (rateio/parcelamento/baixa/XML nunca são
// clonados, mirror "relations_not_cloned_into_form" da doc-bruta).
// ============================================

export interface IncomeDuplicateDraft {
  number: string;
  type_title_uuid: string;
  client_uuid: string | null;
  amount: number;
  note: string;
  proprietary_uuid: string | null;
  fiscal_document: boolean;
  harvest_uuid: string | null;
  discount: number;
  penalty: number;
  interest: number;
  perc_interest: number;
  increase: number;
  payment_type: IncomePaymentType | null;
  dt_emission: string | null;
  due_date: string | null;
}

// ============================================
// MULTIPLE-DESTROY — DELETE /incomes/multiple-destroy
// ============================================

export interface MultipleDestroyIncomesPayload {
  uuids: string[];
}

// ============================================
// FILTRO (drawer da listagem — TASK-FE-036-312)
// ============================================

/**
 * Status derivado no cliente (§5.1 do contrato) — NUNCA devolvido pronto pelo
 * backend. TASK-FE-036-322 (FID-G3F LM03/FM11/LK12) — 6 estados, mirror
 * `Income::opStatus` do legado: título NORMAL (`payment_type!=4`) deriva
 * entre `vencido/parcial/aberto/baixado`; título ADIANTAMENTO
 * (`payment_type===4`) deriva SÓ entre `adiantamento_aberto`/
 * `adiantamento_baixado` (nunca `vencido`/`aberto`/`parcial`/`baixado`).
 * Chaves CONFIRMADAS 1:1 com o enum `status` aceito pelo backend migrado
 * (Tarefa de API de Onda 2, filtros/status).
 */
export type IncomeStatus =
  'vencido' | 'parcial' | 'aberto' | 'baixado' | 'adiantamento_aberto' | 'adiantamento_baixado';

export interface IncomeFilterForm {
  search?: string;
  /**
   * Nome do parâmetro é legado — o valor esperado é o `uuid` do cliente
   * (mirror `InvoiceFilterForm.provider_id`, contrato §3.2). NÃO renomear.
   */
  client_id?: string;
  status?: IncomeStatus | '';
  dt_emission_from?: string;
  dt_emission_to?: string;
  // ---- TASK-FE-036-323 (FID-G3F FM04/FM05/FM10/FM12) ----
  /** Intervalo de vencimento (`due_date` entre duas datas). */
  due_date_from?: string;
  due_date_to?: string;
  /** Histórico — busca textual (mirror `note` do título). */
  note?: string;
  /** Valor — igualdade após normalização monetária (mirror `amount`). */
  amount?: number;
  // NFe (FM02) — cross-feature MISSING (Boleto/Ticket, fora de escopo desta
  // Onda), decisão do dono já registrada. NÃO implementar/inventar campo.
  // ---- TASK-FE-036-324 (FID-G3F FM13/FM16/FM17/FM19) — filtros de lookup ----
  proprietary_id?: string;
  category_id?: string;
  center_id?: string;
  /** Safra DE CABEÇALHO (`harvest_uuid`) — nunca por-linha de rateio. */
  harvest_id?: string;
  // ---- ONDA 3 sub-onda 3d (FM08/FM09/FM18) — filtros de baixa, contrato
  // agora aceito pela API (`IncomeIndexRequest::rules()`). `account_id`
  // guarda o `uuid` da conta da baixa (mirror `client_id`, nome do
  // parâmetro é o que o backend espera). ----
  account_id?: string;
  write_off_date_from?: string;
  write_off_date_to?: string;
  // DEC-115 (TASK-FE-036-344, §5, mirror `ExpenseFilterForm.all_farms`
  // TASK-FE-036-125) — flui para a queryKey (o `filter` inteiro já entra
  // nela, `useCustomGridQuery.tsx:45-52`); `true` quando o toggle "Ver
  // títulos de todas as fazendas" está ligado, `undefined` (NUNCA `false`)
  // quando desligado — mirror da disciplina "nunca enviar valor negativo"
  // já aplicada aos demais filtros opcionais deste tipo.
  all_farms?: boolean;
}

// ============================================
// REACT HOOK FORM (TASK-FE-036-313/314/315/316) — formas divergem de
// `InvoiceForm`/`InvoiceInstallmentForm`/`InvoiceApportionmentForm` (ver
// contrato §3.4 — NÃO copiar mecanicamente).
// ============================================

export interface IncomeInstallmentForm {
  due_date: string | null;
  value: number | null;
}

export interface IncomeApportionmentForm {
  category_uuid: string | null;
  /** Campo derivado pela cascata (GAP-FE-036-301) — editável manualmente. */
  plan_account_uuid: string | null;
  center_uuid: string | null;
  percentage: number | null;
}

export interface IncomeForm {
  uuid?: string;
  number: string;
  type_title_uuid: Option<string> | null;
  client_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  harvest_uuid: Option<string> | null;
  payment_type: IncomePaymentType;
  dt_emission: string | null;
  due_date: string | null;
  amount: number | null;
  discount: number | null;
  penalty: number | null;
  interest: number | null;
  perc_interest: number | null;
  increase: number | null;
  note: string;
  fiscal_document: boolean;
  /** Espelho de `IncomeDetail.is_locked` — hidratado em edição, NUNCA recalculado (GAP-FE-036-300). */
  is_locked: boolean;

  // ---- Aba Parcelamento (SÓ create, GAP-FE-036-302) ----
  has_down_payment: boolean;
  down_payment_date: string | null;
  down_payment_value: number | null;
  qtd_installments: number;
  first_due_date: string | null;
  interval_days: number;
  installments: IncomeInstallmentForm[];

  // ---- Aba Rateio (create + update quando !is_locked, GAP-FE-036-301) ----
  categories: IncomeApportionmentForm[];

  // ---- Baixa automática (SÓ create, GAP-FE-036-303) ----
  automatic_writeoff: boolean;
  account_uuid: Option<string> | null;
  movement_date: string | null;

  // ---- Upload/Prefill de XML (SÓ create, B-05, TASK-FE-036-340/342) ----
  /**
   * Populado SÓ pelo `handleXmlImported` (nunca editável na UI) — repassado
   * defensivamente ao `IncomePayload` no submit. Ver comentário de
   * `IncomePayload.xml_key` (Achado crítico 1, TASK-FE-036-340).
   */
  xml_key?: string | null;

  // ---- Fazenda de destino (SÓ create, DEC-115, TASK-FE-036-344 §6,
  // mirror `ExpenseForm.farm_uuid` TASK-FE-036-125) ----
  /** Select "Fazenda de destino", visível só em criação com
   *  `tenant.list_all_farms===true`; opcional no tipo do form porque o
   *  campo nem existe quando o gate está desligado (nunca lido nesse caso —
   *  ver `tryPersistIncome`). Default = fazenda ATIVA (`activeFarmUuid`,
   *  `useAuth()`), populado assim que `useMyFarms()` resolve. */
  farm_uuid?: Option<string> | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface IncomesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface IncomesListEnvelope {
  success: boolean;
  message: string;
  data: IncomeListItem[];
  errors: Record<string, string[]> | null;
  meta: IncomesApiPaginationMeta | null;
}
