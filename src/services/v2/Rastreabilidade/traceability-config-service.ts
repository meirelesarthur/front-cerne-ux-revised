// src/services/v2/Rastreabilidade/traceability-config-service.ts
// -----------------------------------------------------------------------------
// TraceabilityConfig Service — API v1 do backend Laravel GB.Cerne
// (`/traceability-configs*`, "Configuração"/Produtor da Rastreabilidade,
// F-067). TASK-TR-FE-03 (service layer) — mirror estrutural
// `farm-admin-service.ts` (CRUD com upload de logo multipart + PUT via
// method spoofing), casa PRÓPRIA de `traceability-service.ts` (2 recursos de
// API distintos, mesmo racional de `farm-service.ts`/`farm-admin-service.ts`
// não compartilharem arquivo).
//
// Fonte de verdade: leitura DIRETA do backend REAL já implementado e
// TESTADO (`GB.Cerne.Api`, branch `feature/refactor-monitoring-and-products-
// for-api`) — `TraceabilityConfigController`, `TraceabilityConfigRequest`,
// `TraceabilityConfigIndexRequest`, `TraceabilityConfigOptionsRequest`,
// `routes/api.php`.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente
// (`TraceabilityConfig` é recurso FARM-SCOPED via `HasFarmTenantScope`,
// fecha D15/CRÍTICO do contrato — o legado NÃO tinha esse isolamento).
//
// **Gate 6.1 (ratificado no contrato)**: permissão ÚNICA `tracconfig_view`
// governa TODOS os verbos no servidor, inclusive `store`/`update`/`destroy`
// — nada a refletir aqui (autorização é 100% back-end), citado só para
// contexto de quem for construir o form/RBAC de tela.
//
// `image`/`remove_image` (logo) SEMPRE via multipart (`FormData`) — mirror
// EXATO `buildFarmFormData`/`updateFarm` (`farm-admin-service.ts`): PUT
// nativo + multipart não é parseado de forma confiável pelo Laravel, por
// isso o update usa POST + `_method=PUT` (method spoofing).
//
// Lookups cross-module (`proprietaries/options?scope=farm`,
// `cities/options`, `areas/options` via `farm-context`, `farms/current-
// tenant` para o select "Fazenda" do form — `## 6.6` do contrato, resolvido
// como consumo INFORMATIVO via `farm-context`, não como campo editável do
// form, ver docblock de `TraceabilityConfigForm`) NÃO são duplicados aqui —
// permanecem em `proprietary-service.ts::listProprietaryOptions`,
// `city-service.ts::listCityOptions`, `farm-service.ts::listFarms`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateTraceabilityConfigRequest,
  TraceabilityConfigData,
  TraceabilityConfigFarmContext,
  TraceabilityConfigListItem,
  TraceabilityConfigOption,
  TraceabilityConfigsListEnvelope,
  UpdateTraceabilityConfigRequest,
} from '@/@types/v2/Rastreabilidade/traceability-config';

// Params aceitos por `GET /traceability-configs` — só paginação real
// (`TraceabilityConfigIndexRequest::rules()` NÃO declara nenhum filtro,
// diferente de `TraceabilityIndexRequest` sibling).
export interface ListTraceabilityConfigsParams extends PaginationQueryParams {}

async function getAllTraceabilityConfigs(
  params: ListTraceabilityConfigsParams
): Promise<ResponsePagination<TraceabilityConfigListItem[]>> {
  const { data } = await api.V2.get<TraceabilityConfigsListEnvelope>('/traceability-configs', {
    page: params.page,
    per_page: params.per_page,
  });

  // Adaptação envelope `ApiResponse::paginated` → `ResponsePagination` (grid)
  // — mesmo adaptador de `getAllTraceabilities`/`listCharges`.
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

// `## 6.5` do contrato — NOVO (o legado nunca implementou `show()`, RT-18
// estava morta). Necessário para a SPA hidratar o form de edição com os 12
// campos reais (+ `farm`/`proprietary`/`city` satélites, sempre eager).
async function getTraceabilityConfig(uuid: string): Promise<Response<TraceabilityConfigData>> {
  const { data } = await api.V2.get<Response<TraceabilityConfigData>>(
    `/traceability-configs/${uuid}`
  );
  return data;
}

// `buildTraceabilityConfigFormData` — monta o `FormData` COMPLETO
// (full-resource, mirror `buildFarmFormData`) — sempre multipart por causa
// do `image`, mesmo quando o logo não muda (fallback de logo da Farm no
// `store()` sem upload, SE-06, é responsabilidade do servidor).
function buildTraceabilityConfigFormData(payload: CreateTraceabilityConfigRequest): FormData {
  const formData = new FormData();
  formData.append('proprietary_uuid', payload.proprietary_uuid);
  formData.append('name', payload.name);
  formData.append('cpf_cnpj', payload.cpf_cnpj);
  formData.append('address', payload.address);
  formData.append('number', payload.number);
  formData.append('district', payload.district);
  formData.append('city_uuid', payload.city_uuid);
  formData.append('phone', payload.phone);
  formData.append('email', payload.email);
  formData.append('whatsapp_fone', payload.whatsapp_fone);
  formData.append('whatsapp_texto', payload.whatsapp_texto);

  if (payload.image) formData.append('image', payload.image);
  // SE-07 — `remove_image` só faz sentido em UPDATE, mas a mesma `rules()`
  // aceita a chave nos dois verbos (mirror `buildFarmFormData`).
  if (payload.remove_image) formData.append('remove_image', '1');

  return formData;
}

async function createTraceabilityConfig(
  payload: CreateTraceabilityConfigRequest
): Promise<Response<TraceabilityConfigData>> {
  const formData = buildTraceabilityConfigFormData(payload);
  const { data } = await api.V2.post<Response<TraceabilityConfigData>>(
    '/traceability-configs',
    formData
  );
  return data;
}

// PUT + multipart — method spoofing (`_method=PUT`), mesmo achado real já
// documentado em `farm-admin-service.ts::updateFarm`/`family-equipment-
// service.ts` (PUT nativo + multipart não é parseado de forma confiável
// pelo Laravel). "Update = representação completa" (mirror
// `TraceabilityRequest` sibling) — SEM PATCH parcial.
async function updateTraceabilityConfig(
  uuid: string,
  payload: UpdateTraceabilityConfigRequest
): Promise<Response<TraceabilityConfigData>> {
  const formData = buildTraceabilityConfigFormData(payload);
  formData.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<TraceabilityConfigData>>(
    `/traceability-configs/${uuid}`,
    formData
  );
  return data;
}

// `DELETE /traceability-configs/{uuid}` — 204 SEM envelope (fecha D02 do
// contrato — o legado NÃO tinha nenhum gate de permissão neste verbo; aqui
// `tracconfig_view` já é aplicado no servidor). Mirror `deleteTraceability`.
async function deleteTraceabilityConfig(uuid: string): Promise<void> {
  await api.V2.delete(`/traceability-configs/${uuid}`);
}

// `GET /traceability-configs/{uuid}/farm-context` (contrato `## 1.2`/
// `## 6.6`, substitui RT-21) — Fazenda dona do Config + suas Áreas, para o
// mapa do form de Configuração. FLAT (`ApiResponse::success`, SEM
// paginação), mirror `getProductWarehouses`.
async function getTraceabilityConfigFarmContext(
  uuid: string
): Promise<Response<TraceabilityConfigFarmContext>> {
  const { data } = await api.V2.get<Response<TraceabilityConfigFarmContext>>(
    `/traceability-configs/${uuid}/farm-context`
  );
  return data;
}

// `GET /traceability-configs/options` (LK-02, contrato `## 1.3`) — lookup
// ENXUTO para o select "Configuração/Produtor" do form de Produto. SEM
// `permission:` própria (gate por consumidor, mirror `listProprietaryOptions`
// quanto ao shape de retorno `T[]` direto, não `ResponsePagination`).
async function getTraceabilityConfigOptions(search?: string): Promise<TraceabilityConfigOption[]> {
  const { data } = await api.V2.get<Response<TraceabilityConfigOption[]>>(
    '/traceability-configs/options',
    { search: search || undefined }
  );
  return data.data ?? [];
}

export {
  buildTraceabilityConfigFormData,
  createTraceabilityConfig,
  deleteTraceabilityConfig,
  getAllTraceabilityConfigs,
  getTraceabilityConfig,
  getTraceabilityConfigFarmContext,
  getTraceabilityConfigOptions,
  updateTraceabilityConfig,
};
