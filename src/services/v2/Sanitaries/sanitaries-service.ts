// src/services/v2/Sanitaries/sanitaries-service.ts
// -----------------------------------------------------------------------------
// Sanitaries Service — API v1 do backend Laravel GB.Cerne (`/sanitaries*`,
// plural, `SanitaryRecordController`), TASK-SAN-FE-01. Fonte: CTR-SAN
// (`CORE_WORKSPACE/01-Arquitetura_e_Contratos/contrato-api-lane-c-sanitario.md`),
// `CONTRATO_AUTOAPROVADO`, 12 endpoints `EP-SAN-01..12`, Tester ✅.
//
// NÃO importa nada de `@/services/v2/Sanitary/sanitary-service` (execução
// 039, endpoints singulares `/sanitary/*`, gate `processing_create` — outro
// domínio, cascata embutida em Processamento, ADR-FE-SAN-00 do contrato de
// tela §2.1). Diretório `Sanitaries` (plural) é a única disambiguação real
// desta fatia.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { ProductOption } from '@/@types/v2/Products';
import type {
  SanitaryDetail,
  SanitaryFilterRequest,
  SanitaryFormContext,
  SanitaryListItem,
  SanitaryStockFieldOption,
  SaveMultipleSanitariesRequest,
  SaveSanitaryRequest,
} from '@/@types/v2/Sanitaries';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

const BASE = '/sanitaries';

// ---------------------------------------------------------------------------
// EP-SAN-01 — GET /sanitaries (listagem paginada, filtro batch_uuid/user_uuid,
// ordenação fixa `code desc`, mirror `mode_matrix`). Envelope adaptado do
// `ApiResponse` flat para `ResponsePagination` (`useCustomGridQuery`), mesma
// técnica de `listWeanings`/`listBirthAnimals`.
// ---------------------------------------------------------------------------
export interface ListSanitariesParams extends PaginationQueryParams, SanitaryFilterRequest {}

interface SanitariesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface SanitariesListEnvelope {
  success: boolean;
  message: string;
  data: SanitaryListItem[];
  errors: Record<string, string[]> | null;
  meta: SanitariesApiPaginationMeta | null;
}

async function listSanitaries(
  params: ListSanitariesParams
): Promise<ResponsePagination<SanitaryListItem[]>> {
  const { data } = await api.V2.get<SanitariesListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
    batch_uuid: params.batch_uuid || undefined,
    user_uuid: params.user_uuid || undefined,
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

// EP-SAN-02 — GET /sanitaries/{uuid} (detalhe, edição e visualização).
async function getSanitaryByUuid(uuid: string): Promise<Response<SanitaryDetail>> {
  const { data } = await api.V2.get<Response<SanitaryDetail>>(`${BASE}/${uuid}`);
  return data;
}

// ---------------------------------------------------------------------------
// `GET /sanitaries/next-code` — preview do próximo `code`, SÓ chamado em modo
// CRIAÇÃO (97-Esteiras/002 execução 002 lane C, correção reportada pelo dono
// ao vivo: a API passou a expor este endpoint, ANTES ausente — o texto
// estático "Gerado ao salvar" agora só é fallback enquanto a query carrega/
// falha). Mirror EXATO `getServiceOrderNextCode`/`getBreedingSeasonNextCode`,
// exceto o nome do campo: o Controller real (`SanitaryRecordController::
// nextCode()`, worktree irmão da API) devolve `{ next_code: string }`, NÃO
// `{ code: string }` como os mirrors citados.
// ---------------------------------------------------------------------------
async function getSanitaryNextCode(): Promise<Response<{ next_code: string }>> {
  const { data } = await api.V2.get<Response<{ next_code: string }>>(`${BASE}/next-code`);
  return data;
}

// ---------------------------------------------------------------------------
// Contexto de formulário — NÃO é chamada de rede. `code` é gerado
// atomicamente dentro de `POST /sanitaries` (`pg_advisory_xact_lock`,
// CTR-SAN §4 `nextCode()`); mantido como estava (o `next_code` real agora
// disponível é obtido via `getSanitaryNextCode()` acima, chamada de rede
// própria — este helper client-side NÃO foi adaptado para chamá-la, fora do
// escopo desta correção). `lookups` é só documentação de quais serviços JÁ
// EXISTENTES a tela deve reusar (contrato-tela §5.4) — nunca chamados por
// este service.
// ---------------------------------------------------------------------------
function getSanitaryFormContext(): SanitaryFormContext {
  return {
    next_code: null,
    lookups: {
      animals: 'GET /animals/options?batch_uuid=',
      employees: 'GET /employees/options',
      functions: 'GET /functions/options',
      providers: 'GET /providers/options',
    },
  };
}

// EP-SAN-03 — POST /sanitaries.
async function createSanitary(payload: SaveSanitaryRequest): Promise<Response<SanitaryDetail>> {
  const { data } = await api.V2.post<Response<SanitaryDetail>>(BASE, payload);
  return data;
}

// EP-SAN-04 — PUT /sanitaries/{uuid}.
async function updateSanitary(
  uuid: string,
  payload: SaveSanitaryRequest
): Promise<Response<SanitaryDetail>> {
  const { data } = await api.V2.put<Response<SanitaryDetail>>(`${BASE}/${uuid}`, payload);
  return data;
}

// EP-SAN-05 — DELETE /sanitaries/{uuid}.
async function deleteSanitary(uuid: string): Promise<void> {
  await api.V2.delete(`${BASE}/${uuid}`);
}

// EP-SAN-06 — POST /sanitaries-multiple (ADR-FE-SAN-01, TASK-SAN-FE-07).
// Resposta real (leitura direta de `SanitaryRecordController::storeMultiple()`,
// worktree irmão da API): `ApiResponse::created(SanitaryResource::collection($sanitaries), ...)`
// — `data` é um array de `SanitaryResource`, MESMO shape de `SanitaryDetail`
// (1 item por lote distinto dos animais selecionados, fan-out server-side,
// CTR-SAN §4) — NÃO o objeto `{sanitaries, warnings}` que a fundação
// (TASK-SAN-FE-01) especulava sem ler o Controller (ver nota de shape em
// `@/@types/v2/Sanitaries`).
async function createSanitariesMultiple(
  payload: SaveMultipleSanitariesRequest
): Promise<Response<SanitaryDetail[]>> {
  const { data } = await api.V2.post<Response<SanitaryDetail[]>>(`${BASE}-multiple`, payload);
  return data;
}

// ---------------------------------------------------------------------------
// EP-SAN-07 — GET /sanitaries-batch-report (download síncrono, blob),
// gate `sanitaries-batch-report_view`. Mirror
// `downloadWeaningReport`/`downloadInvoiceXml`.
//
// RE-ALINHAMENTO F-318 (esteira 078, F-318-plano-frontend.md, TASK-F318-F01)
// — a API foi RE-MIGRADA (SFC-318-FILTERS/SFC-318-PERM) e restaurou os 4
// filtros que a TASK-SAN-FE-08 anterior havia tratado como campo morto, além
// de TROCAR o parâmetro de formato: leitura DIRETA do código real (worktree
// irmão `GB.Cerne.Api`, `app/Http/Requests/Api/V1/
// SanitaryBatchReportRequest.php:37-63` + `SanitaryBatchReportController.php`)
// confirma que o Form Request agora aceita `start_date`/`end_date`
// (obrigatórios), `batch_uuid`/`category_uuid`/`feedlot_corral_uuid`/
// `animal_uuid`/`product_uuid` (opcionais, uuid) e **`report_type`** (enum
// string `pdf`|`excel`, default `pdf`) — o antigo `type` (inteiro, `1`=Excel)
// da migração divergente anterior **NÃO EXISTE MAIS** (comentário do próprio
// Form Request: "report_type NUNCA type"). Corrigido aqui para o shape real.
// ---------------------------------------------------------------------------
export interface DownloadSanitariesBatchReportParams {
  start_date: string;
  end_date: string;
  batch_uuid?: string;
  category_uuid?: string;
  feedlot_corral_uuid?: string;
  animal_uuid?: string;
  product_uuid?: string;
}

async function downloadSanitariesBatchReport(
  params: DownloadSanitariesBatchReportParams,
  type: 'pdf' | 'xlsx'
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `${BASE}-batch-report`,
    {
      start_date: params.start_date,
      end_date: params.end_date,
      batch_uuid: params.batch_uuid || undefined,
      category_uuid: params.category_uuid || undefined,
      feedlot_corral_uuid: params.feedlot_corral_uuid || undefined,
      animal_uuid: params.animal_uuid || undefined,
      product_uuid: params.product_uuid || undefined,
      // `report_type` enum string — mirror EXATO do enum
      // `SanitaryBatchReportOutputType` (`pdf`|`excel`); ausente = PDF
      // (default do backend), mas enviamos explícito para os 2 botões.
      report_type: type === 'xlsx' ? 'excel' : 'pdf',
    },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadSanitariesBatchReportPdf(
  params: DownloadSanitariesBatchReportParams
): Promise<Blob> {
  return downloadSanitariesBatchReport(params, 'pdf');
}

async function downloadSanitariesBatchReportXlsx(
  params: DownloadSanitariesBatchReportParams
): Promise<Blob> {
  return downloadSanitariesBatchReport(params, 'xlsx');
}

// ---------------------------------------------------------------------------
// EP-SAN-08 — GET /sanitaries/products (catálogo flat de produtos, gate
// `sanitary_create`, "leitura auxiliar de formulário" CTR-SAN §2) —
// consumido pelo filtro "Produto" do relatório (`san-screen-report`,
// contrato-tela §6.8), NÃO pelo bloco de itens do form (que usa a cascata
// Armazém→Produto(=Stock) de `EP-SAN-09`, sempre com armazém já escolhido).
// Envelope FLAT adaptado para `ResponsePagination` (1 página só), mirror
// `listSanitaryProductsByWarehouse` abaixo.
// ---------------------------------------------------------------------------
async function listSanitaryProducts(): Promise<ResponsePagination<ProductOption[]>> {
  const { data } = await api.V2.get<Response<ProductOption[]>>(`${BASE}/products`);

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

// EP-SAN-09 — GET /sanitaries/products-by-warehouse/{warehouseUuid} — cascata
// Armazém→Produto do bloco de itens. Cada opção é uma LINHA de `Stock`
// (produto+lote), mirror `FeedlotCorralSanitaryStockOption`/GAP-FE-244.
async function listSanitaryProductsByWarehouse(
  warehouseUuid: string
): Promise<ResponsePagination<SanitaryStockFieldOption[]>> {
  const { data } = await api.V2.get<Response<SanitaryStockFieldOption[]>>(
    `${BASE}/products-by-warehouse/${warehouseUuid}`
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

// EP-SAN-10 — GET /sanitaries/warehouses-by-product/{productUuid} — cascata
// invertida (produto→armazém), mesmo racional acima.
async function listSanitaryWarehousesByProduct(
  productUuid: string
): Promise<ResponsePagination<WarehouseOption[]>> {
  const { data } = await api.V2.get<Response<WarehouseOption[]>>(
    `${BASE}/warehouses-by-product/${productUuid}`
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

export interface SanitaryWarehouseStockBalance {
  quantity: number;
}

// EP-SAN-11 — GET /sanitaries/warehouse-stock/{warehouseUuid}/{productUuid} —
// saldo bruto (Estoque, `InputReadOnly`). Contrato-tela §6.5 exige ler o
// saldo DIRETO da opção de Stock (FI-05, GAP-FE-244) sem 2ª chamada — esta
// função fica disponível para os casos em que a opção de Stock precisar ser
// reconfirmada (ex.: hidratação de edição sem re-listar o Select), nunca
// como substituta do valor já embutido na opção.
async function getSanitaryWarehouseStock(
  warehouseUuid: string,
  productUuid: string
): Promise<Response<SanitaryWarehouseStockBalance>> {
  const { data } = await api.V2.get<Response<SanitaryWarehouseStockBalance>>(
    `${BASE}/warehouse-stock/${warehouseUuid}/${productUuid}`
  );
  return data;
}

// EP-SAN-12 — GET /sanitaries/measurements/{productUuid} — unidade principal
// + secundária do produto, popula o Select "Un.Medida" da linha.
async function listSanitaryMeasurements(
  productUuid: string
): Promise<Response<MeasurementOption[]>> {
  const { data } = await api.V2.get<Response<MeasurementOption[]>>(
    `${BASE}/measurements/${productUuid}`
  );
  return data;
}

/**
 * Mapeia `SanitaryStockFieldOption` (linha de Stock) → `Option<string>` do
 * select assíncrono, mirror `mapWeaningLookupAnimalToOption`. `value` = uuid
 * do `Stock` (vira `stock_uuid` no submit), rótulo sufixado com o lote
 * quando presente — mirror `FeedlotSanitaryItemRow`.
 * @param {SanitaryStockFieldOption} item - Opção de Stock devolvida por `listSanitaryProductsByWarehouse`.
 * @return {Option<string>} Opção `{label, value}` decorada para o `SelectAsyncPaginate`.
 */
export function mapSanitaryStockOptionToOption(
  item: SanitaryStockFieldOption
): Option<string> & Record<string, unknown> {
  return { ...item };
}

export {
  createSanitariesMultiple,
  createSanitary,
  deleteSanitary,
  downloadSanitariesBatchReportPdf,
  downloadSanitariesBatchReportXlsx,
  getSanitaryByUuid,
  getSanitaryFormContext,
  getSanitaryNextCode,
  getSanitaryWarehouseStock,
  listSanitaries,
  listSanitaryMeasurements,
  listSanitaryProducts,
  listSanitaryProductsByWarehouse,
  listSanitaryWarehousesByProduct,
  updateSanitary,
};
