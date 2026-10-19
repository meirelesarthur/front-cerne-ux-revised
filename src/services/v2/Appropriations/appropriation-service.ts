// src/services/v2/Appropriations/appropriation-service.ts
// -----------------------------------------------------------------------------
// Appropriation Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL —
// Apontamentos). Casa própria (mirror `Invoices`/`Planos`/`Equipments`), NÃO
// sub-pasta de CadastrosBase/BaseRegistrations. TASK-FE-2705 (execução 033/
// Onda 3).
//
//   GET    /appropriations                       → paginado; listagem enxuta
//   POST   /appropriations                       → 201, appropriations_create
//   GET    /appropriations/{uuid}                → detalhe completo
//   PUT    /appropriations/{uuid}                → 200, appropriations_edit
//                                                   (SEM guarda de status)
//   DELETE /appropriations/{uuid}                → 204, appropriations_delete
//   PATCH  /appropriations/{uuid}/finish          → 200, sem payload
//   PATCH  /appropriations/{uuid}/appropriate     → 200, `items` opcional
//   PATCH  /appropriations/{uuid}/revert-status   → 200, `observation`
//                                                   obrigatório
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
//
// `listAppropriations` ADAPTA o envelope paginado do backend para o shape
// `ResponsePagination` que a infra de grid (useCustomGridQuery/TableProvider)
// consome — mesmo adaptador de `listInvoices`/`listPlanRoles`.
//
// MULTIPART (v1.1 §19-E2, `TASK-BE-999`; extensão GAP-BE-602/TASK-BE-1002,
// execução 034): `createAppropriation`/`updateAppropriation` enviam
// `multipart/form-data` SEMPRE que houver ao menos 1 imagem NOVA (`File`) em
// `occurrences[].images[]` OU em `equipment_items[].start_hour_photo` —
// mirror `buildEquipmentFormData` (arrays serializados com notação de índice
// `campo[i][chave]`, convenção do Laravel para parsear arrays de objetos via
// multipart). Sem nenhuma imagem nova em nenhuma das 2 abas, o payload
// continua JSON puro (nenhuma mudança de comportamento para as 3 abas sem
// upload).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AppropriateItemPayload,
  AppropriateItemTypeValue,
  AppropriationDetail,
  AppropriationEquipmentReportParams,
  AppropriationFilterForm,
  AppropriationListItem,
  AppropriationPayload,
  AppropriationsListEnvelope,
  AppropriationStatusValue,
  FinishAppropriationPayload,
} from '@/@types/v2/Appropriations';

export interface ListAppropriationsParams extends PaginationQueryParams, AppropriationFilterForm {}

async function listAppropriations(
  params: ListAppropriationsParams
): Promise<ResponsePagination<AppropriationListItem[]>> {
  const { data } = await api.V2.get<AppropriationsListEnvelope>('/appropriations', {
    page: params.page,
    per_page: params.per_page,
    status: (params.status as AppropriationStatusValue) || undefined,
    area_uuid: params.area_uuid || undefined,
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

async function getAppropriation(uuid: string) {
  const { data } = await api.V2.get<Response<AppropriationDetail>>(`/appropriations/${uuid}`);
  return data;
}

// Alguma imagem NOVA (`File`) em `occurrences[].images[]` OU em
// `equipment_items[].start_hour_photo` (GAP-BE-602/TASK-BE-1002)? Só nesse
// caso o payload precisa virar multipart — mirror da checagem equivalente de
// `product-service.ts`/`equipment-service.ts` antes de montar FormData.
function hasNewImage(payload: AppropriationPayload): boolean {
  const hasNewOccurrenceImage = payload.occurrences.some((occurrence) =>
    (occurrence.images ?? []).some((image) => image.image instanceof File)
  );
  const hasNewEquipmentPhoto = payload.equipment_items.some(
    (item) => item.start_hour_photo instanceof File
  );
  return hasNewOccurrenceImage || hasNewEquipmentPhoto;
}

// Monta o FormData COMPLETO (full-resource, nunca um delta) — mirror
// `buildEquipmentFormData`. Arrays de objeto usam a notação de índice
// `campo[i][chave]`. Imagens já persistidas (`image` como `string`) viajam
// como `occurrences[i][images][j][image]` = a própria URL/path — o backend
// (`AppropriationOccurrenceImageData`) aceita `UploadedFile|string` e trata
// string como "mantida sem reenvio" (update não-destrutivo, contrato
// v1.1 §19-E2).
function buildAppropriationFormData(payload: AppropriationPayload): FormData {
  const fd = new FormData();

  fd.append('date', payload.date);
  fd.append('area_uuid', payload.area_uuid);
  fd.append('activity_uuid', payload.activity_uuid);
  if (payload.operation_uuid) fd.append('operation_uuid', payload.operation_uuid);
  if (payload.warehouse_production_uuid) {
    fd.append('warehouse_production_uuid', payload.warehouse_production_uuid);
  }
  if (payload.cultivation_uuid) fd.append('cultivation_uuid', payload.cultivation_uuid);
  if (payload.harvest_uuid) fd.append('harvest_uuid', payload.harvest_uuid);
  if (payload.employee_uuid) fd.append('employee_uuid', payload.employee_uuid);
  if (payload.used_area !== null && payload.used_area !== undefined) {
    fd.append('used_area', String(payload.used_area));
  }
  if (payload.description) fd.append('description', payload.description);

  payload.stock_items.forEach((item, index) => {
    fd.append(`stock_items[${index}][product_uuid]`, item.product_uuid);
    fd.append(`stock_items[${index}][warehouse_uuid]`, item.warehouse_uuid);
    fd.append(`stock_items[${index}][quantity]`, String(item.quantity));
    if (item.measurement_uuid) {
      fd.append(`stock_items[${index}][measurement_uuid]`, item.measurement_uuid);
    }
    if (item.total_quantity !== undefined && item.total_quantity !== null) {
      fd.append(`stock_items[${index}][total_quantity]`, String(item.total_quantity));
    }
  });

  payload.equipment_items.forEach((item, index) => {
    fd.append(`equipment_items[${index}][equipment_uuid]`, item.equipment_uuid);
    fd.append(`equipment_items[${index}][start_hour_meter]`, String(item.start_hour_meter ?? 0));
    if (item.note) fd.append(`equipment_items[${index}][note]`, item.note);
    if (item.measurement_uuid) {
      fd.append(`equipment_items[${index}][measurement_uuid]`, item.measurement_uuid);
    }
    // GAP-BE-602/TASK-BE-1002 — `File` novo OU `string` (path/URL mantido
    // sem reenvio); `null`/`undefined` NÃO é anexado — mirror o `AppropriationRequest`
    // que trata a ausência da chave como "sem foto" (fiel ao legado, decisão
    // do dono). O caller (`CreateOrUpdateAppropriation.tsx`) já resolve
    // `file ?? existingUrl` antes de chegar aqui — omitir só acontece quando
    // o usuário removeu a foto de fato.
    if (item.start_hour_photo) {
      fd.append(`equipment_items[${index}][start_hour_photo]`, item.start_hour_photo);
    }
  });

  payload.labor_items.forEach((item, index) => {
    fd.append(`labor_items[${index}][type]`, String(item.type));
    if (item.employee_uuid) fd.append(`labor_items[${index}][employee_uuid]`, item.employee_uuid);
    if (item.function_uuid) fd.append(`labor_items[${index}][function_uuid]`, item.function_uuid);
    if (item.provider_uuid) fd.append(`labor_items[${index}][provider_uuid]`, item.provider_uuid);
    fd.append(`labor_items[${index}][quantity]`, String(item.quantity ?? 0));
    fd.append(`labor_items[${index}][type_payment]`, item.type_payment ?? 'Q');
    if (item.measurement_uuid) {
      fd.append(`labor_items[${index}][measurement_uuid]`, item.measurement_uuid);
    }
    if (item.total_quantity !== undefined && item.total_quantity !== null) {
      fd.append(`labor_items[${index}][total_quantity]`, String(item.total_quantity));
    }
    if (item.amount !== undefined && item.amount !== null) {
      fd.append(`labor_items[${index}][amount]`, String(item.amount));
    }
    if (item.total_amount !== undefined && item.total_amount !== null) {
      fd.append(`labor_items[${index}][total_amount]`, String(item.total_amount));
    }
  });

  const productionQualityFields = [
    'ph',
    'phm',
    'damaged',
    'burned',
    'others',
    'impurities',
    'qb_impurities',
    'moisture',
    'qb_moisture',
    'rate',
    'qb_technique',
    'cleaning_drying',
    'broken',
  ] as const;

  payload.production_items.forEach((item, index) => {
    fd.append(`production_items[${index}][product_uuid]`, item.product_uuid);
    fd.append(`production_items[${index}][quantity]`, String(item.quantity));
    if (item.note) fd.append(`production_items[${index}][note]`, item.note);
    fd.append(`production_items[${index}][amount]`, String(item.amount ?? 0));
    fd.append(`production_items[${index}][total]`, String(item.total ?? 0));
    productionQualityFields.forEach((field) => {
      fd.append(`production_items[${index}][${field}]`, String(item[field] ?? 0));
    });
  });

  payload.occurrences.forEach((occurrence, index) => {
    if (occurrence.diagnosis) {
      fd.append(`occurrences[${index}][diagnosis]`, occurrence.diagnosis);
    }
    if (occurrence.recommendation) {
      fd.append(`occurrences[${index}][recommendation]`, occurrence.recommendation);
    }
    fd.append(`occurrences[${index}][priority]`, occurrence.priority ?? '0');
    (occurrence.images ?? []).forEach((image, imageIndex) => {
      fd.append(`occurrences[${index}][images][${imageIndex}][latitude]`, String(image.latitude));
      fd.append(`occurrences[${index}][images][${imageIndex}][longitude]`, String(image.longitude));
      fd.append(`occurrences[${index}][images][${imageIndex}][image]`, image.image);
    });
  });

  return fd;
}

async function createAppropriation(payload: AppropriationPayload) {
  if (hasNewImage(payload)) {
    const fd = buildAppropriationFormData(payload);
    const { data } = await api.V2.post<Response<AppropriationDetail>>('/appropriations', fd);
    return data;
  }
  const { data } = await api.V2.post<Response<AppropriationDetail>>('/appropriations', payload);
  return data;
}

// PUT multipart não é parseado de forma confiável pelo Laravel quando o
// corpo tem arquivo — mirror `updateEquipment` (method spoofing: POST +
// `_method=PUT`). Sem imagem nova, PUT nativo com JSON puro (sem mudança de
// comportamento das 4 abas que nunca sobem arquivo).
async function updateAppropriation(uuid: string, payload: AppropriationPayload) {
  if (hasNewImage(payload)) {
    const fd = buildAppropriationFormData(payload);
    fd.append('_method', 'PUT');
    const { data } = await api.V2.post<Response<AppropriationDetail>>(
      `/appropriations/${uuid}`,
      fd
    );
    return data;
  }
  const { data } = await api.V2.put<Response<AppropriationDetail>>(
    `/appropriations/${uuid}`,
    payload
  );
  return data;
}

async function deleteAppropriation(uuid: string) {
  const { data } = await api.V2.delete(`/appropriations/${uuid}`);
  return data;
}

// GAP-BE-653/TASK-FE-716 (equipment_items) + GAP-BE-655/TASK-FE-738
// (execução 034/035, payload editável INTEIRO) — `/finish` aceita cabeçalho +
// as 5 categorias numa ÚNICA chamada. Mirror `hasNewImage`/
// `buildAppropriationFormData` (create/update): só monta multipart quando há
// ao menos 1 `File` NOVO em `equipment_items[].end_hour_photo` OU em
// `occurrences[].images[]` (único outro bloco que aceita upload no `finish`
// — Insumos/MO/Produção nunca têm arquivo); sem upload novo, segue `PATCH`
// nativo com JSON puro carregando o payload completo (comportamento
// pré-existente preservado para o caso sem foto).
function hasNewFinishUpload(payload?: FinishAppropriationPayload): boolean {
  const hasNewEquipmentPhoto = (payload?.equipment_items ?? []).some(
    (item) => item.end_hour_photo instanceof File
  );
  const hasNewOccurrenceImage = (payload?.occurrences ?? []).some((occurrence) =>
    (occurrence.images ?? []).some((image) => image.image instanceof File)
  );
  return hasNewEquipmentPhoto || hasNewOccurrenceImage;
}

// PATCH multipart não é parseado de forma confiável pelo Laravel quando o
// corpo tem arquivo — mirror `updateAppropriation`/`updateEquipment` (method
// spoofing: POST + `_method=PATCH`). Arrays de objeto usam a notação de
// índice `campo[i][chave]`, mesma convenção de `buildAppropriationFormData`.
//
// LIMITAÇÃO CONHECIDA (mirror idêntico de `buildAppropriationFormData`):
// multipart não consegue expressar um `null` explícito para limpar um campo
// nullable (`description`/`operation_uuid`/`cultivation_uuid`/
// `harvest_uuid`/`used_area`) — só a ausência da chave (que o backend lê como
// "não enviado, preserva o valor persistido"). Isso só é alcançável quando o
// MESMO submit tenta LIMPAR um desses campos E anexar uma foto/imagem nova
// (upload força o path multipart); no path JSON (sem upload novo, o caso
// comum) o `null` chega intacto. Mesma fidelidade já aceita no `create`/
// `update` — não é uma regressão introduzida aqui.
function buildFinishAppropriationFormData(payload: FinishAppropriationPayload): FormData {
  const fd = new FormData();
  fd.append('_method', 'PATCH');

  if (payload.date) fd.append('date', payload.date);
  if (payload.description) fd.append('description', payload.description);
  if (payload.area_uuid) fd.append('area_uuid', payload.area_uuid);
  if (payload.operation_uuid) fd.append('operation_uuid', payload.operation_uuid);
  if (payload.activity_uuid) fd.append('activity_uuid', payload.activity_uuid);
  if (payload.used_area !== null && payload.used_area !== undefined) {
    fd.append('used_area', String(payload.used_area));
  }
  if (payload.cultivation_uuid) fd.append('cultivation_uuid', payload.cultivation_uuid);
  if (payload.harvest_uuid) fd.append('harvest_uuid', payload.harvest_uuid);

  (payload.stock_items ?? []).forEach((item, index) => {
    fd.append(`stock_items[${index}][product_uuid]`, item.product_uuid);
    fd.append(`stock_items[${index}][quantity]`, String(item.quantity));
    if (item.total_quantity !== undefined && item.total_quantity !== null) {
      fd.append(`stock_items[${index}][total_quantity]`, String(item.total_quantity));
    }
    if (item.measurement_uuid) {
      fd.append(`stock_items[${index}][measurement_uuid]`, item.measurement_uuid);
    }
  });

  (payload.equipment_items ?? []).forEach((item, index) => {
    fd.append(`equipment_items[${index}][equipment_uuid]`, item.equipment_uuid);
    fd.append(`equipment_items[${index}][end_hour_meter]`, String(item.end_hour_meter));
    if (item.end_hour_photo) {
      fd.append(`equipment_items[${index}][end_hour_photo]`, item.end_hour_photo);
    }
  });

  (payload.labor_items ?? []).forEach((item, index) => {
    fd.append(`labor_items[${index}][type]`, String(item.type));
    fd.append(`labor_items[${index}][type_payment]`, item.type_payment);
    if (item.employee_uuid) fd.append(`labor_items[${index}][employee_uuid]`, item.employee_uuid);
    if (item.function_uuid) fd.append(`labor_items[${index}][function_uuid]`, item.function_uuid);
    if (item.provider_uuid) fd.append(`labor_items[${index}][provider_uuid]`, item.provider_uuid);
    if (item.quantity !== undefined && item.quantity !== null) {
      fd.append(`labor_items[${index}][quantity]`, String(item.quantity));
    }
    if (item.total_quantity !== undefined && item.total_quantity !== null) {
      fd.append(`labor_items[${index}][total_quantity]`, String(item.total_quantity));
    }
    if (item.amount !== undefined && item.amount !== null) {
      fd.append(`labor_items[${index}][amount]`, String(item.amount));
    }
    if (item.total_amount !== undefined && item.total_amount !== null) {
      fd.append(`labor_items[${index}][total_amount]`, String(item.total_amount));
    }
  });

  const finishProductionQualityFields = [
    'ph',
    'phm',
    'damaged',
    'burned',
    'others',
    'impurities',
    'qb_impurities',
    'moisture',
    'qb_moisture',
    'rate',
    'qb_technique',
    'cleaning_drying',
    'broken',
  ] as const;

  // SEM `amount`/`total` (decisão do dono, premissa nº5 GAP-BE-655) — o
  // backend sempre recalcula esses 2 campos; o Front nunca os envia aqui.
  (payload.production_items ?? []).forEach((item, index) => {
    fd.append(`production_items[${index}][product_uuid]`, item.product_uuid);
    fd.append(`production_items[${index}][quantity]`, String(item.quantity));
    if (item.measurement_uuid) {
      fd.append(`production_items[${index}][measurement_uuid]`, item.measurement_uuid);
    }
    if (item.note) fd.append(`production_items[${index}][note]`, item.note);
    finishProductionQualityFields.forEach((field) => {
      fd.append(`production_items[${index}][${field}]`, String(item[field] ?? 0));
    });
  });

  (payload.occurrences ?? []).forEach((occurrence, index) => {
    if (occurrence.diagnosis) {
      fd.append(`occurrences[${index}][diagnosis]`, occurrence.diagnosis);
    }
    if (occurrence.recommendation) {
      fd.append(`occurrences[${index}][recommendation]`, occurrence.recommendation);
    }
    fd.append(`occurrences[${index}][priority]`, occurrence.priority ?? '0');
    (occurrence.images ?? []).forEach((image, imageIndex) => {
      fd.append(`occurrences[${index}][images][${imageIndex}][latitude]`, String(image.latitude));
      fd.append(`occurrences[${index}][images][${imageIndex}][longitude]`, String(image.longitude));
      fd.append(`occurrences[${index}][images][${imageIndex}][image]`, image.image);
    });
  });

  return fd;
}

// GAP-BE-655/TASK-FE-738 — UMA única chamada leva o payload editável INTEIRO
// (cabeçalho + 5 categorias); nenhuma 2ª chamada `updateAppropriation`
// paralela/sequencial (proibido pela "Decisão FECHADA" do Gap). Sem upload
// novo (caso comum), `payload` completo segue como JSON puro no `PATCH` —
// campos `undefined` somem no `JSON.stringify` do axios (mirror da máscara
// "sometimes" do Request: omitido preserva o valor persistido), `null`
// explícito chega intacto (limpa o campo).
async function finishAppropriation(uuid: string, payload?: FinishAppropriationPayload) {
  if (payload && hasNewFinishUpload(payload)) {
    const fd = buildFinishAppropriationFormData(payload);
    const { data } = await api.V2.post<Response<AppropriationDetail>>(
      `/appropriations/${uuid}/finish`,
      fd
    );
    return data;
  }

  const { data } = await api.V2.patch<Response<AppropriationDetail>>(
    `/appropriations/${uuid}/finish`,
    payload
  );
  return data;
}

async function appropriateAppropriation(
  uuid: string,
  items?: Array<{
    type: AppropriateItemTypeValue;
    reference_uuid: string;
    center_uuid: string;
    class?: number;
    vl_time?: number;
  }>
) {
  const payload: { items?: AppropriateItemPayload[] } = items?.length ? { items } : {};
  const { data } = await api.V2.patch<Response<AppropriationDetail>>(
    `/appropriations/${uuid}/appropriate`,
    payload
  );
  return data;
}

async function revertAppropriationStatus(uuid: string, observation: string) {
  const { data } = await api.V2.patch<Response<AppropriationDetail>>(
    `/appropriations/${uuid}/revert-status`,
    { observation }
  );
  return data;
}

// -----------------------------------------------------------------------------
// Consumidos pela Tarefa 46 (tela de relatório) — `GET
// /appropriation-equipments-report` binário síncrono, `responseType: 'blob'`,
// mirror EXATO `downloadEvolutionsReportPdf`/`Xlsx`
// (`services/v2/Evolutions/evolution-service.ts`). `type` só é enviado
// quando `1` (Excel); ausente → PDF. Diferente de `EvolucaoRebanho`, esta
// rota está dentro de `farm.context` no backend (X-Farm-Id respeitado) —
// nenhum código novo de auth/tenant, o interceptor genérico de
// `@/services/api.ts` já cobre.
// -----------------------------------------------------------------------------

async function downloadAppropriationEquipmentsReportPdf(
  params: AppropriationEquipmentReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/appropriation-equipments-report',
    { start_date: params.start_date, end_date: params.end_date },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadAppropriationEquipmentsReportXlsx(
  params: AppropriationEquipmentReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/appropriation-equipments-report',
    { start_date: params.start_date, end_date: params.end_date, type: 1 },
    { responseType: 'blob' }
  );
  return data;
}

export {
  appropriateAppropriation,
  buildAppropriationFormData,
  createAppropriation,
  deleteAppropriation,
  downloadAppropriationEquipmentsReportPdf,
  downloadAppropriationEquipmentsReportXlsx,
  finishAppropriation,
  getAppropriation,
  listAppropriations,
  revertAppropriationStatus,
  updateAppropriation,
};
