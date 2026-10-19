// src/@types/v2/Rastreabilidade/traceability-config/index.d.ts
// -----------------------------------------------------------------------------
// Tipos da entidade TRACEABILITY CONFIG ("Configuração"/Produtor —
// Operacional > Agricultura > Rastreabilidade, F-067). TASK-TR-FE-01
// (fundação) — mirror `@types/v2/Rastreabilidade/traceability/index.d.ts`.
//
// Fonte de verdade: leitura DIRETA do backend REAL já implementado
// (`GB.Cerne.Api`) — `app/Http/Resources/V1/{TraceabilityConfigResource,
// TraceabilityConfigListResource}.php`, `app/Http/Requests/Api/V1/
// {TraceabilityConfigRequest,TraceabilityConfigIndexRequest}.php`,
// `app/Models/TraceabilityConfig.php`. `uuid` sempre, `id` NUNCA aparece.
//
// ⚠️ DIVERGÊNCIA DELIBERADA do `field_manifest` legado (FD-44..FD-56) —
// precedência CÓDIGO REAL > ficha, mesmo racional documentado em
// `traceability/index.d.ts`:
//   - `farm_id` (FD-44, "select Fazenda") — NUNCA é campo do
//     `TraceabilityConfigRequest`/aceito do cliente em NENHUM verbo (ver
//     docblock do Request real: "`farm_id`... NUNCA são campos/regras
//     aqui — resolvidos sempre no servidor via `FarmContext`"). O legado
//     tinha um select editável; a API nova resolve a fazenda pelo contexto
//     ativo (header `X-Farm-Id`), igual a todo recurso farm-scoped do fork.
//     Por isso `TraceabilityConfigForm`/`Create|UpdateTraceabilityConfigRequest`
//     NÃO têm campo de fazenda — só `TraceabilityConfigData.farm` (LEITURA,
//     satélite `whenLoaded`, útil para exibir "Fazenda: X" read-only se a
//     Tarefa de form decidir mostrar).
//   - Isso deixa **12 campos realmente escritos pelo cliente** (FD-45..56,
//     descontado `farm_id`) + o par `image`/`remove_image` (upload) —
//     `field_manifest` soma FD-44..56 = 13 entradas, mas só 12 (+upload)
//     chegam de fato ao `TraceabilityConfigRequest::rules()` real.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { FarmRef } from '@/@types/v2/Farms';
import type { ServiceOrderAreaOption } from '@/@types/v2/ServiceOrders';

// ============================================
// SATÉLITES (relações aninhadas, `whenLoaded` no `TraceabilityConfigResource`/
// `TraceabilityConfigListResource` reais).
// ============================================

export interface TraceabilityConfigFarmRef {
  uuid: string;
  description: string;
}

/** `TraceabilityConfigResource::proprietarySummary()` real devolve SÓ
 *  `{uuid}` (sem `name`/label) — `App\Proprietary` legado não expõe mais que
 *  isso por este caminho. O rótulo de exibição (autofill `IG-08`) vem do
 *  lookup `proprietaries/options`, não deste satélite. NÃO inventar `name`
 *  aqui — divergência real vs. o `ChargePartyRef` genérico (que também só
 *  tem `uuid`, mesma limitação, mirror direto). */
export interface TraceabilityConfigProprietaryRef {
  uuid: string;
}

export interface TraceabilityConfigCityRef {
  uuid: string;
  title: string;
}

/** Satélite ENXUTO da listagem (`TraceabilityConfigListResource`, LM-11) —
 *  soma `state_letter` direto (achatado), diferente do aninhado `city.state`
 *  usado em outras entidades. `state_letter` pode ser `null` (cidade sem
 *  relação `state` carregada — defesa em profundidade do próprio Resource). */
export interface TraceabilityConfigListCityRef {
  uuid: string;
  title: string;
  state_letter: string | null;
}

// ============================================
// LEITURA — LISTAGEM (`GET /traceability-configs`,
// `TraceabilityConfigListResource`, `list_manifest` LM-08..11). D05 (fecha):
// o legado rotulava a última coluna como "Ação" (chave de tradução errada);
// o Resource já chama a chave `city` — o rótulo correto ("Ações") é
// responsabilidade da Tarefa de listagem, fora desta fundação.
// ============================================

export interface TraceabilityConfigListItem {
  uuid: string;
  name: string; // LM-08
  cpf_cnpj: string; // LM-09
  /** Já concatenado no servidor (`"{address}, {number} - {district}"`,
   *  LM-10) — NUNCA remontar no front a partir de partes soltas (a
   *  listagem não recebe `address`/`number`/`district` separados). */
  address_full: string;
  city: TraceabilityConfigListCityRef | null; // LM-11
}

// ============================================
// LEITURA — DETALHE (`GET/POST/PUT /traceability-configs/{uuid}`,
// `TraceabilityConfigResource`, `## 6.5` do contrato). `farm`/`proprietary`/
// `city` SEMPRE eager-carregados pelo Repository (mirror `TraceabilityData`).
// ============================================

export interface TraceabilityConfigData {
  uuid: string;
  /** LEITURA apenas — fazenda dona do registro, resolvida no servidor
   *  (`FarmContext`). NÃO é um campo do form (ver divergência no topo do
   *  arquivo). */
  farm: TraceabilityConfigFarmRef;
  proprietary: TraceabilityConfigProprietaryRef | null;
  name: string;
  cpf_cnpj: string;
  address: string;
  number: string;
  district: string;
  city: TraceabilityConfigCityRef | null;
  phone: string;
  email: string;
  /** Path relativo do disco `public` (`Storage::url()`/`APP_URL` + path é
   *  responsabilidade do SPA) — o Resource real NÃO expõe `logo_url`
   *  pré-montado (diferente de `FarmDetail.logo_url`); não inventar aqui. */
  logo: string | null;
  whatsapp_fone: string;
  whatsapp_texto: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// FORMULÁRIO (`react-hook-form`) — ordem fiel a FD-45..56 do `field_manifest`
// (descontado `farm_id`, ver divergência no topo). Campos relacionais em
// `Option<T>`, nunca `uuid` cru (Lei 1). `image`/`remove_image` (upload de
// logo) ficam FORA deste tipo — mirror `FarmFormType` (que também não
// registra `image`/`remove_image` no RHF, tratados por estado local do
// componente de upload, só chegando ao payload em `CreateTraceabilityConfigRequest`/
// `UpdateTraceabilityConfigRequest`).
// ============================================

export interface TraceabilityConfigForm {
  proprietary_uuid: Option<string> | null;
  name: string;
  cpf_cnpj: string;
  address: string;
  number: string;
  district: string;
  /** Populado SÓ via cascata de `proprietary_uuid` em modo criação (`IG-08`,
   *  `## 5.3` do contrato de tela) — vazio até a cascata rodar; hidratado
   *  direto de `TraceabilityConfigData.city` em modo edição. */
  city_uuid: Option<string> | null;
  phone: string;
  email: string;
  whatsapp_fone: string;
  whatsapp_texto: string;
}

// ============================================
// PAYLOAD DE ESCRITA (`POST`/`PUT /traceability-configs`, multipart) —
// espelha `TraceabilityConfigRequest::rules()` REAL (unificado store+update,
// mesmo racional "PUT replace" de `TraceabilityRequest`). `farm_id` NUNCA é
// campo aqui (ver divergência no topo). `image`/`remove_image` mirror
// `FarmPayload` (upload multipart, `remove_image` só faz sentido em UPDATE,
// mas a mesma `rules()` aceita a chave nos dois verbos).
// ============================================

export interface CreateTraceabilityConfigRequest {
  proprietary_uuid: string;
  name: string;
  cpf_cnpj: string;
  address: string;
  number: string;
  district: string;
  city_uuid: string;
  phone: string;
  email: string;
  whatsapp_fone: string;
  whatsapp_texto: string;
  /** Upload de logo (multipart) — `nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048`. */
  image?: File | null;
  /** SE-07 — apaga o logo em disco antes do save. Só relevante em UPDATE. */
  remove_image?: boolean;
}

/** `PUT` é o MESMO shape de `POST` (substituição integral, mirror
 *  `UpdateTraceabilityRequest`/`UpdateChargeRequest`) — alias, não `Partial`. */
export type UpdateTraceabilityConfigRequest = CreateTraceabilityConfigRequest;

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`, `GET /traceability-configs`,
// `TraceabilityConfigIndexRequest`) — mesma armadilha de
// `ChargesListEnvelope`/`TraceabilitiesListEnvelope` (array PLANO em `data`).
// TASK-TR-FE-03.
// ============================================

export interface TraceabilityConfigsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
  links?: Record<string, unknown>;
}

export interface TraceabilityConfigsListEnvelope {
  success: boolean;
  message: string;
  data: TraceabilityConfigListItem[];
  errors: Record<string, string[]> | null;
  meta: TraceabilityConfigsApiPaginationMeta | null;
}

// ============================================
// OPTIONS (`GET /traceability-configs/options`, `TraceabilityConfigOptionResource`,
// LK-02, contrato `## 1.3`, TASK-TR-05/TASK-TR-FE-03) — payload FLAT
// (`ApiResponse::success`, SEM paginação), SEM gate próprio (`authorize()
// => true`, gate por consumidor — mirror `AreaOptionsRequest`/
// `ProductOptionsRequest`). `TraceabilityConfig` não tem `description` — o
// rótulo real é `name` (mesma decisão de `TraceabilityConfigRef`, satélite
// de `traceability/index.d.ts`).
// ============================================

export interface TraceabilityConfigOption {
  uuid: string;
  name: string;
}

// ============================================
// FARM-CONTEXT (`GET /traceability-configs/{uuid}/farm-context`,
// `TraceabilityConfigFarmContextResource`, contrato `## 1.2`/`## 6.6`,
// substitui RT-21, TASK-TR-05/TASK-TR-FE-03) — payload FLAT, composição de 2
// Resources físicos JÁ EXISTENTES no backend, reaproveitados aqui SEM
// duplicar tipo (Lei "não duplicar rota/tipo cross-module"):
//   - `farm`  → `App\Http\Resources\V1\FarmResource` — MESMO shape de
//     `FarmRef` (`@/@types/v2/Farms`, `{uuid,description,logo,tenant}`).
//   - `areas` → `App\Http\Resources\V1\AreaOptionResource` — MESMO shape de
//     `ServiceOrderAreaOption` (`@/@types/v2/ServiceOrders`,
//     `{uuid,description,productive_area}`) — Resource físico COMPARTILHADO
//     com o lookup `GET /areas/options` (`listServiceOrderAreaOptions`,
//     `service-order-service.ts`), não recriado aqui.
//
// ⚠️ ADITIVO (fix de fidelidade do mapa — mirror `mapBuild()` legado,
// `agro365/public/js/map_traceability.js`): o backend passou a enriquecer
// os 2 Resources acima com os campos geográficos que faltavam para o widget
// `TraceabilityMap.tsx` desenhar pastos + cerca (antes só `latlng` era
// consumido). `TraceabilityConfigFarmContextArea.color`/`.coordinates`
// espelham `AreaListItem.color`/`.coordinates` (`@/@types/v2/
// BaseRegistrations/areas`, GeoJSON já desserializado pelo cast `array` do
// Model) — extensão local, NÃO propagada a `ServiceOrderAreaOption` (o
// lookup `GET /areas/options` genérico não necessariamente devolve estes 2
// campos para todo consumidor). `TraceabilityConfigFarmContextFarm.
// coordinates` é a cerca da fazenda — string JSON crua ou `null` (mesma
// armadilha já documentada em `FarmDetail.coordinates`, `farm-admin.d.ts`),
// NUNCA GeoJSON pronto — parse defensivo é responsabilidade do consumidor.
// ============================================

export interface TraceabilityConfigFarmContextArea extends ServiceOrderAreaOption {
  color: string;
  coordinates: GeoJSON.GeoJsonObject | string | null;
}

export interface TraceabilityConfigFarmContextFarm extends FarmRef {
  coordinates: string | GeoJSON.GeoJsonObject | null;
}

export interface TraceabilityConfigFarmContext {
  farm: TraceabilityConfigFarmContextFarm;
  areas: TraceabilityConfigFarmContextArea[];
}
