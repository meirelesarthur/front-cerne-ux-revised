// src/services/v2/FeedlotStreets/feedlot-street-service.ts
// -----------------------------------------------------------------------------
// FeedlotStreet Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL —
// Confinamento — Rua). Casa própria, TASK-FE-042-207 (execução 042).
//
//   POST   /feedlot-streets        → 201, feedlot-streets_create
//   PATCH  /feedlot-streets/{uuid} → 200, feedlot-streets_edit
//   DELETE /feedlot-streets/{uuid} → 204, feedlot-streets_delete
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`. `GET` (listagem/detalhe) NÃO
// consumido aqui — o Mapa lê a Rua embutida na árvore (`GET /feedlot-map`,
// `street.{uuid,description,orientation}`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  CreateFeedlotStreetRequest,
  FeedlotStreetDetail,
  UpdateFeedlotStreetRequest,
} from '@/@types/v2/FeedlotStreets';

async function createFeedlotStreet(
  payload: CreateFeedlotStreetRequest
): Promise<Response<FeedlotStreetDetail>> {
  const { data } = await api.V2.post<Response<FeedlotStreetDetail>>('/feedlot-streets', payload);
  return data;
}

async function updateFeedlotStreet(
  uuid: string,
  payload: UpdateFeedlotStreetRequest
): Promise<Response<FeedlotStreetDetail>> {
  const { data } = await api.V2.patch<Response<FeedlotStreetDetail>>(
    `/feedlot-streets/${uuid}`,
    payload
  );
  return data;
}

async function deleteFeedlotStreet(uuid: string) {
  const { data } = await api.V2.delete(`/feedlot-streets/${uuid}`);
  return data;
}

export { createFeedlotStreet, deleteFeedlotStreet, updateFeedlotStreet };
