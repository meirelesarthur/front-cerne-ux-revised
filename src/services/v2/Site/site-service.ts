// src/services/v2/Site/site-service.ts
// -----------------------------------------------------------------------------
// Site Service — API v1 do backend Laravel GB.Cerne (configuração única do
// site/fazenda) — 97-Esteiras/061, TASK-SITE-04.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET /site → data: SiteData (singleton farm-scoped; `GetSiteAction`
//               devolve instância NÃO persistida na "1ª vez" — `uuid`/`slug`
//               `null` até o 1º PUT).
//   PUT /site → upsert (payload UpdateSiteRequest + banner opcional).
//
// Rota SINGULAR (sem `{uuid}`), dentro do bloco `farm.context` do backend —
// `X-Farm-Id` é anexado automaticamente pelo interceptor de
// `src/services/api.ts` — NUNCA setar manualmente aqui (mirror
// `tenantParameters-service.ts`); sem farm ativa, guard de UI é feito na
// tela (TASK-SITE-05, `usePermissions().hasFarm`).
//
// ⚠️ Multipart com verbo PUT (Risco #4 do contrato de tela): o Laravel não
// faz parse nativo de `multipart/form-data` em requisições PUT verdadeiras.
// `updateSite` SEMPRE envia POST + `_method=PUT` dentro do próprio FormData
// (method spoofing, mirror `buildFamilyEquipmentFormData`) — mesmo quando
// não há `bannerFile` novo, para manter 1 único caminho de submit (sem
// branch condicional JSON vs multipart). NUNCA `api.V2.put(...)` aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { SiteData, UpdateSiteRequest } from '@/@types/v2/Site';

async function getSite() {
  const { data } = await api.V2.get<Response<SiteData>>('/site');
  return data;
}

// `buildSiteFormData` — monta o FormData a partir do payload completo do
// form. `published`/`about` são SEMPRE enviados (obrigatórios no backend,
// `SiteRequest::rules()`). Os 5 campos `nullable` (instagram/facebook/
// twitter/youtube/whatsapp) só são anexados quando não-vazios — FormData não
// tem representação nativa de `null`; omitir a chave é o equivalente correto
// a "ausente" para a regra `nullable` do Laravel (enviar string vazia faria
// `nullable|url` falhar, já que `''` não é uma URL válida nem é `null`).
function buildSiteFormData(payload: UpdateSiteRequest, bannerFile: File | null): FormData {
  const fd = new FormData();
  fd.append('published', payload.published ? '1' : '0');
  fd.append('about', payload.about);

  if (payload.instagram.trim()) fd.append('instagram', payload.instagram.trim());
  if (payload.facebook.trim()) fd.append('facebook', payload.facebook.trim());
  if (payload.twitter.trim()) fd.append('twitter', payload.twitter.trim());
  if (payload.youtube.trim()) fd.append('youtube', payload.youtube.trim());
  if (payload.whatsapp.trim()) fd.append('whatsapp', payload.whatsapp.trim());

  if (bannerFile) {
    fd.append('banner', bannerFile);
  }

  fd.append('_method', 'PUT');
  return fd;
}

async function updateSite(payload: UpdateSiteRequest, bannerFile: File | null) {
  const fd = buildSiteFormData(payload, bannerFile);
  const { data } = await api.V2.post<Response<SiteData>>('/site', fd);
  return data;
}

export { buildSiteFormData, getSite, updateSite };
