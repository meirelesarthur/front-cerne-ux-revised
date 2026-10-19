// src/@types/v2/RequestPurchases/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Solicitação de Compras" (RequestPurchase — Administrativo /
// Suprimentos, esteira 97-Esteiras/022, TASK-RP-FE-01). Fundação de dados —
// nenhuma lógica, só shapes. Mirror estrutural de
// `@/@types/v2/Equipments/index.d.ts` (módulo real mais próximo: header + N
// itens dinâmicos (`useFieldArray`) + N anexos dinâmicos + sincronização por
// `uuid`), referência de PADRÃO indicada pelo contrato de tela (não cópia).
//
// Fonte: RequestPurchase-FrontEnd-contrato.md §5 (convenções de pasta) +
// RequestPurchase-contrato.md §4 (Enums/Resources/Payloads, APROVADO,
// 2026-08-06).
//
// ✅ CONFIRMADO CONTRA O CÓDIGO REAL (TASK-RP-FE-11/12, backend fechado e
// validado — `RequestPurchaseController`/`Resource`/`Repository` lidos
// diretamente em `api_root`). 2 achados reais de shape, corrigidos aqui:
//
// 1. **`RequestAuthorizerRef`/`authorizer`** — `RequestPurchaseResource`
//    (linha `'authorizer' => whenLoaded('requestAuthorizer', fn () => [...])`)
//    expõe **só `{uuid}`**, SEM nenhum campo de label/nome. Tipo corrigido
//    para refletir a realidade (sem `label`). ⚠️ **Gap de backend a
//    reportar** (não decidido/corrigido aqui, fora do escopo deste
//    Executor de frontend): `RequestAuthorizer::user()` existe e tem `name`
//    real (mesmo padrão já usado por `listRequestAuthorizerOptions`/
//    `RequestAuthorizerOptionItem`, TASK-RP-FE-07) — o Resource deveria
//    aninhar `user.name` para o formulário de edição conseguir mostrar um
//    label amigável do autorizador selecionado.
//
// 2. **`HarvestRef`** — `RequestPurchaseResource` expõe `{uuid, description}`,
//    NÃO `{uuid, label}` como a proposta original assumia — campo renomeado
//    aqui para `description` (idêntico ao Resource real).
//
// 3. **Eager-loading incompleto no `show()` (`GetRequestPurchaseAction` →
//    `RequestPurchaseRepository::findByUuidOrFail`)** — CONFIRMADO por
//    leitura direta: `with(['items', 'movements', 'requestAuthorizer',
//    'secondRequestAuthorizer'])`, isto é, **`harvest`, `responsible`,
//    `parent`, `children`, `attachments`, `items.product` e `movements.user`
//    NÃO são eager-loaded**. Como o Resource usa `whenLoaded(...)`, essas
//    chaves ficam **AUSENTES** (não `null`) no JSON quando a relação não foi
//    carregada — index()/my-processes/rejected também não eager-loadam
//    `responsible` (`RequestPurchaseRepository::listWithFilters`/
//    `listMyProcesses`/`listRejected`, sem nenhum `with()`).
//    Campos abaixo marcados `?:` (opcionais) para refletir essa realidade —
//    NÃO É "null vs undefined" cosmético: o código de tela precisa tratar
//    ausência defensivamente (ver `RequestMovementHistory.tsx`,
//    `movement.user?.name`).
//    ⚠️ **Gap de backend de maior severidade a reportar** (fora do escopo
//    deste Executor — `frontend_root` apenas): como `attachments` nunca
//    chega no `GET /request-purchases/{uuid}`, o formulário de edição
//    sempre inicia com a lista de anexos VAZIA — e a sincronização por
//    identidade (`SyncRequestPurchaseAttachmentsAction`, DA-RP-07) trata
//    qualquer `attachment_uuid` ausente do payload como "remover". **Editar
//    e salvar qualquer Solicitação hoje apaga todos os anexos existentes**,
//    mesmo sem o usuário tocar na aba Anexos. Recomendação ao backend:
//    `findByUuidOrFail` deveria eager-loadar também `harvest`, `responsible`,
//    `parent`, `children`, `attachments`, `items.product`, `movements.user`,
//    `requestAuthorizer.user`, `secondRequestAuthorizer.user`. **NÃO
//    corrigido aqui** (fora do escopo do Executor de frontend) — reportar ao
//    Arquiteto/dono como Gap de API antes de testar o fluxo de edição com
//    anexos reais em produção/homologação (risco de perda de dado real).
//
// 11 tipos × 7 formatos de item (`RequestItemData`/`RequestItemPayload`) NÃO
// são separados fisicamente por tipo aqui — decisão espelhada do backend
// (DA-RP-05, campos opcionais, união de formato único).
//
// FKs expostas como `*_uuid` (convenção universal do projeto) — nenhum `id`
// sequencial exposto (Lei do client API Cerne).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { FarmRef } from '@/@types/v2/Farms';

// ============================================
// REFS ANINHADOS (FKs relacionais, mirror ProviderOptionResource/EquipmentProprietaryRef)
// ============================================

/** CONFIRMADO contra `RequestPurchaseResource` real — só `{uuid}`, SEM label
 *  (ver nota de Gap no cabeçalho do arquivo). Diferente de
 *  `ProviderOptionResource`/outros módulos, que expõem `{uuid, label}`. */
export interface RequestAuthorizerRef {
  uuid: string;
  /** DD-078-04 (T-078-API-04) — `requestAuthorizer.user.name`. Aditivo: pode
   *  vir ausente/nulo (relação não carregada); a tela NUNCA cai para o uuid. */
  name?: string | null;
}

/** DD-078-04 — solicitação-pai com rótulo pronto (`{uuid, code, justification}`).
 *  Opcional: `parent_uuid` segue sendo enviado por retrocompatibilidade. */
export interface RequestParentRef {
  uuid: string;
  code?: string | null;
  justification?: string | null;
}

/** CONFIRMADO contra `RequestPurchaseResource` real — `{uuid, description}`,
 *  NÃO `{uuid, label}` (nome de campo corrigido, TASK-RP-FE-12). */
export interface HarvestRef {
  uuid: string;
  description: string;
}

/** Responsável (usuário) — `name`, não `label` (mirror `UserRef` de outros módulos, contrato §4). */
export interface RequestResponsibleRef {
  uuid: string;
  name: string;
}

/** Linha de item dinâmico (leitura) — união dos 7 formatos possíveis
 *  (Produto/Serviço/Adiantamento/Reembolso/Diária/Empreitada/Frete), campos
 *  opcionais conforme o `type` da solicitação-pai (DA-RP-05). */
export interface RequestItemRow {
  uuid: string;
  /** Opcional/ausente quando `items.product` não vem eager-loaded pelo
   *  backend (`show()` real hoje NÃO carrega, ver Gap no cabeçalho do
   *  arquivo) — tratar como "produto desconhecido nesta resposta", não como
   *  "sem produto vinculado". */
  product?: { uuid: string; description: string } | null;
  description: string | null;
  brand: string | null;
  observation: string | null;
  status: 'P' | 'E' | 'C' | null;
  status_label: string | null;
  quantity: number | null;
  amount: number | null;
  /** Sempre igual a `quantity` (DA-RP-06) — somente leitura, nunca no payload. */
  authorized_quantity: number | null;
  /** Diária — nome do prestador. */
  name: string | null;
  nif: string | null;
  phone: string | null;
  service_description: string | null;
  daily_quantity: number | null;
  delivery_date: string | null;
  forecast_delivery_date: string | null;
  /** ADITIVO (T-081-API-04, execução 081) — o item tem cotação autorizada.
   *  Só vem no detalhe (`GET /request-purchases/{uuid}`). "Informar Status"
   *  lista e envia SOMENTE os itens com `is_authorized === true` (legado). */
  is_authorized?: boolean;
}

/** Anexo dinâmico (leitura) — mirror `EquipmentAttachmentRow`. */
export interface RequestAttachmentRow {
  uuid: string;
  name: string;
  file_url: string | null;
}

/** Linha de trâmite (timeline read-only, `TASK-RP-FE-07`). */
export interface RequestMovementRow {
  uuid: string;
  /** Status de ORIGEM do movimento (DA-RP-09) — somente leitura. */
  status: number;
  status_label: string;
  justify: string | null;
  /** Opcional/ausente — `movements.user` NÃO vem eager-loaded pelo `show()`
   *  real hoje (ver Gap no cabeçalho do arquivo); UI deve renderizar com
   *  fallback (`movement.user?.name ?? '—'`), nunca acessar direto. */
  user?: RequestResponsibleRef;
  /** T-081-API-04 / DEP-API-16 — "Tempo Gasto" já formatado pelo servidor
   *  ("< 1h", "5h", "1d 6h"). O front NÃO calcula. Ausente em respostas antigas. */
  elapsed_label?: string | null;
  created_at: string;
}

/** Opção de transição de status disponível para o usuário atual (DA-RP-11,
 *  calculada pelo backend conforme papel + status corrente). */
export interface RequestStatusTransitionOption {
  value: number;
  label: string;
}

// ============================================
// REQUEST PURCHASE (resposta da API)
// ============================================

export interface RequestPurchaseListItem {
  uuid: string;
  /** Gerado pelo servidor — presente após a criação, nunca enviado no payload. */
  code: string | null;
  type: string;
  type_label: string;
  status: number;
  status_label: string;
  priority: number;
  priority_label: string;
  request_date: string;
  justification: string;
  description: string;
  /** Rótulo de duração pronto ("Hoje"/"N dias"), calculado server-side a
   *  partir de `request_date` (ADITIVO, exposto pelo Resource nesta rodada —
   *  coluna "Duração" da listagem). */
  duration_label: string;
  /** Solicitante (autor da solicitação) — `{uuid, name}`, mirror
   *  `RequestResponsibleRef` (mesmo shape de usuário do módulo, ADITIVO,
   *  exposto pelo Resource nesta rodada — coluna "Solicitante" da listagem). */
  user: RequestResponsibleRef;
  /** Fazenda da solicitação — `{uuid, description}` (a tabela `Farm` NÃO tem
   *  `name`, o rótulo vem em `description`; mirror `FarmRef` real do módulo
   *  de Fazendas, ADITIVO, exposto pelo Resource nesta rodada — coluna
   *  "Fazenda" da listagem). */
  farm: FarmRef;
  /** Opcional/ausente — `responsible` NÃO vem eager-loaded em `index()`/
   *  `my-processes`/`rejected` hoje (ver Gap no cabeçalho do arquivo); UI já
   *  trata com `?.` (`index.tsx`), manter essa disciplina em novo código. */
  responsible?: RequestResponsibleRef | null;
  /** ADITIVO (TASK-CQ-FE-02, hub de Cotações — LM-09) — total de cotações
   *  vinculadas a esta solicitação. CONFIRMADO contra `RequestPurchaseResource`
   *  real: `'quotations_count' => $this->whenCounted('quotations')` só
   *  materializa a chave quando o Repository aplicou `withCount('quotations')`
   *  — hoje isso só acontece em `listWithFilters()` (`GET /request-purchases`,
   *  `index()`). `my-processes`/`rejected` NÃO contam (sem `withCount`), então
   *  a chave fica AUSENTE (não `0`) nessas respostas — opcional por
   *  disciplina, mesmo racional de `responsible`/`harvest` acima. */
  quotations_count?: number;
  /** ADITIVO (TASK-MP-API-01, execução 039) — total de cotações RECEBIDAS
   *  (`RequestQuotationStatus::RECEBIDA`). Só populado por `GET /request-purchases/my-processes`
   *  (`withCount` com alias, ver Roteiro API 039 §3) — AUSENTE (não `0`) em `index()`/`rejected()`/
   *  `in-purchase()`/`in-quotation()`. Tratar com `?? 0` no render, nunca assumir presente fora de
   *  `listMyProcesses`. */
  received_quotations_count?: number;
  /** ADITIVO (T-081-API-10, execução 081) — "Refazer" da fila de Cotações: status 1/2 com
   *  movimento aguardando aprovação. Presente só em `GET /request-purchases/in-quotation`;
   *  ausente = `false`. */
  needs_redo?: boolean;
  /** ADITIVO (T-081-API-04, DEP-API-02, execução 081) — o usuário logado é
   *  autorizador desta solicitação (condição de "Autorizar" em Meus Processos,
   *  AM03 do legado). Ausente = tratar como `false`. */
  is_authorizer?: boolean;
  /** ADITIVO (T-081-API-04) — total de cotações APROVADAS. Base de "Informar
   *  Status" (== 1), "Criar Sub Solicitação" (> 1) e "Download Arquivo" (== 1).
   *  Ausente = `0`. */
  approved_quotations_count?: number;
  /** ADITIVO (T-081-API-04) — já existe lançamento financeiro (esconde
   *  "Gerar Financeiro"). Ausente = `false`. */
  has_financial?: boolean;
  created_at: string;
}

/** `GET /request-purchases/next-code` (UT-000743, API-743-NEXTCODE) — código
 *  PREVISTO da próxima solicitação (preview sem reserva; o definitivo é o do
 *  `201` do POST). */
export interface RequestPurchaseNextCode {
  code: string;
}

/** `GET /request-purchases/{uuid}` — shape de detalhe. Acrescenta os campos
 *  que a listagem não precisa exibir, mas o formulário único (`TASK-RP-FE-09`)
 *  consome (abas Dados Gerais/Itens/Anexos/Histórico). */
export interface RequestPurchaseData extends RequestPurchaseListItem {
  description: string;
  observation: string | null;
  nfe: string | null;
  authorization_date: string | null;
  /** Opcional/ausente — `requestAuthorizer` É eager-loaded pelo `show()` real
   *  (`with([...'requestAuthorizer'...])`), então esta chave normalmente
   *  aparece quando há autorizador vinculado; mantido `?:` por disciplina
   *  defensiva (whenLoaded sempre pode ausentar a chave se a Action mudar). */
  authorizer?: RequestAuthorizerRef | null;
  /** Opcional/ausente — `harvest` NÃO vem eager-loaded pelo `show()` real
   *  hoje (ver Gap no cabeçalho do arquivo). */
  harvest?: HarvestRef | null;
  /** Encadeamento de solicitações (DA-RP-14) — `parent_uuid` aponta para a
   *  solicitação-mãe (se houver), `children_uuids` lista as derivadas.
   *  Ambos opcionais/ausentes — `parent`/`children` NÃO vêm eager-loaded
   *  pelo `show()` real hoje (ver Gap no cabeçalho do arquivo). */
  parent_uuid?: string | null;
  /** DD-078-04 — rótulo da solicitação-pai vindo do payload (aditivo). */
  parent?: RequestParentRef | null;
  children_uuids?: string[];
  items: RequestItemRow[];
  movements: RequestMovementRow[];
  /** Opcional/ausente — `attachments` NÃO vem eager-loaded pelo `show()` real
   *  hoje (ver Gap de severidade alta no cabeçalho do arquivo — risco de
   *  perda de dado ao editar/salvar). */
  attachments?: RequestAttachmentRow[];
  /** DA-RP-11 — opções de transição de status calculadas server-side conforme
   *  papel do usuário + status corrente. */
  available_status_transitions: RequestStatusTransitionOption[];
  updated_at: string;
  // ---- ADITIVOS da execução 081 (T-081-API-04, DEP-API-16) ----
  /** N "Não Classificado", C "CAPEX", O "OPEX". */
  classification?: RequestClassification | null;
  financial_due_date?: string | null;
  finalization_note?: string | null;
  final_justification?: string | null;
  receipt_date?: string | null;
  receipt_note?: string | null;
  /** Rateio já gravado (seção Rateio da visualização). */
  ratio?: RequestRatioRow[];
  /** "Justificativa da cotação" (Autorização/Ciência, legado FRM/SEC). Ainda NÃO exposta pelo
   *  `RequestPurchaseResource`; o bloco só aparece quando a API a enviar. */
  quotation_justification?: string | null;
  /** Encarregado (segundo autorizador) — hidrata o select do formulário. */
  second_request_authorizer?: RequestAuthorizerRef | null;
  /** Sub solicitações geradas a partir desta. */
  children?: RequestParentRef[];
}

/** N "Não Classificado", C "CAPEX", O "OPEX" (rateio do Ordenador). */
export type RequestClassification = 'N' | 'C' | 'O';

/** Linha do rateio gravado (`ratio[]` do Resource, T-081-API-04). */
export interface RequestRatioRow {
  category?: { uuid: string; description: string } | null;
  center?: { uuid: string; description: string } | null;
  percent: number;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface RequestPurchasesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface RequestPurchasesListEnvelope {
  success: boolean;
  message: string;
  data: RequestPurchaseListItem[];
  errors: Record<string, string[]> | null;
  meta: RequestPurchasesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (create/update) — payload único, 7 formatos de item (DA-RP-05)
// ============================================

/** Payload de escrita de item — união dos 7 formatos, campos opcionais
 *  conforme o `type` da solicitação-pai (validação condicional real fica no
 *  schema Yup, `TASK-RP-FE-05`, não neste arquivo de tipos). */
export interface RequestItemPayload {
  /** `null`/ausente = item novo (DA-RP-07) — presente = item existente mantido. */
  item_uuid?: string | null;
  product_uuid?: string | null;
  quantity?: number | null;
  /** Numérico puro — sem formatação de moeda aplicada no shape (DA-RP-16). */
  amount?: number | null;
  name?: string | null;
  nif?: string | null;
  phone?: string | null;
  /** ADITIVO — existia no shape de LEITURA (`RequestItemRow`) mas nunca fora
   *  adicionado ao caminho de ESCRITA (Doc Bruta `RequestPurchase-Doc-Bruta.md`
   *  §12, gap corrigido nesta Tarefa). Visível/obrigatório (client-side) em 8
   *  dos 11 tipos — matriz em `request-purchase-schema.ts`. */
  description?: string | null;
  service_description?: string | null;
  daily_quantity?: number | null;
  brand?: string | null;
  observation?: string | null;
  delivery_date?: string | null;
}

/** Payload de escrita de anexo — `attachment_uuid` presente = mantido
 *  (possivelmente com `file` novo substituindo o antigo), ausente/`null` = novo. */
export interface RequestAttachmentPayload {
  attachment_uuid?: string | null;
  name?: string | null;
  /** `required_if` type F/E/U na criação (DA-RP-18, contrato §4). */
  file?: File | null;
}

/** Payload completo (store/update). `type` é imutável no update (regra 14,
 *  contrato §4), mas o backend o exige `required` também no PUT — o service
 *  SEMPRE o envia, com o valor ORIGINAL persistido (ver
 *  `buildRequestPurchasePayload`).
 *
 *  UT-000743 — `harvest_uuid`, `parent_uuid` e `nfe` NÃO fazem parte do
 *  payload: o formulário não os edita e a API preserva esses dados quando a
 *  chave é omitida no PUT (API-743-UPDATE-PRESERVE). Enviar `null` LIMPARIA a
 *  coluna — por isso o tipo nem permite a chave. */
export interface RequestPurchasePayload {
  type: string;
  request_date: string;
  justification: string;
  description: string;
  priority?: number | null;
  authorizer_uuid?: string | null;
  observation?: string | null;
  items: RequestItemPayload[];
  attachments?: RequestAttachmentPayload[];
}

/** Ação de trâmite "Transferir Responsável" (T-081-API-03, DEP-API-01) —
 *  novo responsável e justificativa, ambos obrigatórios (legado: "Este campo
 *  deve ser preenchido."). */
export interface RequestPurchaseTransferPayload {
  responsible_uuid: string;
  justify: string;
}

/** Candidato a novo responsável — `GET request-purchases/{uuid}/transfer-options`
 *  (`data[{uuid, name}]`). */
export interface TransferOption {
  uuid: string;
  name: string;
}

/** `GET request-purchases/authorizer-options` (T-081-API-03, DEP-API-04) —
 *  autorizadores permitidos ao solicitante (Encarregados). */
export interface RequestPurchaseAuthorizerOption {
  uuid: string;
  name: string;
  level?: number | string | null;
}

export interface RequestPurchaseAuthorizerOptionsEnvelope {
  success: boolean;
  message: string;
  data: RequestPurchaseAuthorizerOption[];
  errors: Record<string, string[]> | null;
  /** `requires_authorizer`: o solicitante tem chefes e, portanto, o
   *  Encarregado é obrigatório (DEP-API-04; antes `requester_has_bosses`). */
  meta: { requires_authorizer?: boolean } | null;
}

/** Ação de trâmite "Voltar Etapa" (T-081-API-03, DEP-API-03) — `justify`
 *  OBRIGATÓRIO (máx. 800), como no legado. */
export interface RequestPurchaseChangeStatusPayload {
  status: number;
  justify: string;
}

// ============================================
// FILTRO (grid da listagem)
// ============================================

/** Shape efetivamente PERSISTIDO em `paginatedQuery.filter`
 *  (`userPaginatedQuery<RequestPurchaseFilterForm>`), achatado (strings/
 *  números crus). */
export interface RequestPurchaseFilterForm {
  search?: string;
  type?: string;
  status?: number;
  date_from?: string;
  date_to?: string;
  /** ADITIVO (TASK-CQ-FE-02, hub de Cotações, CL-058/CL-059) — 4 filtros
   *  novos, mirror `RequestPurchaseFilterData` real (`api_root`,
   *  `farm_uuid`/`user_uuid`/`priority`/`responsible_uuid`, TASK-CQ-API-06).
   *  `*_label` são companions DISPLAY-ONLY (re-hidratação do
   *  `SelectAsyncPaginate` ao reabrir o drawer sem request extra) — NUNCA
   *  vão à querystring real nem contam em `filtersApplied` (mesmo padrão de
   *  `TransferFilterForm`, `FilterSideRomaneios.tsx`). */
  farm_uuid?: string;
  farm_label?: string;
  /** Filtro por solicitante (autor da solicitação, `user_id` no backend) —
   *  nomeado `user_uuid` (não `requester_uuid`) para bater 1:1 com
   *  `RequestPurchaseFilterData::$user_uuid` real. */
  user_uuid?: string;
  user_label?: string;
  priority?: number;
  responsible_uuid?: string;
  responsible_label?: string;
}

/** Shape efetivamente enviado à querystring de `GET /request-purchases`. */
export interface RequestPurchaseFilterRequest extends RequestPurchaseFilterForm {}

// ============================================
// FORM (react-hook-form) — item/anexo mantêm shape RAW (mirror
// EquipmentForm.cost_centers/attachments), componente de linha resolve
// exibição internamente (useFieldArray, TASK-RP-FE-07).
// ============================================

export interface RequestItemFormRow {
  item_uuid?: string | null;
  product_uuid?: Option<string> | null;
  quantity?: number | null;
  amount?: number | null;
  name?: string | null;
  nif?: string | null;
  phone?: string | null;
  /** ADITIVO — ver nota em `RequestItemPayload.description` (gap de
   *  caminho-de-escrita, corrigido nesta Tarefa). */
  description?: string | null;
  service_description?: string | null;
  daily_quantity?: number | null;
  brand?: string | null;
  observation?: string | null;
  delivery_date?: string | null;
}

export interface RequestAttachmentFormRow {
  attachment_uuid?: string | null;
  name?: string | null;
  file?: File | null;
}

export interface RequestPurchaseForm {
  /** Travado (`disabled`) na edição — imutável (regra 14, contrato §4). */
  type: Option<string> | null;
  request_date: string | null;
  justification: string;
  description: string;
  priority: Option<number> | null;
  authorizer_uuid?: Option<string> | null;
  observation?: string | null;
  items: RequestItemFormRow[];
  attachments: RequestAttachmentFormRow[];
}

// ============================================
// FILA "COMPRAS" (in-purchase) — ADITIVO a este arquivo existente
// (TASK-CPS-FE-01, esteira 97-Esteiras/036). 3ª visão tenant-wide sobre a
// MESMA entidade `RequestPurchase` (mirror `myProcesses`/`rejected`/
// `inQuotation` já existentes acima) — fundação pura, consumida pelas telas
// de `TASK-CPS-FE-02..06`.
// ============================================

/** Payload de `PUT /request-purchases/{uuid}/inform-status`
 *  (`TASK-CP-API-02`). `item_delivery_dates` é uuid-do-item → data (Y-m-d),
 *  NUNCA array posicional — confirmado por leitura direta de
 *  `RequestPurchaseInformStatusData::$itemDeliveryDates`
 *  (`array<string,string>`, chave = uuid do `RequestItem`). */
export interface InformRequestPurchaseStatusPayload {
  status: 7 | 10;
  justify: string;
  /** `null` explícito apaga o vencimento (o legado sobrescreve mesmo vazio). */
  financial_due_date?: string | null;
  /** Execução 081 (T-081-API-04): TODAS as linhas autorizadas vão no payload;
   *  data em branco = `null` (a API zera a previsão), como no legado. */
  item_delivery_dates?: Record<string, string | null>;
}

/** Payload de `POST /request-purchases/{uuid}/separate` (`TASK-CP-API-03`).
 *  `items` = uuids de `RequestItem` (NÃO de `RequestQuotationItem`, que não
 *  tem uuid próprio) — confirmado contra `SeparateRequestPurchaseData`
 *  (`#[MapInputName('items')] itemUuids: array<string>`). */
export interface SeparateRequestPurchasePayload {
  items: string[];
}

/** `GET /request-purchases/{uuid}/separated-preview` — resposta
 *  `{request_purchase, approved_quotations}`
 *  (`RequestPurchaseController::separatedPreview`).
 *  `approved_quotations[].items[].request_item_uuid` é a chave usada para
 *  montar `SeparateRequestPurchasePayload.items`. */
export interface RequestQuotationItemPreview {
  request_item_uuid: string | null;
  description: string | null;
  product: { uuid: string; description: string } | null;
}
export interface RequestQuotationPreview {
  uuid: string;
  hash: string;
  quotation_date: string | null;
  total_value: number;
  items: RequestQuotationItemPreview[];
}
export interface SeparatedPreviewData {
  request_purchase: RequestPurchaseData;
  approved_quotations: RequestQuotationPreview[];
}

/** `POST /request-purchases/{uuid}/whatsapp-link` — retorna a URL wa.me já
 *  formatada (o front NUNCA monta a mensagem — mirror `TASK-CP-API-04`). */
export interface WhatsappLinkResult {
  url: string;
}

/** `GET /request-purchases/{uuid}/order-pdf` — metadados; o binário fica no
 *  canal PÚBLICO `purchase-orders/{fileName}/download` (SEM auth — decisão
 *  do dono, Gap-CP-04). `url` já vem pronta (absoluta, via `route()`). */
export interface OrderPdfResult {
  path: string;
  url: string;
}

// ============================================
// FORM (react-hook-form) — dialogs de ação da fila Compras
// ============================================

/** Uma linha do RepeaterList de datas de previsão (`TASK-CPS-FE-03`) — chave
 *  é o `item_uuid` (readonly, do `RequestItemRow`), valor é a data editável. */
export interface RequestItemDeliveryDateFormRow {
  item_uuid: string;
  item_label: string; // produto/serviço do item, só para exibição
  /** Execução 081 — colunas Quantidade e Descrição da tabela do legado (somente leitura). */
  quantity?: number | null;
  item_description?: string | null;
  delivery_date: string | null;
}

export interface InformRequestPurchaseStatusForm {
  status: Option<7 | 10> | null;
  financial_due_date: string | null;
  justify: string;
  item_delivery_dates: RequestItemDeliveryDateFormRow[];
}

/** Seleção da bifurcação (`TASK-CPS-FE-04`) — `CheckboxListField`, uma
 *  entrada por `request_item_uuid` disponível no preview. */
export interface SeparateRequestPurchaseForm {
  selected_item_uuids: string[];
}

// Reexport de conveniência (mirror `Equipments/index.d.ts`) — evita import
// direto de `@/@types/option` nas telas quando só o alias for necessário.
export type { Option };
