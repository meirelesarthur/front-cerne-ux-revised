// src/@types/v2/BaseRegistrations/areas/index.d.ts
// -----------------------------------------------------------------------------
// Tipos MÍNIMOS de Área ("Piquete"/"Talhão") — API v1 do backend Laravel
// GB.Cerne, consumidos SÓ pelo mapa de seleção de piquetes do Módulo Pastejo
// (TASK-GZ-FE-03). NÃO é o tipo completo de Área (21 colunas, `Area-contrato.md
// ## 3` AreaResource) — só o subconjunto que `GrazingMap.tsx` precisa para
// desenhar/selecionar polígonos. Se um módulo de Área próprio nascer no
// front no futuro, ESTE arquivo deve ser substituído/estendido por ele, não
// duplicado ao lado.
//
// Fonte: `App\Http\Resources\V1\AreaResource` (leitura direta do backend
// nesta sessão) + `App\Http\Controllers\Api\V1\AreaController::validInsert`
// (shape de resposta do `valid-insert`, também lido direto do código real).
//
// `uuid` sempre; `id` sequencial nunca.
// -----------------------------------------------------------------------------

import type { AreaColorValue, AreaTypeValue } from '@/constants/areas/area/areas-status';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';

// ============================================
// AREA (subconjunto consumido pelo mapa de seleção)
// ============================================

export interface AreaListItem {
  uuid: string;
  description: string;
  /** Cor PRÓPRIA da Área (hex) — dado de negócio, não estilo de UI (mesma
   *  exceção já aplicada a `Grazing.color`/`polygonColor` do `StepDemarcacao`). */
  color: string;
  /** Hectares, valor autoritativo do backend — preferido ao recálculo
   *  geodésico client-side quando disponível (`## 6` do contrato de tela). */
  total_area: number;
  /** Hectares produtivos — o LEGADO exibia este valor sob o rótulo "Área
   *  Total" (`appropriations/_forms.blade.php`) e o backend valida
   *  `used_area ≤ productive_area` (`AppropriationRequest::rules()`), NUNCA
   *  `total_area`. Consumido pelo módulo de Apontamentos (`Appropriations`)
   *  para fidelidade ao legado — `total_area` acima é o bruto (usado pelo
   *  mapa de seleção de Pastejo, outro consumidor deste tipo). */
  productive_area: number;
  /** TASK-FE-416 (sub-lista de Áreas dentro de Fazendas, coluna "Ativo",
   *  SURF-01) — campo ADITIVO ao subconjunto mínimo original (confirmado por
   *  leitura direta de `AreaResource::toArray()`, que é o MESMO Resource
   *  usado pelo `index()`/`GET /areas`, `AreaController.php:100-109` — a
   *  paginação não usa um Resource de lista mais enxuto). Consumidores
   *  anteriores (`GrazingMap.tsx`) seguem intactos — campo novo, nada
   *  removido/renomeado. */
  is_enabled: boolean;
  /** GeoJSON já desserializado pelo cast `array` do Model (`DA-AR-16`) — chega
   *  como objeto, NUNCA como string a re-parsear (diferente do `coordinates`
   *  de `Farm`, que o front ainda trata como string serializada). Formato real
   *  confirmado (`AreaData`/`StoreAreaAction`): um único `Feature` GeoJSON
   *  (`{ type: 'Feature', geometry: {...}, properties: {...} }`), não uma
   *  `FeatureCollection`. */
  coordinates: GeoJSON.Feature | GeoJSON.GeoJsonObject;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — `GET /api/v1/areas`)
// ============================================

export interface AreasListEnvelope {
  success: boolean;
  message: string;
  data: AreaListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

// ============================================
// VALID-INSERT (`GET /api/v1/areas/valid-insert`) — UX preventiva, NÃO a
// garantia de exclusividade (a garantia é a constraint física +
// revalidação server-side no submit de Pastejo, `Grazing-FrontEnd-contrato.md
// ## 7.1`). Shape lido direto de `AreaController::validInsert` nesta sessão.
// ============================================

export interface AreaOccupyingGrazing {
  uuid: string;
  code: string;
  description: string;
}

export interface AreaValidInsertResponse {
  linked: boolean;
  grazing: AreaOccupyingGrazing | null;
}

// ============================================
// OPTIONS (`GET /api/v1/areas/options`) — lookup enxuto do select "Área".
// Farm-scoped pela FAZENDA ATIVA (`X-Farm-Id`), SEM `farm_uuid` explícito
// (diferente do índice completo `GET /areas`) — `AreaController::options()`
// resolve a fazenda via `FarmContext`, sem o vazamento tenant-wide do Scope
// (`app/Actions/Area/ListAreaOptionsAction.php`, TASK-FRONT-1, roteiro
// `lote-area-f143-roteiro.md §2`). Shape lido direto de
// `AreaOptionResource::toArray()` (mirror `ServiceOrderAreaOption`,
// `@/@types/v2/ServiceOrders`, mesmo endpoint/Resource, consumidor
// diferente).
// ============================================

export interface AreaOption {
  uuid: string;
  description: string;
  productive_area: number;
}

export interface AreaOptionsListEnvelope {
  success: boolean;
  message: string;
  data: AreaOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// -----------------------------------------------------------------------------
// TASK-FE-415 (fundação do módulo Áreas, F-348/UT-000446, esteira 067) — a
// partir daqui, o `AreaResource` COMPLETO (21 colunas,
// `CONTRATO-tela-frontend-area.md §2`/matriz FID-G3A §1) + tipos de
// form/filter/request do CRUD novo (get/create/update/delete/batch). O
// subconjunto `AreaListItem`/`AreaOption`/`AreaValidInsertResponse` ACIMA
// continua INTOCADO (consumido pelo mapa de seleção de Pastejo/filtro de
// Lote-Área) — nada aqui o substitui.
//
// Fonte: `App\Http\Resources\V1\AreaResource::toArray()` (leitura direta do
// backend nesta sessão, `GB.Cerne.Api/app/Http/Resources/V1/AreaResource.php`)
// + `App\Http\Requests\Api\V1\AreaRequest::rules()` (payload de escrita) +
// FID-G3A §3 (contrato proposto do `POST /areas/batch`, GAP-API-01, ainda
// NÃO implementado no backend — o service nasce pronto, task-packet §"Pode
// planejar? sim").
// -----------------------------------------------------------------------------

// ============================================
// AREA — leitura completa (`GET /areas/{uuid}`, `AreaResource`)
// ============================================

/** Referência enxuta de Fazenda embutida no Resource (`whenLoaded('farm')`). */
export interface AreaFarmRef {
  uuid: string;
  description: string;
}

/** Referência enxuta de Marker (Atividade/Infraestrutura), `whenLoaded`. */
export interface AreaMarkerRef {
  uuid: string;
  description: string;
}

/** Referência enxuta de Trough (bebedouro), só via `GetAreaAction`/`show()`
 *  (`whenLoaded('troughs')`) — SEM `uuid` (a tabela física `troughs` não tem
 *  essa coluna, confirmado no backend). */
export interface AreaTroughRef {
  code: string;
  description: string;
}

/** Referência enxuta de Batch (lote), só via `GetAreaAction`/`show()`
 *  (`whenLoaded('batches')`). */
export interface AreaBatchRef {
  uuid: string | null;
  code: string | null;
}

/** Referência enxuta de Proprietário Gestor (`whenLoaded('proprietary')`) —
 *  GAP-FE-259 FECHADO (retoque F-348/UT-000446): `AreaResource` passou a
 *  expor este bloco no `GET /areas/{uuid}` (mirror `AreaFarmRef`/
 *  `AreaMarkerRef`). `null` quando a Área não tem Proprietário vinculado. */
export interface AreaProprietaryRef {
  uuid: string;
  label: string;
}

/**
 * GeoJSON `Feature` (ou objeto genérico defensivo) de Área — já
 * desserializado pelo cast `array` do Model (`DA-AR-16`), NUNCA string a
 * re-parsear (diferente de `Farm.coordinates`, que É string serializada).
 * Mirror do tipo já usado em `AreaListItem.coordinates` acima.
 */
export type AreaCoordinates = GeoJSON.Feature | GeoJSON.GeoJsonObject;

export interface AreaData {
  uuid: string;
  description: string;
  registration: string | null;
  total_area: number;
  recreation_area: boolean;
  productive_area: number;
  unproductive_area: number;
  /** Enum `AreaType` (1 Produtiva, 2 Reserva) — valor físico bruto exposto
   *  pelo Resource (`App\Enums\AreaType`, `constants/areas/area/areas-status.ts`). */
  type: AreaTypeValue;
  note: string | null;
  is_enabled: boolean;
  coordinates: AreaCoordinates | null;
  /** Paleta fechada de 14 cores (`App\Enums\AreaColor`,
   *  `constants/areas/area/areas-status.ts`) — hex bruto, dado de negócio. */
  color: AreaColorValue;
  activity_icon_coordinates: Record<string, unknown> | null;
  infrastructure_icon_coordinates: Record<string, unknown> | null;
  /** ISO `yyyy-MM-dd` (`$this->date?->toDateString()`) — OBRIGATÓRIO na
   *  escrita (§4.D da matriz FID-G3A, TASK-067-AR-05), por isso nunca `null`
   *  num registro já persistido; `string | null` só por defesa de leitura. */
  date: string | null;

  /** `whenLoaded('farm')` — ausente em `store()`/`update()` (mirror `GrazingResource`). */
  farm?: AreaFarmRef;
  /** `whenLoaded('activity')` — `null` quando a Área não tem Atividade vinculada. */
  activity?: AreaMarkerRef | null;
  /** `whenLoaded('infrastructure')`. */
  infrastructure?: AreaMarkerRef[];
  /** `whenLoaded('troughs')` — só populado por `GetAreaAction`/`show()`. */
  troughs?: AreaTroughRef[];
  /** `whenLoaded('batches')` — só populado por `GetAreaAction`/`show()`. */
  batches?: AreaBatchRef[];
  /** `whenLoaded('proprietary')` — GAP-FE-259 FECHADO (retoque F-348/
   *  UT-000446). `null`/ausente quando a Área não tem Proprietário Gestor
   *  vinculado; hidratado pelo `SelectCombobox` em `fillAreaForm`
   *  (`CreateOrUpdateArea.tsx`). */
  proprietary?: AreaProprietaryRef | null;

  created_at: string;
  updated_at: string;
}

// ============================================
// AREA FORM (React Hook Form) — Selects sempre `Option<T>`, nunca valor raw
// ============================================

export interface AreaForm {
  description: string;
  registration: string | null;
  /** ISO `yyyy-MM-dd` — `InputDate`/`DateInput` via `Controller` (field-
   *  validation-schema `.date()` exige string, NUNCA `yup.date()`/objeto
   *  `Date`, ver `src/validations/field-validation-schema.ts`). */
  date: string | null;
  proprietary: Option<string> | null;
  type: Option<AreaTypeValue> | null;
  activity: Option<string> | null;
  recreation_area: boolean;
  color: Option<AreaColorValue> | null;
  infrastructure: Option<string>[];
  /** `KgInput` (`floatValue`, `decimalPlaces=2`) — persiste SEMPRE `number`,
   *  nunca a string mascarada (Riscos da Tarefa, `KgInput` round-trip). */
  total_area: number;
  productive_area: number;
  /** Sempre `readonly`/derivada (`total_area − productive_area`) — NÃO
   *  portar o listener `keyup` morto do legado (CLM-06b). */
  unproductive_area: number;
  is_enabled: boolean;
  note: string | null;
  /** Hidden, populado pelo mapa/KML (SURF-04a/04b) — `null` até o primeiro
   *  polígono ser desenhado/importado. */
  coordinates: AreaCoordinates | null;
  activity_icon_coordinates: Record<string, unknown> | null;
  infrastructure_icon_coordinates: Record<string, unknown> | null;
}

// ============================================
// AREA FILTER (drawer de filtro, Contrato B) — `GET /areas`
// ============================================

export interface AreaFilterForm {
  is_enabled?: Option<boolean> | null;
}

export interface AreaFilterRequest extends PaginationQueryParams {
  /** `farm_uuid` é OBRIGATÓRIO na query do índice tenant-wide (`AreaTenantScope`
   *  sozinho não escopa por Fazenda) — mirror `ListAreasParams.farm_uuid`
   *  (`areas-service.ts`, mantido lá; replicado aqui só como referência de
   *  shape do filtro de tela, TASK-FE-416). */
  farm_uuid: string;
  is_enabled?: boolean;
}

// ============================================
// AREA WRITE PAYLOAD — `POST /areas` · `PUT|PATCH /areas/{uuid}`
// (`AreaRequest::rules()`, escrita travada por TASK-067-AR-05 — o service
// nasce pronto, task-packet §"Endpoints")
// ============================================

/** Shape comum de escrita (single). `farm_uuid` é tratado à parte por
 *  `CreateAreaRequest`/`UpdateAreaRequest` (obrigatório na criação, imutável
 *  — ignorado pela Action mesmo se enviado — na edição, matriz FID-G3A A-04). */
export interface AreaWritePayload {
  description: string;
  registration?: string | null;
  total_area: number;
  recreation_area: boolean;
  productive_area: number;
  unproductive_area: number;
  type: AreaTypeValue;
  note?: string | null;
  is_enabled: boolean;
  /** GeoJSON `Feature` — o backend injeta `area_description` em
   *  `geometry.properties` (§4.A da matriz, NÃO na raiz). */
  coordinates: AreaCoordinates | Record<string, unknown>;
  color: AreaColorValue;
  activity_icon_coordinates?: Record<string, unknown> | null;
  infrastructure_icon_coordinates?: Record<string, unknown> | null;
  activity_uuid?: string | null;
  proprietary_uuid?: string | null;
  infrastructure?: string[];
  /** OBRIGATÓRIO (§4.D, TASK-067-AR-05) — ISO `yyyy-MM-dd`. */
  date: string;
}

export interface CreateAreaRequest extends AreaWritePayload {
  /** `required` no `POST` — Área é tenant-wide, o cliente precisa dizer
   *  explicitamente a qual Fazenda do tenant a Área nova pertence (DA-AR-01). */
  farm_uuid: string;
}

export interface UpdateAreaRequest extends AreaWritePayload {
  /** `sometimes` no `PUT`/`PATCH` — aceito mas IGNORADO pela Action
   *  (`farm_id` imutável após a criação, mirror `FarmRequest.tenant_id`). Não
   *  reenviar por decisão de produto; mantido opcional só por fidelidade ao
   *  formato aceito pela API. */
  farm_uuid?: string;
}

// ============================================
// AREA BATCH — `POST /areas/batch` (GAP-API-01/TASK-067-AR-06, backend AINDA
// NÃO IMPLEMENTADO nesta rodada — contrato de payload fixado pela matriz
// FID-G3A §3; o service (`createAreasBatch`) nasce pronto, task-packet
// "o service pode nascer já"). Consumido por TASK-FE-421 ("Adicionar
// Múltiplas Áreas").
// ============================================

/** Item do lote — mesmo shape de `AreaWritePayload`, SEM `farm_uuid` próprio
 *  (uma única Fazenda serve TODO o lote, no nível de `AreaBatchRequest`). */
export type AreaBatchItemRequest = AreaWritePayload;

export interface AreaBatchRequest {
  /** Uma Fazenda para todo o lote (mirror do `farm_id` agregado do legado). */
  farm_uuid: string;
  areas: AreaBatchItemRequest[];
}
