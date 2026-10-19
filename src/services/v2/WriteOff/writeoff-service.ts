// src/services/v2/WriteOff/writeoff-service.ts
// -----------------------------------------------------------------------------
// WriteOff Service — API v1 do backend Laravel GB.Cerne (Baixa Manual, TASK-
// -036-GB-02). Módulo COMPARTILHADO entre Contas a Receber e Contas a Pagar —
// TASK-FE-036-330, consumido pelos componentes de UI das Tarefas 331/332 e
// pela integração de Contas a Receber (Tarefa 333). NÃO DUPLICAR: a fatia
// irmã de Contas a Pagar reusa este MESMO arquivo, nunca cria um
// `income-writeoff-service.ts`/`expense-writeoff-service.ts` próprio.
//
// Contrato (envelope ApiResponse: { success, message, data, errors, meta }):
//   GET  /{segment}/{titleUuid}/writeoffs → data: WriteOffListItem[], SEM
//        paginação (`meta: null` sempre) — só baixas ATIVAS
//        (`canceled_at IS NULL`), o backend já filtra
//        (`WriteOffRepository::activeForIncome/activeForExpense`).
//   POST /{segment}/{titleUuid}/writeoffs → payload WriteOffPayload IDÊNTICO
//        entre os 2 segmentos (`ManualWriteOffIncomeRequest`/
//        `ManualWriteOffExpenseRequest`, mirror 1:1). `writeoff_type='M'`
//        fixo no servidor — nunca enviado pelo front. `net_value` NUNCA é
//        campo do payload — calculado no servidor
//        (`amount - discount + penalty + interest + increase`).
//   PUT  /writeoffs/{writeOffUuid}/cancel → SEM payload, SEM segmento no path
//        (a API resolve a permissão dinamicamente pelo dono da baixa,
//        `CancelWriteOffRequest::authorize()`) — resposta 204 SEM CORPO; o
//        chamador precisa reconsultar o `GET` da lista após cancelar.
//
// Divergência de serialização JÁ CONFIRMADA (leitura direta do backend):
// `IncomeController::storeWriteoff()` passa `encodingOptions:
// JSON_PRESERVE_ZERO_FRACTION`, `ExpenseController::storeWriteoff()` NÃO —
// um valor "inteiro" pode vir como `40` (Expense) ou `40.0` (Income). Este
// service não faz parsing algum sobre o corpo de resposta (repassa o
// envelope cru); o CONSUMIDOR (Tarefas 331/332) é quem deve usar `Number(...)`
// ao ler campos numéricos, nunca comparação de string.
// -----------------------------------------------------------------------------

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import api from '@/services/api';

import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  SuggestedWriteOffCategory,
  WriteOffAdvancePartyOption,
  WriteOffBatchPayload,
  WriteOffCounterpartOption,
  WriteOffCounterpartOptionItem,
  WriteOffListItem,
  WriteOffPayload,
  WriteOffSegment,
  WriteOffsListEnvelope,
} from '@/@types/v2/WriteOff';

// Mapper NOMEADO (não arrow inline) — usado como `mapOptions` do
// `SelectAsyncPaginate` em `WriteOffCreateModal`/`WriteOffBatchModal`. Ser
// uma referência de função (não um literal de objeto contextualmente
// tipado) evita o excess-property-check do TS contra o retorno genérico
// `{label,value,active?}` de `SelectAsyncPaginateProps.mapOptions` — o
// `balance` extra é permitido por assignabilidade estrutural normal.
export function mapWriteOffCounterpartOption(
  item: WriteOffCounterpartOptionItem
): WriteOffCounterpartOption {
  return { label: item.label, value: item.uuid, balance: item.balance };
}

// Mapper NOMEADO dedicado (item A2, Execução 065, TASK-065-FE-A2) — SÓ para o
// select "Título Relacionado" da Baixa Cruzada do LOTE
// (`WriteOffBatchModal.tsx`). NÃO reusa/muta `mapWriteOffCounterpartOption`
// acima: aquele é COMPARTILHADO com `WriteOffCreateModal` (baixa individual)
// — mudar o label ali regrediria o label da baixa individual (risco
// registrado no plano da Execução 065). Aqui o label ganha o saldo
// formatado anexado (`{código — descrição} — {saldo BRL}`), enhancement
// aprovado pelo dono além do legado (que só mostrava `{number}`).
// `balance` PERMANECE na option (mesma obrigação de
// `mapWriteOffCounterpartOption`) — alimenta o `InputReadOnly` de "Saldo do
// Título" e a guarda de saldo (`batchTotal` vs `watchedRelatedTitle.balance`)
// no modal, ambos lidos diretamente da option escolhida.
export function mapWriteOffAdvanceTitleOptionWithBalance(
  item: WriteOffCounterpartOptionItem
): WriteOffCounterpartOption {
  return {
    label: `${item.label} — ${formatCurrencyBRL(item.balance)}`,
    value: item.uuid,
    balance: item.balance,
  };
}

// GET /{segment}/{titleUuid}/writeoffs — lista baixas ATIVAS do título.
// Envelope `ApiResponse::success` (SEM paginação) — repassado cru, sem
// adaptação para `ResponsePagination` (este service não alimenta grid/select
// assíncrono, é consumido por `useQuery` direto, mirror `useIncomeDetail`).
async function listActiveWriteOffs(
  segment: WriteOffSegment,
  titleUuid: string
): Promise<WriteOffsListEnvelope> {
  const { data } = await api.V2.get<WriteOffsListEnvelope>(`/${segment}/${titleUuid}/writeoffs`);
  return data;
}

// POST /{segment}/{titleUuid}/writeoffs — cria 1 baixa MANUAL bancária
// (`writeoff_type='M'`, fixo no servidor). `payload` nunca inclui
// `net_value` (calculado no servidor) nem `writeoff_type` (não existe no
// `WriteOffPayload`, ver @types/v2/WriteOff).
async function createManualWriteOff(
  segment: WriteOffSegment,
  titleUuid: string,
  payload: WriteOffPayload
): Promise<Response<WriteOffListItem>> {
  const { data } = await api.V2.post<Response<WriteOffListItem>>(
    `/${segment}/${titleUuid}/writeoffs`,
    payload
  );
  return data;
}

// GET /{segment}/{titleUuid}/writeoffs/suggested-categories — rateio
// SUGERIDO do título (`TASK-036-GB-06`, mirror `SuggestWriteOffCategoriesAction`
// no servidor: desconta o já consumido em baixas anteriores, renormaliza a
// 100% e redistribui sobre o `balance` ATUAL com correção de maior resto).
// SÓ LEITURA — não persiste nada. Consumido por `WriteOffCreateModal` ao
// abrir, para pré-preencher `categories` sem round-trip extra (o DTO já
// vem com `*_description` para popular os caches de label dos
// `SelectAsyncPaginate`). Falha (rede/404/título sem categoria) é tratada
// pelo CHAMADOR — mirror `getAccountBalance`, este service não engole erro.
async function getSuggestedWriteOffCategories(
  segment: WriteOffSegment,
  titleUuid: string
): Promise<Response<SuggestedWriteOffCategory[]>> {
  const { data } = await api.V2.get<Response<SuggestedWriteOffCategory[]>>(
    `/${segment}/${titleUuid}/writeoffs/suggested-categories`
  );
  return data;
}

// -----------------------------------------------------------------------------
// Options de CONTRAPARTIDA da baixa INDIVIDUAL (`TASK-036-GB-07/08`) —
// `GET /{segment}/{titleUuid}/writeoffs/{advance,nfe,income,expense,card-bill}-options`.
// Leitura direta do backend (`ExpenseController`/`IncomeController`,
// métodos SEM Form Request e SEM parâmetro de query) confirma que estas
// rotas são FLAT (`ApiResponse::success`, sem paginação real, sem
// `search`/`page`) — mesma família de `/plan-accounts/options`
// (`plan-account-service.ts`) e `/cost-centers/options/global`. Adaptadas
// aqui para uma única "página" com tudo (mirror `listGlobalCostCenterOptions`)
// só para caber no contrato `ResponsePagination` que `SelectAsyncPaginate`
// exige — NÃO existe filtro por digitação no servidor para estes 5
// endpoints (universo já é o título aberto, tipicamente pequeno).
// -----------------------------------------------------------------------------

function adaptCounterpartOptionsEnvelope(
  envelope: Response<WriteOffCounterpartOptionItem[]>
): ResponsePagination<WriteOffCounterpartOptionItem[]> {
  return {
    success: envelope.success,
    message: envelope.message,
    data: {
      items: envelope.data,
      pagination: {
        total: envelope.data.length,
        count: envelope.data.length,
        per_page: envelope.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

// `writeoff_type='B'` — título de ADIANTAMENTO (mesmo segmento), excluindo o
// próprio `{titleUuid}`.
async function listAdvanceOptions(
  segment: WriteOffSegment,
  titleUuid: string
): Promise<ResponsePagination<WriteOffCounterpartOptionItem[]>> {
  const { data } = await api.V2.get<Response<WriteOffCounterpartOptionItem[]>>(
    `/${segment}/${titleUuid}/writeoffs/advance-options`
  );
  return adaptCounterpartOptionsEnvelope(data);
}

// `writeoff_type='D'` — só `segment='expenses'` (NFe de Devolução).
async function listNfeOptions(
  segment: WriteOffSegment,
  titleUuid: string
): Promise<ResponsePagination<WriteOffCounterpartOptionItem[]>> {
  const { data } = await api.V2.get<Response<WriteOffCounterpartOptionItem[]>>(
    `/${segment}/${titleUuid}/writeoffs/nfe-options`
  );
  return adaptCounterpartOptionsEnvelope(data);
}

// `writeoff_type='I'` — só `segment='expenses'` (Conta a Receber cruzada).
// Lista vazia (não erro) quando a condição de disponibilidade não é
// satisfeita — usada também para desabilitar a option `I` no seletor de
// tipo (`WriteOffCreateModal`).
async function listIncomeOptions(
  segment: WriteOffSegment,
  titleUuid: string
): Promise<ResponsePagination<WriteOffCounterpartOptionItem[]>> {
  const { data } = await api.V2.get<Response<WriteOffCounterpartOptionItem[]>>(
    `/${segment}/${titleUuid}/writeoffs/income-options`
  );
  return adaptCounterpartOptionsEnvelope(data);
}

// `writeoff_type='E'` — só `segment='incomes'` (Conta a Pagar cruzada).
// Mesma semântica de lista vazia de `listIncomeOptions`.
async function listExpenseOptions(
  segment: WriteOffSegment,
  titleUuid: string
): Promise<ResponsePagination<WriteOffCounterpartOptionItem[]>> {
  const { data } = await api.V2.get<Response<WriteOffCounterpartOptionItem[]>>(
    `/${segment}/${titleUuid}/writeoffs/expense-options`
  );
  return adaptCounterpartOptionsEnvelope(data);
}

// `writeoff_type='C'` — só `segment='expenses'` (Fatura, excluindo a própria).
async function listCardBillOptions(
  segment: WriteOffSegment,
  titleUuid: string
): Promise<ResponsePagination<WriteOffCounterpartOptionItem[]>> {
  const { data } = await api.V2.get<Response<WriteOffCounterpartOptionItem[]>>(
    `/${segment}/${titleUuid}/writeoffs/card-bill-options`
  );
  return adaptCounterpartOptionsEnvelope(data);
}

// -----------------------------------------------------------------------------
// Cascata Fornecedor/Cliente→Título da Baixa em LOTE (`TASK-036-GB-09`,
// HANDSHAKE-front-baixa-lote-cascata-fornecedor-cliente.md). Rotas
// SEM segmento no path (`/writeoffs/advance-parties`/`/writeoffs/advance-titles`,
// `segment` vai por querystring) — mirror `AdvancePartiesRequest`/
// `AdvanceTitlesByPartyRequest` (leitura direta do backend).
// -----------------------------------------------------------------------------

function emptyAdvanceTitlesPage(): ResponsePagination<WriteOffCounterpartOptionItem[]> {
  return {
    success: true,
    message: '',
    data: {
      items: [],
      pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
    },
  };
}

// `GET /writeoffs/advance-parties?segment=` — 1º nível da cascata (Fornecedor
// c/ Saldo em `expenses` | Cliente c/ Saldo em `incomes`). `search` é o
// ÚNICO parâmetro extra aceito pelo backend (`AdvancePartiesRequest::rules()`)
// — sem paginação real (`ProviderOptionResource`/`ClientOptionResource`,
// SEM `balance`, o saldo é por TÍTULO, não por pessoa).
async function listAdvanceParties(
  segment: WriteOffSegment,
  params: { search?: string }
): Promise<ResponsePagination<WriteOffAdvancePartyOption[]>> {
  const { data } = await api.V2.get<Response<WriteOffAdvancePartyOption[]>>(
    '/writeoffs/advance-parties',
    { segment, search: params.search || undefined }
  );
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

// `GET /writeoffs/advance-titles?segment=&party_uuid=` — 2º nível da
// cascata: títulos de ADIANTAMENTO com saldo do `party_uuid` informado.
// `partyUuid` ausente (nível 1 ainda não selecionado) retorna página vazia
// SEM round-trip — mirror da guarda `isDisabled` do Select.
async function listAdvanceTitles(
  segment: WriteOffSegment,
  partyUuid: string | undefined
): Promise<ResponsePagination<WriteOffCounterpartOptionItem[]>> {
  if (!partyUuid) return emptyAdvanceTitlesPage();

  const { data } = await api.V2.get<Response<WriteOffCounterpartOptionItem[]>>(
    '/writeoffs/advance-titles',
    { segment, party_uuid: partyUuid }
  );
  return adaptCounterpartOptionsEnvelope(data);
}

// PUT /writeoffs/{writeOffUuid}/cancel — cancela 1 baixa (uuid do WRITE-OFF,
// nunca o uuid do título). SEM payload. Resposta 204 SEM CORPO — o chamador
// (Tarefa 332) precisa reconsultar `listActiveWriteOffs` após o sucesso
// (mais de 1 baixa pode ter desaparecido se compartilharem `movement_id`
// agrupado, suportado pelo backend por robustez futura). Segmento-agnóstico
// de propósito — a própria API resolve a permissão dinamicamente pelo dono
// da baixa (`expense_id`/`income_id` do registro resolvido).
async function cancelWriteOff(writeOffUuid: string): Promise<void> {
  await api.V2.put(`/writeoffs/${writeOffUuid}/cancel`);
}

// POST /writeoffs/batch — cria 1 LOTE de baixas MANUAIS bancárias, ATÔMICO
// (`DB::transaction` no servidor — `TASK-036-GB-05` v2.0, `BatchWriteOffAction`;
// rollback do LOTE INTEIRO se qualquer linha falhar). Rota SEM segmento no
// path (diferente de `createManualWriteOff` acima) — `segment` vai DENTRO do
// `WriteOffBatchPayload`. Resposta é a coleção `WriteOffResource::collection`
// na MESMA ordem das `rows` enviadas — reaproveita `WriteOffListItem` já
// existente (mesmo shape de leitura), não um tipo novo.
//
// `payload.file` presente → envia `FormData` (multipart), mirror
// `createPartner`/`parseInvoiceXml` (axios define o `Content-Type:
// multipart/form-data` sozinho a partir da instância `FormData`, nunca
// setado manualmente); `rows[]` vai em notação de colchetes
// (`rows[0][title_uuid]`, mirror `buildRequestPurchaseFormData`). SEM
// arquivo → JSON puro (payload de lote historicamente já era JSON, sem
// motivo para forçar multipart quando não há upload).
//
// ⚠️ Idempotência: NÃO EXISTE proteção nenhuma no servidor (campo/header
// cortado do escopo desta entrega, comentário explícito no
// `BatchWriteOffAction`). Reenviar o mesmo payload cria um SEGUNDO lote
// duplicado — o consumidor (`WriteOffBatchModal`, Tarefa 335/343) é
// responsável por desabilitar o botão de submit enquanto esta chamada está
// em voo (`isPending`), única proteção existente.
function buildBatchWriteOffFormData(payload: WriteOffBatchPayload): FormData {
  const fd = new FormData();
  fd.append('segment', payload.segment);
  fd.append('banking_movement', payload.banking_movement ? '1' : '0');
  fd.append('movement_date', payload.movement_date);

  if (payload.account_uuid) fd.append('account_uuid', payload.account_uuid);
  if (payload.related_title_uuid) fd.append('related_title_uuid', payload.related_title_uuid);
  if (payload.writeoff_type) fd.append('writeoff_type', payload.writeoff_type);
  if (payload.penalty !== undefined) fd.append('penalty', String(payload.penalty));
  if (payload.interest !== undefined) fd.append('interest', String(payload.interest));
  if (payload.increase !== undefined) fd.append('increase', String(payload.increase));
  if (payload.note) fd.append('note', payload.note);
  if (payload.description) fd.append('description', payload.description);
  if (payload.file) fd.append('file', payload.file);
  // TASK-MES-FE-06 — aditivo/opcional, ver nota em `@/@types/v2/WriteOff`.
  if (payload.is_reconciled !== undefined) {
    fd.append('is_reconciled', payload.is_reconciled ? '1' : '0');
  }

  payload.rows.forEach((row, index) => {
    fd.append(`rows[${index}][title_uuid]`, row.title_uuid);
    fd.append(`rows[${index}][amount]`, String(row.amount));
    if (row.discount !== undefined) fd.append(`rows[${index}][discount]`, String(row.discount));
  });

  return fd;
}

async function createBatchWriteOff(
  payload: WriteOffBatchPayload
): Promise<Response<WriteOffListItem[]>> {
  const body: WriteOffBatchPayload | FormData = payload.file
    ? buildBatchWriteOffFormData(payload)
    : payload;
  const { data } = await api.V2.post<Response<WriteOffListItem[]>>('/writeoffs/batch', body);
  return data;
}

export {
  cancelWriteOff,
  createBatchWriteOff,
  createManualWriteOff,
  getSuggestedWriteOffCategories,
  listActiveWriteOffs,
  listAdvanceOptions,
  listAdvanceParties,
  listAdvanceTitles,
  listCardBillOptions,
  listExpenseOptions,
  listIncomeOptions,
  listNfeOptions,
};
