// src/services/v2/RequestPurchases/request-purchase-service.ts
// -----------------------------------------------------------------------------
// RequestPurchase Service — API v1 do backend Laravel GB.Cerne (Suprimentos/
// Compras — "Solicitação de Compras"). Contrato: RequestPurchase-contrato.md
// (backend, APROVADO 2026-08-06, gate humano concluído com os 7 defaults
// DA-RP-14 a DA-RP-20) §3/§4 + RequestPurchase-FrontEnd-contrato.md §5.
//
// ✅ CONFIRMADO CONTRA O CÓDIGO REAL (TASK-RP-FE-11/12) — backend fechado
// (`06-Tarefas_Backend/TASK-RP-06/07/08`, todos ✅ CONCLUÍDO/validados pelo
// Tester backend em 2026-08-06) e `RequestPurchaseController`/rotas
// `/request-purchases` EXISTEM no fork (`routes/api.php`), lido diretamente
// nesta rodada. Os 5 filtros de `listRequestPurchases` (§3.1) e o shape do
// envelope (`data`/`meta.current_page`/`per_page`/`total`/`last_page`)
// batem 1:1 com `RequestPurchaseController::index()`/`RequestPurchaseFilterData`
// reais — nenhum ajuste de nome de parâmetro necessário. Notação de array
// `items[N][campo]`/`attachments[N][campo]` via multipart CONFIRMADA
// compatível com `spatie/laravel-data` (mesmo mecanismo já usado por
// `Equipment`). Achados reais de SHAPE (corrigidos em
// `@/@types/v2/RequestPurchases`, ver cabeçalho daquele arquivo para o
// detalhe completo): `authorizer`/`harvest` do `RequestPurchaseResource`
// divergem do tipo original (`authorizer` só tem `uuid`, sem label;
// `harvest` usa `description`, não `label`); e o `show()` real
// (`GetRequestPurchaseAction`/`RequestPurchaseRepository::findByUuidOrFail`)
// NÃO eager-loada `harvest`/`responsible`/`parent`/`children`/`attachments`/
// `items.product`/`movements.user` — Gap de backend de severidade ALTA
// registrado lá (risco de perda de anexos ao editar), fora do escopo deste
// Executor de frontend (não corrigido aqui). `getNifDailyTotal` — Resource
// real (`RequestPurchaseController::nifDaily()`) retorna
// `{nif: string, total: number}` (CONFIRMADO), shape já correto abaixo.
//
//   GET    /request-purchases                        → data: RequestPurchaseListItem[],
//                                                        meta com paginação REAL (contrato §3)
//   GET    /request-purchases/{uuid}                 → data: RequestPurchaseData
//   POST   /request-purchases                        → multipart (RequestPurchasePayload,
//                                                        por causa de `attachments[].file`)
//   PUT    /request-purchases/{uuid}                 → multipart via POST + `_method=PUT`
//                                                        (method spoofing — mirror
//                                                        `updateEquipment`/`updateFamilyEquipment`,
//                                                        PUT nativo não é parseado de forma
//                                                        confiável pelo Laravel quando o corpo é
//                                                        multipart). `type` é IMUTÁVEL no update
//                                                        (regra 14, contrato §4) MAS é ENVIADO
//                                                        (mesmo valor original) — o Form Request
//                                                        exige `type` `required` também no update;
//                                                        a imutabilidade é validada server-side
//                                                        comparando com o valor persistido, não
//                                                        pela ausência do campo (ERRO-FE corrigido
//                                                        2026-08-06, 422 "type required" real).
//   DELETE /request-purchases/{uuid}                 → CONFIRMADO no contrato de API §3
//                                                        (hard delete atômico + guarda 422 de FK,
//                                                        DA-RP-12)
//   POST   /request-purchases/{uuid}/receive          → sem payload — idempotência negativa
//                                                        (DA-RP-08)
//   POST   /request-purchases/{uuid}/transfer         → RequestPurchaseTransferPayload (JSON)
//   POST   /request-purchases/{uuid}/change-status     → RequestPurchaseChangeStatusPayload (JSON)
//   POST   /request-purchases/{uuid}/finish            → sem payload — força status=9 (DA-RP-09)
//   POST   /request-purchases/{uuid}/quotation-justification → JSON, campo isolado
//   GET    /request-purchases/my-processes             → mesmo envelope/adapter de `index()`,
//                                                        filtro de negócio `responsible_id`
//                                                        aplicado server-side (DA-RP-13)
//   GET    /request-purchases/rejected                 → idem, filtro `status IN (5, 10)`
//   GET    /request-purchases/nif-daily?nif=...         → agregação pura (DA-RP-17)
//
// `listRequestPurchases`/`listMyProcesses`/`listRejectedRequestPurchases`
// ADAPTAM o envelope { data: [], meta: {} } para o shape `ResponsePagination`
// que `useCustomGridQuery`/`TableProvider` consomem — mesmo adaptador de
// `listEquipments`/`listProducts` (meta REAL, nunca fallback fake).
//
// `buildRequestPurchaseFormData` monta o FormData COMPLETO (full-resource,
// nunca delta de `dirtyFields` — mirror `buildEquipmentFormData`). Arrays
// (`items`/`attachments`) são serializados com a notação de índice
// `campo[i][chave]`, convenção padrão do Laravel para parsear arrays de
// objetos vindos de multipart/form-data — MESMA cláusula de risco de
// `Equipment` quanto à confirmação exata do parsing pelo `spatie/laravel-data`
// quando o backend publicar (ver bloco acima).
//
// ⚠️ Armadilha ERRO-FE-016 (services que enumeram parâmetros manualmente
// descartam parâmetro novo em silêncio, `tsc` não acusa): os filtros de
// `ListRequestPurchasesParams` são TODOS repassados explicitamente na
// querystring abaixo — ao adicionar um filtro novo no futuro, repassar aqui
// também, não só no tipo.
// -----------------------------------------------------------------------------

import api from '@/services/api';
import type { RequestAuthorizerOptionItem } from '@/services/v2/RequestAuthorizers/request-authorizer-service';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  InformRequestPurchaseStatusPayload,
  OrderPdfResult,
  RequestAttachmentPayload,
  RequestItemPayload,
  RequestPurchaseAuthorizerOption,
  RequestPurchaseAuthorizerOptionsEnvelope,
  RequestPurchaseChangeStatusPayload,
  RequestPurchaseData,
  RequestPurchaseFilterRequest,
  RequestPurchaseListItem,
  RequestPurchaseNextCode,
  RequestPurchasePayload,
  RequestPurchaseTransferPayload,
  RequestPurchasesListEnvelope,
  SeparatedPreviewData,
  SeparateRequestPurchasePayload,
  TransferOption,
  WhatsappLinkResult,
} from '@/@types/v2/RequestPurchases';

export interface ListRequestPurchasesParams
  extends PaginationQueryParams, RequestPurchaseFilterRequest {}

async function listRequestPurchases(
  params: ListRequestPurchasesParams
): Promise<ResponsePagination<RequestPurchaseListItem[]>> {
  const { data } = await api.V2.get<RequestPurchasesListEnvelope>('/request-purchases', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    type: params.type || undefined,
    status: params.status ?? undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
    // ADITIVO (TASK-CQ-FE-02, hub de Cotações, TASK-CQ-API-06) — só
    // `listRequestPurchases`/`index()` aceita estes 4 filtros
    // (`RequestPurchaseFilterData` real); `listMyProcesses`/
    // `listRejectedRequestPurchases` abaixo chamam Repository methods SEM
    // filtro (`listMyProcesses(userId, tenantId)`/`listRejected(tenantId)`,
    // confirmado em `api_root`) — não repassar lá. `*_label` companions do
    // FilterSide NUNCA são repassados (whitelist explícita, mesma disciplina
    // do resto desta função — ver nota ERRO-FE-016 acima).
    farm_uuid: params.farm_uuid || undefined,
    user_uuid: params.user_uuid || undefined,
    priority: params.priority ?? undefined,
    responsible_uuid: params.responsible_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listEquipments`/`listProducts` (meta REAL, não fallback fake).
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getRequestPurchase(uuid: string) {
  const { data } = await api.V2.get<Response<RequestPurchaseData>>(`/request-purchases/${uuid}`);
  return data;
}

// buildRequestPurchaseFormData — monta o FormData COMPLETO (full-resource,
// nunca um delta de dirtyFields) — mirror `buildEquipmentFormData`. Arrays
// (`items`/`attachments`) são serializados com a notação de índice
// `campo[i][chave]`, convenção padrão do Laravel para parsear arrays de
// objetos vindos de multipart/form-data.
//
// ⚠️ ERRO-FE corrigido (2026-08-06): `type` é IMUTÁVEL no update (regra 14,
// contrato §4), mas IMUTÁVEL != AUSENTE — o Form Request do backend
// (`RequestPurchaseRequest::rules()`) exige `type` como `required` TAMBÉM no
// `update` (a imutabilidade é validada DEPOIS, comparando o valor recebido
// com o valor persistido, `UpdateRequestPurchaseAction`). Esta função
// SEMPRE envia `type` (create e update) — quem garante que o valor é o
// ORIGINAL/imutável no update é o chamador (`CreateOrUpdateSolicitacao.tsx`,
// que lê de `requestPurchaseData.type`, nunca de um campo editável pelo
// usuário). Omitir `type` aqui causava 422 "type required" em TODO update
// (confirmado por cURL real).
function buildRequestPurchaseFormData(payload: RequestPurchasePayload): FormData {
  const fd = new FormData();

  fd.append('type', payload.type);

  fd.append('request_date', payload.request_date);
  fd.append('justification', payload.justification);
  fd.append('description', payload.description);

  if (payload.priority !== null && payload.priority !== undefined) {
    fd.append('priority', String(payload.priority));
  }
  if (payload.authorizer_uuid) fd.append('authorizer_uuid', payload.authorizer_uuid);
  // UT-000743 — `harvest_uuid`/`parent_uuid`/`nfe` NUNCA vão ao wire (nem
  // `null`, nem vazio): omissão = a API preserva o dado (API-743-UPDATE-PRESERVE).
  if (payload.observation) fd.append('observation', payload.observation);

  payload.items.forEach((item: RequestItemPayload, index: number) => {
    if (item.item_uuid) fd.append(`items[${index}][item_uuid]`, item.item_uuid);
    if (item.product_uuid) fd.append(`items[${index}][product_uuid]`, item.product_uuid);
    if (item.description) fd.append(`items[${index}][description]`, item.description);
    if (item.quantity !== null && item.quantity !== undefined) {
      fd.append(`items[${index}][quantity]`, String(item.quantity));
    }
    if (item.amount !== null && item.amount !== undefined) {
      fd.append(`items[${index}][amount]`, String(item.amount));
    }
    if (item.name) fd.append(`items[${index}][name]`, item.name);
    if (item.nif) fd.append(`items[${index}][nif]`, item.nif);
    if (item.phone) fd.append(`items[${index}][phone]`, item.phone);
    if (item.service_description) {
      fd.append(`items[${index}][service_description]`, item.service_description);
    }
    if (item.daily_quantity !== null && item.daily_quantity !== undefined) {
      fd.append(`items[${index}][daily_quantity]`, String(item.daily_quantity));
    }
    if (item.brand) fd.append(`items[${index}][brand]`, item.brand);
    if (item.observation) fd.append(`items[${index}][observation]`, item.observation);
    if (item.delivery_date) fd.append(`items[${index}][delivery_date]`, item.delivery_date);
  });

  (payload.attachments ?? []).forEach((row: RequestAttachmentPayload, index: number) => {
    if (row.attachment_uuid)
      fd.append(`attachments[${index}][attachment_uuid]`, row.attachment_uuid);
    if (row.name) fd.append(`attachments[${index}][name]`, row.name);
    if (row.file) fd.append(`attachments[${index}][file]`, row.file);
  });

  return fd;
}

// UT-000743 (API-743-NEXTCODE) — preview do próximo código (modo criar). Não
// reserva número: o código definitivo é o `data.code` do 201 do POST.
async function getNextRequestPurchaseCode(): Promise<RequestPurchaseNextCode> {
  const { data } = await api.V2.get<Response<RequestPurchaseNextCode>>(
    '/request-purchases/next-code'
  );
  return data.data;
}

async function createRequestPurchase(payload: RequestPurchasePayload) {
  const fd = buildRequestPurchaseFormData(payload);
  const { data } = await api.V2.post<Response<RequestPurchaseData>>('/request-purchases', fd);
  return data;
}

// ⚠️ Mirror `updateEquipment` (mesma classe de achado real de
// `TASK-FE-FE-02`/`TASK-RP-06`): PUT nativo + multipart não é parseado de
// forma confiável pelo Laravel. Envia como POST + `_method=PUT` dentro do
// próprio FormData (method spoofing padrão do Laravel) — NUNCA
// `api.V2.put(...)` aqui. `type` é ENVIADO (o backend exige `required` mesmo
// no update — a imutabilidade é validada no servidor comparando com o valor
// persistido, não pela ausência do campo; ver comentário de
// `buildRequestPurchaseFormData`). Reconciliar contra a API real quando
// `TASK-RP-06/07/08` publicarem as rotas (ver cabeçalho do arquivo) — se o
// controller aceitar PUT multipart nativo, simplificar.
async function updateRequestPurchase(uuid: string, payload: RequestPurchasePayload) {
  const fd = buildRequestPurchaseFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<RequestPurchaseData>>(
    `/request-purchases/${uuid}`,
    fd
  );
  return data;
}

// `DELETE /request-purchases/{uuid}` CONFIRMADO no contrato de API §3 — hard
// delete atômico (`items` + `RequestPurchase` na mesma transação) + guarda de
// FK 23503→422 (DA-RP-12).
async function deleteRequestPurchase(uuid: string) {
  const { data } = await api.V2.delete(`/request-purchases/${uuid}`);
  return data;
}

// `receive()` é idempotência negativa — só assume responsabilidade se
// `responsible_id` estiver `null` no servidor (DA-RP-08); sem payload.
async function receiveRequestPurchase(uuid: string) {
  const { data } = await api.V2.post<Response<RequestPurchaseData>>(
    `/request-purchases/${uuid}/receive`
  );
  return data;
}

// Unifica o par legado `change` (tela)/`changeUpdate` (efetivação) num único
// endpoint REST (DA-RP-08) — `justify` E `responsible_uuid` obrigatórios
// (T-081-API-03, DEP-API-01). Regra especial preservada server-side: se status
// atual == 3, zera o autorizador e força status=11 (não é responsabilidade do
// client replicar essa regra).
async function transferRequestPurchase(uuid: string, payload: RequestPurchaseTransferPayload) {
  const { data } = await api.V2.post<Response<RequestPurchaseData>>(
    `/request-purchases/${uuid}/transfer`,
    payload
  );
  return data;
}

// Voltar Etapa (DA-RP-09/DA-RP-10, T-081-API-03/DEP-API-03) — `justify`
// OBRIGATÓRIO (máx. 800), como no legado; o servidor zera o responsável e só
// aceita o responsável atual.
async function changeRequestPurchaseStatus(
  uuid: string,
  payload: RequestPurchaseChangeStatusPayload
) {
  const { data } = await api.V2.post<Response<RequestPurchaseData>>(
    `/request-purchases/${uuid}/change-status`,
    payload
  );
  return data;
}

// Força status=9 (Pedido Finalizado) — sem payload; o servidor grava o
// movimento com o status de ORIGEM (DA-RP-09), não o 9 fixo.
async function finishRequestPurchase(uuid: string) {
  const { data } = await api.V2.post<Response<RequestPurchaseData>>(
    `/request-purchases/${uuid}/finish`
  );
  return data;
}

// `quotation_justification` gravado isoladamente — endpoint dedicado, fora do
// update de cabeçalho (contrato §2.1). Shape do payload NÃO está em
// `@/@types/v2/RequestPurchases` (arquivo congelado nesta execução,
// `TASK-RP-FE-01`, chokepoint declarado no task-packet daquela Tarefa;
// contrato de API §4 também não formaliza um DTO próprio para este endpoint)
// — mesmo tratamento inline de `EquipmentImportResult`/`EquipmentOptionsListEnvelope`
// em `equipment-service.ts`: shape é PREMISSA fiel ao nome de coluna físico
// (`quotation_justification`, contrato §2.1), a confirmar quando o backend
// publicar o Resource real.
export interface AddQuotationJustificationPayload {
  quotation_justification: string;
}

async function addQuotationJustification(uuid: string, payload: AddQuotationJustificationPayload) {
  const { data } = await api.V2.post<Response<RequestPurchaseData>>(
    `/request-purchases/${uuid}/quotation-justification`,
    payload
  );
  return data;
}

// `my-processes` — mesmo envelope/adapter de `listRequestPurchases`, filtro
// de negócio `responsible_id = auth()->id()` aplicado server-side (DA-RP-13)
// — o client não repassa esse filtro, só os mesmos filtros de listagem
// (search/type/status/date range/paginação).
async function listMyProcesses(
  params: ListRequestPurchasesParams
): Promise<ResponsePagination<RequestPurchaseListItem[]>> {
  const { data } = await api.V2.get<RequestPurchasesListEnvelope>(
    '/request-purchases/my-processes',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      type: params.type || undefined,
      status: params.status ?? undefined,
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
    }
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// `rejected` — mesmo envelope/adapter, filtro de negócio
// `status IN (5, 10)` aplicado server-side (DA-RP-13).
async function listRejectedRequestPurchases(
  params: ListRequestPurchasesParams
): Promise<ResponsePagination<RequestPurchaseListItem[]>> {
  const { data } = await api.V2.get<RequestPurchasesListEnvelope>('/request-purchases/rejected', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    type: params.type || undefined,
    status: params.status ?? undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// `in-quotation` (TASK-CQ-API-13/FE-13) — hub "Cotações" (`/administrativo/
// cotacoes`, item de menu `adm-sup-cot`, `request-quotation_view`), mesmo
// envelope/adapter de `listRequestPurchases`/`listRejectedRequestPurchases`,
// filtro de negócio `status IN (1, 2)` aplicado server-side. DISTINTO de
// `listRequestPurchases`/`index()`, que é user-scoped (`where('user_id')`,
// regra 17/DA-RP-13) — este endpoint é TENANT-WIDE (mirror
// `RequestPurchaseTenantScope`), por isso é um endpoint DEDICADO
// (`GET /request-purchases/in-quotation`) em vez de reaproveitar `index()`
// com um filtro de status (ver DEC-CQ-08 "REVISÃO 2", FEAT-16a01176-
// cotacoes.md). Mirror EXATO de `listRejectedRequestPurchases` — SÓ os 5
// filtros de negócio de listagem são repassados (search/type/status/date
// range), NÃO os 4 filtros de `TASK-CQ-FE-02` (farm_uuid/user_uuid/
// priority/responsible_uuid, exclusivos de `index()`).
async function listRequestPurchasesInQuotation(
  params: ListRequestPurchasesParams
): Promise<ResponsePagination<RequestPurchaseListItem[]>> {
  const { data } = await api.V2.get<RequestPurchasesListEnvelope>(
    '/request-purchases/in-quotation',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      type: params.type || undefined,
      status: params.status ?? undefined,
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
    }
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// `nif-daily` — agregação pura, sem bloqueio server-side (DA-RP-17). Shape do
// Resource NÃO é formalizado pelo contrato de API §3 (só descreve "soma
// `daily_quantity` do mês corrente e devolve o total") — mesmo tratamento
// inline acima: PREMISSA a confirmar contra o Resource real quando o backend
// publicar (`TASK-RP-FE-12`, GRUPO B).
export interface RequestPurchaseNifDailyTotal {
  /** CONFIRMADO — `RequestPurchaseController::nifDaily()` real devolve o
   *  `nif` consultado de volta no envelope, junto com o total (TASK-RP-FE-12). */
  nif: string;
  total: number;
}

async function getNifDailyTotal(nif: string) {
  const { data } = await api.V2.get<Response<RequestPurchaseNifDailyTotal>>(
    '/request-purchases/nif-daily',
    { nif }
  );
  return data;
}

// -----------------------------------------------------------------------------
// Dimensão B — Autorização (`02-roteiro-api-cotacoes.md` §8.1, TASK-CQ-API-07 —
// CONFIRMADO por leitura direta do backend real, `RequestPurchaseController::
// eligibleAuthorizers/sendForAuthorization`). Fronteira de módulo: estas duas
// rotas operam sobre `RequestPurchase`, NÃO sobre `RequestQuotation` — mesma
// observação já registrada em `listRequestPurchases` (filtros de
// `TASK-CQ-API-06`) — acrescentadas aqui, não em `request-quotation-service.ts`,
// porque a URL/Resource/permissão são todas de `RequestPurchase`
// (`03-roteiro-frontend-cotacoes.md` TASK-CQ-FE-07). Consumidas pelo Dialog
// "Enviar para Autorização" da aba Cotações (`RequestQuotationAuthorizerDialog.tsx`).
// -----------------------------------------------------------------------------

// `eligible-authorizers` (RT-14) — `ApiResponse::success` com uma Collection
// SEM paginação (`RequestAuthorizerResource::collection`, MESMO Resource já
// consumido por `listRequestAuthorizerOptions`/`RequestAuthorizerOptionItem`,
// reaproveitado aqui em vez de duplicar o shape) — motor de elegibilidade
// condicional 100% server-side (CL-043: farm/`is_conditional`/`RuleType`/
// exclusão de quem já aprovou). O front NUNCA replica essa lógica — só
// consome a lista já filtrada.
async function getEligibleAuthorizers(uuid: string) {
  const { data } = await api.V2.get<Response<RequestAuthorizerOptionItem[]>>(
    `/request-purchases/${uuid}/eligible-authorizers`
  );
  return data;
}

// `send-for-authorization` (RT-15) — payload real
// (`RequestPurchaseSendForAuthorizationRequest::rules()`, confirmado por
// leitura direta do backend): `{authorizer_uuid}`, `required|uuid|exists`.
// Promove o `status` da `RequestPurchase` para 3 (`AGUARDANDO_APROVACAO`,
// primeiro envio) ou 4 (`AGUARDANDO_CIENCIA`, já havia aprovador) — regra
// 100% server-side (CL-044). Quem chama esta função DEVE invalidar a grade de
// cotações da aba + o hub + o detalhe desta `RequestPurchase` no `onSuccess`
// (a badge de status/barra de trâmite da tela única depende do detalhe).
export interface SendForAuthorizationPayload {
  authorizer_uuid: string;
}

async function sendForAuthorization(uuid: string, payload: SendForAuthorizationPayload) {
  const { data } = await api.V2.post<Response<RequestPurchaseData>>(
    `/request-purchases/${uuid}/send-for-authorization`,
    payload
  );
  return data;
}

// -----------------------------------------------------------------------------
// Fila "Compras" (`in-purchase`, TASK-CPS-FE-01, esteira 97-Esteiras/036) —
// 3ª visão tenant-wide sobre a MESMA entidade `RequestPurchase` (mirror
// `listMyProcesses`/`listRejectedRequestPurchases`/
// `listRequestPurchasesInQuotation` acima). Fundação pura — nenhuma tela
// nesta Tarefa, consumida por `TASK-CPS-FE-02..06`.
// -----------------------------------------------------------------------------

// `in-purchase` (TASK-CP-API-01) — mesmos 9 filtros de `listRequestPurchases`
// (`RequestPurchaseFilterData` reaproveitado no backend), NÃO o subconjunto
// reduzido de `listRejectedRequestPurchases`/`listRequestPurchasesInQuotation`
// (que não repassam `farm_uuid`/`user_uuid`/`priority`/`responsible_uuid`) —
// achado de leitura direta documentado na Tarefa (Risco 3).
async function listInPurchase(
  params: ListRequestPurchasesParams
): Promise<ResponsePagination<RequestPurchaseListItem[]>> {
  const { data } = await api.V2.get<RequestPurchasesListEnvelope>(
    '/request-purchases/in-purchase',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      type: params.type || undefined,
      status: params.status ?? undefined,
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
      farm_uuid: params.farm_uuid || undefined,
      user_uuid: params.user_uuid || undefined,
      priority: params.priority ?? undefined,
      responsible_uuid: params.responsible_uuid || undefined,
    }
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// `inform-status` (TASK-CP-API-02) — PUT nativo (JSON puro, sem multipart/
// method-spoofing — diferente de `updateRequestPurchase`; este endpoint não
// lida com arquivos).
async function informRequestPurchaseStatus(
  uuid: string,
  payload: InformRequestPurchaseStatusPayload
) {
  const { data } = await api.V2.put<Response<RequestPurchaseData>>(
    `/request-purchases/${uuid}/inform-status`,
    payload
  );
  return data;
}

// `separated-preview` (TASK-CP-API-03) — GET, sem paginação (Collection crua).
async function getSeparatedPreview(uuid: string) {
  const { data } = await api.V2.get<Response<SeparatedPreviewData>>(
    `/request-purchases/${uuid}/separated-preview`
  );
  return data;
}

// `separate` (TASK-CP-API-03) — POST, retorna a NOVA `RequestPurchase`
// criada (bifurcação). Quem chama invalida a queryKey da fila Compras no
// `onSuccess`.
async function separateRequestPurchase(uuid: string, payload: SeparateRequestPurchasePayload) {
  const { data } = await api.V2.post<Response<RequestPurchaseData>>(
    `/request-purchases/${uuid}/separate`,
    payload
  );
  return data;
}

// `whatsapp-link` (TASK-CP-API-04) — sem payload; devolve a URL wa.me pronta.
async function getWhatsappLink(uuid: string) {
  const { data } = await api.V2.post<Response<WhatsappLinkResult>>(
    `/request-purchases/${uuid}/whatsapp-link`
  );
  return data;
}

// `send-order-email` (TASK-CP-API-04) — sem payload; responde 202
// (enfileirado, `ShouldQueue`) — NÃO tratar como "enviado" na UI (a tela deve
// mostrar feedback de "e-mail enfileirado").
async function sendOrderEmail(uuid: string) {
  const { data } = await api.V2.post<Response<null>>(`/request-purchases/${uuid}/send-order-email`);
  return data;
}

// `order-pdf` (TASK-CP-API-04) — GET; devolve metadados, o binário é servido
// pelo canal PÚBLICO em `result.data.url` (sem auth, Gap-CP-04) — o CHAMADOR
// abre com `window.open(url, '_blank')`, NUNCA re-chama via api axios
// autenticado.
async function getOrderPdf(uuid: string) {
  const { data } = await api.V2.get<Response<OrderPdfResult>>(
    `/request-purchases/${uuid}/order-pdf`
  );
  return data;
}

// `transfer-options` (T-081-API-03, DEP-API-01) — candidatos a novo responsável
// (`data[{uuid, name}]`, usuários ativos da fazenda ativa). Sem paginação.
async function listTransferOptions(uuid: string): Promise<TransferOption[]> {
  const { data } = await api.V2.get<Response<TransferOption[]>>(
    `/request-purchases/${uuid}/transfer-options`
  );
  return data.data ?? [];
}

// `authorizer-options` (T-081-API-03, DEP-API-04) — Encarregados permitidos ao
// solicitante. `requires_authorizer` (meta) diz se o campo é obrigatório.
async function listAuthorizerOptions(): Promise<{
  options: RequestPurchaseAuthorizerOption[];
  requiresAuthorizer: boolean;
}> {
  const { data } = await api.V2.get<RequestPurchaseAuthorizerOptionsEnvelope>(
    '/request-purchases/authorizer-options'
  );
  return {
    options: data.data ?? [],
    requiresAuthorizer: data.meta?.requires_authorizer ?? false,
  };
}

// `quotation-map` (T-081-API-07, DEP-API-07) — Mapa de Cotações em xlsx.
// `responseType: 'blob'` obrigatório (sem isso o axios corrompe o binário); o
// chamador dispara o download com `downloadBlob`. Rota no SINGULAR.
async function downloadQuotationsMap(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/request-purchases/${uuid}/quotation-map`, undefined, {
    responseType: 'blob',
  });
  return data;
}

export {
  addQuotationJustification,
  buildRequestPurchaseFormData,
  changeRequestPurchaseStatus,
  createRequestPurchase,
  deleteRequestPurchase,
  downloadQuotationsMap,
  finishRequestPurchase,
  getEligibleAuthorizers,
  getNextRequestPurchaseCode,
  getNifDailyTotal,
  getOrderPdf,
  getRequestPurchase,
  getSeparatedPreview,
  getWhatsappLink,
  informRequestPurchaseStatus,
  listAuthorizerOptions,
  listInPurchase,
  listMyProcesses,
  listRejectedRequestPurchases,
  listRequestPurchases,
  listRequestPurchasesInQuotation,
  listTransferOptions,
  receiveRequestPurchase,
  sendForAuthorization,
  sendOrderEmail,
  separateRequestPurchase,
  transferRequestPurchase,
  updateRequestPurchase,
};
