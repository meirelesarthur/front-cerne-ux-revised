// src/services/v2/Afiliados/partner-service.ts
// -----------------------------------------------------------------------------
// Partner Service — API v1 do backend Laravel GB.Cerne (Afiliados). Mirror de
// `services/v2/Kinds/kind-service.ts` (catálogo GLOBAL, sem ID de contexto)
// combinado com `services/v2/Farms/farm-admin-service.ts` (upload multipart
// sempre presente + method spoofing no update).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /partners          → data: PartnerListItem[], meta paginado REAL
//                                (`per_page` default backend 10, teto 100)
//   GET    /partners/{uuid}   → data: PartnerDetail
//   POST   /partners          → multipart (FormData)
//   PUT    /partners/{uuid}   → multipart via POST + `_method=PUT` (method
//                                spoofing — mesmo achado real de
//                                `farm-admin-service.ts`/
//                                `family-equipment-service.ts`: PUT nativo +
//                                multipart não é parseado de forma confiável
//                                pelo Laravel)
//   DELETE /partners/{uuid}   → 204 (GAP-BE-210 `[AVALIADO]`, efeito colateral
//                                no backend, fora do escopo do front)
//
// `buildPartnerFormData` monta o FormData SEMPRE (create E update) — mesmo
// quando `contract_file` está `undefined` (os demais campos vão como
// string/number no FormData, mirror `buildFarmFormData`). `zip_code` —
// CORREÇÃO E2E (feature 024): `PartnerRequest` passou a aceitar o campo no
// payload raiz; enviado como opcional (mesmo tratamento de `phone`/
// `cellphone`), nunca bloqueia submit quando ausente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  PartnerDetail,
  PartnerListItem,
  PartnerPayload,
  PartnersListEnvelope,
} from '@/@types/v2/Afiliados';

export interface ListPartnersParams extends PaginationQueryParams {
  search?: string;
  status?: 1 | 2 | 3;
}

async function listPartners(
  params: ListPartnersParams
): Promise<ResponsePagination<PartnerListItem[]>> {
  const { data } = await api.V2.get<PartnersListEnvelope>('/partners', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    status: params.status || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico ao adaptador de `listKinds`/`listFarms`.
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

async function getPartnerByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<PartnerDetail>>(`/partners/${uuid}`);
  return data;
}

// buildPartnerFormData — monta o FormData COMPLETO (full-resource, mirror
// `buildFarmFormData`) — sempre multipart por causa do `contract_file`, mesmo
// quando o contrato não muda nesta sessão.
function buildPartnerFormData(payload: PartnerPayload): FormData {
  const fd = new FormData();
  fd.append('nif', payload.nif);
  fd.append('nickname', payload.nickname);
  fd.append('name', payload.name);
  fd.append('email', payload.email);
  fd.append('address', payload.address);
  fd.append('city_uuid', payload.city_uuid);
  fd.append('status', String(payload.status));
  fd.append('dt_affiliation', payload.dt_affiliation);
  fd.append('commission', String(payload.commission));

  if (payload.phone) fd.append('phone', payload.phone);
  if (payload.cellphone) fd.append('cellphone', payload.cellphone);
  if (payload.zip_code) fd.append('zip_code', payload.zip_code);
  if (payload.contact) fd.append('contact', payload.contact);
  if (payload.contact_phone) fd.append('contact_phone', payload.contact_phone);
  if (payload.due_date) fd.append('due_date', payload.due_date);
  if (payload.qtd_farms !== null && payload.qtd_farms !== undefined) {
    fd.append('qtd_farms', String(payload.qtd_farms));
  }
  if (payload.business_rule) fd.append('business_rule', payload.business_rule);
  if (payload.note) fd.append('note', payload.note);

  if (payload.contract_file) {
    fd.append('contract_file', payload.contract_file);
  }
  if (payload.remove_contract_file) {
    fd.append('remove_contract_file', '1');
  }

  return fd;
}

async function createPartner(payload: PartnerPayload) {
  const fd = buildPartnerFormData(payload);
  const { data } = await api.V2.post<Response<PartnerDetail>>('/partners', fd);
  return data;
}

// PUT + multipart — method spoofing (`_method=PUT`), mesmo achado real já
// documentado em `farm-admin-service.ts`/`family-equipment-service.ts`.
async function updatePartner(uuid: string, payload: PartnerPayload) {
  const fd = buildPartnerFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<PartnerDetail>>(`/partners/${uuid}`, fd);
  return data;
}

async function deletePartner(uuid: string) {
  const { data } = await api.V2.delete(`/partners/${uuid}`);
  return data;
}

export {
  buildPartnerFormData,
  createPartner,
  deletePartner,
  getPartnerByUuid,
  listPartners,
  updatePartner,
};
