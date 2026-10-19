// src/services/v2/MovementPurchases/movement-purchase-service.ts
// -----------------------------------------------------------------------------
// MovementPurchase Service — API v1 do backend Laravel GB.Cerne
// (`/movement-purchases*`, contrato-api-compras-movimento.md §4, TASK-CP-04).
// Fundação desta Tarefa: `listMovementPurchases`/`getMovementPurchaseByUuid`/
// `deleteMovementPurchase`/`createMovementPurchase`/`updateMovementPurchase`.
// Demais endpoints especiais (report/sisbov-report/import-xml/documents) são
// consumidos pelas Tarefas 08/09 — declarados só quando essas Tarefas os
// materializarem (fiel ao escopo desta fundação, contrato §8).
//
// Envelope paginado (`ApiResponse::paginated`) — mesma adaptação de
// `listMovementSales`: a API devolve `{ data: [array plano], meta: {
// current_page, last_page, per_page, total } }`, o `useCustomGridQuery`
// espera `ResponsePagination<T>` (`data.items`/`data.pagination`). Adaptação
// feita aqui, nunca no componente.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  MovementPurchaseDetail,
  MovementPurchaseDocumentRow,
  MovementPurchaseFilterRequest,
  MovementPurchaseListItem,
  MovementPurchasePayload,
} from '@/@types/v2/MovementPurchases';

export interface ListMovementPurchasesParams
  extends PaginationQueryParams, MovementPurchaseFilterRequest {}

interface MovementPurchasesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface MovementPurchasesListEnvelope {
  success: boolean;
  message: string;
  data: MovementPurchaseListItem[];
  errors: Record<string, string[]> | null;
  meta: MovementPurchasesApiPaginationMeta | null;
}

// `GET /movement-purchases` — 4 filtros REAIS (`search`/`provider_uuid`/
// `start_date`/`end_date`, ver docblock de `@/@types/v2/MovementPurchases`,
// achado #4), diferente do achado de Vendas (`GAP-VD-02`, filtros mortos).
async function listMovementPurchases(
  params: ListMovementPurchasesParams
): Promise<ResponsePagination<MovementPurchaseListItem[]>> {
  const { data } = await api.V2.get<MovementPurchasesListEnvelope>('/movement-purchases', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    provider_uuid: params.provider_uuid || undefined,
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

async function getMovementPurchaseByUuid(uuid: string): Promise<Response<MovementPurchaseDetail>> {
  const { data } = await api.V2.get<Response<MovementPurchaseDetail>>(
    `/movement-purchases/${uuid}`
  );
  return data;
}

// `DELETE /movement-purchases/{uuid}` — cascata via FK `ON DELETE CASCADE`
// nativa do banco (`DestroyMovementPurchaseAction`, contrato-api §6, SRF-11).
// Sem envelope de corpo relevante (204).
async function deleteMovementPurchase(uuid: string): Promise<void> {
  await api.V2.delete(`/movement-purchases/${uuid}`);
}

// -----------------------------------------------------------------------------
// Consumidos pelas Tarefas 06/07 (formulário criar/editar) — declarados aqui
// por instrução da fundação (contrato §3/§10). `PUT` recebe o MESMO shape de
// `POST` (`MovementPurchaseRequest` unificado,
// `MovementPurchaseController::update()`).
// -----------------------------------------------------------------------------

async function createMovementPurchase(
  payload: MovementPurchasePayload
): Promise<Response<MovementPurchaseDetail>> {
  const { data } = await api.V2.post<Response<MovementPurchaseDetail>>(
    '/movement-purchases',
    payload
  );
  return data;
}

async function updateMovementPurchase(
  uuid: string,
  payload: MovementPurchasePayload
): Promise<Response<MovementPurchaseDetail>> {
  const { data } = await api.V2.put<Response<MovementPurchaseDetail>>(
    `/movement-purchases/${uuid}`,
    payload
  );
  return data;
}

// -----------------------------------------------------------------------------
// Relatórios PDF (TASK-CP-05, DoD "download de relatório/SISBOV via blob") —
// 2 GETs síncronos, gate `mov_purchase_view`, FORA do envelope `ApiResponse`
// (`Content-Type: application/pdf`). Mesmo padrão de
// `downloadMovementSaleReport` (blob puro, `responseType: 'blob'`) — nunca
// `window.open`/`<a href>` direto (exige cookie Sanctum + `X-Farm-Id` do
// interceptor).
//
// Diferente de Vendas, o SISBOV de Compras é um ÚNICO endpoint
// (`sisbov-report`, sem variantes `/rearing`/`/slaughter` — confirmado contra
// `routes/api.php`/`MovementPurchaseController::sisbovReport()`). 404 é
// comportamento ESPERADO (compra válida sem animal SISBOV,
// `findWithSisbovItems()`-equivalente do servidor) — o caller trata com
// mensagem própria (`reports.sisbovNotFound`), nunca o toast genérico.
// -----------------------------------------------------------------------------

async function downloadMovementPurchaseReport(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/movement-purchases/${uuid}/report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

async function downloadMovementPurchaseSisbovReport(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/movement-purchases/${uuid}/sisbov-report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// -----------------------------------------------------------------------------
// Importação de XML de NFe (TASK-CP-08, contrato §4.5) — `POST
// /movement-purchases/import-xml`, mesmo padrão de `importMovementSaleXml`
// (upload multipart, devolve draft PURO, nada persistido — API stateless).
//
// Achado confirmado contra `ImportMovementPurchaseXmlAction`/
// `MovementPurchaseXmlDraftData`/`MovementPurchaseXmlDraftResource` reais
// (`GB.Cerne.Api`, `CORRIGE CLM-14`) — DIVERGE da premissa do contrato de
// frontend §4.5 ("provavelmente inclui os 15 campos fiscais por item"): os
// itens do draft SÃO `{category_uuid, description, quantity, value_unit,
// amount}` — `category_uuid` SEMPRE `null` (o legado nunca casava categoria
// de animal para Compras, diferente de Vendas), SEM NENHUM dos 15 campos
// fiscais (`cst_*`/`perc_*`/etc. não existem no draft real). Não há sub-bloco
// "Dados Fiscais (NFe)" para abrir automaticamente — decisão de escopo já
// tomada em `TASK-CP-06`/`CreateOrUpdateMovementPurchase.tsx` (o DTO de
// escrita real não aceita esses campos). O usuário SEMPRE seleciona a
// categoria manualmente após aplicar o draft (mirror do racional já usado
// para `category_uuid=null` em `movementPurchaseItemDetailToForm`).
// -----------------------------------------------------------------------------

export interface MovementPurchaseXmlDraftItem {
  category_uuid: string | null;
  description: string;
  quantity: number;
  value_unit: number;
  amount: number;
  /** 088 D4 (§2.5 API) — `qCom` original do XML (antes do truncamento `(int)`). */
  quantity_xml?: number;
}

export interface MovementPurchaseXmlDraftInstallment {
  /** 088 D4 — `nDup` (informativo; paridade: número do título = nNF). */
  number?: string;
  due_date: string;
  amount: number;
}

export interface MovementPurchaseXmlDraftProvider {
  uuid: string | null;
  matched: boolean;
  nif: string;
  name: string;
  /** 088 D4 (§2.5 API) — após D4-T2 `uuid` nunca é `null` e `matched` é sempre `true`. */
  type?: number;
  is_enabled?: boolean;
  created?: boolean;
}

/** 088 D4 — avisos não bloqueantes do import (`code` estável; fallback = `message`). */
export interface MovementPurchaseXmlDraftWarning {
  code: string;
  message: string;
}

export interface MovementPurchaseXmlTotals {
  vProd: number;
  vFrete: number;
  vDesc: number;
  vSeg: number;
  vIPI: number;
  vOutro: number;
  vNF: number;
}

/** 088 D4 — defaults do cabeçalho financeiro vindos do XML (§4.5 plano FE). */
export interface MovementPurchaseXmlFinancialDefaults {
  number: string;
  type_title: { uuid: string; description: string | null } | null;
  proprietary: { uuid: string; name: string | null } | null;
  note: string;
  fiscal_document: boolean;
  classification: 'N' | 'C' | 'O';
  has_input: boolean;
}

export interface MovementPurchaseXmlDraft {
  number: string;
  serie: string;
  dt_sale: string;
  chave: string;
  note: string;
  provider: MovementPurchaseXmlDraftProvider;
  total_products: number;
  freight: number;
  discount: number;
  total: number;
  items: MovementPurchaseXmlDraftItem[];
  installments: MovementPurchaseXmlDraftInstallment[];
  /** 088 D4 (§2.5 API) — financeiro do XML (duplicatas reais, defaults do título, avisos). */
  interval_days?: number;
  financial_defaults?: MovementPurchaseXmlFinancialDefaults;
  warnings?: MovementPurchaseXmlDraftWarning[];
  xml_totals?: MovementPurchaseXmlTotals;
}

async function importMovementPurchaseXml(file: File): Promise<Response<MovementPurchaseXmlDraft>> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.V2.post<Response<MovementPurchaseXmlDraft>>(
    '/movement-purchases/import-xml',
    formData
  );
  return data;
}

// -----------------------------------------------------------------------------
// Documentos (TASK-CP-08, contrato §4/§7, `CORRIGE CLM-20`) — `POST
// /movement-purchases/{uuid}/documents`, `multipart/form-data`, gate
// `mov_purchase_edit`. Diff COMPLETO — mirror `storeMovementSaleDocuments`
// na SEMÂNTICA (lista atual completa sempre enviada, servidor apaga o que
// não aparecer), mas o WIRE FORMAT DIVERGE de Vendas — confirmado contra
// `MovementPurchaseDocumentRequest::rules()`/`StoreMovementPurchaseDocumentsAction`
// reais: arrays PARALELOS `description[]`/`anexo[]`/`date[]`/`old_document[]`
// correlacionados por ÍNDICE (mirror do `Admin\MovementPurchaseDocumentController`
// legado), NÃO o shape aninhado `documents[i][chave]` de
// `MovementSaleDocumentRequest`. Cada índice usa o MESMO `$i` nos 4 arrays —
// `anexo[$i]` só é anexado quando há arquivo NOVO para aquela linha (a Action
// real preserva o `anexo` já persistido via `isset($anexos[$index])` quando
// ausente); linhas novas (sem `old_document_uuid`) sempre exigem `file`
// (validado no cliente, ver `MovementPurchaseDocumentsModal.tsx`).
// -----------------------------------------------------------------------------

function buildMovementPurchaseDocumentsFormData(
  documents: MovementPurchaseDocumentRow[]
): FormData {
  const fd = new FormData();

  documents.forEach((row, index) => {
    fd.append(`description[${index}]`, row.description);
    if (row.date) fd.append(`date[${index}]`, row.date);
    if (row.old_document_uuid) fd.append(`old_document[${index}]`, row.old_document_uuid);
    if (row.file) fd.append(`anexo[${index}]`, row.file);
  });

  return fd;
}

async function storeMovementPurchaseDocuments(
  uuid: string,
  documents: MovementPurchaseDocumentRow[]
): Promise<Response<MovementPurchaseDetail>> {
  const fd = buildMovementPurchaseDocumentsFormData(documents);
  const { data } = await api.V2.post<Response<MovementPurchaseDetail>>(
    `/movement-purchases/${uuid}/documents`,
    fd
  );
  return data;
}

export {
  buildMovementPurchaseDocumentsFormData,
  createMovementPurchase,
  deleteMovementPurchase,
  downloadMovementPurchaseReport,
  downloadMovementPurchaseSisbovReport,
  getMovementPurchaseByUuid,
  importMovementPurchaseXml,
  listMovementPurchases,
  storeMovementPurchaseDocuments,
  updateMovementPurchase,
};
