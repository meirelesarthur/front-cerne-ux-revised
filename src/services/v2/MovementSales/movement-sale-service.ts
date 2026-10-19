// src/services/v2/MovementSales/movement-sale-service.ts
// -----------------------------------------------------------------------------
// MovementSale Service — API v1 do backend Laravel GB.Cerne (`/movement-sales*`,
// api-contract-vendas.md §1, TASK-VD-FE-01). Fundação desta Tarefa:
// `listMovementSales`/`getMovementSaleByUuid`/`deleteMovementSale`/
// `listMovementSaleAnimalsByBatch`. `createMovementSale`/`updateMovementSale`
// são consumidos pela Tarefa 15 (formulário) — declarados aqui por instrução
// da fundação (contrato §10), sem tela que os chame ainda nesta entrega.
//
// Envelope paginado (`ApiResponse::paginated`) — mesma adaptação de
// `listTransfers`/`listProviders`: a API devolve `{ data: [array plano],
// meta: { current_page, last_page, per_page, total } }`, o
// `useCustomGridQuery` espera `ResponsePagination<T>` (`data.items`/
// `data.pagination`). Adaptação feita aqui, nunca no componente.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  MovementSaleDetail,
  MovementSaleDocumentRow,
  MovementSaleFilterRequest,
  MovementSaleListItem,
  MovementSaleNfeHandoffPayload,
  MovementSalePayload,
  MovementSaleSlaughterManyPayload,
  MovementSaleSlaughterPayload,
  MovementSaleWeighingParseRow,
} from '@/@types/v2/MovementSales';

export interface ListMovementSalesParams extends PaginationQueryParams, MovementSaleFilterRequest {}

interface MovementSalesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface MovementSalesListEnvelope {
  success: boolean;
  message: string;
  data: MovementSaleListItem[];
  errors: Record<string, string[]> | null;
  meta: MovementSalesApiPaginationMeta | null;
}

async function listMovementSales(
  params: ListMovementSalesParams
): Promise<ResponsePagination<MovementSaleListItem[]>> {
  const { data } = await api.V2.get<MovementSalesListEnvelope>('/movement-sales', {
    page: params.page,
    per_page: params.per_page,
    // `type_sale` é o ÚNICO filtro efetivamente aplicado pelo servidor
    // (`MovementSaleRepository::listWithFilters()`). `search`/`client_id`/
    // `start_date`/`end_date` são aceitos pelo DTO por compatibilidade de
    // payload mas DELIBERADAMENTE ignorados (GAP-VD-02, preservação fiel do
    // legado, decisão do dono já tomada) — enviados mesmo assim (paridade de
    // payload com o legado), sem efeito no resultado.
    type_sale: params.type_sale ?? undefined,
    search: params.search || undefined,
    client_id: params.client_id || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
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

async function getMovementSaleByUuid(uuid: string): Promise<Response<MovementSaleDetail>> {
  const { data } = await api.V2.get<Response<MovementSaleDetail>>(`/movement-sales/${uuid}`);
  return data;
}

// `DELETE /movement-sales/{uuid}` — reverte animais para `ACTIVE` e apaga
// financeiro/documentos/itens em cascata (`DestroyMovementSaleAction`,
// api-contract-vendas.md §5). Sem envelope de corpo relevante (204).
async function deleteMovementSale(uuid: string): Promise<void> {
  await api.V2.delete(`/movement-sales/${uuid}`);
}

// -----------------------------------------------------------------------------
// Importação de Pesagem (VD-FE-01, contrato §3.2 FALTA-A, SURF-PNL-001/
// EP-017/EP-018) — painel do formulário de venda: baixa um modelo XLSX com
// os animais JÁ selecionados nos itens e faz o parse da planilha preenchida
// para hidratar `weight_kg` client-side, SEM PERSISTIR (`SE-013`,
// `TASK-VDA-40` confirmada implementada em `MovementSaleController@
// weighingTemplate/weighingParse`, GB.Cerne.Api).
// -----------------------------------------------------------------------------

// `GET /movement-sales/weighing-template?animal_uuids[]=...` — `animal_uuids`
// OBRIGATÓRIO e tenant-scoped no SERVIDOR
// (`Rule::exists('animals','uuid')->where('farm_id', ...)`, `LK-018`); o
// cliente só repassa os `animal_uuid` já presentes nos itens do form. Mesmo
// padrão de array-param de `listMovementSalesPendingSlaughterMany`
// (`sale_uuids[]`) — o axios serializa `animal_uuids: string[]` como
// `animal_uuids[]=a&animal_uuids[]=b`. Blob síncrono (arquivo pequeno,
// escopo por fazenda).
async function downloadMovementSaleWeighingTemplate(animalUuids: string[]): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/movement-sales/weighing-template',
    { animal_uuids: animalUuids },
    { responseType: 'blob' }
  );
  return data;
}

// `POST /movement-sales/weighing-parse` — multipart `file`, parse-only
// (`CV-022`: normalização de peso é 100% do servidor, o front NUNCA
// re-parseia número). Resposta `{animal_uuid, weight_kg}[]`
// (`MovementSaleWeighingParseResource` real) — linhas sem casamento
// (identificação inexistente/inativa/de outra fazenda, peso ≤ 0) são
// OMITIDAS pelo servidor; o caller (`MovementSaleWeighingImportPanel`)
// calcula os animais do form que NÃO vieram na resposta.
async function parseMovementSaleWeighingSpreadsheet(
  file: File
): Promise<Response<MovementSaleWeighingParseRow[]>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<MovementSaleWeighingParseRow[]>>(
    '/movement-sales/weighing-parse',
    fd
  );
  return data;
}

// -----------------------------------------------------------------------------
// Consumidos pela Tarefa 15 (formulário criar/editar) — declarados aqui por
// instrução da fundação (contrato §10). `PUT` recebe o MESMO shape de `POST`
// (`MovementSaleRequest` unificado, `MovementSaleController::update()`).
// -----------------------------------------------------------------------------

async function createMovementSale(
  payload: MovementSalePayload
): Promise<Response<MovementSaleDetail>> {
  const { data } = await api.V2.post<Response<MovementSaleDetail>>('/movement-sales', payload);
  return data;
}

async function updateMovementSale(
  uuid: string,
  payload: MovementSalePayload
): Promise<Response<MovementSaleDetail>> {
  const { data } = await api.V2.put<Response<MovementSaleDetail>>(
    `/movement-sales/${uuid}`,
    payload
  );
  return data;
}

// -----------------------------------------------------------------------------
// `GET /movement-sales/animal-by-batch?batch_uuid=` — endpoint ÚNICO de
// animais-por-lote desta feature (contrato de tela §7.4, unificação IG1+IG2
// sobre `L8`). Consumido pela Tarefa 15 (cards de item do form).
//
// ⚠️ Achado de fidelidade (Tarefa 15, confirmado contra
// `GetAnimalsByBatchAction::handle()` real, `GB.Cerne.Api`) — a resposta é
// SÓ `{uuid, identification, category}` (`category` é a DESCRIÇÃO da
// categoria, texto — NUNCA `category_uuid`), sem `previous_weight_kg`/data
// de entrada embutidos como o contrato de tela §7.2/§7.4 assumia ("sem
// request extra"). `MovementSaleItemRow.tsx` faz 1 chamada adicional
// (`getAnimalByUuid`, `animal-service.ts`, já existente, gate
// `animals_view`) ao SELECIONAR um animal, para resolver `category.uuid`
// (exigido no payload, `MovementSaleItemPayload.category_uuid`) + `weight`/
// `entry_date` (cálculo de `gain`/`gmd`). Ajuste de tipo, não Gap (contrato
// §4, "confirmar contra o código real antes de fixar os tipos").
//
// Sem paginação real (Action devolve array cru) — `[key: string]: unknown`
// mantido por tolerância, mas as 3 chaves reais são as tipadas abaixo.
// -----------------------------------------------------------------------------

export interface MovementSaleAnimalByBatchItem {
  uuid: string;
  identification: string | null;
  /** Descrição da categoria (texto), NUNCA uuid — ver nota acima. */
  category: string | null;
  [key: string]: unknown;
}

async function listMovementSaleAnimalsByBatch(params: {
  batch_uuid: string;
}): Promise<Response<MovementSaleAnimalByBatchItem[]>> {
  const { data } = await api.V2.get<Response<MovementSaleAnimalByBatchItem[]>>(
    '/movement-sales/animal-by-batch',
    { batch_uuid: params.batch_uuid }
  );
  return data;
}

// -----------------------------------------------------------------------------
// `POST /movement-sales/import-xml` (contrato de tela §7.7, TASK-VD-FE-02) —
// upload multipart, devolve `MovementSaleXmlDraftResource` (draft PURO, nada
// persistido — API stateless, sem `session()`). Confirmado contra
// `ImportMovementSaleXmlAction`/`MovementSaleXmlDraftData` reais: o draft NÃO
// inclui `items[]` (o XML de NFe não identifica animais individuais — o
// usuário sempre adiciona os cards manualmente após a importação, mesmo
// comportamento honesto do legado). `series` (não `serie`) é o nome real do
// campo no Resource.
// -----------------------------------------------------------------------------

export interface MovementSaleXmlDraftCategory {
  category_uuid: string | null;
  description: string;
  quantity: number;
  value_total: number;
  value_head: number;
}

export interface MovementSaleXmlDraftInstallment {
  due_date: string;
  amount: number;
}

export interface MovementSaleXmlDraft {
  number: string;
  series: string;
  dt_sale: string;
  chave: string;
  note: string;
  client: {
    uuid: string | null;
    matched: boolean;
    nif: string;
    name: string;
  };
  total_products: number;
  freight: number;
  discount: number;
  total: number;
  categories: MovementSaleXmlDraftCategory[];
  installments: MovementSaleXmlDraftInstallment[];
}

async function importMovementSaleXml(file: File): Promise<Response<MovementSaleXmlDraft>> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.V2.post<Response<MovementSaleXmlDraft>>(
    '/movement-sales/import-xml',
    formData
  );
  return data;
}

// -----------------------------------------------------------------------------
// Finalização de abate (TASK-VD-FE-03, contrato §8) — `GET/PUT
// .../{uuid}/slaughter` (individual) e `GET/PUT .../slaughter-many` (lote).
// Confirmado contra `MovementSaleController::slaughter/updateSlaughter/
// slaughterMany/updateSlaughterMany` reais (`GB.Cerne.Api`, branch
// `feature/vendas-nascimentos-for-api`).
//
// ⚠️ Achado de fidelidade (diverge da leitura do contrato de tela §8.2 —
// "busca cada venda por uuid via `Promise.allSettled`, mirror
// `RomaneioDetalhe.tsx:180-240`"): `GET /movement-sales/slaughter-many`
// já devolve TODAS as vendas pendentes do lote (`sale_uuids[]`) numa ÚNICA
// chamada (`ListPendingSlaughterManyAction`, `MovementSaleResource::
// collection`) — não há 1 endpoint por uuid a paralelizar. Usar a chamada
// única real é estritamente melhor (menos requests, mesmo resultado
// visível), não uma decisão de arquitetura em aberto — "confirmar contra o
// código real" (contrato §4), não Gap.
// -----------------------------------------------------------------------------

// `GET /movement-sales/{uuid}/slaughter` — venda `status=Pendente` pronta
// para finalização (`GetPendingSlaughterAction::handle()`, 404 se já
// finalizada/inexistente/de outra farm). Mesmo shape de leitura do detalhe
// (`MovementSaleResource`).
async function getMovementSalePendingSlaughter(
  uuid: string
): Promise<Response<MovementSaleDetail>> {
  const { data } = await api.V2.get<Response<MovementSaleDetail>>(
    `/movement-sales/${uuid}/slaughter`
  );
  return data;
}

// `PUT /movement-sales/{uuid}/slaughter` — finalização INDIVIDUAL
// (`FinalizeSlaughterAction`, fator 15, `GAP-VD-04`).
async function finalizeMovementSaleSlaughter(
  uuid: string,
  payload: MovementSaleSlaughterPayload
): Promise<Response<MovementSaleDetail>> {
  const { data } = await api.V2.put<Response<MovementSaleDetail>>(
    `/movement-sales/${uuid}/slaughter`,
    payload
  );
  return data;
}

// `GET /movement-sales/slaughter-many?sale_uuids[]=...` — vendas
// `status=Pendente` do lote informado (`ListPendingSlaughterManyAction`,
// 404 `ResourceNotFoundException` se NENHUMA casar). `sale_uuids: string[]`
// repassado direto como param — mesmo padrão de `category_uuids: string[]`
// em `listBatchCandidateAnimals` (`batch-service.ts`), o axios serializa
// como `sale_uuids[]=a&sale_uuids[]=b`.
async function listMovementSalesPendingSlaughterMany(
  saleUuids: string[]
): Promise<Response<MovementSaleDetail[]>> {
  const { data } = await api.V2.get<Response<MovementSaleDetail[]>>(
    '/movement-sales/slaughter-many',
    { sale_uuids: saleUuids }
  );
  return data;
}

// `PUT /movement-sales/slaughter-many` — finalização EM LOTE
// (`FinalizeSlaughterManyAction`, distribuição proporcional com correção de
// resíduo centavo a centavo, `CV6` — feita PELO SERVIDOR, nunca reimplementada
// aqui).
async function finalizeMovementSalesSlaughterMany(
  payload: MovementSaleSlaughterManyPayload
): Promise<Response<MovementSaleDetail[]>> {
  const { data } = await api.V2.put<Response<MovementSaleDetail[]>>(
    '/movement-sales/slaughter-many',
    payload
  );
  return data;
}

// -----------------------------------------------------------------------------
// Relatórios PDF (Tarefa 17.a, task-packet §3/matriz FID-G3F #4-#6) — 3 GETs
// síncronos, todos gate `movement_sales_view`, todos FORA do envelope
// `ApiResponse` (`Content-Type: application/pdf`, `Content-Disposition:
// inline`). Mesmo padrão de `nfe-service.ts::downloadNfeDanfe` (blob puro,
// `responseType: 'blob'`) — nunca `window.open`/`<a href>` direto (exige
// cookie Sanctum + `X-Farm-Id` do interceptor).
//
// O servidor manda nome FIXO em todos os 3 (`relatorio-movimento-venda.pdf`
// no `report`; e o MESMO `comunicado-saida.pdf` nos DOIS SISBOV) — o
// `filename` passado a `downloadBlob` no caller sempre vence, por isso a
// nomeação por `code` acontece na camada de UI (achado E do task-packet),
// sem qualquer mudança de servidor.
//
// 404 nos 2 endpoints SISBOV é comportamento ESPERADO (não erro genérico):
// `findWithSisbovItems()` usa `firstOrFail()` sobre itens com brinco SISBOV —
// venda válida sem animal SISBOV devolve 404 (mesmo comportamento do
// legado). O caller (handler em `index.tsx`) trata esse 404 com mensagem
// própria (`reports.sisbovNotFound`), nunca com o toast genérico.
// -----------------------------------------------------------------------------

async function downloadMovementSaleReport(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/movement-sales/${uuid}/report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

async function downloadMovementSaleSisbovRearingReport(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `/movement-sales/${uuid}/sisbov-report/rearing`,
    undefined,
    { responseType: 'blob' }
  );
  return data;
}

async function downloadMovementSaleSisbovSlaughterReport(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `/movement-sales/${uuid}/sisbov-report/slaughter`,
    undefined,
    { responseType: 'blob' }
  );
  return data;
}

// -----------------------------------------------------------------------------
// Documentos (Tarefa 17.b, task-packet §3/§6, matriz FID-G3F #1) —
// `POST /movement-sales/{uuid}/documents`, `multipart/form-data`, gate
// `movement_sales_view` (achado C, mirror consciente do legado — ver
// `MovementSaleDocumentRequest::authorize()`). Diff COMPLETO: o array
// enviado SUBSTITUI o estado do servidor por inteiro (o caller sempre monta
// a lista atual completa, nunca um delta).
//
// `documents[i][old_document_uuid]` só é anexado quando presente (linha já
// persistida) — mirror `buildDocumentManagementFormData`, notação de índice
// `campo[i][chave]` padrão Laravel para arrays de objetos em multipart.
//
// Achado B do task-packet (§3.1, verificação §1.5): NÃO existe forma de o
// cliente enviar `documents` "presente e vazio" via multipart real quando
// `documents.length === 0` — nenhuma linha é anexada, a chave `documents`
// nunca aparece no corpo, e `MovementSaleDocumentRequest::rules()` exige
// `documents => ['present','array']`. O caller (`MovementSaleDocumentsModal.
// tsx`) bloqueia o Salvar com 0 linhas por essa razão (ver docblock de
// topo do componente e o Histórico da Tarefa 17 para a verificação completa).
// -----------------------------------------------------------------------------

function buildMovementSaleDocumentsFormData(documents: MovementSaleDocumentRow[]): FormData {
  const fd = new FormData();

  documents.forEach((row, index) => {
    if (row.old_document_uuid) {
      fd.append(`documents[${index}][old_document_uuid]`, row.old_document_uuid);
    }
    fd.append(`documents[${index}][description]`, row.description);
    if (row.date) fd.append(`documents[${index}][date]`, row.date);
    if (row.file) fd.append(`documents[${index}][file]`, row.file);
  });

  return fd;
}

async function storeMovementSaleDocuments(
  uuid: string,
  documents: MovementSaleDocumentRow[]
): Promise<Response<MovementSaleDetail>> {
  const fd = buildMovementSaleDocumentsFormData(documents);
  const { data } = await api.V2.post<Response<MovementSaleDetail>>(
    `/movement-sales/${uuid}/documents`,
    fd
  );
  return data;
}

// -----------------------------------------------------------------------------
// Emitir NFe — HANDOFF (Tarefa 17.c, task-packet §3/matriz FID-G3F #3) —
// `POST /movement-sales/{uuid}/nfe-issue`, SEM CORPO (gate
// `movement_sales_edit`), 200 síncrono. NÃO emite NFe nem grava
// `movement_sales.nfe_id` (DEC-022) — devolve só o payload de handoff (mirror
// `session('nfe')` do legado, ver docblock de `MovementSaleNfeHandoffPayload`
// em `@/@types/v2/MovementSales`). Mesmo padrão de `consultNfe`
// (`nfe-service.ts`) — POST sem 2º argumento de corpo.
// -----------------------------------------------------------------------------

async function issueMovementSaleNfe(
  uuid: string
): Promise<Response<MovementSaleNfeHandoffPayload>> {
  const { data } = await api.V2.post<Response<MovementSaleNfeHandoffPayload>>(
    `/movement-sales/${uuid}/nfe-issue`
  );
  return data;
}

// -----------------------------------------------------------------------------
// Options de forma de pagamento (`type_payment`) — VD-FE-03, PARADA-FE-1
// aceita (TASK-41 backend ✅, `MovementSaleController::paymentTypeOptions()`
// mirror `AccountController::options()`/`BankController::options()`).
// `GET /movement-sales/payment-types/options` — FORA do gate de CRUD, reusa
// `App\Enums\Nfe\NfeTypePaymentEnum` do backend (mesmos 15 códigos fiscais
// de `LK-008`); payload plano `{value,label}[]` já compatível com
// `Option<string>[]`, nenhuma adaptação de shape necessária. ADITIVA — o
// catálogo local `movementSaleTypePaymentOptions`
// (`@/constants/GestaoAnimal/MovementSale/options`) permanece intocado como
// FALLBACK quando a query falhar (`useMovementSalePaymentTypeOptions`,
// `useMovementSales.tsx`), nunca select vazio.
// -----------------------------------------------------------------------------
async function listMovementSalePaymentTypeOptions(): Promise<Response<Option<string>[]>> {
  const { data } = await api.V2.get<Response<Option<string>[]>>(
    '/movement-sales/payment-types/options'
  );
  return data;
}

export {
  buildMovementSaleDocumentsFormData,
  createMovementSale,
  deleteMovementSale,
  downloadMovementSaleReport,
  downloadMovementSaleSisbovRearingReport,
  downloadMovementSaleSisbovSlaughterReport,
  downloadMovementSaleWeighingTemplate,
  finalizeMovementSaleSlaughter,
  finalizeMovementSalesSlaughterMany,
  getMovementSaleByUuid,
  getMovementSalePendingSlaughter,
  importMovementSaleXml,
  issueMovementSaleNfe,
  listMovementSales,
  listMovementSaleAnimalsByBatch,
  listMovementSalePaymentTypeOptions,
  listMovementSalesPendingSlaughterMany,
  parseMovementSaleWeighingSpreadsheet,
  storeMovementSaleDocuments,
  updateMovementSale,
};
