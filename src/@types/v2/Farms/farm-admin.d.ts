// src/@types/v2/Farms/farm-admin.d.ts
// -----------------------------------------------------------------------------
// Tipos do CRUD ADMINISTRATIVO de Fazenda (Farm) — API v1 do backend Laravel
// GB.Cerne (execução 024, `TASK-FE-400`). Arquivo NOVO e SEPARADO de
// `@/@types/v2/Farms/index.d.ts` (criado pela `TASK-FE-320`, usado
// exclusivamente pelo multiselect de Emissores NFe sobre
// `GET /farms/current-tenant`) — são 2 recursos de API distintos, ver nota de
// cabeçalho de `index.d.ts`. NÃO editar aquele arquivo, NÃO reaproveitar
// `FarmRef`/`FarmsCurrentTenantEnvelope` aqui.
//
// Fonte batida linha a linha contra `api_root` nesta execução:
//   - app/Http/Resources/V1/FarmDetailResource.php (shape de leitura — usado
//     TANTO no index() paginado quanto no show(), Grupo B)
//   - app/Http/Requests/Api/V1/FarmRequest.php (regras de escrita)
//   - app/Data/Farm/FarmFilterData.php (filtros REAIS aceitos — nota: o
//     contrato Farm-contrato.md §8.2 documenta um `state_id` que NÃO existe
//     no código real; seguimos o código, não a prosa do contrato)
//   - app/Http/Requests/Api/V1/FarmIndexRequest.php (query string do índice)
//   - app/Enums/FarmExplorationType.php
//
// ✅ GAP-FE-120/GAP-FE-124 FECHADOS (companheira desta execução, backend
// commitado em `TASK-BE-421`/`TASK-BE-423`/`TASK-BE-424`) — `FarmRequest`
// agora aceita `city_uuid`/`country_uuid` (string, uuid), resolvidos para os
// `id`/`country_id` internos na Action (mirror mecânico exato de
// `TASK-BE-334`/DEC-009, People). `GET /countries/options` existe (payload
// enxuto `uuid`+`nome`+`codigo`, sem gate, mirror `cities/options`), e
// `GET /farms/{uuid}` (show) agora devolve `town.uuid` (prefill de Cidade) e
// o bloco `country{uuid,nome,codigo}` (prefill de País).
//
// ✅ GAP-FE-125 FECHADO (`TASK-BE-422`) — `GET /farms/{uuid}` (show) agora
// devolve `centers[]` (uuid/code/description) dos Centros de Custo JÁ
// VINCULADOS à fazenda — o wizard reabilita a edição completa do
// `CheckboxListField` em modo EDIÇÃO (prefill real, sem risco de `sync()`
// destrutivo).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUM — Tipo de Exploração (app/Enums/FarmExplorationType.php)
// ============================================

export type FarmExplorationTypeValue = 1 | 2 | 3 | 4 | 5 | 6;

// ============================================
// FARM (resposta da API) — FarmDetailResource, usado no index() E no show()
// ============================================

/** Cidade denormalizada (`FarmDetailResource.town`, `when(relationLoaded)`) — `uuid` exposto desde `TASK-BE-421` (prefill do Select de Cidade em edição). */
export interface FarmTownRef {
  uuid: string;
  name: string;
  state: string | null;
}

/** País denormalizado (`FarmDetailResource.country`, `when(relationLoaded)`) — bloco novo desde `TASK-BE-424` (prefill do Select de País em edição). */
export interface FarmCountryRef {
  uuid: string;
  nome: string;
  codigo: number;
}

/**
 * `FarmDetailResource` expõe `tenant.id` (inteiro), NUNCA `tenant.uuid`/
 * `tenant.name` — dívida técnica documentada na classe do Resource (Model
 * `Tenant` ainda não implementa `HasUuids`). Por isso a coluna/filtro
 * "Contratante" (GAP-FE-122) só pode exibir o ID numérico, nunca uma razão
 * social — ver nota em `FilterSideFazendas.tsx`/`index.tsx`.
 */
export interface FarmTenantRef {
  id: number;
}

/**
 * Subconjunto ENXUTO de Área embutido em CADA Fazenda de `FarmDetailResource`
 * (`GET /farms`, `with('areas')`, TASK-FE-416 refinamento — ponto 1 do dono).
 * SEM paginação, SEM os 21 campos completos de `AreaResource`
 * (`@/@types/v2/BaseRegistrations/areas` → `AreaData`/`AreaListItem`) — só o
 * necessário para a sub-lista embutida na linha da Fazenda
 * (`AreasSubList.tsx`). NÃO reaproveitar para outra tela que precise do
 * Resource completo de Área (usar `getArea`/`listAreas` daquele módulo).
 */
export interface FarmAreaListItem {
  uuid: string;
  description: string;
  total_area: number;
  is_enabled: boolean;
}

// `FarmDetailResource` é o MESMO shape para listagem paginada (index) e
// detalhe (show) — não existe um `FarmListItem` mais enxuto no backend real
// (diferente do que o planejamento original presumia). Mantemos os 2 nomes
// como ALIAS do mesmo shape para não quebrar os imports das Tarefas
// 401/402/403, mas ambos apontam para a mesma verdade de fato.
export interface FarmDetail {
  uuid: string;
  description: string;
  descriptive: string;
  total_area: number;
  value_ha: number;
  car: string | null;
  city_id: number;
  town?: FarmTownRef | null;
  /** Centros de Custo JÁ VINCULADOS à fazenda (`TASK-BE-422`, fecha `GAP-FE-125`) — só no `show`, ausente/vazio no `index` (`FarmResource`, intocado). */
  centers?: FarmCenterOption[];
  note: string | null;
  is_enabled: boolean;
  coordinates: string | null;
  logo: string | null;
  /** URL absoluta pronta para uso como `src` (`Storage::disk('public')->url()`, convenção do projeto — mirror `FamilyEquipment.image_url`). `logo` continua sendo o caminho cru, não serve como `src`. */
  logo_url: string | null;
  rate: number | null;
  tenant?: FarmTenantRef | null;
  latitude: string | null;
  longitude: string | null;
  phone: string;
  nif: string | null;
  state_registration: string | null;
  control_supplies_stock: boolean;
  cost_processing_date: number;
  cafir: string | null;
  caepf: string | null;
  district: string | null;
  zip_code: string | null;
  number: string | null;
  exploration_type: { value: FarmExplorationTypeValue; label: string } | null;
  /** Bloco denormalizado (`FarmDetailResource.country`, `when(relationLoaded)`) — substitui `country_id` cru desde `TASK-BE-424` (fecha `GAP-FE-124`). */
  country?: FarmCountryRef | null;
  coin: string;
  nirf: string | null;
  ccir: string | null;
  use_cash_book: boolean;
  created_at: string | null;
  updated_at: string | null;
  /** Áreas da fazenda (subconjunto enxuto, `with('areas')`, SEM paginação —
   *  TASK-FE-416 refinamento, ponto 1 do dono). Presente TANTO no `index()`
   *  quanto no `show()` (mesmo `FarmDetailResource`). Opcional só por defesa
   *  de leitura (payload/mocks antigos sem o campo) — `AreasSubList.tsx`
   *  trata ausência como lista vazia (`farm.areas ?? []`), nunca como erro. */
  areas?: FarmAreaListItem[];
}

/** Mesmo shape de `FarmDetail` — a listagem admin (`GET /farms`) usa `FarmDetailResource::collection()`, não um Resource mais enxuto. Alias por clareza de intenção nos consumidores (grid vs. formulário). */
export type FarmListItem = FarmDetail;

// ============================================
// FILTRO (drawer da listagem) — espelha `FarmFilterData` REAL (código, não a
// prosa do contrato — `state_id` NÃO existe em `FarmFilterData.php`).
// `country_id` foi REMOVIDO do filtro na `TASK-FE-580` (decisão do dev,
// redução consciente de escopo — o backend `FarmFilterData` continua
// aceitando o param, só a UI parou de expor/enviar).
// ============================================

export interface FarmFilterForm {
  search?: string;
  /** Só exibido/enviado para `Gestor_Plataf` (GAP-FE-122). */
  tenant_id?: number;
  is_enabled?: '' | 'true' | 'false';
}

// ============================================
// CENTROS DE CUSTO — `GET /farms/{uuid}/centers` (Grupo C, modo edição)
// ============================================

export interface FarmCenterOption {
  uuid: string;
  code: string;
  description: string;
}

// ============================================
// PAYLOAD DE ESCRITA (multipart — `FarmRequest`/`FarmData`)
// ============================================

export interface FarmPayload {
  description: string;
  descriptive: string;
  total_area: number;
  value_ha: number;
  /** `city_uuid` (string, uuid) desde `TASK-BE-421` (fecha `GAP-FE-120`) — resolvido para o `city_id` interno na Action. */
  city_uuid: string;
  /** `country_uuid` (string, uuid) desde `TASK-BE-424` (fecha `GAP-FE-124`) — resolvido para o `country_id` interno na Action. */
  country_uuid: string;
  is_enabled: boolean;
  control_supplies_stock: boolean;
  use_cash_book: boolean;
  cost_processing_date: number;
  phone: string;
  coin: string;
  zip_code: string;
  district: string;
  /** Obrigatório (create) só para `Gestor_Plataf`; `prohibited` para usuário comum; ausente no update (imutável via este Request). */
  tenant_id?: number;
  car?: string;
  note?: string;
  rate?: number;
  nif?: string;
  state_registration?: string;
  cafir?: string;
  caepf?: string;
  number?: string;
  exploration_type?: FarmExplorationTypeValue;
  nirf?: string;
  ccir?: string;
  /** RN-04 — composto "lat,lng", montado a partir dos 2 `Input` de texto simples do step Endereço; a etapa Demarcação (`TASK-FE-411`) deriva um default a partir do centróide do polígono, mas o campo continua editável manualmente. Omitido se ambos vazios. */
  latitude_longitude?: string;
  /** UUIDs de CostCenter (PERGUNTA-03) — nunca IDs inteiros. */
  centers?: string[];
  image?: File | null;
  remove_image?: boolean;
  /** GAP-FE-121 (reaberto) — GeoJSON (`FeatureCollection`) do polígono desenhado/importado na etapa Demarcação (`TASK-FE-411`/`TASK-FE-412`), serializado como string. `null`/omitido quando nenhum polígono foi demarcado (step opcional). */
  coordinates?: string | null;
}

// ============================================
// REACT HOOK FORM — forma interna do wizard (`CreateOrUpdateFarm.tsx`)
// ============================================

export interface FarmFormType {
  description: string;
  descriptive: string;
  nif: string;
  phone: string;
  exploration_type: FarmExplorationTypeValue | null;
  car: string;
  nirf: string;
  ccir: string;
  cafir: string;
  caepf: string;
  state_registration: string;
  /** `Option.value` carrega o `uuid` de `/countries/options` (fecha `GAP-FE-124`) — pré-selecionado com "Brasil" em modo criação (mesmo default do legado/`FarmRequest::rules()`, fallback `?: 30`). */
  country_uuid: Option<string> | null;
  zip_code: string;
  /** `Option.value` carrega o `uuid` de `/cities/options`, enviado como `city_uuid` (fecha `GAP-FE-120`, mirror `TASK-BE-334`/Person). */
  city_uuid: Option<string> | null;
  district: string;
  number: string;
  latitude: string;
  longitude: string;
  coin: string;
  total_area: number | null;
  value_ha: number | null;
  rate: number | null;
  is_enabled: boolean;
  use_cash_book: boolean;
  cost_processing_date: number | null;
  control_supplies_stock: boolean;
  note: string;
  centers: string[];
  /** Só relevante/exibido para `Gestor_Plataf` em modo CRIAÇÃO. */
  tenant_id: number | null;
  /** GAP-FE-121 (reaberto) — GeoJSON (`FeatureCollection`) serializado do polígono desenhado/importado na etapa Demarcação (`TASK-FE-411`/`TASK-FE-412`). `null` enquanto nenhum polígono foi demarcado — step opcional, não bloqueia o wizard. */
  coordinates: string | null;
}

// ============================================
// IMPORTAÇÃO DE KML/KMZ — `POST /api/v1/kml-import` (`TASK-BE-425`/`TASK-FE-412`)
// ============================================

/** Envelope de resposta de `POST /api/v1/kml-import` — utilitário stateless, não é um recurso de Farm (sem `uuid` de fazenda). */
export interface KmlImportEnvelope {
  success: boolean;
  message: string;
  data: GeoJSON.FeatureCollection;
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface FarmsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface FarmsListEnvelope {
  success: boolean;
  message: string;
  data: FarmDetail[];
  errors: Record<string, string[]> | null;
  meta: FarmsApiPaginationMeta | null;
}

export interface FarmCentersEnvelope {
  success: boolean;
  message: string;
  data: FarmCenterOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}
