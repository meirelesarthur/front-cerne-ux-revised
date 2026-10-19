// src/services/v2/Equipments/equipment-service.ts
// -----------------------------------------------------------------------------
// Equipment Service — API v1 do backend Laravel GB.Cerne (Inventário —
// bens/ativos físicos da fazenda). Contrato: Equipment-Frontend-Contrato.md
// (execução 026) §4/§14 + Equipment-contrato.md (backend, APROVADO, ciclo 3,
// mesma execução) §10.
//
// ⚠️ `EquipmentController`/rotas `/equipments` AINDA NÃO EXISTEM no fork
// (`TASK-BE-704` em curso em paralelo, mesma execução) — este service é
// escrito CONTRA O CONTRATO, não contra um endpoint testável agora. Quando
// `TASK-BE-704` publicar as rotas reais, confirmar (a) os 5 nomes exatos dos
// query params de filtro (premissa §14.3 do contrato de tela) e (b) se o
// `PUT` multipart precisa mesmo de method-spoofing (ver "Teste do dev
// (sugerido)" da Tarefa) — ajuste mecânico, não replanejamento.
//
//   GET    /equipments              → data: EquipmentListItem[], meta com
//                                      paginação REAL, per_page default 10,
//                                      teto 100 (`EquipmentIndexRequest`)
//   GET    /equipments/{uuid}       → data: EquipmentData
//   POST   /equipments              → multipart (EquipmentPayload, por causa
//                                      de `image`+`attachments[]`)
//   PUT    /equipments/{uuid}       → multipart via POST + `_method=PUT`
//                                      (method spoofing — mirror
//                                      `updateFamilyEquipment`, PUT nativo
//                                      não é parseado de forma confiável
//                                      pelo Laravel quando o corpo é
//                                      multipart)
//   DELETE /equipments/{uuid}       → CONFIRMADO no contrato de API §10
//                                      (`equipments_delete`) — RN-7 (delete
//                                      em cascata de `depreciations`,
//                                      server-side, dentro da mesma
//                                      transação)
//
// `listEquipments` ADAPTA o envelope { data: [], meta: {} } para o shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listProducts`/`listFamilyEquipments` (meta REAL, não
// fallback fake).
//
// ⚠️ Armadilha ERRO-FE-016 (services que enumeram parâmetros manualmente
// descartam parâmetro novo em silêncio, `tsc` não acusa): os 5 filtros de
// `ListEquipmentsParams` são TODOS repassados explicitamente na querystring
// abaixo — ao adicionar um filtro novo no futuro, repassar aqui também, não
// só no tipo.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  EquipmentData,
  EquipmentFilterRequest,
  EquipmentListItem,
  EquipmentOption,
  EquipmentPayload,
  EquipmentsListEnvelope,
} from '@/@types/v2/Equipments';

export interface ListEquipmentsParams extends PaginationQueryParams, EquipmentFilterRequest {}

async function listEquipments(
  params: ListEquipmentsParams
): Promise<ResponsePagination<EquipmentListItem[]>> {
  const { data } = await api.V2.get<EquipmentsListEnvelope>('/equipments', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    family_equipment_uuid: params.family_equipment_uuid || undefined,
    proprietary_uuid: params.proprietary_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listProducts`/`listFamilyEquipments` (meta REAL, não
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

async function getEquipment(uuid: string) {
  const { data } = await api.V2.get<Response<EquipmentData>>(`/equipments/${uuid}`);
  return data;
}

// buildEquipmentFormData — monta o FormData COMPLETO (full-resource, nunca
// um delta de dirtyFields) — mirror `buildFamilyEquipmentFormData`. Arrays
// (`features`/`cost_centers`/`attachments`) são serializados com a notação
// de índice `campo[i][chave]`, convenção padrão do Laravel para parsear
// arrays de objetos vindos de multipart/form-data.
function buildEquipmentFormData(payload: EquipmentPayload): FormData {
  const fd = new FormData();

  fd.append('family_equipment_uuid', payload.family_equipment_uuid);
  fd.append('description', payload.description);
  if (payload.specification) fd.append('specification', payload.specification);
  if (payload.model) fd.append('model', payload.model);
  if (payload.patrimony) fd.append('patrimony', payload.patrimony);
  if (payload.product_uuid) fd.append('product_uuid', payload.product_uuid);
  fd.append('vl_time_productive', String(payload.vl_time_productive));
  fd.append('vl_time_unproductive', String(payload.vl_time_unproductive));
  if (payload.provider_uuid) fd.append('provider_uuid', payload.provider_uuid);
  if (payload.dt_acquisition) fd.append('dt_acquisition', payload.dt_acquisition);
  fd.append('vl_acquisition', String(payload.vl_acquisition));
  fd.append('status', String(payload.status));
  if (payload.hour_meter !== null && payload.hour_meter !== undefined) {
    fd.append('hour_meter', String(payload.hour_meter));
  }
  fd.append('year_mod', payload.year_mod);
  fd.append('has_depreciation', payload.has_depreciation ? '1' : '0');
  if (payload.life_bens !== null && payload.life_bens !== undefined) {
    fd.append('life_bens', String(payload.life_bens));
  }
  fd.append('depreciation_type', String(payload.depreciation_type));
  if (payload.residual !== null && payload.residual !== undefined) {
    fd.append('residual', String(payload.residual));
  }
  fd.append('vl_residual', String(payload.vl_residual));
  fd.append('vl_depreciate', String(payload.vl_depreciate));
  if (payload.depreciation !== null && payload.depreciation !== undefined) {
    fd.append('depreciation', String(payload.depreciation));
  }

  // -- Bloco Fiscal/Veículo --
  fd.append('use_fiscal', payload.use_fiscal ? '1' : '0');
  if (payload.chassi) fd.append('chassi', payload.chassi);
  if (payload.renavam) fd.append('renavam', payload.renavam);
  if (payload.serie) fd.append('serie', payload.serie);
  if (payload.plate) fd.append('plate', payload.plate);
  if (payload.color) fd.append('color', payload.color);
  if (payload.uf) fd.append('uf', payload.uf);
  if (payload.brand) fd.append('brand', payload.brand);
  if (payload.rntrc) fd.append('rntrc', payload.rntrc);
  if (payload.type) fd.append('type', payload.type);
  if (payload.body_type) fd.append('body_type', payload.body_type);
  if (payload.wheel_type) fd.append('wheel_type', payload.wheel_type);
  if (payload.tara !== null && payload.tara !== undefined) fd.append('tara', String(payload.tara));
  if (payload.capacity !== null && payload.capacity !== undefined) {
    fd.append('capacity', String(payload.capacity));
  }
  if (payload.owner_type) fd.append('owner_type', payload.owner_type);
  if (payload.owner_document) fd.append('owner_document', payload.owner_document);
  if (payload.owner_name) fd.append('owner_name', payload.owner_name);
  if (payload.owner_ie) fd.append('owner_ie', payload.owner_ie);
  if (payload.owner_uf) fd.append('owner_uf', payload.owner_uf);
  if (payload.owner_tp !== null && payload.owner_tp !== undefined) {
    fd.append('owner_tp', String(payload.owner_tp));
  }

  fd.append('equipment_type', payload.equipment_type);

  payload.features.forEach((feature, index) => {
    fd.append(`features[${index}]`, feature);
  });

  if (payload.image) {
    fd.append('image', payload.image);
  }
  if (payload.removeImage) {
    fd.append('remove_image', '1');
  }

  payload.cost_centers.forEach((row, index) => {
    fd.append(`cost_centers[${index}][cost_center_uuid]`, row.cost_center_uuid);
    fd.append(`cost_centers[${index}][percentage]`, String(row.percentage));
  });

  payload.attachments.forEach((row, index) => {
    if (row.uuid) fd.append(`attachments[${index}][uuid]`, row.uuid);
    fd.append(`attachments[${index}][name]`, row.name);
    if (row.file) fd.append(`attachments[${index}][file]`, row.file);
  });

  return fd;
}

async function createEquipment(payload: EquipmentPayload) {
  const fd = buildEquipmentFormData(payload);
  const { data } = await api.V2.post<Response<EquipmentData>>('/equipments', fd);
  return data;
}

// ⚠️ Mirror `updateFamilyEquipment` (achado real de `TASK-FE-FE-02`): PUT
// nativo + multipart não é parseado de forma confiável pelo Laravel. Envia
// como POST + `_method=PUT` dentro do próprio FormData (method spoofing
// padrão do Laravel) — NUNCA `api.V2.put(...)` aqui. Reconciliar contra a
// API real quando `TASK-BE-704` publicar as rotas (ver "Teste do dev
// (sugerido)" da Tarefa) — se o controller novo aceitar PUT multipart
// nativo, simplificar.
async function updateEquipment(uuid: string, payload: EquipmentPayload) {
  const fd = buildEquipmentFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<EquipmentData>>(`/equipments/${uuid}`, fd);
  return data;
}

// `DELETE /equipments/{uuid}` CONFIRMADO no contrato de API §10
// (`equipments_delete` — RN-7, delete em cascata de `depreciations` dentro
// da mesma transação, server-side).
async function deleteEquipment(uuid: string) {
  const { data } = await api.V2.delete(`/equipments/${uuid}`);
  return data;
}

// ---- TASK-FE-1012: download de modelo + import + export -------------------
//
// Paths CONFIRMADOS contra Equipment-contrato.md (backend, APROVADO) linhas
// 208-210 — NÃO a premissa `/equipments/import/template` do
// Equipment-Frontend-Contrato.md §14.4 (que ainda não tinha visibilidade do
// contrato de API no momento em que foi escrita):
//   GET  /equipments/download   equipments_report  (planilha-modelo, TASK-BE-706)
//   POST /equipments/import     equipments_report  (multipart, campo `file`)
//   GET  /equipments/export     equipments_report  (listagem atual → .xlsx)
//
// ⚠️ `TASK-BE-706` (Controller+rotas dos 3 endpoints) AINDA NÃO FOI
// EXECUTADA no momento desta Tarefa (fila atrás de `routes/api.php` —
// TASK-BE-704/705) — as 3 chamadas abaixo são código PRONTO contra o
// contrato, sem endpoint real para exercitar agora (mesma situação já
// registrada no cabeçalho do arquivo para o CRUD principal).
//
// `EquipmentImportResult` fica INLINE aqui (não em `@/@types/v2/Equipments`,
// arquivo congelado nesta execução — chokepoint declarado no task-packet da
// Tarefa) — mudança mínima, sem tocar o bloco estável do módulo. Shape é
// PREMISSA (contrato §14 do backend não detalha o Resource de resposta,
// TASK-BE-706 ainda não publicou): mirror ABORT-ALL de
// `PlanAccountImportResult` (422 `errors.rows: string[]`, nada persistido em
// linha inválida), mas SÓ com `created` — `EquipmentImport` do legado
// (Equipment-Doc-Bruta.md §10) é INSERT puro por linha, sem upsert por chave
// natural e sem exclusão de registros ausentes, então não há
// `updated`/`deleted`/`preserved` a espelhar. Reconciliar se o Resource
// publicado divergir (ajuste mecânico, não replanejamento).
export interface EquipmentImportResult {
  created: number;
}

async function downloadEquipmentImportTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/equipments/download', undefined, {
    responseType: 'blob',
  });
  return data;
}

async function exportEquipments(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/equipments/export', undefined, {
    responseType: 'blob',
  });
  return data;
}

async function importEquipments(file: File): Promise<Response<EquipmentImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<EquipmentImportResult>>('/equipments/import', fd);
  return data;
}

// ---- TASK-FE-840 (execução 027, feature Depreciação): listEquipmentCatalogOptions ----
//
// GET /equipments/options — lookup enxuto {uuid, code, description}, SEM
// gate de permissão (mirror `cost-centers/options`/`listCboOptions`) —
// popula o `SelectAsyncPaginate` de `equipment_uuid` do filtro de
// Depreciação (Depreciation-Frontend-Contrato.md §5/§8.1). Envelope INLINE
// aqui (mesmo tratamento de `EquipmentImportResult` acima) — não altera
// `@/@types/v2/Equipments/index.d.ts` (bloco estável do módulo Inventário,
// chokepoint de outra execução), apenas reaproveita `EquipmentOption` já
// exportado de lá.
export interface EquipmentOptionsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Item de `GET /equipments/options`. `family`/`uses_mileage` só vêm com
 *  `purpose=expense-maintenance` (UT-000795) — opcionais. */
export interface EquipmentCatalogOption extends EquipmentOption {
  family?: { uuid: string; description: string } | null;
  uses_mileage?: boolean;
}

export interface EquipmentOptionsListEnvelope {
  success: boolean;
  message: string;
  data: EquipmentCatalogOption[];
  errors: Record<string, string[]> | null;
  meta: EquipmentOptionsApiPaginationMeta | null;
}

export interface ListEquipmentCatalogOptionsParams {
  page?: number;
  per_page?: number;
  search?: string;
  /** PLANO-FIX AUDIT-FILTROS-RELATORIOS §1/§2.3 — filtro opt-in whitelistado
   *  (`family_ids[]`, whereIn `family_equipment_id`, default OFF). F-278
   *  envia a whitelist `[1,2,3,5]` de Máquinas do legado; sem o param o
   *  catálogo geral atual não regride. */
  family_ids?: number[];
  /** Execução 086 (API-04) — filtro semântico opt-in por finalidade.
   *  `service-order` = paridade com o legado da OS (tenant inteiro + status 1 +
   *  `is_enabled` + famílias 1/2/3). Sem o param o catálogo não regride. */
  purpose?: EquipmentOptionsPurpose;
}

/** Valores aceitos por `purpose` em `GET /equipments/options`. */
export type EquipmentOptionsPurpose = 'service-order' | 'expense-maintenance';

async function listEquipmentCatalogOptions(
  params: ListEquipmentCatalogOptionsParams
): Promise<ResponsePagination<EquipmentCatalogOption[]>> {
  const { data } = await api.V2.get<EquipmentOptionsListEnvelope>('/equipments/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    family_ids: params.family_ids?.length ? params.family_ids : undefined,
    purpose: params.purpose ?? undefined,
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

export {
  buildEquipmentFormData,
  createEquipment,
  deleteEquipment,
  downloadEquipmentImportTemplate,
  exportEquipments,
  getEquipment,
  importEquipments,
  listEquipmentCatalogOptions,
  listEquipments,
  updateEquipment,
};
