// src/services/v2/BaseRegistrations/headband-service.ts
// Headband Service ("Testeiras") — API v1 do backend Laravel GB.Cerne. SEM
// `X-Farm-Id` (catálogo GLOBAL, Headband-contrato.md DA-HB-03). Mirror de
// `diagnosisPregnancy-service.ts` (adaptador de paginação REAL) combinado com
// `familyEquipment-service.ts`/`partner-service.ts` (upload multipart +
// method-spoofing `_method=PUT`).
//
// Endpoints (`api.v1.headbands.*`): `GET/POST /headbands`, `GET/PUT/DELETE
// /headbands/{uuid}` — UUID é a chave de rota, nunca `id`.

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  HeadbandData,
  HeadbandListItem,
  HeadbandPayload,
  HeadbandsFilterForm,
  HeadbandsListEnvelope,
} from '@/@types/v2/BaseRegistrations/headband';

export interface ListHeadbandsParams extends PaginationQueryParams, HeadbandsFilterForm {}

async function listHeadbands(
  params: ListHeadbandsParams
): Promise<ResponsePagination<HeadbandListItem[]>> {
  const { data } = await api.V2.get<HeadbandsListEnvelope>('/headbands', {
    page: params.page,
    per_page: params.per_page,
    type: params.type || undefined,
    partner_uuid: params.partner_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // paginação REAL (meta vem do backend), mirror `listDiagnosisPregnancies`/
  // `listFamilyEquipments`.
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

async function getHeadbandByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<HeadbandData>>(`/headbands/${uuid}`);
  return data;
}

// Monta o FormData — SEM `remove_image` (fora do contrato, GAP-HB-03 — a
// coluna `headbands.image` é NOT NULL, só existe TROCA de imagem, nunca
// remoção).
//
// `partner_uuid` (vínculo ÚNICO, coluna direta) — semântica TRI-ESTADO
// testada no backend (ver `HeadbandPayload.partner_uuid` no arquivo de
// tipos para o racional completo):
//   - chave AUSENTE do `payload` → campo NÃO anexado ao FormData → backend
//     recebe a chave ausente → PRESERVA o valor atual no update (`Optional`).
//   - chave presente com `null` → anexada como STRING VAZIA → o middleware
//     `ConvertEmptyStringsToNull` (ativo no backend) converte para `null`
//     antes da validação → ZERA o vínculo.
//   - chave presente com um uuid → grava o vínculo.
// Por isso o check usa `'partner_uuid' in payload` (presença da CHAVE), não
// `payload.partner_uuid !== undefined` — essa segunda forma não distinguiria
// "ausente" de "presente com undefined", colapsando os dois primeiros casos.
//
// `partner_uuids[]` (pivot, vínculo N:N, entrada INDEPENDENTE de
// `partner_uuid`) só é anexado quando definido (sync explícito da pivot).
function buildHeadbandFormData(payload: HeadbandPayload): FormData {
  const fd = new FormData();
  fd.append('description', payload.description);
  fd.append('link', payload.link);
  fd.append('position', String(payload.position));
  fd.append('type', payload.type);
  if (payload.image) {
    fd.append('image', payload.image);
  }
  if ('partner_uuid' in payload) {
    fd.append('partner_uuid', payload.partner_uuid ?? '');
  }
  if (payload.partner_uuids) {
    payload.partner_uuids.forEach((uuid) => fd.append('partner_uuids[]', uuid));
  }
  return fd;
}

async function createHeadband(payload: HeadbandPayload) {
  const fd = buildHeadbandFormData(payload);
  const { data } = await api.V2.post<Response<HeadbandData>>('/headbands', fd);
  return data;
}

// PUT nativo + multipart não é confiável no Laravel (achado já documentado em
// `family-equipment-service.ts`/`partner-service.ts`) — POST + `_method=PUT`.
async function updateHeadband(uuid: string, payload: HeadbandPayload) {
  const fd = buildHeadbandFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<HeadbandData>>(`/headbands/${uuid}`, fd);
  return data;
}

async function deleteHeadband(uuid: string) {
  const { data } = await api.V2.delete(`/headbands/${uuid}`);
  return data;
}

export {
  buildHeadbandFormData,
  createHeadband,
  deleteHeadband,
  getHeadbandByUuid,
  listHeadbands,
  updateHeadband,
};
