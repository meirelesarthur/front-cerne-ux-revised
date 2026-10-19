// src/services/v2/Rastreabilidade/traceability-service.ts
// -----------------------------------------------------------------------------
// Traceability Service — API v1 do backend Laravel GB.Cerne (`/traceabilities*`,
// "Produtos" da tela de Rastreabilidade, F-067). TASK-TR-FE-03 (service layer)
// — mirror estrutural `charge-service.ts` (adapta `ApiResponse::paginated`
// para `ResponsePagination`, mesma armadilha de envelope).
//
// Fonte de verdade: leitura DIRETA do backend REAL já implementado e
// TESTADO (`GB.Cerne.Api`, branch `feature/refactor-monitoring-and-products-
// for-api`) — `TraceabilityController`, `TraceabilityRequest`,
// `TraceabilityIndexRequest`, `TraceabilityGaleryRequest`, `routes/api.php`
// — não é resumo do contrato de destino nem transcrição cega da ficha.
//
// ⚠️ DIVERGÊNCIA da ficha da Tarefa (`## 6.4` do contrato de destino
// presumia reuso do `show()` de `Product`): o backend REAL implementou rota
// PRÓPRIA `GET /traceabilities/product-autofill/{productUuid}` dentro do
// módulo Rastreabilidade (`TraceabilityController::productAutofill`), NÃO
// `GET /products/{uuid}`. `getProductAutofill` consome a rota REAL —
// precedência código real > ficha (ver docblock de
// `TraceabilityProductAutofill`, `@/@types/v2/Rastreabilidade/traceability`).
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente
// (`Traceability` é recurso FARM-SCOPED via `HasFarmTenantScope`).
//
// `getTraceabilityTag` — a etiqueta é um PDF (`Content-Type: application/
// pdf`, `GenerateTraceabilityTagAction`), NUNCA o envelope `ApiResponse`.
// `responseType: 'blob'` é OBRIGATÓRIO — mirror `downloadChargeReportByProduct`
// (`charge-report-service.ts`). A tela consome o `Blob` com
// `URL.createObjectURL` + `window.open`/link de download (fora do escopo
// desta Tarefa, camada de dados apenas).
//
// Lookups cross-module (`products/options`, `areas/options`,
// `proprietaries/options`, `cities/options`, `farms/current-tenant`) NÃO são
// duplicados aqui — permanecem nos services de módulo já existentes
// (`product-service.ts::listProductOptions`,
// `service-order-service.ts::listServiceOrderAreaOptions` — mesmo Resource
// físico `AreaOptionResource` de `/areas/options`,
// `proprietary-service.ts::listProprietaryOptions(search,'farm')`,
// `city-service.ts::listCityOptions`, `farm-service.ts::listFarms`), a serem
// consumidos DIRETO pelas telas de formulário quando essa Tarefa chegar (Lei
// "não duplicar rota cross-module").
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateTraceabilityRequest,
  TraceabilitiesListEnvelope,
  TraceabilityData,
  TraceabilityFilterRequest,
  TraceabilityGaleryImage,
  TraceabilityListItem,
  TraceabilityProductAutofill,
  UpdateTraceabilityRequest,
} from '@/@types/v2/Rastreabilidade/traceability';
// `TraceabilityConfigFarmContext` — MESMO tipo/shape do farm-context do
// Config (`TraceabilityConfigFarmContextResource` reaproveitado no servidor
// por `TraceabilityController::farmContext`, ver docblock do endpoint em
// `getTraceabilityFarmContext` abaixo). Reuso deliberado, não duplicação
// (Lei "não duplicar rota/tipo cross-module").
import type { TraceabilityConfigFarmContext } from '@/@types/v2/Rastreabilidade/traceability-config';

// Params aceitos por `GET /traceabilities` — paginação padrão + os 3 filtros
// reais de `TraceabilityIndexRequest::rules()` (`FM-01..03`).
export interface ListTraceabilitiesParams
  extends PaginationQueryParams, TraceabilityFilterRequest {}

async function getAllTraceabilities(
  params: ListTraceabilitiesParams
): Promise<ResponsePagination<TraceabilityListItem[]>> {
  const { data } = await api.V2.get<TraceabilitiesListEnvelope>('/traceabilities', {
    page: params.page,
    per_page: params.per_page,
    harvested_in: params.harvested_in || undefined,
    product_uuid: params.product_uuid || undefined,
    tracking_code: params.tracking_code || undefined,
  });

  // Adaptação envelope `ApiResponse::paginated` → `ResponsePagination` (grid)
  // — mesmo adaptador de `listCharges`/`listProducts` (meta REAL, não
  // fallback fake).
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

// `## 6.5` do contrato — NOVO (o legado nunca implementou `show()`, RT-07
// estava morta). Necessário para a SPA hidratar o form de edição com os 40
// campos reais (`TraceabilityResource`).
async function getTraceability(uuid: string): Promise<Response<TraceabilityData>> {
  const { data } = await api.V2.get<Response<TraceabilityData>>(`/traceabilities/${uuid}`);
  return data;
}

async function createTraceability(
  payload: CreateTraceabilityRequest
): Promise<Response<TraceabilityData>> {
  const { data } = await api.V2.post<Response<TraceabilityData>>('/traceabilities', payload);
  return data;
}

// `PUT` — "Update = representação completa" (`TraceabilityRequest`, PUT
// replace, SEM PATCH parcial) — mirror `updateCharge`. `tracking_code`/
// `lot_number` são ignorados pelo servidor mesmo se enviados (imutáveis).
async function updateTraceability(
  uuid: string,
  payload: UpdateTraceabilityRequest
): Promise<Response<TraceabilityData>> {
  const { data } = await api.V2.put<Response<TraceabilityData>>(`/traceabilities/${uuid}`, payload);
  return data;
}

// `DELETE /traceabilities/{uuid}` — 204 SEM envelope (`ApiResponse::
// noContent`, mirror `deleteCharge`/`deleteProprietary`). Exclui galeria +
// registro em transação no servidor (SE-03) — nada a fazer aqui além do
// request.
async function deleteTraceability(uuid: string): Promise<void> {
  await api.V2.delete(`/traceabilities/${uuid}`);
}

// -----------------------------------------------------------------------------
// Galeria (`TASK-TR-04`, contrato `## 1.1`) — `permission:traceab_view`
// (listar) / `traceab_edit` (upload/remoção), aplicado no servidor.
// -----------------------------------------------------------------------------

// `GET /traceabilities/{uuid}/galery` — FLAT (`ApiResponse::success`, SEM
// paginação), mirror `getProductWarehouses`/`listProprietaryOptions`.
async function getTraceabilityGalery(uuid: string): Promise<Response<TraceabilityGaleryImage[]>> {
  const { data } = await api.V2.get<Response<TraceabilityGaleryImage[]>>(
    `/traceabilities/${uuid}/galery`
  );
  return data;
}

// `POST /traceabilities/{uuid}/galery` — multipart, campo `image`
// `required` (`TraceabilityGaleryRequest`). SEM `remove_image` nesta rota
// (D18 — decisão deliberada, campo morto do legado não recriado); a remoção
// é sempre via `deleteTraceabilityGaleryImage` (botão individual por card).
async function uploadTraceabilityGalery(
  uuid: string,
  file: File
): Promise<Response<TraceabilityGaleryImage>> {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await api.V2.post<Response<TraceabilityGaleryImage>>(
    `/traceabilities/${uuid}/galery`,
    formData
  );
  return data;
}

// `DELETE /traceabilities/{uuid}/galery/{galeryUuid}` — 204 SEM envelope
// (mirror `deleteTraceability`).
async function deleteTraceabilityGaleryImage(uuid: string, galeryUuid: string): Promise<void> {
  await api.V2.delete(`/traceabilities/${uuid}/galery/${galeryUuid}`);
}

// -----------------------------------------------------------------------------
// Etiqueta (`TASK-TR-04`, RT-11/SE-08) — PDF puro (QR + link público, 3
// idiomas), `permission:traceab_view`.
// -----------------------------------------------------------------------------

export type TraceabilityTagLang = 'pt-br' | 'en' | 'es';

// ⚠️ RISCO (ficha, "Risco + solução"): resposta é `Content-Type: application/
// pdf` — `Response` binária pura (`GenerateTraceabilityTagAction`), FORA do
// envelope `ApiResponse`. `responseType: 'blob'` é OBRIGATÓRIO — errar aqui
// quebra o download silenciosamente (o axios tentaria parsear o PDF como
// JSON/texto). Mirror `downloadChargeReportByProduct`
// (`charge-report-service.ts`). A tela consome com `URL.createObjectURL` +
// `window.open` (mirror `AM-06`, fora do escopo desta Tarefa).
async function getTraceabilityTag(
  uuid: string,
  lang: TraceabilityTagLang = 'pt-br'
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `/traceabilities/${uuid}/tag`,
    { lang },
    { responseType: 'blob' }
  );
  return data;
}

// -----------------------------------------------------------------------------
// Autofill nutricional (`## 6.4` do contrato/GAP-TR-01, TASK-TR-05) — rota
// PRÓPRIA REAL do backend (ver divergência documentada no topo do arquivo).
// -----------------------------------------------------------------------------

async function getProductAutofill(
  productUuid: string
): Promise<Response<TraceabilityProductAutofill>> {
  const { data } = await api.V2.get<Response<TraceabilityProductAutofill>>(
    `/traceabilities/product-autofill/${productUuid}`
  );
  return data;
}

// -----------------------------------------------------------------------------
// Farm-context da FAZENDA ATIVA (fix de fidelidade do mapa `TraceabilityMap.
// tsx` — mirror `mapBuild()` legado, `agro365/public/js/map_traceability.
// js`: o legado desenha a fazenda ATIVA por padrão na carga do form, ANTES
// de qualquer Produtor/Configuração ser selecionado). `GET /traceabilities/
// farm-context` (SEM args — resolve a fazenda pelo header `X-Farm-Id`
// automático do interceptor, `TraceabilityController::farmContext`) devolve
// o MESMO `TraceabilityConfigFarmContextResource` do farm-context do
// Config (`getTraceabilityConfigFarmContext`) — reuso de tipo deliberado,
// NÃO uma cópia (Lei "não duplicar rota/tipo cross-module").
// -----------------------------------------------------------------------------
async function getTraceabilityFarmContext(): Promise<Response<TraceabilityConfigFarmContext>> {
  const { data } = await api.V2.get<Response<TraceabilityConfigFarmContext>>(
    '/traceabilities/farm-context'
  );
  return data;
}

export {
  createTraceability,
  deleteTraceability,
  deleteTraceabilityGaleryImage,
  getAllTraceabilities,
  getProductAutofill,
  getTraceability,
  getTraceabilityFarmContext,
  getTraceabilityGalery,
  getTraceabilityTag,
  updateTraceability,
  uploadTraceabilityGalery,
};
